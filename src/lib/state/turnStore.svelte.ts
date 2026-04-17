import { browser } from "$app/environment";

class TurnStore {
  debitBuyTracks = $state<number | null>(null);
  debitBuyContracts = $state<number | null>(null);
  debitBuyClaims = $state<number | null>(null);
  debitOperateClaims = $state<number | null>(null);
  debitPayFines = $state<number | null>(null);
  creditPassengerRevenue = $state<number | null>(null);
  creditSellResources = $state<number | null>(null);
  dealsAndAdjustments = $state<number | null>(null);
  loggedInUserId = $state<string | null>(null);

  get netChange() {
    return (
      (this.creditPassengerRevenue || 0) +
      (this.creditSellResources || 0) +
      (this.dealsAndAdjustments || 0) -
      (this.debitBuyTracks || 0) -
      (this.debitBuyContracts || 0) -
      (this.debitBuyClaims || 0) -
      (this.debitOperateClaims || 0) -
      (this.debitPayFines || 0)
    );
  }

  saveToLocal() {
    if (!browser || !this.loggedInUserId) return;
    const data = {
      debitBuyTracks: this.debitBuyTracks,
      debitBuyContracts: this.debitBuyContracts,
      debitBuyClaims: this.debitBuyClaims,
      debitOperateClaims: this.debitOperateClaims,
      debitPayFines: this.debitPayFines,
      creditPassengerRevenue: this.creditPassengerRevenue,
      creditSellResources: this.creditSellResources,
      dealsAndAdjustments: this.dealsAndAdjustments,
    };
    localStorage.setItem(
      `silverton_actions_${this.loggedInUserId}`,
      JSON.stringify(data),
    );
  }

  loadFromLocal(userId: string) {
    this.loggedInUserId = userId;
    if (!browser) return;
    const saved = localStorage.getItem(`silverton_actions_${userId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.debitBuyTracks = data.debitBuyTracks ?? null;
        this.debitBuyContracts = data.debitBuyContracts ?? null;
        this.debitBuyClaims = data.debitBuyClaims ?? null;
        this.debitOperateClaims = data.debitOperateClaims ?? null;
        this.debitPayFines = data.debitPayFines ?? null;
        this.creditPassengerRevenue = data.creditPassengerRevenue ?? null;
        this.creditSellResources = data.creditSellResources ?? null;
        this.dealsAndAdjustments = data.dealsAndAdjustments ?? null;
        return;
      } catch (e) {
        console.error("Failed to parse saved turn actions", e);
      }
    }
    this.clear();
  }

  clear() {
    this.debitBuyTracks = null;
    this.debitBuyContracts = null;
    this.debitBuyClaims = null;
    this.debitOperateClaims = null;
    this.debitPayFines = null;
    this.creditPassengerRevenue = null;
    this.creditSellResources = null;
    this.dealsAndAdjustments = null;
  }

  clearLocal() {
    if (!browser || !this.loggedInUserId) return;
    localStorage.removeItem(`silverton_actions_${this.loggedInUserId}`);
  }
}

export const turnStore = new TurnStore();
