<script lang="ts">
  import { gameStore } from '$lib/state/gameStore.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Local device authentication state
  let loggedInUserId = $state<string | null>(null);

  // Load initial server data into store
  if (data.initialGameState) {
    gameStore.loadFromJson(data.initialGameState);
  }

  // Auto-save effect
  $effect(() => {
    // Reading values to track dependencies
    const payload = {
        players: gameStore.players,
        currentPhase: gameStore.currentPhase,
        turnNumber: gameStore.turnNumber,
        activePlayerId: gameStore.activePlayerId,
        marketPrices: gameStore.marketPrices
    };

    if (browser) {
        fetch('/api/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to save state:', err));
    }
  });

  onMount(() => {
    // Check if we already have an active session logged into local storage
    if (browser) {
      const storedId = localStorage.getItem('silverton_active_user_id');
      if (storedId && gameStore.players.some(p => p.id === storedId)) {
        loggedInUserId = storedId;
      }
    }
  });

  let newPlayerName = $state('');
  
  function handleAddPlayer() {
    if (newPlayerName.trim()) {
      // Pick random color from a preset list
      const colors = ['#e6a122', '#a83c32', '#326da8', '#32a852'];
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
    }
  }

  function logInAs(playerId: string) {
    loggedInUserId = playerId;
    if (browser) {
      localStorage.setItem('silverton_active_user_id', playerId);
    }
  }

  function logOut() {
    loggedInUserId = null;
    if (browser) {
      localStorage.removeItem('silverton_active_user_id');
    }
  }

  let loggedInPlayer = $derived(gameStore.players.find(p => p.id === loggedInUserId));

  // Turn Action tracking
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
    (debitBuyClaims || 0) - 
    (debitOperateClaims || 0) - 
    (debitPayFines || 0)
  );

  let predictedBalance = $derived(loggedInPlayer ? loggedInPlayer.money + netChange : 0);

  function completeTurn() {
    if (loggedInPlayer) {
      loggedInPlayer.money = predictedBalance;
      
      // Reset inputs
      debitBuyClaims = null;
      debitOperateClaims = null;
      debitPayFines = null;
      creditPassengerRevenue = null;
      creditSellResources = null;
      dealsAndAdjustments = null;
    }
  }
</script>

<svelte:head>
  <title>Silverton Dashboard</title>
  <meta name="description" content="State management for the Silverton board game" />
</svelte:head>

<div class="hero animate-entrance">
  <h1>Silverton</h1>
  <p class="subtitle stagger-1">Board Game State Manager</p>
  
  <div class="actions stagger-2">
    {#if loggedInPlayer}
        <button class="btn btn-outline" style="border-color: {loggedInPlayer.color}; color: {loggedInPlayer.color}; pointer-events: none;">Welcome, {loggedInPlayer.name}</button>
        <button class="btn btn-outline" onclick={logOut}>Log Out</button>
    {/if}
  </div>
</div>

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
          <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
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
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <input 
              type="text" 
              bind:value={newPlayerName} 
              placeholder="Your Name" 
              style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-elevated); color: var(--color-text-primary);"
            />
            <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick={handleAddPlayer}>Join</button>
          </div>
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
                <h2>Your Dossier</h2>
                <span style="font-size: 2rem; font-family: var(--font-heading); color: var(--color-primary);">${loggedInPlayer.money}</span>
            </div>
            
            <h4 style="color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); padding-bottom: 4px; margin-bottom: var(--spacing-sm);">Resources</h4>
            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-md);">
                {#each Object.entries(loggedInPlayer.resources) as [resource, amount]}
                    <div style="background: var(--color-bg-elevated); padding: var(--spacing-sm) var(--spacing-md); border-radius: 4px; border: 1px solid var(--color-border); flex: 1; min-width: 100px; text-align: center;">
                        <span style="text-transform: capitalize; color: var(--color-text-secondary); font-size: 0.9rem; display: block;">{resource}</span>
                        <strong style="font-size: 1.25rem;">{amount}</strong>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Turn Actions Widget -->
        <div class="card" style="grid-column: 1 / -1;">
            <h3>Turn Actions</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                
                <!-- Debits -->
                <div>
                    <h4 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">Debits (-)</h4>
                    <div class="input-group">
                        <label>Buy Claims/Contracts</label>
                        <input type="number" min="0" bind:value={debitBuyClaims} placeholder="0" />
                    </div>
                    <div class="input-group">
                        <label>Operate Claims</label>
                        <input type="number" min="0" bind:value={debitOperateClaims} placeholder="0" />
                    </div>
                    <div class="input-group">
                        <label>Pay Fines</label>
                        <input type="number" min="0" bind:value={debitPayFines} placeholder="0" />
                    </div>
                </div>

                <!-- Credits & Adjustments -->
                <div>
                    <h4 style="color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">Credits (+) & Adjustments</h4>
                    <div class="input-group">
                        <label>Passenger Revenue</label>
                        <input type="number" min="0" bind:value={creditPassengerRevenue} placeholder="0" />
                    </div>
                    <div class="input-group">
                        <label>Sell Resources</label>
                        <input type="number" min="0" bind:value={creditSellResources} placeholder="0" />
                    </div>
                    <div class="input-group">
                        <label>Deals & Adjustments (+/-)</label>
                        <input type="number" bind:value={dealsAndAdjustments} placeholder="0" />
                    </div>
                </div>
            </div>

            <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-sm);">
                <div>
                    <span style="font-size: 0.9rem; color: var(--color-text-secondary); margin-right: var(--spacing-md); display: inline-block;">
                        Net Change: <strong style="color: {netChange > 0 ? 'var(--color-primary)' : netChange < 0 ? '#ff4d4f' : 'inherit'}">{netChange > 0 ? '+' : ''}{netChange}</strong>
                    </span>
                    <span style="font-size: 1.1rem; display: inline-block;">
                        New Balance: <strong style="color: {predictedBalance < 0 ? '#ff4d4f' : 'inherit'}">${predictedBalance}</strong>
                    </span>
                </div>
                <button class="btn btn-primary" onclick={completeTurn} disabled={netChange === 0}>My Turn Complete</button>
            </div>
        </div>
    {/if}

    <!-- Global Game Stats Widget -->
    <div class="card">
      <h3>Game Status</h3>
      <p><strong>Phase:</strong> {gameStore.currentPhase}</p>
      <p><strong>Turn:</strong> {gameStore.turnNumber}</p>
      {#if gameStore.activePlayerId}
        <p><strong>Active Player:</strong> {gameStore.players.find(p => p.id === gameStore.activePlayerId)?.name}</p>
      {/if}

      <div style="margin-top: var(--spacing-md); border-top: 1px solid var(--color-border); padding-top: var(--spacing-md);">
        {#if gameStore.currentPhase === 'setup'}
            <button class="btn btn-primary" style="width: 100%;" onclick={() => gameStore.startGame()} disabled={gameStore.players.length === 0}>Start Game</button>
        {:else}
            <button class="btn btn-primary" style="width: 100%;" onclick={() => gameStore.nextPhase()}>Next Phase ({gameStore.currentPhase})</button>
        {/if}
      </div>
    </div>
    
    <div class="card">
      <h3>Market Prices</h3>
      <ul style="list-style-type: none; padding: 0;">
        {#each Object.entries(gameStore.marketPrices) as [resource, price]}
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border); padding: 4px 0;">
            <span style="text-transform: capitalize;">{resource}</span>
            <strong>${price}</strong>
          </li>
        {/each}
      </ul>
    </div>

    <div class="card">
        <h3>All Players ({gameStore.players.length})</h3>
        {#if gameStore.players.length === 0}
            <p>No players added yet.</p>
        {:else}
            <ul style="list-style-type: none; padding: 0;">
                {#each gameStore.players as player}
                    <li style="margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                        <span style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: {player.color}"></div>
                            <strong>{player.name}</strong> 
                            {#if player.id === loggedInUserId} <span style="font-size: 0.8rem; color: var(--color-text-secondary);">(You)</span> {/if}
                        </span>
                        <span>${player.money}</span>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
  </div>
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
    font-family: var(--font-heading);
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

  .input-group label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
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
</style>
