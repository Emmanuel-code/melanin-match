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
