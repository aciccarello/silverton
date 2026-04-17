<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { PLAYER_COLORS, MARKETS, STARTING_PIECES } from "$lib/constants";
  import { cardTipFlip } from "$lib/transitions";
  import type { Player } from "$lib/state/gameStore.svelte";

  let {
    loggedInPlayer,
    savePlayer,
  }: {
    loggedInPlayer: Player;
    savePlayer: (p: Player, action: string) => void;
  } = $props();

  let isColorDropdownOpen = $state(false);

  function getStartingPieces(player: Player | undefined) {
    if (!player?.startingOrder) return null;
    return (
      STARTING_PIECES[player.startingOrder]?.[gameStore.players.length] || null
    );
  }

  function toggleMarket(market: (typeof MARKETS)[number]) {
    if (!loggedInPlayer) return;
    const current = loggedInPlayer.marketsInPlay ?? [];
    if (current.includes(market)) {
      loggedInPlayer.marketsInPlay = current.filter((m) => m !== market);
    } else {
      loggedInPlayer.marketsInPlay = [...current, market];
    }
    savePlayer($state.snapshot(loggedInPlayer), "Updated markets in play");
  }

  function updatePlayerColor(color: string) {
    if (loggedInPlayer) {
      loggedInPlayer.color = color;
      savePlayer($state.snapshot(loggedInPlayer), `Changed color to ${color}`);
    }
  }
</script>

<div
  class="card"
  style="border-top: 4px solid {loggedInPlayer.color}; grid-column: 1 / -1;"
>
  <div
    style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md); gap: var(--spacing-lg); flex-wrap: wrap;"
  >
    <h2>Your Game</h2>

    <div
      style="display: flex; align-items: baseline; gap: var(--spacing-md); flex-wrap: wrap;"
    >
      <span
        style="font-size: 2rem; font-family: var(--font-heading); color: var(--color-primary);"
        >${loggedInPlayer.money}</span
      >

      <!-- Color Picker Dropdown -->
      <div class="color-picker-container">
        <button
          class="color-picker-trigger"
          onclick={() => (isColorDropdownOpen = !isColorDropdownOpen)}
          style="border-color: {loggedInPlayer.color};"
        >
          <div
            class="swatch-preview"
            style="background-color: {loggedInPlayer.color};"
          ></div>
          <span class="color-name">
            {PLAYER_COLORS.find((c) => c.hex === loggedInPlayer?.color)?.name ||
              "Custom"}
          </span>
          <span class="chevron" class:open={isColorDropdownOpen}>▼</span>
        </button>

        {#if isColorDropdownOpen}
          <div class="color-dropdown-menu card animate-entrance">
            {#each PLAYER_COLORS as color}
              <button
                class="color-dropdown-item"
                onclick={() => {
                  updatePlayerColor(color.hex);
                  isColorDropdownOpen = false;
                }}
              >
                <div
                  class="color-swatch-sm"
                  style="background-color: {color.hex};"
                ></div>
                <span>{color.name}</span>
                {#if loggedInPlayer.color === color.hex}
                  <span class="check">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
  <div
    style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; color: var(--color-text-secondary);"
  >
    <div><strong>Your Markets:</strong></div>
    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem 2rem;">
      {#each MARKETS as market}
        <label
          style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;"
        >
          <input
            type="checkbox"
            checked={loggedInPlayer.marketsInPlay?.includes(market)}
            onchange={() => toggleMarket(market)}
          />
          <span>{market}</span>
        </label>
      {/each}
    </div>
    <div
      style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;"
    >
      <strong>Starting Pieces ({loggedInPlayer.startingOrder}):</strong>
      {#if getStartingPieces(loggedInPlayer)}
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          {#each getStartingPieces(loggedInPlayer)?.split(",") || [] as piece}
            <div
              style="display: flex; align-items: center; justify-content: center; width: 2.2rem; height: 2.2rem; border-radius: 50%; background: var(--color-bg-surface); border: 2px solid var(--color-border); color: var(--color-primary); font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
            >
              {piece.trim()}
            </div>
          {/each}
        </div>
      {:else}
        <span style="color: var(--color-text-secondary); font-style: italic;"
          >N/A</span
        >
      {/if}
    </div>
  </div>
  {#if uiStore.showGettingStartedTips}
    <div class="card-tip" transition:cardTipFlip>
      To start, <strong
        >select the color corresponding to your game pieces</strong
      >. One the game begins, you will want to find the prospector and surveyor
      pieces that correspond to your starting position.
    </div>
  {/if}
</div>
