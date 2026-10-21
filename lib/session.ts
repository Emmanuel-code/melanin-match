// Session-scoped app state. Module-level on purpose: it resets when the app
// restarts, which keeps the demo flow fresh every launch without any native
// storage dependency.

import type { PipelineResult } from './youcam';

// The last completed pipeline run. Carried in memory, NOT via route params:
// the try-on result is a long signed URL full of `&`/`%` characters, and
// routing it through navigation params can mangle it — the results screen
// then shows a blank panel instead of the transformed photo.
let lastResult: PipelineResult | null = null;

export function setLastResult(result: PipelineResult): void {
  lastResult = result;
}

export function getLastResult(): PipelineResult | null {
  return lastResult;
}

// The user's photo URI, also carried in memory. Gallery picks on Android
// come back as content:// URIs full of %-escapes — passing those through
// route params lets navigation decoding corrupt them, and the results
// screen's "before" image then fails silently (flat colour, no photo).
let lastPhotoUri: string | null = null;

export function setLastPhotoUri(uri: string): void {
  lastPhotoUri = uri;
}

export function getLastPhotoUri(): string | null {
  return lastPhotoUri;
}

let onboardingSeen = false;

export function hasSeenOnboarding(): boolean {
  return onboardingSeen;
}

export function markOnboardingSeen(): void {
  onboardingSeen = true;
}

// Match feedback ("Was this your shade?") — the start of a validation loop.
let feedbackYes = 0;
let feedbackNo = 0;

export function recordMatchFeedback(good: boolean): void {
  if (good) feedbackYes += 1;
  else feedbackNo += 1;
}

export function matchFeedbackCounts(): { yes: number; no: number } {
  return { yes: feedbackYes, no: feedbackNo };
}
