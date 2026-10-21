import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PipelineResult } from './youcam';

const PHOTO_STORAGE_KEY = '@peach_match_last_photo';

let lastResult: PipelineResult | null = null;

export function setLastResult(result: PipelineResult): void {
  lastResult = result;
}

export function getLastResult(): PipelineResult | null {
  return lastResult;
}

let lastPhotoUri: string | null = null;

export function setLastPhotoUri(uri: string): void {
  lastPhotoUri = uri;
  AsyncStorage.setItem(PHOTO_STORAGE_KEY, uri).catch(() => {});
}

export function getLastPhotoUri(): string | null {
  return lastPhotoUri;
}

export async function loadPersistedPhotoUri(): Promise<string | null> {
  try {
    const saved = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
    if (saved && !lastPhotoUri) {
      lastPhotoUri = saved;
    }
    return lastPhotoUri;
  } catch {
    return lastPhotoUri;
  }
}

let onboardingSeen = false;

export function hasSeenOnboarding(): boolean {
  return onboardingSeen;
}

export function markOnboardingSeen(): void {
  onboardingSeen = true;
}

let feedbackYes = 0;
let feedbackNo = 0;

export function recordMatchFeedback(good: boolean): void {
  if (good) feedbackYes += 1;
  else feedbackNo += 1;
}

export function matchFeedbackCounts(): { yes: number; no: number } {
  return { yes: feedbackYes, no: feedbackNo };
}
