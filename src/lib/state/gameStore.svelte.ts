export type Resource = 'gold' | 'silver' | 'copper' | 'coal' | 'lumber';

export interface Player {
    id: string;
    name: string;
    color: string;
    money: number;
    resources: Record<Resource, number>;
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

    addPlayer(name: string, color: string) {
        const newPlayer: Player = {
            id: Math.random().toString(36).substring(2, 9),
            name,
            color,
            money: 500, // Starting money
            resources: {
                gold: 0,
                silver: 0,
                copper: 0,
                coal: 0,
                lumber: 0
            },
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
}

// Export a singleton instance of the game state
export const gameStore = new GameState();
