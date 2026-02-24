<script lang="ts">
  import { gameStore } from '$lib/state/gameStore.svelte';
  import { confirmStore } from '$lib/state/confirmStore.svelte';
  import Dice from '$lib/components/Dice.svelte';
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import type { Player, TurnHistoryEntry } from '$lib/state/gameStore.svelte';

  let { data }: { data: PageData } = $props();

  // Local device authentication state
  let loggedInUserId = $state<string | null>(null);
  let mounted = $state(false);
  let isColorDropdownOpen = $state(false);

  // Claim Rolling State
  let claimRollResults = $state<number[]>([]);
  let isClaimRolling = $state(false);
  let claimRollTotal = $state<number | null>(null);
  let claimRollType = $state<'Initial' | 'Normal' | null>(null);

  const PLAYER_COLORS = [
    { name: 'Blue', hex: '#3498db' },
    { name: 'Purple', hex: '#9b59b6' },
    { name: 'Yellow', hex: '#f1c40f' },
    { name: 'Green', hex: '#2ecc71' },
    { name: 'Red', hex: '#e74c3c' },
    { name: 'White', hex: '#ffffff' }
  ];

  // Load initial server data into store
  untrack(() => {
    if (data.initialGameState) {
      gameStore.loadFromJson(data.initialGameState);
    }
  });

  async function savePlayer(player: Player, action?: string) {
    if (!browser) return;
    try {
        await fetch('/api/state/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...player,
                lastModifiedBy: loggedInPlayer?.name || player.name || 'Unknown',
                lastModifiedAction: action || 'Updated player state'
            })
        });
    } catch (err) {
        console.error('Failed to save player state:', err);
    }
  }

  async function saveGame(payload: any, action?: string) {
    if (!browser) return;
    try {
        await fetch('/api/state/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...payload,
                lastModifiedBy: loggedInPlayer?.name || 'System',
                lastModifiedAction: action || 'Updated game state'
            })
        });
    } catch (err) {
        console.error('Failed to save game state:', err);
    }
  }

  // Getting started tips toggle (not persisted)
  let showGettingStartedTips = $state(gameStore.currentPhase === 'setup');
  let previousPhase = gameStore.currentPhase;

  // When phase changes from setup to another, auto-hide tips if still showing
  $effect(() => {
    if (previousPhase === 'setup' && gameStore.currentPhase !== 'setup' && showGettingStartedTips) {
      showGettingStartedTips = false;
    }
    previousPhase = gameStore.currentPhase;
  });

  onMount(() => {
    mounted = true;
    // Poll the server every 5 seconds to keep game state in sync across players
    const POLL_INTERVAL_MS = 5_000;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const freshState = await res.json();
          gameStore.loadFromJson(freshState);
        }
      } catch (err) {
        // Silently ignore network errors during polling
        console.warn('State poll failed:', err);
      }
    }, POLL_INTERVAL_MS);

    // Clean up on component destroy
    return () => clearInterval(intervalId);
  });

  let newPlayerName = $state('');
  
  function handleAddPlayer() {
    if (newPlayerName.trim()) {
      // Pick random color from a preset list
      const colors = PLAYER_COLORS.map(c => c.hex);
      const color = colors[gameStore.players.length % colors.length];
      
      const newPlayerId = Math.random().toString(36).substring(2, 9);
      
      const newPlayer = {
          id: newPlayerId,
          name: newPlayerName.trim(),
          color,
          money: 1600, // Updated starting money
          resources: { gold: 0, silver: 0, copper: 0, coal: 0, lumber: 0 },
          claims: 0,
          score: 0
      };
      
      // Mutating the gameStore directly
      gameStore.players.push(newPlayer);
      newPlayerName = '';
      logInAs(newPlayerId);

      // Async save
      savePlayer(newPlayer, 'Joined the game');
    }
  }

  function logInAs(playerId: string) {
    loggedInUserId = playerId;
    if (browser) {
      localStorage.setItem('silverton_active_user_id', playerId);
      loadTurnActionsFromLocal();
    }
  }

  function logOut() {
    clearTurnActionsFromLocal();
    loggedInUserId = null;
    if (browser) {
      localStorage.removeItem('silverton_active_user_id');
    }
  }

  let loggedInPlayer = $derived(gameStore.players.find(p => p.id === loggedInUserId));

  const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
  let season = $derived(SEASONS[(gameStore.turnNumber - 1) % 4]);
  let isWinter = $derived(season === 'Winter');
  let nextPhase = $derived(gameStore.currentPhase === 'reset' ? 'prospecting' : gameStore.currentPhase === 'prospecting' ? 'operating' : 'reset');

  // Turn Action tracking
  let debitBuyTracks = $state<number | null>(null);
  let debitBuyContracts = $state<number | null>(null);
  let debitBuyClaims = $state<number | null>(null);
  let debitOperateClaims = $state<number | null>(null);
  let debitPayFines = $state<number | null>(null);
  let creditPassengerRevenue = $state<number | null>(null);
  let creditSellResources = $state<number | null>(null);
  let dealsAndAdjustments = $state<number | null>(null);

  let netChange = $derived(
    (creditPassengerRevenue || 0) + 
    (creditSellResources || 0) + 
    (dealsAndAdjustments || 0) - 
    (debitBuyTracks || 0) -
    (debitBuyContracts || 0) -
    (debitBuyClaims || 0) - 
    (debitOperateClaims || 0) - 
    (debitPayFines || 0)
  );

  let predictedBalance = $derived(loggedInPlayer ? loggedInPlayer.money + netChange : 0);
  let isOperatingLocked = $derived(gameStore.currentPhase === 'prospecting' && !loggedInPlayer?.prospectReady);

  // Persistence logic for turn actions
  function saveTurnActionsToLocal() {
    if (!browser || !loggedInUserId) return;
    const data = {
      debitBuyTracks,
      debitBuyContracts,
      debitBuyClaims,
      debitOperateClaims,
      debitPayFines,
      creditPassengerRevenue,
      creditSellResources,
      dealsAndAdjustments
    };
    localStorage.setItem(`silverton_actions_${loggedInUserId}`, JSON.stringify(data));
  }

  function loadTurnActionsFromLocal() {
    if (!browser || !loggedInUserId) return;
    const saved = localStorage.getItem(`silverton_actions_${loggedInUserId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        debitBuyTracks = data.debitBuyTracks;
        debitBuyContracts = data.debitBuyContracts;
        debitBuyClaims = data.debitBuyClaims;
        debitOperateClaims = data.debitOperateClaims;
        debitPayFines = data.debitPayFines;
        creditPassengerRevenue = data.creditPassengerRevenue;
        creditSellResources = data.creditSellResources;
        dealsAndAdjustments = data.dealsAndAdjustments;
      } catch (e) {
        console.error('Failed to parse saved turn actions', e);
      }
    }
  }

  function clearTurnActionsFromLocal() {
    if (!browser || !loggedInUserId) return;
    localStorage.removeItem(`silverton_actions_${loggedInUserId}`);
  }

  // Effect to auto-save inputs when they change
  $effect(() => {
    // We reference all inputs here to track them
    const _ = {
      debitBuyTracks,
      debitBuyContracts,
      debitBuyClaims,
      debitOperateClaims,
      debitPayFines,
      creditPassengerRevenue,
      creditSellResources,
      dealsAndAdjustments,
      loggedInUserId // Reset if user changes
    };
    saveTurnActionsToLocal();
  });

  let sortedPlayers = $derived([...gameStore.players].sort((a, b) => {
    if (a.turnOrder === undefined) return 1;
    if (b.turnOrder === undefined) return -1;
    return a.turnOrder - b.turnOrder;
  }));

  let winner = $derived.by(() => {
    const goal = gameStore.config.gameGoal;
    const candidates = gameStore.players.filter(p => p.money >= goal);
    if (gameStore.currentPhase == 'operating' || candidates.length === 0) return null;
    // Sort by money descending and take the first one
    return [...candidates].sort((a, b) => b.money - a.money)[0];
  });

  function doneProspecting() {
    if (loggedInPlayer) {
      loggedInPlayer.prospectReady = true;
      savePlayer($state.snapshot(loggedInPlayer), 'Done prospecting');
      // Auto-advance if all players are ready and not already advanced
      const allReady = gameStore.players.length > 0 && gameStore.players.every(p => p.prospectReady);
      if (allReady && gameStore.currentPhase === 'prospecting') {
        handleNextPhase();
      }
    }
  }

  function doneOperating() {
    if (loggedInPlayer) {
      // Record turn history entry
      const historyEntry: TurnHistoryEntry = {
        turn: gameStore.turnNumber,
        season,
        phase: gameStore.currentPhase,
        netChange,
        balance: predictedBalance,
        timestamp: new Date().toISOString()
      };

      if (!loggedInPlayer.history) {
        loggedInPlayer.history = [];
      }
      loggedInPlayer.history.push(historyEntry);

      loggedInPlayer.money = predictedBalance;

      loggedInPlayer.operateReady = true;
      // Reset inputs
      debitBuyTracks = null;
      debitBuyContracts = null;
      debitBuyClaims = null;
      debitOperateClaims = null;
      debitPayFines = null;
      creditPassengerRevenue = null;
      creditSellResources = null;
      dealsAndAdjustments = null;

      clearTurnActionsFromLocal();

      // Sync player balance and ready state
      savePlayer($state.snapshot(loggedInPlayer), 'Completed turn');

      // Auto-advance if all players are ready and not already advanced
      const allReady = gameStore.players.length > 0 && gameStore.players.every(p => p.operateReady);
      if (allReady && gameStore.currentPhase === 'operating') {
        handleNextPhase();
      }
    }
  }

  function updatePlayerColor(color: string) {
    if (loggedInPlayer) {
      loggedInPlayer.color = color;
      savePlayer($state.snapshot(loggedInPlayer), `Changed color to ${color}`);
    }
  }

  async function rollClaim(type: 'Initial' | 'Normal') {
    if (isClaimRolling) return;
    
    isClaimRolling = true;
    claimRollType = type;
    claimRollResults = [];
    claimRollTotal = null;

    // Simulate rolling delay
    await new Promise(r => setTimeout(r, 600));

    const diceCount = type === 'Initial' ? 1 : 2;
    const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    
    claimRollResults = results;
    const sum = results.reduce((a, b) => a + b, 0);
    claimRollTotal = type === 'Initial' ? sum + 6 : sum;
    isClaimRolling = false;
  }

  function assignTurnOrder() {
    const playerIds = gameStore.players.map(p => p.id);
    // Shuffle the player IDs
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    
    // Assign order (1-indexed) based on shuffled list
    gameStore.players.forEach(p => {
      p.turnOrder = playerIds.indexOf(p.id) + 1;
      savePlayer($state.snapshot(p), 'Assigned turn order');
    });
  }

  function handleStartGame() {
    // Reset ready state and assign random turn order on all players
    gameStore.players.forEach(p => {
      p.prospectReady = false;
      p.operateReady = false;
    });
    assignTurnOrder();
    gameStore.startGame();
    saveGame({
        currentPhase: gameStore.currentPhase,
        turnNumber: gameStore.turnNumber,
        activePlayerId: gameStore.activePlayerId
    }, 'Started game');
  }

  async function handleNextPhase() {
    const wasReset = gameStore.currentPhase === 'reset';
    
    if (wasReset) {
      const confirmed = await confirmStore.confirm('Are you sure you want to advance to the next turn? This will shuffle turn order and reset all player ready states.');
      if (!confirmed) return;
    }

    gameStore.nextPhase();
    // Reset ready state and re-shuffle turn order when a new turn begins
    if (wasReset) {
      gameStore.players.forEach(p => {
        p.prospectReady = false;
        p.operateReady = false;
      });
      assignTurnOrder();
    }
    saveGame({
        currentPhase: gameStore.currentPhase,
        turnNumber: gameStore.turnNumber,
        activePlayerId: gameStore.activePlayerId
    }, `Advanced to ${gameStore.currentPhase} phase`);
  }

  // Restore session synchronously on client
  if (browser) {
    const storedId = localStorage.getItem('silverton_active_user_id');
    if (storedId && gameStore.players.some(p => p.id === storedId)) {
      loggedInUserId = storedId;
      loadTurnActionsFromLocal();
    }
  }
</script>

<svelte:head>
  <title>Silverton Dashboard</title>
  <meta name="description" content="State management for the Silverton board game" />
</svelte:head>

<div class="hero animate-entrance">
  <h1>Silverton</h1>
  <p class="subtitle stagger-1">Board Game Tracker</p>
  
  {#if loggedInPlayer}
    <div class="actions animate-entrance stagger-2">
      <button class="btn btn-outline" style="border-color: {loggedInPlayer.color}; color: {loggedInPlayer.color}; pointer-events: none;">Welcome, {loggedInPlayer.name}</button>
      <button class="btn btn-outline" onclick={logOut}>Log Out</button>
    </div>
    <div style="margin: 1rem 0; text-align: center;">
      <label style="cursor: pointer; font-size: 1rem;">
        <input type="checkbox" bind:checked={showGettingStartedTips} style="margin-right: 0.5em; vertical-align: middle;" />
        Show Getting Started Tips
      </label>
    </div>
  {/if}
</div>

{#if winner}
  <div class="card victory-banner animate-entrance">
    <h2>🎉 Victory! 🎉</h2>
    <p><strong>{winner.name}</strong> has reached the game goal with <strong>${winner.money}</strong>!</p>
    <p class="subtitle" style="font-size: 1rem; margin-top: 0.5rem; color: var(--color-text-secondary);">Congratulations on your incredible luck in Silverton!</p>
  </div>
{/if}

{#if mounted}
  {#if !loggedInUserId}
    <!-- LOGIN VIEW -->
    <div class="dashboard-grid animate-entrance stagger-3" style="max-width: 600px; margin: 0 auto;">
    <div class="card" style="text-align: center;">
      <h2>Join Game</h2>
      
      <div style="margin: var(--spacing-lg) 0;">
        <p style="margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);">Select an existing player to log in:</p>
        {#if gameStore.players.length === 0}
          <p><em>No players registered yet.</em></p>
        {:else}
          <div class="btn-container btn-container--vertical">
            {#each gameStore.players as player}
              <button 
                  class="btn btn-outline" 
                  style="border-color: {player.color}; color: {player.color}; width: 100%;"
                  onclick={() => logInAs(player.id)}
              >
                  {player.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-lg);">
        <p style="margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);">Or register a new player:</p>
        {#if gameStore.currentPhase === 'setup'}
          <form style="display: flex; gap: 0.5rem; justify-content: center;" onsubmit={(e) => { e.preventDefault(); handleAddPlayer(); }}>
            <input 
              type="text" 
              bind:value={newPlayerName} 
              placeholder="Your Name" 
              style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-elevated); color: var(--color-text-primary);"
            />
            <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Join</button>
          </form>
        {:else}
          <p><em>Registration is closed once the game starts.</em></p>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- PLAYER DASHBOARD VIEW -->
  <div class="dashboard-grid animate-entrance stagger-3">
    
    <!-- Player Stats Widget -->
    {#if loggedInPlayer}
        <div class="card" style="border-top: 4px solid {loggedInPlayer.color}; grid-column: 1 / -1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--spacing-md);">
                <h2>Your balance</h2>
                <div style="display: flex; align-items: baseline; gap: var(--spacing-md); flex-wrap: wrap;">
                  <span style="font-size: 2rem; font-family: var(--font-heading); color: var(--color-primary);">${loggedInPlayer.money}</span>
                  
                  <!-- Color Picker Dropdown -->
                  <div class="color-picker-container">
                    <button 
                      class="color-picker-trigger" 
                      onclick={() => isColorDropdownOpen = !isColorDropdownOpen}
                      style="border-color: {loggedInPlayer.color};"
                    >
                      <div class="swatch-preview" style="background-color: {loggedInPlayer.color};"></div>
                      <span class="color-name">{PLAYER_COLORS.find(c => c.hex === loggedInPlayer?.color)?.name || 'Custom'}</span>
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
                            <div class="color-swatch-sm" style="background-color: {color.hex};"></div>
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
          {#if showGettingStartedTips}
            <div class="card-tip">To start, select the color corresponding to your game pieces. One the game begins, you will want to find the prospector and surveyor pieces that correspond to your starting position.</div>
          {/if}
        </div>

        <!-- Turn Actions Widget -->
        <div class="card" style="grid-column: 1 / -1;">
          <h3>Turn Actions</h3>
          {#if showGettingStartedTips}
            <div class="card-tip">Here you can add up all the debts and credits for the turn. To begin, you must be done prospecting. Debts are subtracted while credits and adjustments are added to your balance. Click "I'm done operating" to save your changes. If you've saved prematurely, you can also make an adjustment. If needed you can enter negative adjustments.</div>
          {/if}
          {#if isWinter}
            <div style="background: rgba(100, 181, 246, 0.12); border: 1px solid #64b5f6; border-radius: 6px; padding: var(--spacing-sm) var(--spacing-md); margin-bottom: var(--spacing-md); color: #90caf9;">
            ❄️ <strong>Winter:</strong> White (winter) route segments cannot be surveyed or used for deliveries/passenger rail this turn.
            </div>
          {/if}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">

            <!-- Debits -->
            <div>
              <h4 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">Debits (-)</h4>
              <label class="input-group">
                <span>Buy Tracks</span>
                <input type="number" min="0" bind:value={debitBuyTracks} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Buy Contracts</span>
                <input type="number" min="0" bind:value={debitBuyContracts} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Buy Claims</span>
                <input type="number" min="0" bind:value={debitBuyClaims} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Operate Claims</span>
                <input type="number" min="0" bind:value={debitOperateClaims} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Pay Fines</span>
                <input type="number" min="0" bind:value={debitPayFines} placeholder="0" disabled={isOperatingLocked} />
              </label>
            </div>
            <!-- Credits & Adjustments -->
            <div>
              <h4 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">Credits (+) & Adjustments</h4>
              <label class="input-group">
                <span>Passenger Revenue</span>
                <input type="number" min="0" bind:value={creditPassengerRevenue} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Sell Resources</span>
                <input type="number" min="0" bind:value={creditSellResources} placeholder="0" disabled={isOperatingLocked} />
              </label>
              <label class="input-group">
                <span>Deals & Adjustments (+/-)</span>
                <input type="number" bind:value={dealsAndAdjustments} placeholder="0" disabled={isOperatingLocked} />
              </label>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-sm);">
			<div>
				<span style="font-size: 1.1rem; font-weight: bold; color: var(--color-primary);">
				Current Phase:
				</span>
				<span style="margin-left: 0.5rem; color: var(--color-text-secondary);">
				{#if gameStore.currentPhase === 'prospecting'}
					Prospect & Survey, Resolve Disputes
				{:else if gameStore.currentPhase === 'operating'}
					Buy, Operate, Build, Deliver, Sell
				{:else if gameStore.currentPhase === 'reset'}
					Replenish Cards, Price Changes, Advance Turn
				{/if}
				</span>
			</div>
            <div>
              <span style="font-size: 0.9rem; color: var(--color-text-secondary); margin-right: var(--spacing-md); display: inline-block;">
                Net Change: <strong style="color: {netChange > 0 ? 'var(--color-primary)' : netChange < 0 ? '#ff4d4f' : 'inherit'}">{netChange > 0 ? '+' : ''}{netChange}</strong>
              </span>
              <span style="font-size: 1.1rem; display: inline-block;">
                New Balance: <strong style="color: {predictedBalance < 0 ? '#ff4d4f' : 'inherit'}">${predictedBalance}</strong>
              </span>
            </div>
            <div class="btn-container">
			  <button class="btn btn-primary" onclick={doneProspecting} disabled={loggedInPlayer?.prospectReady || gameStore.currentPhase !== 'prospecting'}>I'm Done Prospecting</button>
              <button class="btn btn-primary" onclick={doneOperating} disabled={predictedBalance < 0 || gameStore.currentPhase === 'prospecting'}>{loggedInPlayer?.operateReady ? "Make Adjustment" : "I'm Done Operating"}</button>
            </div>
          </div>
        </div>
    {/if}
    
    <div class="card">
      <h3>Turn Sequence</h3>
      {#if showGettingStartedTips}
        <div class="card-tip">This card, modeled after the physical card from the game, outlines the sequence of phases and steps for each game turn and highlights the current phase.</div>
      {/if}
      <ol class="turn-sequence">
        <li>Deal Turn Order Cards</li>
        <li class:active-step={gameStore.currentPhase === 'prospecting'}>Prospect &amp; Survey</li>
        <li class:active-step={gameStore.currentPhase === 'prospecting'}>Resolve Disputes</li>
        <li class:active-step={gameStore.currentPhase === 'operating'}>Construction &amp; Operation
          <ol>
            <li>Buy Claims/Contracts</li>
            <li>Build Track</li>
            <li>Operate Claims</li>
            <li>Make Deals</li>
            <li>Collect Passenger Revenue</li>
            <li>Deliver Loads</li>
            <li>Pay Fines</li>
          </ol>
        </li>
        <li class:active-step={gameStore.currentPhase === 'reset'}>Determine Price Changes</li>
        <li class:active-step={gameStore.currentPhase === 'reset'}>Replenish Cards</li>
        <li class:active-step={gameStore.currentPhase === 'reset'}>Advance Game Turn</li>
      </ol>
    </div>

    <!-- Roll to Operate Claim Widget -->
    <div class="card roll-card animate-entrance">
      <h3>Roll to Operate Claim</h3>
      {#if showGettingStartedTips}
        <div class="card-tip">Here you can roll dice to operate a claim and determine how many resources you yield. Roll one die the first time you operate a claim, and 2 dice for subsequent turns.</div>
      {/if}
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md); align-items: center; padding: var(--spacing-md) 0; flex: 1;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); width: 100%;">
          <Dice results={claimRollResults} isRolling={isClaimRolling} diceCount={claimRollType === 'Initial' ? 1 : 2}>
            <p class="placeholder" style="margin: 0;">Select roll type to start</p>
          </Dice>

          {#if claimRollTotal !== null && !isClaimRolling}
            <div class="animate-bounce-in" style="text-align: center;">
              <div style="text-transform: uppercase; font-size: 0.75rem; color: var(--color-text-secondary); letter-spacing: 0.1em; margin-bottom: 2px;">
                {claimRollType} Roll Total
              </div>
              <div style="font-size: 2.5rem; font-family: var(--font-heading); color: var(--color-primary); line-height: 1;">
                {claimRollTotal}
              </div>
              {#if claimRollType === 'Initial'}
                <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 4px;">
                  ({claimRollResults[0]} + 6)
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="btn-container">
          <button 
            class="btn btn-sm btn-outline" 
            style="flex: 1 1 120px;" 
            onclick={() => rollClaim('Initial')}
            disabled={isClaimRolling}
          >
            Initial (1d+6)
          </button>
          <button 
            class="btn btn-sm btn-outline" 
            style="flex: 1 1 120px;" 
            onclick={() => rollClaim('Normal')}
            disabled={isClaimRolling}
          >
            Normal (2d)
          </button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3>Player Order ({gameStore.players.length})</h3>
      {#if showGettingStartedTips}
        <div class="card-tip">This is where you can see all players in the game, the order for this game turn, and whether others are ready to move to the next phase. As players reach the visibility threshold, their balance will become visible.</div>
      {/if}
      {#if gameStore.players.length === 0}
        <p>No players added yet.</p>
      {:else}
        <ul style="list-style-type: none; padding: 0; flex-grow: 1;">
          {#each sortedPlayers as player}
            <li style="margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: {player.color}"></div>
                {#if player.turnOrder}<span style="font-size: 0.8rem; color: var(--color-text-secondary); width: 15px;">{player.turnOrder}.</span>{/if}
                <strong>{player.name}</strong> 
                {#if player.id === loggedInUserId} <span style="font-size: 0.8rem; color: var(--color-text-secondary);">(You)</span> {/if}
                {#if ((player.prospectReady && gameStore.currentPhase === 'prospecting') || (player.operateReady && gameStore.currentPhase === 'operating')) && !winner}
                  <span style="font-size: 0.75rem; background: rgba(82, 196, 26, 0.15); color: #52c41a; border: 1px solid #52c41a; border-radius: 10px; padding: 1px 7px; font-weight: bold;">✓ Ready</span>
                {/if}
              </span>
              <span class:winning-money={player.id === winner?.id}>
                {#if player.money >= gameStore.config.visibleAmount || player.id === loggedInUserId || winner}
                  ${player.money}
                {:else}
                  <span style="color: var(--color-text-secondary); font-style: italic;">Hidden</span>
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Global Game Stats Widget -->
    <div class="card">
      <h3>Game Status</h3>
      {#if showGettingStartedTips}
        <div class="card-tip">This section lists some broader game details like the turn and is also where a player can move everyone forward to the next phase when all are ready.</div>
      {/if}
    {#if winner}
      <p class="game-status-line"><strong>Winner:</strong> {winner.name} 🎉</p>
    {/if}
      <p class="game-status-line"><strong>Game Turn:</strong> {gameStore.turnNumber} <span style="color: {isWinter ? '#64b5f6' : 'var(--color-text-secondary)'}; font-style: italic;">{season}</span></p>
      <p class="game-status-line"><strong>Turn Phase:</strong> {gameStore.currentPhase}</p>
      
      {#if loggedInPlayer?.turnOrder}
        <div style="margin-top: var(--spacing-sm);">
          <strong>Turn Order:</strong> 
          {loggedInPlayer.turnOrder}
            <span style="font-size: 0.9rem; color: var(--color-text-secondary);">
              ({sortedPlayers.filter((p, index) => index + 1 == loggedInPlayer?.turnOrder || index + 2 == loggedInPlayer?.turnOrder).map(p => p.name).join(' → ')})
            </span>
        </div>
      {/if}

      <div style="margin-top: var(--spacing-md); border-top: 1px solid var(--color-border); padding-top: var(--spacing-md);">
        <p>Everyone ready to move forward?</p>
        {#if gameStore.currentPhase === 'setup'}
            <button class="btn btn-primary" style="width: 100%;" onclick={handleStartGame} disabled={gameStore.players.length === 0}>Start Game</button>
        {:else if gameStore.currentPhase === 'reset'}
            <button class="btn btn-primary" style="width: 100%;" onclick={handleNextPhase}>Next Turn</button>
        {:else}
            <button class="btn btn-primary" style="width: 100%;" onclick={handleNextPhase}>Next Phase ({nextPhase})</button>
        {/if}
      </div>
    </div>

    <div class="card" style="grid-column: 1 / -1;">
      <h3>Your Turn History</h3>
      {#if showGettingStartedTips}
        <div class="card-tip">Here you can review your personal turn history, including net changes and balances for each round. This can be helpful if you want to compare how you are doing with previous turns.</div>
      {/if}
      {#if !loggedInPlayer?.history || loggedInPlayer.history.length === 0}
        <p>No turns completed yet.</p>
      {:else}
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border); text-align: left;">
                <th style="padding: 0.5rem;">Turn</th>
                <th style="padding: 0.5rem;">Season</th>
                <th style="padding: 0.5rem;">Phase</th>
                <th style="padding: 0.5rem;">Change</th>
                <th style="padding: 0.5rem;">New Balance</th>
                <th style="padding: 0.5rem; text-align: right;">Time</th>
              </tr>
            </thead>
            <tbody>
              {#each [...loggedInPlayer.history].reverse() as entry}
                <tr style="border-bottom: 1px solid var(--color-border); font-size: 0.9rem;">
                  <td style="padding: 0.5rem;">{entry.turn}</td>
                  <td style="padding: 0.5rem;">{entry.season}</td>
                  <td style="padding: 0.5rem; text-transform: capitalize;">{entry.phase}</td>
                  <td style="padding: 0.5rem; color: {entry.netChange >= 0 ? 'var(--color-primary)' : '#ff5252'}">
                    {entry.netChange >= 0 ? '+' : ''}{entry.netChange}
                  </td>
                  <td style="padding: 0.5rem;">${entry.balance}</td>
                  <td style="padding: 0.5rem; text-align: right; color: var(--color-text-secondary); font-size: 0.8rem;">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}
{/if}

<style>
  .hero {
    text-align: center;
    padding: var(--spacing-xl) 0;
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-border);
  }
  
  .hero h1 {
    font-size: clamp(2.5rem, 10vw, 4.5rem);
    margin-bottom: var(--spacing-sm);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .subtitle {
    font-size: 1.5rem;
    color: var(--color-text-secondary);
    font-family: var(--font-display);
    font-weight: 300;
  }

  .victory-banner {
    text-align: center;
    background: linear-gradient(135deg, rgba(230, 161, 34, 0.15) 0%, rgba(230, 161, 34, 0.05) 100%);
    border: 2px solid var(--color-primary);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    box-shadow: 0 10px 30px rgba(230, 161, 34, 0.2);
  }

  .victory-banner h2 {
    font-size: 2.5rem;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--spacing-md);
  }

  .victory-banner p {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-lg);
  }
  
  .actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .input-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  .input-group input {
    width: 80px;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-base);
    color: var(--color-text-primary);
    text-align: right;
  }

  .game-status-line {
    text-transform: capitalize;
  }

  .turn-sequence {
    list-style-type: upper-roman;
    padding-left: var(--spacing-lg);
    margin: 0;
  }

  .turn-sequence li {
    color: var(--color-text-secondary);
    padding: 3px 0;
    font-size: 0.95rem;
  }

  .turn-sequence ol {
    list-style-type: decimal;
    padding-left: var(--spacing-lg);
    margin: 4px 0 2px;
  }

  .turn-sequence ol li {
    font-size: 0.85rem;
    padding: 1px 0;
  }

  .turn-sequence .active-step {
    font-weight: bold;
    color: var(--color-primary);
  }

  .winning-money {
    font-weight: bold;
    color: var(--color-primary);
  }

  .roll-card {
    min-height: 450px;
  }

  /* Color Picker Dropdown Styles */
  .color-picker-container {
    position: relative;
    user-select: none;
  }

  .color-picker-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--color-bg-elevated);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .color-picker-trigger:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-surface);
  }

  .swatch-preview {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .color-name {
    font-size: 0.9rem;
    font-weight: bold;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chevron {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    transition: transform var(--transition-fast);
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .color-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 100;
    width: 180px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .color-dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .color-dropdown-item:hover {
    background: rgba(230, 161, 34, 0.1);
  }

  .color-swatch-sm {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .check {
    margin-left: auto;
    color: var(--color-primary);
    font-weight: bold;
  }

</style>
