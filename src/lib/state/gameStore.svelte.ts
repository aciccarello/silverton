export type Resource = 'gold' | 'silver' | 'copper' | 'coal' | 'lumber';

export interface Player {
    id: string;
    name: string;
    color: string;
    money: number;
    claims: number;
    score: number;
}

export type GamePhase = 'setup' | 'prospecting' | 'mining' | 'trading' | 'scoring' | 'end';

export class GameState {
    players = $state<Player[]>([]);
    currentPhase = $state<GamePhase>('setup');
    turnNumber = $state<number>(1);
    activePlayerId = $state<string | null>(null);

    // Initial market prices for resources
    marketPrices = $state<Record<Resource, number>>({
        gold: 200,
        silver: 100,
        copper: 50,
        coal: 20,
        lumber: 10
    });

    config = $state({
        startingMoney: 1600,
        visibleAmount: 4000,
        gameGoal: 6000
    });

    addPlayer(name: string, color: string) {
        const newPlayer: Player = {
            id: Math.random().toString(36).substring(2, 9),
            name,
            color,
            money: this.config.startingMoney,
            claims: 0,
            score: 0
        };
        this.players.push(newPlayer);
    }

    startGame() {
        if (this.players.length > 0) {
            this.currentPhase = 'prospecting';
            this.turnNumber = 1;
            this.activePlayerId = this.players[0].id;
        }
    }

    updateMarketPrice(resource: Resource, newPrice: number) {
        this.marketPrices[resource] = newPrice;
    }

    nextPhase() {
        const phases: GamePhase[] = ['setup', 'prospecting', 'mining', 'trading', 'scoring', 'end'];
        const currentIndex = phases.indexOf(this.currentPhase);
        if (currentIndex < phases.length - 1) {
            this.currentPhase = phases[currentIndex + 1];
        } else {
            // New turn
            this.turnNumber++;
            this.currentPhase = 'prospecting';
        }
    }

    loadFromJson(data: any) {
        if (!data || Object.keys(data).length === 0) return;
        if (data.players) this.players = data.players;
        if (data.currentPhase) this.currentPhase = data.currentPhase;
        if (data.turnNumber) this.turnNumber = data.turnNumber;
        if (data.activePlayerId !== undefined) this.activePlayerId = data.activePlayerId;
        if (data.marketPrices) this.marketPrices = data.marketPrices;
        if (data.config) this.config = { ...this.config, ...data.config };
    }
}

// Export a singleton instance of the game state
export const gameStore = new GameState();
