<script lang="ts">
  import { onMount } from 'svelte';
  
  // Market configurations
  const markets = [
    { name: 'Gold', subtitle: 'Global', dice: 1, color: '#e6a122' },
    { name: 'Copper', subtitle: 'Global', dice: 1, color: '#b87333' },
    { name: 'Silver', subtitle: 'Global', dice: 2, color: '#a0a0a0' },
    { name: 'Lumber', subtitle: 'Denver', dice: 2, color: '#8d6e63' },
    { name: 'Lumber', subtitle: 'SLC', dice: 2, color: '#8d6e63' },
    { name: 'Lumber', subtitle: 'Pueblo', dice: 2, color: '#8d6e63' },
    { name: 'Lumber', subtitle: 'Santa Fe', dice: 2, color: '#8d6e63' },
    { name: 'Lumber', subtitle: 'El Paso', dice: 2, color: '#8d6e63' },
    { name: 'Coal', subtitle: 'Denver', dice: 2, color: '#607d8b' },
    { name: 'Coal', subtitle: 'SLC', dice: 2, color: '#607d8b' },
    { name: 'Coal', subtitle: 'Pueblo', dice: 2, color: '#607d8b' },
    { name: 'Coal', subtitle: 'Santa Fe', dice: 2, color: '#607d8b' },
    { name: 'Coal', subtitle: 'El Paso', dice: 2, color: '#607d8b' }
  ];

  // State for rolls
  let marketRolls = $state(markets.map(() => ({
    results: [] as number[],
    isRolling: false,
    sum: 0
  })));

  let isGlobalRolling = $state(false);

  function rollDice(index: number) {
    return new Promise<void>((resolve) => {
      const market = markets[index];
      marketRolls[index].isRolling = true;
      
      // Simulate "rolling" animation time
      setTimeout(() => {
        const results = Array.from({ length: market.dice }, () => Math.floor(Math.random() * 6) + 1);
        marketRolls[index].results = results;
        marketRolls[index].sum = results.reduce((a, b) => a + b, 0);
        marketRolls[index].isRolling = false;
        resolve();
      }, 600);
    });
  }

  async function rollAll() {
    isGlobalRolling = true;
    for (let i = 0; i < markets.length; i++) {
      await rollDice(i);
      // Optional: add a tiny extra pause between markets for better visual pacing
      await new Promise(r => setTimeout(r, 100));
    }
    isGlobalRolling = false;
  }

  // Helper for dots on a die
  function getDots(value: number) {
    const positions = [
      [],               // 0 (unused)
      [4],              // 1 (center)
      [0, 8],           // 2 (top-left, bottom-right)
      [0, 4, 8],        // 3 (top-left, center, bottom-right)
      [0, 2, 6, 8],     // 4 (four corners)
      [0, 2, 4, 6, 8],  // 5 (four corners + center)
      [0, 2, 3, 5, 6, 8] // 6 (two vertical columns)
    ];
    return positions[value] || [];
  }
</script>

<svelte:head>
  <title>Market | Silverton</title>
</svelte:head>

<div class="page-container">
  <div class="hero animate-entrance">
    <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
      <div>
        <h1>Market Prices</h1>
        <p class="subtitle stagger-1">Virtual Dice for Price Calculations</p>
      </div>
      <button 
        class="btn btn-primary animate-entrance stagger-2" 
        onclick={rollAll} 
        disabled={isGlobalRolling}
        style="margin-bottom: var(--spacing-sm);"
      >
        {isGlobalRolling ? 'Rolling All...' : 'Roll All Dice'}
      </button>
    </div>
  </div>

  <div class="card table-card animate-entrance stagger-2">
    <table class="market-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Market</th>
          <th class="results-col">Results</th>
          <th>Total</th>
          <th style="text-align: right;">Action</th>
        </tr>
      </thead>
      <tbody>
        {#each markets as market, i}
          <tr class="market-row">
            <td>
              <div class="resource-tag" style="background-color: {market.color}20; color: {market.color}; border-color: {market.color}40;">
                {market.name}
              </div>
            </td>
            <td><span class="region-text">{market.subtitle}</span></td>
            <td class="results-col">
              <div class="dice-row" class:rolling={marketRolls[i].isRolling}>
                {#if marketRolls[i].isRolling}
                  {#each Array(market.dice) as _}
                    <div class="mini-die dummy">?</div>
                  {/each}
                {:else if marketRolls[i].results.length > 0}
                  {#each marketRolls[i].results as val}
                    <div class="mini-die">
                      {#each Array(9) as _, dotIdx}
                        <div class="mini-dot" class:visible={getDots(val).includes(dotIdx)}></div>
                      {/each}
                    </div>
                  {/each}
                {:else}
                  <span class="placeholder">Ready</span>
                {/if}
              </div>
            </td>
            <td>
              {#if marketRolls[i].results.length > 0 && !marketRolls[i].isRolling}
                <strong class="sum-total">{marketRolls[i].sum}</strong>
              {:else}
                -
              {/if}
            </td>
            <td style="text-align: right;">
              <button 
                class="btn btn-sm {marketRolls[i].results.length > 0 ? 'btn-outline' : 'btn-primary'}" 
                onclick={() => rollDice(i)}
                disabled={marketRolls[i].isRolling}
              >
                {marketRolls[i].isRolling ? '...' : (marketRolls[i].results.length > 0 ? 'Re-roll' : 'Roll')}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .page-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .table-card {
    padding: 0;
    overflow: hidden;
    margin-top: var(--spacing-xl);
  }

  .market-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }

  .market-table th {
    text-align: left;
    padding: var(--spacing-md);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-secondary);
    font-family: var(--font-display);
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-border);
  }

  .market-table td {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .market-row:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .resource-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.85rem;
    border: 1px solid transparent;
  }

  .region-text {
    color: var(--color-text-secondary);
    font-size: 0.85rem;
  }

  .results-col {
    width: 120px;
  }

  .dice-row {
    display: flex;
    gap: 6px;
    min-height: 32px;
    align-items: center;
  }

  .mini-die {
    width: 30px;
    height: 30px;
    background: white;
    border-radius: 4px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    padding: 3px;
    gap: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .mini-die.dummy {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-primary);
    font-weight: bold;
    font-size: 1rem;
  }

  .mini-dot {
    background: #2c3e50;
    border-radius: 50%;
    opacity: 0;
  }

  .mini-dot.visible {
    opacity: 1;
  }

  .sum-total {
    color: var(--color-primary);
    font-size: 1.1rem;
  }

  .placeholder {
    color: var(--color-text-tertiary);
    font-style: italic;
    font-size: 0.8rem;
  }

  .rolling {
    animation: shake 0.5s infinite;
  }

  @keyframes shake {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(-5deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }



  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
</style>
