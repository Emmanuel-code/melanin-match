// YouCam S2S API client — AI skin analysis + virtual foundation try-on.
// Official docs: https://yce.perfectcorp.com (S2S REST API)
// Base: https://yce-api-01.makeupar.com  |  Auth: Authorization: Bearer <API_KEY>
//
// If EXPO_PUBLIC_YOUCAM_API_KEY is not set, every call runs in MOCK MODE and
// returns realistic fake data after short delays, so the full UX is testable
// today without a key. Mock mode is logged loudly on every pipeline run.

import { findNearestShades, hexToLab, MatchedShade } from './match';

const BASE_URL = 'https://yce-api-01.makeupar.com';
const API_KEY = process.env.EXPO_PUBLIC_YOUCAM_API_KEY;

// Demo-day escape hatch: the analyzing screen can force one pipeline run
// into mock mode after a live failure, so a bad venue network or a rejected
// photo never dead-ends a presentation.
let mockOverride = false;

export function setMockOverride(v: boolean): void {
  mockOverride = v;
}

export function isMockMode(): boolean {
  return mockOverride || !API_KEY;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// File upload
// ---------------------------------------------------------------------------

interface UploadTicket {
  fileId: string;
  putUrl: string;
}

// POST /s2s/v2.0/file/<feature> with a `files` array (a flat body is rejected
// with 400 "files is required" — verified live 2026-10-21). Response is
// enveloped: { status, data: { files: [{ file_id, requests: [{method, url}] }] } }
async function getUploadUrl(
  feature: string,
  contentType: string,
  fileName: string,
  fileSize: number,
): Promise<UploadTicket> {
  const res = await fetch(`${BASE_URL}/s2s/v2.0/file/${feature}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: fileSize }],
    }),
  });
  if (!res.ok) throw new Error(`upload ticket failed (${res.status})`);
  const json = await res.json();
  const file = json?.data?.files?.[0];
  const fileId: string | undefined = file?.file_id;
  const putReq = (file?.requests ?? []).find(
    (r: { method?: string }) => r?.method === 'PUT',
  );
  const putUrl: string | undefined = putReq?.url ?? file?.requests?.[0]?.url;
  if (!fileId || !putUrl) throw new Error('upload ticket missing file_id or PUT url');
  return { fileId, putUrl };
}

// Uploads a local photo and returns its YouCam file_id.
export async function uploadPhoto(imageUri: string): Promise<string> {
  if (isMockMode()) {
    await sleep(700);
    return 'mock-file-id';
  }
  const fileRes = await fetch(imageUri);
  // Send the photo as an ArrayBuffer, NOT an RN Blob: the Blob path can
  // rewrite the Content-Type / length actually sent, and the presigned PUT
  // rejects any mismatch with a 403 (hit live 2026-10-21). An ArrayBuffer
  // sends byte-exact with our Content-Type header intact.
  const buf = await fileRes.arrayBuffer();
  const fileSize = buf.byteLength;
  if (!fileSize) throw new Error('could not read photo bytes');
  const contentType = 'image/jpeg';
  const fileName = `selfie-${Date.now()}.jpg`;

  const { fileId, putUrl } = await getUploadUrl('skin-tone-analysis', contentType, fileName, fileSize);

  // PUT the raw binary. The presigned URL signs content-length + content-type
  // (X-Amz-SignedHeaders), so BOTH headers must match the ticket exactly or
  // S3 answers 403. The ArrayBuffer is byte-exact, so the length below is the
  // true length either way the stack handles it. (The earlier Blob body was
  // the 403 source: its sent headers could drift from the signed ones.)
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(fileSize) },
    body: buf,
  });
  if (!putRes.ok) throw new Error(`photo upload failed (${putRes.status})`);
  return fileId;
}

// ---------------------------------------------------------------------------
// Task lifecycle
// ---------------------------------------------------------------------------

// POST /s2s/v2.0/task/<feature> -> { task_id }
async function createTask(feature: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/${feature}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`createTask ${feature} failed (${res.status})`);
  const json = await res.json();
  const taskId: string | undefined = json?.data?.task_id ?? json?.task_id;
  if (!taskId) throw new Error(`createTask ${feature} returned no task_id`);
  return taskId;
}

// GET /s2s/v2.0/task/<feature>/<taskId> until task_status is success/error.
async function pollTask(feature: string, taskId: string): Promise<any> {
  const started = Date.now();
  for (;;) {
    const res = await fetch(`${BASE_URL}/s2s/v2.0/task/${feature}/${taskId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`pollTask ${feature} failed (${res.status})`);
    const json = await res.json();
    const data = json?.data ?? json;
    const status: string | undefined = data.task_status ?? data.status;
    if (status === 'success' || status === 'succeeded') return data.results ?? data.result;
    if (status === 'error' || status === 'failed') {
      // The API's own message is usually the actionable fix (e.g. face too
      // small) — surface it verbatim.
      throw new Error(data.error_message ?? data.message ?? data.error ?? `${feature} task failed`);
    }
    if (Date.now() - started > 90_000) throw new Error(`${feature} task timed out`);
    await sleep(2000);
  }
}

// makeup-vto returns the result image in one of two shapes:
//   { url }  or  [ { download_url }, ... ]
function extractVtoUrl(results: any): string {
  if (!results) throw new Error('try-on returned no results');
  if (typeof results.url === 'string') return results.url;
  if (typeof results.download_url === 'string') return results.download_url;
  if (Array.isArray(results)) {
    if (typeof results[0]?.download_url === 'string') return results[0].download_url;
    if (typeof results[0]?.url === 'string') return results[0].url;
  }
  throw new Error('could not find try-on result image URL');
}

// src may be a YouCam file_id or a public URL; pick the right body key.
function srcField(src: string): Record<string, string> {
  return /^https?:\/\//i.test(src) ? { src_file_url: src } : { src_file_id: src };
}

// ---------------------------------------------------------------------------
// Analyses
// ---------------------------------------------------------------------------

export interface SkinToneResult {
  skinColorHex: string;
  faceQuality: number;
}

// The API grades face quality qualitatively, not numerically (verified live
// 2026-10-21): { has_face, area, frontal, lighting, faceangle } with grades
// like "good". Convert to the 0–100 score the UI's quality gate expects.
const GRADE_SCORES: Record<string, number> = {
  good: 100,
  fair: 65,
  moderate: 65,
  ok: 65,
  poor: 30,
  bad: 30,
};

function faceQualityScore(fq: unknown): number {
  if (typeof fq === 'number') return fq;
  if (!fq || typeof fq !== 'object') return 0;
  const q = fq as Record<string, unknown>;
  if (q.has_face === false) return 0;
  const grades = ['area', 'frontal', 'lighting', 'faceangle']
    .map((k) => GRADE_SCORES[String(q[k] ?? '').toLowerCase()])
    .filter((v): v is number => typeof v === 'number');
  if (!grades.length) return 50;
  return Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
}

export async function analyzeSkinTone(src: string): Promise<SkinToneResult> {
  if (isMockMode()) {
    await sleep(900);
    return { skinColorHex: '#8a5a3b', faceQuality: 92 };
  }
  const taskId = await createTask('skin-tone-analysis', {
    ...srcField(src),
    face_angle_strictness_level: 'medium',
  });
  const results = await pollTask('skin-tone-analysis', taskId);
  const hex: string | undefined = results?.color?.skin_color;
  if (!hex) throw new Error('skin-tone-analysis returned no skin_color');
  return { skinColorHex: hex, faceQuality: faceQualityScore(results?.face_quality) };
}

export async function analyzeFitzpatrick(src: string): Promise<string> {
  if (isMockMode()) {
    await sleep(700);
    return 'V';
  }
  const taskId = await createTask('fitzpatrick-scale-analyzer', {
    ...srcField(src),
    version: '1.0',
    index: 0,
  });
  const results = await pollTask('fitzpatrick-scale-analyzer', taskId);
  const scale: string | undefined = results?.fitzpatrick_scale;
  if (!scale) throw new Error('fitzpatrick-scale-analyzer returned no scale');
  return scale;
}

export interface SkinScores {
  acne: number;
  oiliness: number;
  moisture: number;
  radiance: number;
}

const SKIN_ACTIONS = ['acne', 'oiliness', 'moisture', 'radiance'] as const;

export async function analyzeSkin(src: string): Promise<SkinScores> {
  if (isMockMode()) {
    await sleep(1000);
    return { acne: 82, oiliness: 45, moisture: 68, radiance: 74 };
  }
  // NOTE: never mix HD and SD dst_actions — these are all SD.
  const taskId = await createTask('skin-analysis', {
    ...srcField(src),
    dst_actions: [...SKIN_ACTIONS],
    format: 'json',
  });
  const results = await pollTask('skin-analysis', taskId);
  const output: Array<{ type?: string; ui_score?: number }> = results?.output ?? [];
  const byType: Record<string, number> = {};
  for (const item of output) {
    if (item.type && typeof item.ui_score === 'number') byType[item.type] = item.ui_score;
  }
  const scores: SkinScores = {
    acne: byType.acne ?? 0,
    oiliness: byType.oiliness ?? 0,
    moisture: byType.moisture ?? 0,
    radiance: byType.radiance ?? 0,
  };
  return scores;
}

// ---------------------------------------------------------------------------
// Virtual foundation try-on
// ---------------------------------------------------------------------------

export async function tryOnFoundation(
  src: string,
  hexColor: string,
  mockFallbackUri?: string,
): Promise<string> {
  if (isMockMode()) {
    await sleep(1200);
    // No real render without a key — show the original photo as the "try-on".
    return mockFallbackUri ?? src;
  }
  const taskId = await createTask('makeup-vto', {
    ...srcField(src),
    version: '1.0',
    effects: [
      // skin_smooth with zero strength keeps the render honest — we want the
      // SHADE to show, not a beautified blur.
      { category: 'skin_smooth', skinSmoothStrength: 0, skinSmoothColorIntensity: 0 },
      {
        category: 'foundation',
        palettes: [
          {
            // Demo-strength: at 70/60 the render was nearly invisible on
            // camera ("just the colour"). 85/85 reads as real foundation —
            // evened, covered skin — without crossing into face paint.
            color: hexColor,
            colorIntensity: 85,
            glowIntensity: 35,
            coverageIntensity: 85,
          },
        ],
      },
    ],
  });
  const results = await pollTask('makeup-vto', taskId);
  return extractVtoUrl(results);
}

// ---------------------------------------------------------------------------
// Full pipeline (upload -> analyses -> match -> try-on)
// ---------------------------------------------------------------------------

export type PipelineStep = 'upload' | 'skinTone' | 'skinAnalysis' | 'match' | 'tryOn';

export interface PipelineResult {
  fileId: string;
  skinColorHex: string;
  faceQuality: number;
  fitzpatrick: string;
  scores: SkinScores | null;
  matches: MatchedShade[];
  tryOnUrl: string;
}

// Fallback when the Fitzpatrick task itself errors: band the skin colour's
// CIELAB lightness. Calibrated so #6d4d38 (live API: VI) lands in VI.
function estimateFitzpatrick(skinHex: string): string {
  const { L } = hexToLab(skinHex);
  if (L >= 70) return 'I';
  if (L >= 63) return 'II';
  if (L >= 55) return 'III';
  if (L >= 45) return 'IV';
  if (L >= 35) return 'V';
  return 'VI';
}

export const FITZPATRICK_LABELS: Record<string, string> = {
  I: 'Type I — very fair',
  II: 'Type II — fair',
  III: 'Type III — medium',
  IV: 'Type IV — olive / tan',
  V: 'Type V — brown',
  VI: 'Type VI — deep brown',
};

export async function runPipeline(
  imageUri: string,
  onStep: (step: PipelineStep) => void,
): Promise<PipelineResult> {
  if (isMockMode()) {
    console.log(
      '[youcam] MOCK MODE ACTIVE — no EXPO_PUBLIC_YOUCAM_API_KEY set. Returning demo data.',
    );
  }

  onStep('upload');
  const fileId = await uploadPhoto(imageUri);

  onStep('skinTone');
  const { skinColorHex, faceQuality } = await analyzeSkinTone(fileId);

  onStep('skinAnalysis');
  // Skin scores and the Fitzpatrick read are supporting detail — the match is
  // the product. If a supporting call fails (skin-analysis rejects faces
  // under ~60% of frame width), degrade instead of dead-ending the result.
  const [fitzpatrick, scores] = await Promise.all([
    analyzeFitzpatrick(fileId).catch(() => estimateFitzpatrick(skinColorHex)),
    analyzeSkin(fileId).catch(() => null),
  ]);

  onStep('match');
  const matches = findNearestShades(skinColorHex, 3);

  onStep('tryOn');
  const tryOnUrl = await tryOnFoundation(fileId, matches[0].hex, imageUri);

  return { fileId, skinColorHex, faceQuality, fitzpatrick, scores, matches, tryOnUrl };
}

// Re-run try-on with an alternate shade (fileId from the completed pipeline).
export async function tryOnShade(
  fileId: string,
  hexColor: string,
  fallbackUri: string,
): Promise<string> {
  return tryOnFoundation(fileId, hexColor, fallbackUri);
}
