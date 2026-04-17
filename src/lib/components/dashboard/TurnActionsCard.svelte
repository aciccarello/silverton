<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { turnStore } from "$lib/state/turnStore.svelte";
  import { cardTipFlip } from "$lib/transitions";
  import type { Player, TurnHistoryEntry } from "$lib/state/gameStore.svelte";

  let {
    loggedInPlayer,
    savePlayer,
    handleNextPhase,
    openSellResourcesModal,
  }: {
    loggedInPlayer: Player;
    savePlayer: (p: Player, action: string) => void;
    handleNextPhase: () => void;
    openSellResourcesModal: () => void;
  } = $props();

  const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
  let season = $derived(SEASONS[(gameStore.turnNumber - 1) % 4]);
  let isWinter = $derived(season === "Winter");

  let predictedBalance = $derived(
    loggedInPlayer ? loggedInPlayer.money + turnStore.netChange : 0,
  );

  let isOperatingLocked = $derived(
    gameStore.currentPhase === "prospecting" && !loggedInPlayer?.prospectReady,
  );

  $effect(() => {
    // Auto-save whenever store values change
    turnStore.debitBuyTracks;
    turnStore.debitBuyContracts;
    turnStore.debitBuyClaims;
    turnStore.debitOperateClaims;
    turnStore.debitPayFines;
    turnStore.creditPassengerRevenue;
    turnStore.creditSellResources;
    turnStore.dealsAndAdjustments;
    turnStore.saveToLocal();
  });

  function doneProspecting() {
    if (loggedInPlayer) {
      loggedInPlayer.prospectReady = true;
      savePlayer($state.snapshot(loggedInPlayer), "Done prospecting");

      const allReady =
        gameStore.players.length > 0 &&
        gameStore.players.every((p) => p.prospectReady);
      if (allReady && gameStore.currentPhase === "prospecting") {
        handleNextPhase();
      }
    }
  }

  function doneOperating() {
    if (loggedInPlayer) {
      const historyEntry: TurnHistoryEntry = {
        turn: gameStore.turnNumber,
        season,
        phase: gameStore.currentPhase,
        netChange: turnStore.netChange,
        balance: predictedBalance,
        timestamp: new Date().toISOString(),
      };

      if (!loggedInPlayer.history) {
        loggedInPlayer.history = [];
      }
      loggedInPlayer.history.push(historyEntry);

      loggedInPlayer.money = predictedBalance;
      loggedInPlayer.operateReady = true;

      turnStore.clear();
      turnStore.clearLocal();

      savePlayer($state.snapshot(loggedInPlayer), "Completed turn");

      const allReady =
        gameStore.players.length > 0 &&
        gameStore.players.every((p) => p.operateReady);
      if (allReady && gameStore.currentPhase === "operating") {
        handleNextPhase();
      }
    }
  }
</script>

<div class="card" style="grid-column: 1 / -1;">
  <h3>Turn Actions</h3>
  {#if uiStore.showGettingStartedTips}
    <div class="card-tip" transition:cardTipFlip>
      Here you can <strong>add up all the debts and credits for the turn</strong
      >. To begin, you must be done prospecting. Debts are subtracted while
      credits and adjustments are added to your balance. Click "I'm done
      operating" to save your changes. If you've saved prematurely, you can also
      make an adjustment. If needed you can enter negative adjustments.
    </div>
  {/if}
  {#if isWinter}
    <div
      style="background: rgba(100, 181, 246, 0.12); border: 1px solid #64b5f6; border-radius: 6px; padding: var(--spacing-sm) var(--spacing-md); margin-bottom: var(--spacing-md); color: #90caf9;"
    >
      ❄️ <strong>Winter:</strong> White (winter) route segments cannot be surveyed
      or used for deliveries/passenger rail this turn.
    </div>
  {/if}

  <div
    style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);"
  >
    <!-- Debits -->
    <div>
      <h4
        style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);"
      >
        Debits (-)
      </h4>
      <label class="input-group">
        <span>Buy Tracks</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.debitBuyTracks}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span>Buy Contracts</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.debitBuyContracts}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span>Buy Claims</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.debitBuyClaims}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span>Operate Claims</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.debitOperateClaims}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span>Pay Fines</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.debitPayFines}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
    </div>
    <!-- Credits & Adjustments -->
    <div>
      <h4
        style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);"
      >
        Credits (+) & Adjustments
      </h4>
      <label class="input-group">
        <span>Passenger Revenue</span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.creditPassengerRevenue}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span style="display: flex; align-items: center; gap: 0.5rem;">
          Sell Resources
          <button
            type="button"
            class="btn btn-outline"
            style="padding: 0.1rem 0.4rem; font-size: 0.75rem; border-width: 1px;"
            onclick={(e) => {
              e.preventDefault();
              openSellResourcesModal();
            }}
            disabled={isOperatingLocked}
          >
            Calculate
          </button>
        </span>
        <input
          type="number"
          min="0"
          bind:value={turnStore.creditSellResources}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
      <label class="input-group">
        <span>Deals & Adjustments (+/-)</span>
        <input
          type="number"
          bind:value={turnStore.dealsAndAdjustments}
          placeholder="0"
          disabled={isOperatingLocked}
        />
      </label>
    </div>
  </div>

  <div
    style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-sm);"
  >
    <div>
      <span
        style="font-size: 1.1rem; font-weight: bold; color: var(--color-primary);"
      >
        Current Phase:
      </span>
      <span style="margin-left: 0.5rem; color: var(--color-text-secondary);">
        {#if gameStore.currentPhase === "prospecting"}
          Prospect & Survey, Resolve Disputes
        {:else if gameStore.currentPhase === "operating"}
          Buy, Operate, Build, Deliver, Sell
        {:else if gameStore.currentPhase === "reset"}
          Replenish Cards, Price Changes, Advance Turn
        {/if}
      </span>
    </div>
    <div>
      <span
        style="font-size: 0.9rem; color: var(--color-text-secondary); margin-right: var(--spacing-md); display: inline-block;"
      >
        Net Change: <strong
          style="color: {turnStore.netChange > 0
            ? 'var(--color-primary)'
            : turnStore.netChange < 0
              ? '#ff4d4f'
              : 'inherit'}"
          >{turnStore.netChange > 0 ? "+" : ""}{turnStore.netChange}</strong
        >
      </span>
      <span style="font-size: 1.1rem; display: inline-block;">
        New Balance: <strong
          style="color: {predictedBalance < 0 ? '#ff4d4f' : 'inherit'}"
          >${predictedBalance}</strong
        >
      </span>
    </div>
    <div class="btn-container">
      <button
        class="btn btn-primary"
        onclick={doneProspecting}
        disabled={loggedInPlayer?.prospectReady ||
          gameStore.currentPhase !== "prospecting"}>I'm Done Prospecting</button
      >
      <button
        class="btn btn-primary"
        onclick={doneOperating}
        disabled={predictedBalance < 0 ||
          gameStore.currentPhase === "prospecting"}
        >{loggedInPlayer?.operateReady
          ? "Make Adjustment"
          : "I'm Done Operating"}</button
      >
    </div>
  </div>
</div>
