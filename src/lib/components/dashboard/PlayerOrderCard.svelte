<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { cardTipFlip } from "$lib/transitions";
  import type { Player } from "$lib/state/gameStore.svelte";

  let {
    loggedInUserId,
  }: {
    loggedInUserId: string | null;
  } = $props();

  let sortedPlayers = $derived(
    [...gameStore.players].sort(
      (a, b) => (a.turnOrder ?? 0) - (b.turnOrder ?? 0),
    ),
  );

  let winner = $derived.by(() => {
    if (gameStore.players.length === 0) return null;
    let maxScore = -1;
    let winningPlayer: Player | null = null;
    let tieCount = 0;

    for (const player of gameStore.players) {
      if (player.score > maxScore) {
        maxScore = player.score;
        winningPlayer = player;
        tieCount = 1;
      } else if (player.score === maxScore) {
        tieCount++;
      }
    }

    if (maxScore >= gameStore.config.gameGoal && tieCount === 1) {
      return winningPlayer;
    }
    return null;
  });
</script>

<div class="card card-tight">
  <h3>Turn Order</h3>
  {#if uiStore.showGettingStartedTips}
    <div class="card-tip" transition:cardTipFlip>
      Once everyone has joined the game, use your physical starting pieces to
      determine turn order. The turn order determines what city you start in.
      Drag and drop to sort this list.
    </div>
  {/if}
  <ul class="player-list">
    {#each sortedPlayers as player, index}
      <li
        class="player-list-item"
        style="border-left: 4px solid {player.color}"
      >
        <span class="player-name">
          {index + 1}. {player.name}
          {#if winner?.id === player.id}
            <span title="Winner!">👑</span>
          {/if}
        </span>

        <span class="player-status">
          {#if gameStore.currentPhase === "prospecting"}
            {#if player.prospectReady}
              <span style="color: var(--color-success);">Ready</span>
            {:else}
              <span style="color: var(--color-text-secondary);"
                >Prospecting</span
              >
            {/if}
          {:else if gameStore.currentPhase === "operating"}
            {#if player.operateReady}
              <span style="color: var(--color-success);">Ready</span>
            {:else}
              <span style="color: var(--color-text-secondary);">Operating</span>
            {/if}
          {:else}
            <!-- Reset phase or setup -->
            -
          {/if}
        </span>

        <span class="player-money">
          {#if player.money >= gameStore.config.visibleAmount || loggedInUserId === player.id || gameStore.currentPhase === "end"}
            ${player.money}
          {:else}
            <span
              style="color: var(--color-text-secondary); font-style: italic;"
              >Hidden</span
            >
          {/if}
        </span>
      </li>
    {/each}
  </ul>
</div>
