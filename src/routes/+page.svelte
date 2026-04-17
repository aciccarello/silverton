<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { uiStore } from "$lib/state/uiStore.svelte";
  import { turnStore } from "$lib/state/turnStore.svelte";
  import { confirmStore } from "$lib/state/confirmStore.svelte";
  import { onMount, untrack } from "svelte";
  import { browser } from "$app/environment";
  import type { PageData } from "./$types";

  import LoginCard from "$lib/components/dashboard/LoginCard.svelte";
  import PlayerStatsCard from "$lib/components/dashboard/PlayerStatsCard.svelte";
  import TurnActionsCard from "$lib/components/dashboard/TurnActionsCard.svelte";
  import SellResourcesModal from "$lib/components/dashboard/SellResourcesModal.svelte";
  import TurnSequenceCard from "$lib/components/dashboard/TurnSequenceCard.svelte";
  import RollToOperateCard from "$lib/components/dashboard/RollToOperateCard.svelte";
  import PlayerOrderCard from "$lib/components/dashboard/PlayerOrderCard.svelte";
  import GameStatusCard from "$lib/components/dashboard/GameStatusCard.svelte";
  import TurnHistoryCard from "$lib/components/dashboard/TurnHistoryCard.svelte";

  let { data }: { data: PageData } = $props();

  let mounted = $state(false);
  let isSellModalOpen = $state(false);

  // Load initial server data into store
  untrack(() => {
    if (data.initialGameState) {
      gameStore.loadFromJson(data.initialGameState);
    }
  });

  async function savePlayer(player: any, action?: string) {
    if (!browser) return;
    try {
      await fetch("/api/state/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...player,
          lastModifiedBy: loggedInPlayer?.name || player.name || "Unknown",
          lastModifiedAction: action || "Updated player state",
        }),
      });
    } catch (err) {
      console.error("Failed to save player state:", err);
    }
  }

  async function saveGame(payload: any, action?: string) {
    if (!browser) return;
    try {
      await fetch("/api/state/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          lastModifiedBy: loggedInPlayer?.name || "System",
          lastModifiedAction: action || "Updated game state",
        }),
      });
    } catch (err) {
      console.error("Failed to save game state:", err);
    }
  }

  $effect(() => {
    uiStore.syncPhase(gameStore.currentPhase);
  });

  onMount(() => {
    mounted = true;
    const POLL_INTERVAL_MS = 5_000;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch("/api/state");
        if (res.ok) {
          const freshState = await res.json();
          gameStore.loadFromJson(freshState);
        }
      } catch (err) {
        console.warn("State poll failed:", err);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });

  function logInAs(playerId: string) {
    turnStore.loggedInUserId = playerId;
    if (browser) {
      localStorage.setItem("silverton_active_user_id", playerId);
      turnStore.loadFromLocal(playerId);
    }
  }

  function handleAddPlayer(newPlayerName: string) {
    const colors = [
      "#3498db",
      "#9b59b6",
      "#f1c40f",
      "#2ecc71",
      "#e74c3c",
      "#ffffff",
    ];
    const color = colors[gameStore.players.length % colors.length];
    const newPlayerId = Math.random().toString(36).substring(2, 9);
    const newPlayer = {
      id: newPlayerId,
      name: newPlayerName.trim(),
      color,
      money: gameStore.config.startingMoney,
      resources: { gold: 0, silver: 0, copper: 0, coal: 0, lumber: 0 },
      claims: 0,
      score: 0,
    };
    gameStore.players.push(newPlayer);
    logInAs(newPlayerId);
    savePlayer(newPlayer, "Joined the game");
  }

  function logOut() {
    turnStore.clear();
    turnStore.loggedInUserId = null;
    if (browser) {
      localStorage.removeItem("silverton_active_user_id");
    }
  }

  let loggedInPlayer = $derived(
    gameStore.players.find((p) => p.id === turnStore.loggedInUserId),
  );

  let winner = $derived.by(() => {
    const goal = gameStore.config.gameGoal;
    const candidates = gameStore.players.filter((p) => p.money >= goal);
    if (gameStore.currentPhase == "operating" || candidates.length === 0)
      return null;
    return [...candidates].sort((a, b) => b.money - a.money)[0];
  });

  function assignTurnOrder() {
    const playerIds = gameStore.players.map((p) => p.id);
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    gameStore.players.forEach((p) => {
      p.turnOrder = playerIds.indexOf(p.id) + 1;
      if (gameStore.currentPhase === "setup") {
        p.startingOrder = p.turnOrder;
      }
      savePlayer($state.snapshot(p), "Assigned turn order");
    });
  }

  function handleStartGame() {
    gameStore.players.forEach((p) => {
      p.prospectReady = false;
      p.operateReady = false;
    });
    assignTurnOrder();
    gameStore.startGame();
    gameStore.players.forEach((p) => {
      savePlayer($state.snapshot(p), "Assigned starting money and markets");
    });
    saveGame(
      {
        currentPhase: gameStore.currentPhase,
        turnNumber: gameStore.turnNumber,
        activePlayerId: gameStore.activePlayerId,
        config: $state.snapshot(gameStore.config),
      },
      "Started game",
    );
  }

  async function handleNextPhase() {
    const wasReset = gameStore.currentPhase === "reset";
    if (wasReset) {
      const confirmed = await confirmStore.confirm(
        "Are you sure you want to advance to the next turn? This will shuffle turn order and reset all player ready states.",
      );
      if (!confirmed) return;
    }
    gameStore.nextPhase();
    if (wasReset) {
      gameStore.players.forEach((p) => {
        p.prospectReady = false;
        p.operateReady = false;
      });
      assignTurnOrder();
    }
    saveGame(
      {
        currentPhase: gameStore.currentPhase,
        turnNumber: gameStore.turnNumber,
        activePlayerId: gameStore.activePlayerId,
      },
      `Advanced to ${gameStore.currentPhase} phase`,
    );
  }

  function openSellResourcesModal() {
    isSellModalOpen = true;
  }

  if (browser) {
    const storedId = localStorage.getItem("silverton_active_user_id");
    if (storedId && gameStore.players.some((p) => p.id === storedId)) {
      turnStore.loggedInUserId = storedId;
      turnStore.loadFromLocal(storedId);
    }
  }
</script>

<svelte:head>
  <title>Silverton Dashboard</title>
  <meta
    name="description"
    content="State management for the Silverton board game"
  />
</svelte:head>

<div class="hero animate-entrance">
  <h1>Silverton</h1>
  <p class="subtitle stagger-1">Board Game Tracker</p>

  {#if loggedInPlayer}
    <div class="actions animate-entrance stagger-2">
      <button
        class="btn btn-outline"
        style="border-color: {loggedInPlayer.color}; color: {loggedInPlayer.color}; pointer-events: none;"
      >
        Welcome, {loggedInPlayer.name}
      </button>
      <button class="btn btn-outline" onclick={logOut}>Log Out</button>
    </div>
    <div style="margin: 1rem 0; text-align: center;">
      <label style="cursor: pointer; font-size: 1rem;">
        <input
          type="checkbox"
          bind:checked={uiStore.showGettingStartedTips}
          style="margin-right: 0.5em; vertical-align: middle;"
        />
        Show Getting Started Tips
      </label>
    </div>
  {/if}
</div>

{#if winner}
  <div class="card victory-banner animate-entrance">
    <h2>🎉 Victory! 🎉</h2>
    <p>
      <strong>{winner.name}</strong> has reached the game goal with
      <strong>${winner.money}</strong>!
    </p>
    <p
      class="subtitle"
      style="font-size: 1rem; margin-top: 0.5rem; color: var(--color-text-secondary);"
    >
      Congratulations on your incredible luck in Silverton!
    </p>
  </div>
{/if}

{#if mounted}
  {#if !turnStore.loggedInUserId}
    <div
      class="dashboard-grid animate-entrance stagger-3"
      style="max-width: 600px; margin: 0 auto;"
    >
      <LoginCard {logInAs} {handleAddPlayer} />
    </div>
  {:else}
    <div class="dashboard-grid animate-entrance stagger-3">
      {#if loggedInPlayer}
        <PlayerStatsCard {loggedInPlayer} {savePlayer} />
        <TurnActionsCard
          {loggedInPlayer}
          {savePlayer}
          {handleNextPhase}
          {openSellResourcesModal}
        />
      {/if}

      <TurnSequenceCard />
      <RollToOperateCard />
      <PlayerOrderCard loggedInUserId={turnStore.loggedInUserId} />
      <GameStatusCard {handleNextPhase} {handleStartGame} />

      {#if loggedInPlayer}
        <TurnHistoryCard {loggedInPlayer} />
      {/if}
    </div>
  {/if}
{/if}

<SellResourcesModal bind:isOpen={isSellModalOpen} {loggedInPlayer} />
