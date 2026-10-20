// Session-scoped app state. Module-level on purpose: it resets when the app
// restarts, which keeps the demo flow fresh every launch without any native
// storage dependency.

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
