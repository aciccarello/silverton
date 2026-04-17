<script lang="ts">
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { cardTipFlip } from "$lib/transitions";
  import Dice from "$lib/components/Dice.svelte";

  let isClaimRolling = $state(false);
  let claimRollResults = $state<number[]>([1, 1]);
  let claimRollTotal = $derived(
    claimRollResults[0] + (claimRollType === "claim" ? claimRollResults[1] : 0),
  );
  let claimRollType: "claim" | "passenger" = $state("claim");

  function rollForClaim() {
    if (isClaimRolling) return;
    isClaimRolling = true;
    let rolls = 0;
    const interval = setInterval(() => {
      claimRollResults = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        isClaimRolling = false;
      }
    }, 50);
  }
</script>

<div class="card card-tight" style="text-align: center;">
  <h3 style="margin-bottom: var(--spacing-sm);">Roll to Operate</h3>

  <div
    style="margin-bottom: var(--spacing-sm); display: flex; justify-content: center; gap: var(--spacing-sm);"
  >
    <label style="display: flex; align-items: center; gap: 0.25rem;">
      <input
        type="radio"
        name="rollType"
        value="claim"
        bind:group={claimRollType}
      />
      Claim
    </label>
    <label style="display: flex; align-items: center; gap: 0.25rem;">
      <input
        type="radio"
        name="rollType"
        value="passenger"
        bind:group={claimRollType}
      />
      Passenger
    </label>
  </div>

  <div
    style="display: flex; justify-content: center; gap: 1rem; align-items: center; margin-bottom: var(--spacing-md);"
  >
    <Dice value={claimRollResults[0]} rolling={isClaimRolling} />
    {#if claimRollType === "claim"}
      <Dice value={claimRollResults[1]} rolling={isClaimRolling} />
    {/if}
  </div>

  <button
    class="btn btn-primary"
    onclick={rollForClaim}
    disabled={isClaimRolling}
  >
    {isClaimRolling ? "Rolling..." : "Roll Dice"}
  </button>

  {#if !isClaimRolling && claimRollResults.length > 0}
    <div style="margin-top: var(--spacing-sm); font-size: 1.1rem;">
      Total: <strong>{claimRollTotal}</strong>
    </div>
  {/if}

  {#if uiStore.showGettingStartedTips}
    <div class="card-tip" transition:cardTipFlip>
      To <strong>operate a claim</strong>, roll 2 dice and reference the chart
      on your claim card to see how much resources it produced. To
      <strong>calculate passenger revenue</strong>, roll 1 die and reference the
      passenger revenue table.
    </div>
  {/if}
</div>
