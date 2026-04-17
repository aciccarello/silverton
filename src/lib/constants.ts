export const PLAYER_COLORS = [
  { name: "Blue", hex: "#3498db" },
  { name: "Purple", hex: "#9b59b6" },
  { name: "Yellow", hex: "#f1c40f" },
  { name: "Green", hex: "#2ecc71" },
  { name: "Red", hex: "#e74c3c" },
  { name: "White", hex: "#ffffff" },
];

export const MARKETS = [
  "Denver",
  "El Paso",
  "Salt Lake City",
  "Pueblo",
  "Santa Fe",
] as const;

export const STARTING_PIECES: Record<number, Record<number, string>> = {
  1: {
    2: "S+2, S, P+1, P",
    3: "S+2, S, P, P",
    4: "S+2, S, P, P",
    5: "S+2, P",
    6: "S+2, P",
  },
  2: {
    2: "S+1, S, P+2, P",
    3: "S+1, S, P+1, P",
    4: "S+1, S, P+1, P",
    5: "S, P+2",
    6: "S, P+2",
  },
  3: { 3: "S, S, P+2, P", 4: "S+1, S, P+1, P", 5: "S+1, P+1", 6: "S+1, P+1" },
  4: { 4: "S, S, P+2, P", 5: "S, P+2", 6: "S, P+2" },
  5: { 5: "S+1, P+1", 6: "S+1, P+1" },
  6: { 6: "S+2, P" },
};
export const GOLD_PRICES = [150, 175, 200, 225, 250, 250, 275, 300, 325, 350];
export const COPPER_PRICES = [100, 120, 140, 160, 200, 200, 240, 280, 320, 400];
export const SILVER_PRICES = [100, 120, 160, 180, 200, 200, 200, 240, 300, 400];

export const LUMBER_PRICES = [30, 40, 60, 80, 100, 120, 160, 200, 240, 300];
export const COAL_PRICES = [20, 20, 30, 40, 60, 60, 80, 100, 120, 140];

export const SALE_LIMIT_LUMBER: Record<string, number> = {
  Denver: 10,
  "Salt Lake City": 8,
  Pueblo: 6,
  "Santa Fe": 6,
  "El Paso": 8,
};

export const SALE_LIMIT_COAL: Record<string, number> = {
  Denver: 16,
  "Salt Lake City": 10,
  Pueblo: 8,
  "Santa Fe": 8,
  "El Paso": 8,
};
