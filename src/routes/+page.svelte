<script lang="ts">
  import { gameStore } from '$lib/state/gameStore.svelte';

  let newPlayerName = $state('');
  
  function handleAddPlayer() {
    if (newPlayerName.trim()) {
      // Pick random color from a preset list
      const colors = ['#e6a122', '#a83c32', '#326da8', '#32a852'];
      const color = colors[gameStore.players.length % colors.length];
      gameStore.addPlayer(newPlayerName, color);
      newPlayerName = '';
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
    {#if gameStore.currentPhase === 'setup'}
      <button class="btn btn-primary" onclick={() => gameStore.startGame()} disabled={gameStore.players.length === 0}>Start Game</button>
    {:else}
      <button class="btn btn-primary" onclick={() => gameStore.nextPhase()}>Next Phase ({gameStore.currentPhase})</button>
    {/if}
  </div>
</div>

<div class="dashboard-grid animate-entrance stagger-3">
  <div class="card">
    <h3>Game Status</h3>
    <p><strong>Phase:</strong> {gameStore.currentPhase}</p>
    <p><strong>Turn:</strong> {gameStore.turnNumber}</p>
    {#if gameStore.activePlayerId}
      <p><strong>Active Player:</strong> {gameStore.players.find(p => p.id === gameStore.activePlayerId)?.name}</p>
    {/if}
  </div>
  
  <div class="card">
    <h3>Players ({gameStore.players.length})</h3>
    {#if gameStore.players.length === 0}
      <p>No players added yet.</p>
    {:else}
      <ul style="list-style-type: none; padding: 0;">
        {#each gameStore.players as player}
          <li style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: {player.color}"></div>
            <strong>{player.name}</strong> - ${player.money}
          </li>
        {/each}
      </ul>
    {/if}
    
    {#if gameStore.currentPhase === 'setup'}
      <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
        <input 
          type="text" 
          bind:value={newPlayerName} 
          placeholder="New Player Name" 
          style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-elevated); color: var(--color-text-primary);"
        />
        <button class="btn btn-outline" style="padding: 0.5rem 1rem;" onclick={handleAddPlayer}>Add</button>
      </div>
    {/if}
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
</div>

<style>
  .hero {
    text-align: center;
    padding: var(--spacing-xl) 0;
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-border);
  }
  
  .hero h1 {
    font-size: 4.5rem;
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
</style>
