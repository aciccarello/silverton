class UiStore {
  /**
   * Global state for whether to show the "Getting Started" tips on cards.
   * Typically toggled by the user and defaulted to true if the current phase is setup.
   */
  showGettingStartedTips = $state(false);

  // We keep track of the current phase to auto toggle tips off when moving from setup to first round.
  previousPhase = $state<string | null>(null);

  syncPhase(currentPhase: string) {
    if (
      this.previousPhase === "setup" &&
      currentPhase !== "setup" &&
      this.showGettingStartedTips
    ) {
      this.showGettingStartedTips = false;
    }
    this.previousPhase = currentPhase;
  }
}

export const uiStore = new UiStore();
