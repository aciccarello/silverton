<script lang="ts">
  import { onMount } from "svelte";
  import Dice from "$lib/components/Dice.svelte";

  const GOLD_PRICES = [150, 175, 200, 225, 250, 250, 275, 300, 325, 350];
  const COPPER_PRICES = [100, 120, 140, 160, 200, 200, 240, 280, 320, 400];
  const SILVER_PRICES = [100, 120, 160, 180, 200, 200, 200, 240, 300, 400];

  const LUMBER_PRICES = [30, 40, 60, 80, 100, 120, 160, 200, 240, 300];
  const COAL_PRICES = [20, 20, 30, 40, 60, 60, 80, 100, 120, 140];
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
    Denver: [9, 8, 0],
    "Salt Lake City": [2, 1, 0],
    Pueblo: [9, 8, 0],
    "Santa Fe": [9, 8, 7],
    "El Paso": [9, 8, 0],
  };

  const BLOCKED_COAL: Record<string, number[]> = {
    Denver: [0, 1],
    "Salt Lake City": [9, 8],
    Pueblo: [9, 8, 7],
    "Santa Fe": [9, 0],
    "El Paso": [0, 1],
  };

  const STARTING_GLOBAL_INDEX: Record<string, number> = {
    gold: 4, // 250 (lower)
    copper: 4, // 200 (lower)
    silver: 5, // 200 (middle)
  };

  const STARTING_LUMBER_ROW_INDEX: Record<string, number> = {
    Denver: 4, // 100
    "Salt Lake City": 5, // 120
    Pueblo: 4, // 100
    "Santa Fe": 3, // 80
    "El Paso": 4, // 100
  };

  const STARTING_COAL_ROW_INDEX: Record<string, number> = {
    Denver: 5, // 60 (higher)
    "Salt Lake City": 4, // 60 (lower)
    Pueblo: 3, // 40
    "Santa Fe": 4, // 60 (lower)
    "El Paso": 5, // 60 (higher)
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
  let previousGlobal = $state<{
    gold: number;
    copper: number;
    silver: number;
  } | null>(null);
  let cityPrices = $state<
    { cityId: number; cityName: string; lumber: number; coal: number }[]
  >([]);
  let previousCityPrices = $state<
    { cityId: number; cityName: string; lumber: number; coal: number }[] | null
  >(null);
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
  let isSaving = $state(false);

  // State for price diffs
  let globalDiffs = $state({ gold: 0, copper: 0, silver: 0 });
  let cityDiffs = $state<Record<number, { lumber: number; coal: number }>>({});

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

      // Fetch previous turn data for comparison
      if (turnNumber > 1) {
        const prevRes = await fetch(`/api/market?turn=${turnNumber - 1}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          previousGlobal = prevData.global;
          previousCityPrices = prevData.cityPrices;
        } else {
          previousGlobal = null;
          previousCityPrices = null;
        }
      } else {
        previousGlobal = null;
        previousCityPrices = null;
      }

      // Initialize diffs for each city
      cityPrices.forEach((cp) => {
        if (!cityDiffs[cp.cityId]) {
          cityDiffs[cp.cityId] = { lumber: 0, coal: 0 };
        }
      });
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

  function isPreviousPrice(
    resource: string,
    rowIndex: number,
    cityName?: string,
    cityResource?: string,
  ): boolean {
    if (!previousGlobal) return false;

    if (resource === "gold" || resource === "copper" || resource === "silver") {
      const prevIdx = previousGlobal[resource as keyof typeof global];
      const curIdx = global[resource as keyof typeof global];
      return prevIdx === rowIndex && prevIdx !== curIdx;
    }

    if (
      cityName &&
      cityResource &&
      (cityResource === "lumber" || cityResource === "coal")
    ) {
      if (!previousCityPrices) return false;
      const city = cityPrices.find((c) => c.cityName === cityName);
      const prevCity = previousCityPrices.find(
        (c) => c.cityId === city?.cityId,
      );
      if (!city || !prevCity) return false;

      const prevIdx = prevCity[cityResource];
      const curIdx = city[cityResource];
      return prevIdx === rowIndex && prevIdx !== curIdx;
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

  async function savePrices() {
    isSaving = true;
    try {
      // 1. Save market indices for the next turn
      const marketPayload = {
        turn,
        global: {
          gold: Math.max(
            0,
            Math.min(GOLD_PRICES.length - 1, global.gold + globalDiffs.gold),
          ),
          copper: Math.max(
            0,
            Math.min(
              COPPER_PRICES.length - 1,
              global.copper + globalDiffs.copper,
            ),
          ),
          silver: Math.max(
            0,
            Math.min(
              SILVER_PRICES.length - 1,
              global.silver + globalDiffs.silver,
            ),
          ),
        },
        cityPrices: cityPrices.map((cp) => ({
          cityId: cp.cityId,
          lumber: Math.max(
            0,
            Math.min(
              LUMBER_PRICES.length - 1,
              cp.lumber + (cityDiffs[cp.cityId]?.lumber ?? 0),
            ),
          ),
          coal: Math.max(
            0,
            Math.min(
              COAL_PRICES.length - 1,
              cp.coal + (cityDiffs[cp.cityId]?.coal ?? 0),
            ),
          ),
        })),
      };

      const marketRes = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marketPayload),
      });

      if (!marketRes.ok) throw new Error("Failed to save market prices");

      // 2. Reset diffs and reload state
      globalDiffs = { gold: 0, copper: 0, silver: 0 };
      Object.keys(cityDiffs).forEach((key) => {
        const id = Number(key);
        cityDiffs[id] = { lumber: 0, coal: 0 };
      });

      await loadMarket();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save prices");
    } finally {
      isSaving = false;
    }
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
        disabled={isGlobalRolling || isSaving}
      >
        {isGlobalRolling ? "Rolling All..." : "Roll All Dice"}
      </button>
      <button
        class="btn btn-success"
        onclick={savePrices}
        disabled={isGlobalRolling || isSaving}
      >
        {isSaving ? "Saving..." : "Save Results"}
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
            <col class="col-data" />
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
            {#each Array.from({ length: MAX_GLOBAL_ROWS }, (_, i) => MAX_GLOBAL_ROWS - 1 - i) as i}
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
                  {#if GOLD_PRICES[i] != null && isPreviousPrice("gold", i)}<span
                      class="marker marker-prev">✕</span
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
                  {#if COPPER_PRICES[i] != null && isPreviousPrice("copper", i)}<span
                      class="marker marker-prev">✕</span
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
                  {#if SILVER_PRICES[i] != null && isPreviousPrice("silver", i)}<span
                      class="marker marker-prev">✕</span
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
            <tr class="diff-row">
              <td class="price-col dice-label">Diff</td>
              <td class="diff-cell"
                ><input type="number" bind:value={globalDiffs.gold} /></td
              >
              <td class="price-col"></td>
              <td class="diff-cell"
                ><input type="number" bind:value={globalDiffs.copper} /></td
              >
              <td class="price-col"></td>
              <td class="diff-cell"
                ><input type="number" bind:value={globalDiffs.silver} /></td
              >
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
            {#each Array.from({ length: LUMBER_PRICES.length }, (_, i) => LUMBER_PRICES.length - 1 - i) as rowIndex}
              <tr class="price-row">
                <td class="price-col">{LUMBER_PRICES[rowIndex]}</td>
                {#each cityPrices as { cityName }}
                  <td
                    class={LUMBER_PRICES[rowIndex] != null
                      ? BLOCKED_LUMBER[cityName]?.includes(rowIndex)
                        ? "blocked"
                        : "shaded"
                      : "blocked"}
                    class:starting-cell={rowIndex ===
                      STARTING_LUMBER_ROW_INDEX[cityName]}
                    title={rowIndex === STARTING_LUMBER_ROW_INDEX[cityName]
                      ? "Starting price"
                      : undefined}
                  >
                    {#if LUMBER_PRICES[rowIndex] != null && isCurrentPrice("lumber", rowIndex, cityName, "lumber")}<span
                        class="marker">✕</span
                      >{/if}
                    {#if LUMBER_PRICES[rowIndex] != null && isPreviousPrice("lumber", rowIndex, cityName, "lumber")}<span
                        class="marker marker-prev">✕</span
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
            </tr>
            <tr class="diff-row">
              <td class="price-col dice-label">Diff</td>
              {#each cityPrices as city}
                <td class="diff-cell">
                  {#if cityDiffs[city.cityId]}
                    <input
                      type="number"
                      bind:value={cityDiffs[city.cityId].lumber}
                    />
                  {/if}
                </td>
              {/each}
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
            {#each Array.from({ length: COAL_PRICES.length }, (_, i) => COAL_PRICES.length - 1 - i) as rowIndex}
              <tr class="price-row">
                <td class="price-col">{COAL_PRICES[rowIndex]}</td>
                {#each cityPrices as { cityName }}
                  <td
                    class={COAL_PRICES[rowIndex] != null
                      ? BLOCKED_COAL[cityName]?.includes(rowIndex)
                        ? "blocked"
                        : "shaded"
                      : "blocked"}
                    class:starting-cell={rowIndex ===
                      STARTING_COAL_ROW_INDEX[cityName]}
                    title={rowIndex === STARTING_COAL_ROW_INDEX[cityName]
                      ? "Starting price"
                      : undefined}
                  >
                    {#if COAL_PRICES[rowIndex] != null && isCurrentPrice("coal", rowIndex, cityName, "coal")}<span
                        class="marker">✕</span
                      >{/if}
                    {#if COAL_PRICES[rowIndex] != null && isPreviousPrice("coal", rowIndex, cityName, "coal")}<span
                        class="marker marker-prev">✕</span
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
            <tr class="diff-row">
              <td class="price-col dice-label">Diff</td>
              {#each cityPrices as city}
                <td class="diff-cell">
                  {#if cityDiffs[city.cityId]}
                    <input
                      type="number"
                      bind:value={cityDiffs[city.cityId].coal}
                    />
                  {/if}
                </td>
              {/each}
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="current-legend">
        ✕ indicates the current selling price for this turn.
      </p>
    </div>

    <div class="adjustment-reference card">
      <h2>Price Change Look-up</h2>
      <div class="ref-grid">
        <div class="ref-table">
          <div class="table-header gold">GOLD</div>
          <div class="table-body">
            <div class="ref-row"><span>> 7</span><span>-2</span></div>
            <div class="ref-row"><span>6-7</span><span>-1</span></div>
            <div class="ref-row"><span>4-5</span><span>NC</span></div>
            <div class="ref-row"><span>2-3</span><span>+1</span></div>
            <div class="ref-row"><span>1</span><span>+2</span></div>
          </div>
        </div>

        <div class="ref-table">
          <div class="table-header copper">COPPER</div>
          <div class="table-body">
            <div class="ref-row"><span>> 11</span><span>-4</span></div>
            <div class="ref-row"><span>10-11</span><span>-3</span></div>
            <div class="ref-row"><span>8-9</span><span>-2</span></div>
            <div class="ref-row"><span>6-7</span><span>-1</span></div>
            <div class="ref-row"><span>4-5</span><span>NC</span></div>
            <div class="ref-row"><span>3</span><span>+1</span></div>
            <div class="ref-row"><span>2</span><span>+2</span></div>
            <div class="ref-row"><span>1</span><span>+3</span></div>
          </div>
        </div>

        <div class="ref-table">
          <div class="table-header silver">SILVER</div>
          <div class="table-body">
            <div class="ref-row"><span>> 15</span><span>-7</span></div>
            <div class="ref-row"><span>15</span><span>-6</span></div>
            <div class="ref-row"><span>14</span><span>-5</span></div>
            <div class="ref-row"><span>13</span><span>-4</span></div>
            <div class="ref-row"><span>12</span><span>-3</span></div>
            <div class="ref-row"><span>10-11</span><span>-2</span></div>
            <div class="ref-row"><span>8-9</span><span>-1</span></div>
            <div class="ref-row"><span>6-7</span><span>NC</span></div>
            <div class="ref-row"><span>4-5</span><span>+1</span></div>
            <div class="ref-row"><span>3</span><span>+2</span></div>
            <div class="ref-row"><span>2</span><span>+3</span></div>
            <div class="ref-row"><span>1</span><span>+4</span></div>
            <div class="ref-row"><span>&lt; 1</span><span>+5</span></div>
          </div>
        </div>

        <div class="ref-table">
          <div class="table-header lumber">LUMBER</div>
          <div class="table-body">
            <div class="ref-row"><span>> 12</span><span>-4</span></div>
            <div class="ref-row"><span>11-12</span><span>-3</span></div>
            <div class="ref-row"><span>9-10</span><span>-2</span></div>
            <div class="ref-row"><span>7-8</span><span>-1</span></div>
            <div class="ref-row"><span>6</span><span>NC</span></div>
            <div class="ref-row"><span>4-5</span><span>+1</span></div>
            <div class="ref-row"><span>2-3</span><span>+2</span></div>
            <div class="ref-row"><span>&lt; 2</span><span>+3</span></div>
          </div>
        </div>

        <div class="ref-table">
          <div class="table-header coal">COAL</div>
          <div class="table-body">
            <div class="ref-row"><span>> 12</span><span>-3</span></div>
            <div class="ref-row"><span>11-12</span><span>-2</span></div>
            <div class="ref-row"><span>9-10</span><span>-1</span></div>
            <div class="ref-row"><span>6-8</span><span>NC</span></div>
            <div class="ref-row"><span>4-5</span><span>+1</span></div>
            <div class="ref-row"><span>2-3</span><span>+2</span></div>
            <div class="ref-row"><span>&lt; 2</span><span>+3</span></div>
          </div>
        </div>
      </div>
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

  .diff-cell {
    padding: 0.15rem !important;
  }

  .diff-cell input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-base);
    font-size: 0.8rem;
    text-align: center;
    padding: 0.1rem;
    box-sizing: border-box;
  }

  .diff-cell input:focus {
    outline: none;
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-success {
    background-color: #4caf50;
    color: white;
  }

  .btn-success:hover {
    background-color: #43a047;
  }

  .btn-success:disabled {
    background-color: #2e7d32;
    opacity: 0.6;
    cursor: not-allowed;
  }

  .current-legend {
    margin-top: var(--spacing-md);
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .adjustment-reference {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-lg);
  }

  .adjustment-reference h2 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: var(--spacing-lg);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
  }

  .ref-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .ref-table {
    flex: 1;
    min-width: 140px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    background: var(--color-bg-elevated);
  }

  .table-header {
    padding: 0.5rem;
    text-align: center;
    font-weight: bold;
    font-size: 0.85rem;
    background: var(--color-bg-base);
    border-bottom: 2px solid var(--color-border);
  }

  .table-header.gold {
    color: #e6a122;
  }
  .table-header.copper {
    color: #b87333;
  }
  .table-header.silver {
    color: #a0a0a0;
  }
  .table-header.lumber {
    color: #8d6e63;
  }
  .table-header.coal {
    color: #607d8b;
  }

  .table-body {
    padding: 0.25rem 0;
  }

  .ref-row {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0.75rem;
    font-size: 0.85rem;
    font-family: var(--font-mono);
  }

  .ref-row:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
  }

  .ref-row span:last-child {
    font-weight: bold;
    color: var(--color-primary);
  }

  .marker {
    color: #42a5f5;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .marker-prev {
    color: #616161;
    opacity: 0.5;
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
