<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";

  let {
    handleNextPhase,
    handleStartGame,
  }: {
    handleNextPhase: () => void;
    handleStartGame: () => void;
  } = $props();

  const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
  let season = $derived(SEASONS[(gameStore.turnNumber - 1) % 4]);
</script>

<div class="card card-tight">
  <h3>Game Status</h3>
  <div
    style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-sm);"
  >
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--color-text-secondary);">Turn</span>
      <strong style="font-size: 1.1em;">{gameStore.turnNumber}</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--color-text-secondary);">Season</span>
      <strong style="font-size: 1.1em;">{season}</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--color-text-secondary);">Phase</span>
      <strong style="font-size: 1.1em; text-transform: capitalize;"
        >{gameStore.currentPhase}</strong
      >
    </div>
  </div>

  <div
    style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border); text-align: center;"
  >
    {#if gameStore.currentPhase === "setup"}
      <button
        class="btn btn-primary"
        onclick={handleStartGame}
        style="width: 100%;"
      >
        Start Game
      </button>
    {:else}
      <button
        class="btn btn-outline"
        onclick={handleNextPhase}
        style="width: 100%;"
      >
        Advance to Next Phase
      </button>
    {/if}
  </div>
</div>
