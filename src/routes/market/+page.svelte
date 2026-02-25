<script lang="ts">
  import { onMount } from "svelte";
  import Dice from "$lib/components/Dice.svelte";

  const GOLD_PRICES = [350, 325, 300, 275, 250, 250, 225, 200, 175, 150];
  const COPPER_PRICES = [400, 320, 280, 240, 200, 200, 160, 140, 120, 100];
  const SILVER_PRICES = [400, 300, 240, 200, 200, 200, 180, 160, 120, 100];

  const LUMBER_PRICES = [300, 240, 200, 160, 120, 100, 80, 60, 40, 30];
  const COAL_PRICES = [140, 120, 100, 80, 60, 60, 40, 30, 20, 20];
  const MAX_GLOBAL_ROWS = Math.max(
    GOLD_PRICES.length,
    COPPER_PRICES.length,
    SILVER_PRICES.length,
  );

  const CITY_SHORT: Record<string, string> = {
    Denver: "Denver",
    "Salt Lake City": "SLC",
    Pueblo: "Pueblo",
    "Santa Fe": "Santa Fe",
    "El Paso": "El Paso",
  };

  const SALE_LIMIT_LUMBER: Record<string, number> = {
    Denver: 10,
    "Salt Lake City": 8,
    Pueblo: 6,
    "Santa Fe": 6,
    "El Paso": 8,
  };
  const SALE_LIMIT_COAL: Record<string, number> = {
    Denver: 16,
    "Salt Lake City": 10,
    Pueblo: 8,
    "Santa Fe": 8,
    "El Paso": 8,
  };

  const BLOCKED_LUMBER: Record<string, number[]> = {
    Denver: [300, 240, 30],
    "Salt Lake City": [60, 40, 30],
    Pueblo: [300, 240, 30],
    "Santa Fe": [300, 240, 200],
    "El Paso": [300, 240, 30],
  };

  const BLOCKED_COAL: Record<string, number[]> = {
    Denver: [20, 20],
    "Salt Lake City": [140, 120],
    Pueblo: [140, 120, 100],
    "Santa Fe": [140, 20],
    "El Paso": [20, 20],
  };

  const STARTING_GLOBAL_INDEX: Record<string, number> = {
    gold: 5, // 250 (second)
    copper: 5, // 200 (second)
    silver: 4, // 200 (second)
  };

  const STARTING_LUMBER_ROW_INDEX: Record<string, number> = {
    Denver: LUMBER_PRICES.indexOf(100),
    "Salt Lake City": LUMBER_PRICES.indexOf(120),
    Pueblo: LUMBER_PRICES.indexOf(100),
    "Santa Fe": LUMBER_PRICES.indexOf(80),
    "El Paso": LUMBER_PRICES.indexOf(100),
  };

  const STARTING_COAL_ROW_INDEX: Record<string, number> = {
    Denver: 4, // 60 (first)
    "Salt Lake City": 5, // 60 (second)
    Pueblo: 6, // 40
    "Santa Fe": 5, // 60 (second)
    "El Paso": 4, // 60 (first)
  };

  // Market configurations for dice rolling
  const markets = [
    { name: "Gold", subtitle: "Global", dice: 1, color: "#e6a122" },
    { name: "Copper", subtitle: "Global", dice: 1, color: "#b87333" },
    { name: "Silver", subtitle: "Global", dice: 2, color: "#a0a0a0" },
    { name: "Lumber", subtitle: "Denver", dice: 2, color: "#8d6e63" },
    { name: "Lumber", subtitle: "SLC", dice: 2, color: "#8d6e63" },
    { name: "Lumber", subtitle: "Pueblo", dice: 2, color: "#8d6e63" },
    { name: "Lumber", subtitle: "Santa Fe", dice: 2, color: "#8d6e63" },
    { name: "Lumber", subtitle: "El Paso", dice: 2, color: "#8d6e63" },
    { name: "Coal", subtitle: "Denver", dice: 2, color: "#607d8b" },
    { name: "Coal", subtitle: "SLC", dice: 2, color: "#607d8b" },
    { name: "Coal", subtitle: "Pueblo", dice: 2, color: "#607d8b" },
    { name: "Coal", subtitle: "Santa Fe", dice: 2, color: "#607d8b" },
    { name: "Coal", subtitle: "El Paso", dice: 2, color: "#607d8b" },
  ];

  const METAL_MARKET_OFFSET = 0;
  const LUMBER_MARKET_OFFSET = 3;
  const COAL_MARKET_OFFSET = 8;

  const METAL_MARKETS = markets.slice(
    METAL_MARKET_OFFSET,
    LUMBER_MARKET_OFFSET,
  );
  const LUMBER_MARKETS = markets.slice(
    LUMBER_MARKET_OFFSET,
    COAL_MARKET_OFFSET,
  );
  const COAL_MARKETS = markets.slice(COAL_MARKET_OFFSET);

  let turn = $state(1);
  let global = $state<{ gold: number; copper: number; silver: number }>({
    gold: 0,
    copper: 0,
    silver: 0,
  });
  let cityPrices = $state<
    { cityId: number; cityName: string; lumber: number; coal: number }[]
  >([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // State for dice rolls
  let marketRolls = $state(
    markets.map(() => ({
      results: [] as number[],
      isRolling: false,
      sum: 0,
    })),
  );

  let isGlobalRolling = $state(false);

  async function loadMarket() {
    loading = true;
    error = null;
    try {
      const stateRes = await fetch("/api/state");
      const state = await stateRes.json();
      const turnNumber = state?.turnNumber ?? 1;
      turn = turnNumber;

      const marketRes = await fetch(`/api/market?turn=${turnNumber}`);
      if (!marketRes.ok) throw new Error("Failed to load market");
      const data = await marketRes.json();
      global = data.global ?? global;
      cityPrices = data.cityPrices ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load market";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadMarket();
  });

  function isCurrentPrice(
    resource: string,
    rowIndex: number,
    cityName?: string,
    cityResource?: string,
  ): boolean {
    // The API now returns indices into the price ladders (not raw prices), so we
    // compare against row indices in the chart.
    if (resource === "gold" || resource === "copper" || resource === "silver") {
      return global[resource as keyof typeof global] === rowIndex;
    }
    if (
      cityName &&
      cityResource &&
      (cityResource === "lumber" || cityResource === "coal")
    ) {
      const city = cityPrices.find((c) => c.cityName === cityName);
      if (!city) return false;
      return city[cityResource] === rowIndex;
    }
    return false;
  }

  function rollDice(index: number) {
    return new Promise<void>((resolve) => {
      const market = markets[index];
      marketRolls[index].isRolling = true;

      // Simulate "rolling" animation time
      setTimeout(() => {
        const results = Array.from(
          { length: market.dice },
          () => Math.floor(Math.random() * 6) + 1,
        );
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
      await new Promise((r) => setTimeout(r, 100));
    }
    isGlobalRolling = false;
  }
</script>

<svelte:head>
  <title>Market Prices | Silverton</title>
</svelte:head>

<!-- Market price chart (from backup) -->
<div class="market-page">
  <div class="header">
    <div>
      <h1>Market Prices</h1>
      <p class="subtitle">Selling Price Chart with Price Change Calculation</p>
    </div>
    <div class="turn-bar">
      <span class="turn-label">Turn: {turn}</span>
      <button
        class="btn btn-primary"
        onclick={rollAll}
        disabled={isGlobalRolling}
      >
        {isGlobalRolling ? "Rolling All..." : "Roll All Dice"}
      </button>
      <a href="/" class="btn btn-outline">Back to Dashboard</a>
    </div>
  </div>

  {#if loading}
    <p class="loading">Loading market…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="chart-card card">
      <div class="chart-grid">
        <!-- Column widths: price col same across blocks, data cols same so boxes line up -->
        <table class="price-chart block-metal">
          <colgroup>
            <col class="col-price" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-price" />
            <col class="col-data" />
          </colgroup>
          <thead>
            <tr>
              <th class="price-col"></th>
              <th class="group-header">Gold</th>
              <th></th>
              <th class="group-header">Copper</th>
              <th></th>
              <th class="group-header">Silver</th>
            </tr>
            <tr class="sub-header">
              <th class="price-col">Price Index</th>
              <th></th>
              <th class="price-col">Price Index</th>
              <th></th>
              <th class="price-col">Price Index</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each Array(MAX_GLOBAL_ROWS) as _, i}
              <tr class="price-row">
                <td class="price-col">{GOLD_PRICES[i] ?? ""}</td>
                <td
                  class={GOLD_PRICES[i] != null ? "shaded" : "cell-empty"}
                  class:starting-cell={GOLD_PRICES[i] != null &&
                    i === STARTING_GLOBAL_INDEX.gold}
                  title={GOLD_PRICES[i] != null &&
                  i === STARTING_GLOBAL_INDEX.gold
                    ? "Starting price"
                    : undefined}
                >
                  {#if GOLD_PRICES[i] != null && isCurrentPrice("gold", i)}<span
                      class="marker">✕</span
                    >{/if}
                </td>
                <td class="price-col">{COPPER_PRICES[i] ?? ""}</td>
                <td
                  class={COPPER_PRICES[i] != null ? "shaded" : "cell-empty"}
                  class:starting-cell={COPPER_PRICES[i] != null &&
                    i === STARTING_GLOBAL_INDEX.copper}
                  title={COPPER_PRICES[i] != null &&
                  i === STARTING_GLOBAL_INDEX.copper
                    ? "Starting price"
                    : undefined}
                >
                  {#if COPPER_PRICES[i] != null && isCurrentPrice("copper", i)}<span
                      class="marker">✕</span
                    >{/if}
                </td>
                <td class="price-col">{SILVER_PRICES[i] ?? ""}</td>
                <td
                  class={SILVER_PRICES[i] != null ? "shaded" : "cell-empty"}
                  class:starting-cell={SILVER_PRICES[i] != null &&
                    i === STARTING_GLOBAL_INDEX.silver}
                  title={SILVER_PRICES[i] != null &&
                  i === STARTING_GLOBAL_INDEX.silver
                    ? "Starting price"
                    : undefined}
                >
                  {#if SILVER_PRICES[i] != null && isCurrentPrice("silver", i)}<span
                      class="marker">✕</span
                    >{/if}
                </td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="sale-limit">
              <td>SALE LIMIT</td>
              <td colspan="5">No limit</td>
            </tr>
            <tr class="dice-row">
              <td class="price-col dice-label">Dice</td>
              {#each METAL_MARKETS as market, idx}
                <td class="dice-cell">
                  <Dice
                    results={marketRolls[METAL_MARKET_OFFSET + idx].results}
                    isRolling={marketRolls[METAL_MARKET_OFFSET + idx].isRolling}
                    diceCount={market.dice}
                  />
                  <div class="dice-total">
                    {#if marketRolls[METAL_MARKET_OFFSET + idx].results.length > 0 && !marketRolls[METAL_MARKET_OFFSET + idx].isRolling}
                      <strong
                        >{marketRolls[METAL_MARKET_OFFSET + idx].sum}</strong
                      >
                    {:else}
                      -
                    {/if}
                  </div>
                </td>
                {#if idx < METAL_MARKETS.length - 1}
                  <td class="price-col"></td>
                {/if}
              {/each}
            </tr>
            <tr class="formula-row">
              <td class="price-col dice-label">Calc</td>
              <td class="formula-cell">1 Die + Qty Sold</td>
              <td class="price-col"></td>
              <td class="formula-cell">1 Die + Qty Sold</td>
              <td class="price-col"></td>
              <td class="formula-cell">2 Dice + Qty Sold - IDN</td>
            </tr>
          </tfoot>
        </table>

        <table class="price-chart block-lumber">
          <colgroup>
            <col class="col-price" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
          </colgroup>
          <thead>
            <tr>
              <th class="price-col"></th>
              <th colspan="5" class="group-header">Lumber</th>
            </tr>
            <tr class="sub-header">
              <th></th>
              {#each cityPrices as { cityName }}
                <th>{CITY_SHORT[cityName] ?? cityName}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each LUMBER_PRICES as price, rowIndex}
              <tr class="price-row">
                <td class="price-col">{price}</td>
                {#each cityPrices as { cityName }}
                  <td
                    class={LUMBER_PRICES.includes(price)
                      ? BLOCKED_LUMBER[cityName]?.includes(price)
                        ? "blocked"
                        : "shaded"
                      : "blocked"}
                    class:starting-cell={rowIndex ===
                      STARTING_LUMBER_ROW_INDEX[cityName]}
                    title={rowIndex === STARTING_LUMBER_ROW_INDEX[cityName]
                      ? "Starting price"
                      : undefined}
                  >
                    {#if LUMBER_PRICES.includes(price) && isCurrentPrice("lumber", rowIndex, cityName, "lumber")}<span
                        class="marker">✕</span
                      >{/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="sale-limit">
              <td>SALE LIMIT</td>
              {#each cityPrices as { cityName }}
                <td>{SALE_LIMIT_LUMBER[cityName] ?? "—"}</td>
              {/each}
            </tr>
            <tr class="dice-row">
              <td class="price-col dice-label">Dice</td>
              {#each LUMBER_MARKETS as market, idx}
                <td class="dice-cell">
                  <Dice
                    results={marketRolls[LUMBER_MARKET_OFFSET + idx].results}
                    isRolling={marketRolls[LUMBER_MARKET_OFFSET + idx]
                      .isRolling}
                    diceCount={market.dice}
                  />
                  <div class="dice-total">
                    {#if marketRolls[LUMBER_MARKET_OFFSET + idx].results.length > 0 && !marketRolls[LUMBER_MARKET_OFFSET + idx].isRolling}
                      <strong
                        >{marketRolls[LUMBER_MARKET_OFFSET + idx].sum}</strong
                      >
                    {:else}
                      -
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
            <tr class="formula-row">
              <td class="price-col dice-label">Calc</td>
              <td class="formula-cell" colspan="5">2 Dice + Qty Sold - IDN</td>
              <!-- {#each cityPrices as _}
                <td class="formula-cell">2 Dice + Qty Sold - IDN</td>
              {/each} -->
            </tr>
          </tfoot>
        </table>

        <table class="price-chart block-coal">
          <colgroup>
            <col class="col-price" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
            <col class="col-data" />
          </colgroup>
          <thead>
            <tr>
              <th class="price-col"></th>
              <th colspan="5" class="group-header">Coal</th>
            </tr>
            <tr class="sub-header">
              <th></th>
              {#each cityPrices as { cityName }}
                <th>{CITY_SHORT[cityName] ?? cityName}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each COAL_PRICES as price, rowIndex}
              <tr class="price-row">
                <td class="price-col">{price}</td>
                {#each cityPrices as { cityName }}
                  <td
                    class={COAL_PRICES.includes(price)
                      ? BLOCKED_COAL[cityName]?.includes(price)
                        ? "blocked"
                        : "shaded"
                      : "blocked"}
                    class:starting-cell={rowIndex ===
                      STARTING_COAL_ROW_INDEX[cityName]}
                    title={rowIndex === STARTING_COAL_ROW_INDEX[cityName]
                      ? "Starting price"
                      : undefined}
                  >
                    {#if COAL_PRICES.includes(price) && isCurrentPrice("coal", rowIndex, cityName, "coal")}<span
                        class="marker">✕</span
                      >{/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr class="sale-limit">
              <td>SALE LIMIT</td>
              {#each cityPrices as { cityName }}
                <td>{SALE_LIMIT_COAL[cityName] ?? "—"}</td>
              {/each}
            </tr>
            <tr class="dice-row">
              <td class="price-col dice-label">Dice</td>
              {#each COAL_MARKETS as market, idx}
                <td class="dice-cell">
                  <Dice
                    results={marketRolls[COAL_MARKET_OFFSET + idx].results}
                    isRolling={marketRolls[COAL_MARKET_OFFSET + idx].isRolling}
                    diceCount={market.dice}
                  />
                  <div class="dice-total">
                    {#if marketRolls[COAL_MARKET_OFFSET + idx].results.length > 0 && !marketRolls[COAL_MARKET_OFFSET + idx].isRolling}
                      <strong
                        >{marketRolls[COAL_MARKET_OFFSET + idx].sum}</strong
                      >
                    {:else}
                      -
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
            <tr class="formula-row">
              <td class="price-col dice-label">Calc</td>
              <td class="formula-cell" colspan="2"
                >2 Dice + (Qty Sold / 2) - IDN</td
              >
              <td class="formula-cell" colspan="3">2 Dice + Qty Sold - IDN</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="current-legend">
        ✕ indicates the current selling price for this turn.
      </p>
      <p class="chart-footer-row">NUMBER OF PLAYERS: 1–6</p>
    </div>
  {/if}
</div>

<style>
  .market-page {
    max-width: 100%;
    overflow-x: auto;
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .turn-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .turn-label {
    color: var(--color-text-secondary);
    font-family: var(--font-heading);
  }

  .loading,
  .error {
    color: var(--color-text-secondary);
    margin: var(--spacing-lg) 0;
  }

  .error {
    color: #e57373;
  }

  .chart-card {
    overflow-x: auto;
  }

  .chart-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    align-items: flex-start;
  }

  .chart-grid .price-chart {
    flex: 0 0 auto;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  /* Same price column and data column widths across all blocks so boxes line up */
  .chart-grid .col-price {
    width: 2.75rem;
  }

  .chart-grid .col-data {
    width: 2.5rem;
  }

  .price-chart th,
  .price-chart td {
    border: 1px solid var(--color-border);
    padding: 0.35rem 0.4rem;
    text-align: center;
    box-sizing: border-box;
  }

  .price-chart .price-col {
    width: 2.75rem;
    min-width: 2.75rem;
    text-align: right;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-bg-elevated);
  }

  .price-chart .group-header {
    background: var(--color-bg-elevated);
    color: var(--color-primary);
    font-family: var(--font-heading);
  }

  .price-chart .sub-header th {
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
    font-weight: 600;
    height: 2.5rem;
    vertical-align: middle;
  }

  .price-chart td.shaded {
    background: hsl(0, 0%, 22%);
  }

  .price-chart td.blocked {
    background: hsl(0, 0%, 14%);
    opacity: 0.7;
  }

  .price-chart td.cell-empty {
    background: var(--color-bg-base);
  }

  .price-chart td.starting-cell {
    border: 2px solid grey;
  }

  .price-chart tr.price-row td {
    height: 1.9rem;
    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
  }

  .dice-row .dice-label {
    text-align: right;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .dice-cell {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }

  .dice-total {
    margin-top: 0.15rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .formula-row .dice-label {
    text-align: right;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .formula-cell {
    font-size: 0.65rem;
    color: var(--color-text-secondary);
    line-height: 1.1;
  }

  .current-legend {
    margin-top: var(--spacing-md);
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .marker {
    color: #42a5f5;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .price-chart tfoot .sale-limit td {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  .page-container {
    max-width: 1000px;
    margin: 2rem auto 0 auto;
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

  .sum-total {
    color: var(--color-primary);
    font-size: 1.1rem;
  }

  .stagger-1 {
    animation-delay: 0.1s;
  }

  .stagger-2 {
    animation-delay: 0.2s;
  }
</style>
