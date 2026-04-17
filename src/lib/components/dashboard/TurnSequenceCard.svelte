<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { cardTipFlip } from "$lib/transitions";
</script>

<div class="card card-tight">
  <h3>Turn Sequence</h3>
  {#if uiStore.showGettingStartedTips}
    <div class="card-tip" transition:cardTipFlip>
      The turn sequence indicates what players do in each phase of the turn.
    </div>
  {/if}
  <ol class="phase-list">
    <li class:active={gameStore.currentPhase === "prospecting"}>
      <strong>1. Prospecting Phase:</strong> Prospect & Survey, Resolve Disputes
    </li>
    <li class:active={gameStore.currentPhase === "operating"}>
      <strong>2. Operating Phase:</strong> Buy, Operate, Build, Deliver, Sell
    </li>
    <li class:active={gameStore.currentPhase === "reset"}>
      <strong>3. Reset Phase:</strong> Replenish Cards, Price Changes, Advance Turn
    </li>
  </ol>
</div>
