<script lang="ts">
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { cardTipFlip } from "$lib/transitions";
  import type { Player } from "$lib/state/gameStore.svelte";

  let {
    loggedInPlayer,
  }: {
    loggedInPlayer: Player | undefined;
  } = $props();
</script>

{#if loggedInPlayer?.history && loggedInPlayer.history.length > 0}
  <div class="card" style="grid-column: 1 / -1;">
    <h3>Turn History</h3>
    {#if uiStore.showGettingStartedTips}
      <div class="card-tip" transition:cardTipFlip>
        Your historical turn actions. Useful to look back on what you did last
        turn.
      </div>
    {/if}
    <div style="overflow-x: auto;">
      <table
        style="width: 100%; border-collapse: collapse; margin-top: var(--spacing-sm);"
      >
        <thead>
          <tr
            style="border-bottom: 2px solid var(--color-border); text-align: left;"
          >
            <th style="padding: 0.5rem; color: var(--color-text-secondary);"
              >Turn</th
            >
            <th style="padding: 0.5rem; color: var(--color-text-secondary);"
              >Season</th
            >
            <th style="padding: 0.5rem; color: var(--color-text-secondary);"
              >Net Change</th
            >
            <th style="padding: 0.5rem; color: var(--color-text-secondary);"
              >Balance</th
            >
          </tr>
        </thead>
        <tbody>
          {#each [...loggedInPlayer.history].reverse() as entry}
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td style="padding: 0.5rem;">{entry.turn}</td>
              <td style="padding: 0.5rem;">{entry.season}</td>
              <td
                style="padding: 0.5rem; color: {entry.netChange > 0
                  ? 'var(--color-primary)'
                  : entry.netChange < 0
                    ? '#ff4d4f'
                    : 'inherit'}"
              >
                {entry.netChange > 0 ? "+" : ""}{entry.netChange}
              </td>
              <td style="padding: 0.5rem; font-weight: bold;"
                >${entry.balance}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
