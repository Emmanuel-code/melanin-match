// YouCam S2S API client — AI skin analysis + virtual foundation try-on.
// Official docs: https://yce.perfectcorp.com (S2S REST API)
// Base: https://yce-api-01.makeupar.com  |  Auth: Authorization: Bearer <API_KEY>
//
// If EXPO_PUBLIC_YOUCAM_API_KEY is not set, every call runs in MOCK MODE and
// returns realistic fake data after short delays, so the full UX is testable
// today without a key. Mock mode is logged loudly on every pipeline run.

import { findNearestShades, MatchedShade } from './match';

const BASE_URL = 'https://yce-api-01.makeupar.com';
const API_KEY = process.env.EXPO_PUBLIC_YOUCAM_API_KEY;

export function isMockMode(): boolean {
  return !API_KEY;
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

// POST /s2s/v2.0/file/<feature> -> { file_id, <presigned PUT url> }
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
      content_type: contentType,
      file_name: fileName,
      file_size: fileSize,
    }),
  });
  if (!res.ok) throw new Error(`upload ticket failed (${res.status})`);
  const data = await res.json();
  const fileId: string | undefined = data.file_id ?? data.fileId;
  const putUrl: string | undefined = data.upload_url ?? data.presigned_url ?? data.url;
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
  const blob = await fileRes.blob();
  const fileSize = blob.size;
  if (!fileSize) throw new Error('could not read photo bytes');
  const contentType = 'image/jpeg';
  const fileName = `selfie-${Date.now()}.jpg`;

  const { fileId, putUrl } = await getUploadUrl('skin-tone-analysis', contentType, fileName, fileSize);

  // PUT the raw binary — Content-Type + Content-Length are required, skipping
  // them breaks the presigned upload.
  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(fileSize) },
    body: blob,
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
  const data = await res.json();
  const taskId: string | undefined = data.task_id ?? data.taskId;
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
    const data = await res.json();
    const status: string | undefined = data.task_status ?? data.status;
    if (status === 'success' || status === 'succeeded') return data.results ?? data.result;
    if (status === 'error' || status === 'failed') {
      throw new Error(data.message ?? `${feature} task failed`);
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
  const faceQuality: number = results?.face_quality ?? 0;
  if (!hex) throw new Error('skin-tone-analysis returned no skin_color');
  return { skinColorHex: hex, faceQuality };
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
            color: hexColor,
            colorIntensity: 70,
            glowIntensity: 30,
            coverageIntensity: 60,
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
  scores: SkinScores;
  matches: MatchedShade[];
  tryOnUrl: string;
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
  const [{ skinColorHex, faceQuality }, fitzpatrick] = await Promise.all([
    analyzeSkinTone(fileId),
    analyzeFitzpatrick(fileId),
  ]);

  onStep('skinAnalysis');
  const scores = await analyzeSkin(fileId);

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
