import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync('local.db');
db.exec('PRAGMA foreign_keys = ON');

// Initialize the database schema for history
db.exec(`
  CREATE TABLE IF NOT EXISTS state_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    state_json TEXT NOT NULL
  )
`);

// Cities (coal and lumber prices are per-city)
db.exec(`
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )
`);

// Global market state: gold, copper, silver — one price per turn worldwide
db.exec(`
  CREATE TABLE IF NOT EXISTS global_market_state (
    turn_number INTEGER NOT NULL,
    resource TEXT NOT NULL CHECK (resource IN ('gold', 'copper', 'silver')),
    price INTEGER NOT NULL,
    PRIMARY KEY (turn_number, resource)
  )
`);

// Per-city market state: coal and lumber — price per city per turn
db.exec(`
  CREATE TABLE IF NOT EXISTS city_market_state (
    turn_number INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    resource TEXT NOT NULL CHECK (resource IN ('coal', 'lumber')),
    price INTEGER NOT NULL,
    PRIMARY KEY (turn_number, city_id, resource),
    FOREIGN KEY (city_id) REFERENCES cities (id)
  )
`);

// Seed initial cities if empty
const cityCountStmt = db.prepare('SELECT COUNT(*) as count FROM cities');
const { count: cityCount } = cityCountStmt.get() as { count: number };
if (cityCount === 0) {
    const insertCity = db.prepare('INSERT INTO cities (name) VALUES (?)');
    for (const name of ['Denver', 'Pueblo', 'Salt Lake City', 'Santa Fe', 'El Paso']) {
        insertCity.run(name);
    }
}

// Seed initial market prices for turn 1 if not present
const turn1GlobalStmt = db.prepare('SELECT 1 FROM global_market_state WHERE turn_number = 1 LIMIT 1');
if (!turn1GlobalStmt.get()) {
    const insGlobal = db.prepare('INSERT INTO global_market_state (turn_number, resource, price) VALUES (1, ?, ?)');
    insGlobal.run('gold', 250);
    insGlobal.run('copper', 200);
    insGlobal.run('silver', 200);

    const cityIds = new Map(
        (db.prepare('SELECT id, name FROM cities').all() as { id: number; name: string }[]).map((r) => [r.name, r.id])
    );
    const insCity = db.prepare('INSERT INTO city_market_state (turn_number, city_id, resource, price) VALUES (1, ?, ?, ?)');

    const lumberByCity: [string, number][] = [
        ['Denver', 100],
        ['Salt Lake City', 120],
        ['Pueblo', 100],
        ['Santa Fe', 80],
        ['El Paso', 100]
    ];
    for (const [name, price] of lumberByCity) {
        const cityId = cityIds.get(name);
        if (cityId != null) insCity.run(cityId, 'lumber', price);
    }

    const coalByCity: [string, number][] = [
        ['Denver', 60],
        ['Salt Lake City', 60],
        ['Pueblo', 40],
        ['Santa Fe', 60],
        ['El Paso', 60]
    ];
    for (const [name, price] of coalByCity) {
        const cityId = cityIds.get(name);
        if (cityId != null) insCity.run(cityId, 'coal', price);
    }
}

// Insert default empty state if not present
const checkStmt = db.prepare('SELECT COUNT(*) as count FROM state_history');
const { count } = checkStmt.get() as { count: number };

if (count === 0) {
    const insertStmt = db.prepare('INSERT INTO state_history (state_json) VALUES (?)');
    insertStmt.run('{}');
}

export function loadState(): string {
    const stmt = db.prepare('SELECT state_json FROM state_history ORDER BY id DESC LIMIT 1');
    const result = stmt.get() as { state_json: string } | undefined;
    return result?.state_json || '{}';
}

export function updateState(
    updater: (state: any) => any,
    lastModifiedBy?: string,
    lastModifiedAction?: string
) {
    db.exec('BEGIN IMMEDIATE');
    try {
        const stmt = db.prepare('SELECT state_json FROM state_history ORDER BY id DESC LIMIT 1');
        const result = stmt.get() as { state_json: string } | undefined;
        let state = JSON.parse(result?.state_json || '{}');

        // Apply updates
        state = updater(state);

        // Inject metadata
        if (lastModifiedBy) state.lastModifiedBy = lastModifiedBy;
        if (lastModifiedAction) state.lastModifiedAction = lastModifiedAction;

        // Save new record
        const insertStmt = db.prepare('INSERT INTO state_history (state_json) VALUES (?)');
        insertStmt.run(JSON.stringify(state));

        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

export function getHistory(limit: number = 50, offset: number = 0): Array<{ id: number, timestamp: string, state_json: string }> {
    const stmt = db.prepare('SELECT id, timestamp, state_json FROM state_history ORDER BY id DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset) as Array<{ id: number, timestamp: string, state_json: string }>;
}

export function getTotalHistoryCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM state_history');
    const result = stmt.get() as { count: number };
    return result.count;
}

export function rollbackTo(id: number, lastModifiedBy?: string, lastModifiedAction?: string) {
    db.exec('BEGIN IMMEDIATE');
    try {
        const stmt = db.prepare('SELECT state_json FROM state_history WHERE id = ?');
        const result = stmt.get(id) as { state_json: string } | undefined;

        if (result) {
            let state = JSON.parse(result.state_json);

            if (lastModifiedBy) state.lastModifiedBy = lastModifiedBy;
            if (lastModifiedAction) state.lastModifiedAction = lastModifiedAction;

            const insertStmt = db.prepare('INSERT INTO state_history (state_json) VALUES (?)');
            insertStmt.run(JSON.stringify(state));

            db.exec('COMMIT');
        } else {
            throw new Error('Historical state not found');
        }
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

export function resetState(lastModifiedBy?: string, lastModifiedAction?: string) {
    updateState(() => ({}), lastModifiedBy, lastModifiedAction);
}

// --- Cities ---
export type CityRow = { id: number; name: string };

export function getCities(): CityRow[] {
    const stmt = db.prepare('SELECT id, name FROM cities ORDER BY name');
    return stmt.all() as CityRow[];
}

// --- Market state (prices as-of a turn) ---
export type GlobalMarketRow = { turn_number: number; resource: string; price: number };
export type CityMarketRow = { turn_number: number; city_id: number; resource: string; price: number };

export function getGlobalMarketState(turnNumber: number): GlobalMarketRow[] {
    const stmt = db.prepare('SELECT turn_number, resource, price FROM global_market_state WHERE turn_number = ?');
    return stmt.all(turnNumber) as GlobalMarketRow[];
}

export function getCityMarketState(turnNumber: number): CityMarketRow[] {
    const stmt = db.prepare('SELECT turn_number, city_id, resource, price FROM city_market_state WHERE turn_number = ?');
    return stmt.all(turnNumber) as CityMarketRow[];
}

export function setGlobalMarketPrice(turnNumber: number, resource: 'gold' | 'copper' | 'silver', price: number) {
    const stmt = db.prepare(`
        INSERT INTO global_market_state (turn_number, resource, price) VALUES (?, ?, ?)
        ON CONFLICT (turn_number, resource) DO UPDATE SET price = excluded.price
    `);
    stmt.run(turnNumber, resource, price);
}

export function setCityMarketPrice(turnNumber: number, cityId: number, resource: 'coal' | 'lumber', price: number) {
    const stmt = db.prepare(`
        INSERT INTO city_market_state (turn_number, city_id, resource, price) VALUES (?, ?, ?, ?)
        ON CONFLICT (turn_number, city_id, resource) DO UPDATE SET price = excluded.price
    `);
    stmt.run(turnNumber, cityId, resource, price);
}
