<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";
  import { turnStore } from "$lib/state/turnStore.svelte";
  import { browser } from "$app/environment";
  import {
    GOLD_PRICES,
    COPPER_PRICES,
    SILVER_PRICES,
    LUMBER_PRICES,
    COAL_PRICES,
    SALE_LIMIT_LUMBER,
    SALE_LIMIT_COAL,
  } from "$lib/constants";
  import type { Player } from "$lib/state/gameStore.svelte";

  let {
    isOpen = $bindable(false),
    loggedInPlayer,
  }: {
    isOpen: boolean;
    loggedInPlayer?: Player;
  } = $props();

  type SellMarketData = {
    global: { gold: number; copper: number; silver: number };
    cityPrices: { cityName: string; lumber: number; coal: number }[];
  };

  type SellRowId =
    | "gold"
    | "silver"
    | "copper"
    | `lumber:${string}`
    | `coal:${string}`;

  let isSellMarketLoading = $state(false);
  let sellMarketError = $state<string | null>(null);
  let sellMarketData = $state<SellMarketData | null>(null);
  let sellInputs = $state<Record<SellRowId, number>>(
    {} as Record<SellRowId, number>,
  );

  function priceForMetal(
    resource: "gold" | "silver" | "copper",
    index: number,
  ): number {
    const ladder =
      resource === "gold"
        ? GOLD_PRICES
        : resource === "copper"
          ? COPPER_PRICES
          : SILVER_PRICES;
    return ladder[index] ?? 0;
  }

  function priceForCityResource(
    resource: "lumber" | "coal",
    index: number,
  ): number {
    const ladder = resource === "lumber" ? LUMBER_PRICES : COAL_PRICES;
    return ladder[index] ?? 0;
  }

  type SellRow = {
    id: SellRowId;
    label: string;
    cityLabel?: string;
    price: number;
    maxCount: number | null;
  };

  let sellRows = $derived.by((): SellRow[] => {
    if (!sellMarketData) return [];

    const rows: SellRow[] = [];
    const { global, cityPrices } = sellMarketData;

    (["gold", "silver", "copper"] as const).forEach((resource) => {
      const idx = global[resource];
      rows.push({
        id: resource,
        label: resource.charAt(0).toUpperCase() + resource.slice(1),
        price: priceForMetal(resource, idx),
        maxCount: null,
      });
    });

    const selectedCities = loggedInPlayer?.marketsInPlay ?? [];
    const lumberRows: SellRow[] = [];
    const coalRows: SellRow[] = [];

    for (const cityName of selectedCities) {
      const city = cityPrices.find((c) => c.cityName === cityName);
      if (!city) continue;

      const lumberLimit = SALE_LIMIT_LUMBER[cityName] ?? null;
      const coalLimit = SALE_LIMIT_COAL[cityName] ?? null;

      lumberRows.push({
        id: `lumber:${cityName}`,
        label: "Lumber",
        cityLabel: cityName,
        price: priceForCityResource("lumber", city.lumber),
        maxCount: lumberLimit,
      });

      coalRows.push({
        id: `coal:${cityName}`,
        label: "Coal",
        cityLabel: cityName,
        price: priceForCityResource("coal", city.coal),
        maxCount: coalLimit,
      });
    }

    return [...rows, ...lumberRows, ...coalRows];
  });

  let sellTotal = $derived.by(() => {
    if (!sellMarketData) return 0;
    return sellRows.reduce((sum, row) => {
      const qty = sellInputs[row.id] ?? 0;
      return sum + qty * row.price;
    }, 0);
  });

  let sellDistinctResources = $derived.by(() => {
    return sellRows.reduce((count, row) => {
      const qty = sellInputs[row.id] ?? 0;
      return count + (qty > 0 ? 1 : 0);
    }, 0);
  });

  let sellCapacityWarning = $derived(sellDistinctResources > 2);

  async function loadSellMarketForTurn() {
    if (!browser) return;
    isSellMarketLoading = true;
    sellMarketError = null;
    try {
      const res = await fetch(`/api/market?turn=${gameStore.turnNumber}`);
      if (!res.ok) throw new Error("Failed to load market data");
      const data = await res.json();
      sellMarketData = {
        global: data.global,
        cityPrices: data.cityPrices ?? [],
      };
    } catch (e) {
      console.error("Failed to load sell market data", e);
      sellMarketError =
        "Could not load market prices. Try again from the Market page.";
    } finally {
      isSellMarketLoading = false;
    }
  }

  $effect(() => {
    // Attempt to load market when opened if not loaded
    if (isOpen && !sellMarketData) {
      loadSellMarketForTurn();
    }
  });

  function closeSellResourcesModal() {
    isOpen = false;
  }

  function saveSellResourcesFromModal() {
    turnStore.creditSellResources = sellTotal;
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="modal-backdrop">
    <div class="modal">
      <h3>Sell Resources</h3>
      <div class="modal-body">
        <p
          style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-md);"
        >
          Enter how many units you are selling in each market. The value will be
          calculated from the current market price. Remember you can normally
          only deliver from two resources per turn.
        </p>

        {#if isSellMarketLoading}
          <p>Loading market prices…</p>
        {:else if sellMarketError}
          <p style="color: #ff4d4f;">{sellMarketError}</p>
        {:else if sellRows.length === 0}
          <p style="font-size: 0.9rem; color: var(--color-text-secondary);">
            No markets available. Make sure market prices have been set for this
            turn.
          </p>
        {:else}
          <div class="sell-grid">
            {#each sellRows as row}
              <div class="sell-row">
                <div class="sell-row-main">
                  <div class="sell-row-label">
                    <strong>{row.label}</strong>
                    {#if row.cityLabel}
                      <span class="sell-row-city">({row.cityLabel})</span>
                    {/if}
                  </div>
                  <div class="sell-row-meta">
                    <span>Price: ${row.price}</span>
                    {#if row.maxCount !== null}
                      <span>Max: {row.maxCount}</span>
                    {/if}
                  </div>
                </div>
                <div class="sell-row-input">
                  <input
                    type="number"
                    min="0"
                    max={row.maxCount ?? undefined}
                    value={sellInputs[row.id] ?? ""}
                    oninput={(event) => {
                      const value = Number(
                        (event.currentTarget as HTMLInputElement).value || 0,
                      );
                      sellInputs[row.id] = value;
                    }}
                  />
                  <span class="sell-row-total">
                    ${(sellInputs[row.id] ?? 0) * row.price}
                  </span>
                </div>
              </div>
            {/each}
          </div>

          {#if !loggedInPlayer?.marketsInPlay?.length}
            <p
              style="font-size: 0.9rem; color: #ffcc00; margin-bottom: var(--spacing-md); font-style: italic;"
            >
              Note: You have not selected any markets yet. Close this and select
              your markets on the dashboard to see lumber and coal prices.
            </p>
          {/if}

          <div class="sell-summary">
            <div>
              <strong>Total sold value:</strong>
              <span>${sellTotal}</span>
            </div>
            {#if sellCapacityWarning}
              <div class="sell-warning">
                You have entered quantities in more than two resources. Make
                sure this does not exceed your delivery capacity this turn.
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="btn-container" style="margin-top: var(--spacing-md);">
        <button class="btn btn-outline" onclick={closeSellResourcesModal}
          >Cancel</button
        >
        <button
          class="btn btn-primary"
          onclick={saveSellResourcesFromModal}
          disabled={!sellMarketData}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
