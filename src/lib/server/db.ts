import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync('local.db');

// Initialize the database schema for history
db.exec(`
  CREATE TABLE IF NOT EXISTS state_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    state_json TEXT NOT NULL
  )
`);

// Insert default empty state if not present
const checkStmt = db.prepare('SELECT COUNT(*) as count FROM state_history');
const { count } = checkStmt.get() as { count: number };

if (count === 0) {
    const insertStmt = db.prepare('INSERT INTO state_history (state_json) VALUES (?)');
    insertStmt.run('{}');
}

export function saveState(jsonString: string) {
    const stmt = db.prepare('INSERT INTO state_history (state_json) VALUES (?)');
    stmt.run(jsonString);
}

export function loadState(): string {
    const stmt = db.prepare('SELECT state_json FROM state_history ORDER BY id DESC LIMIT 1');
    const result = stmt.get() as { state_json: string } | undefined;
    return result?.state_json || '{}';
}

export function getHistory(): Array<{ id: number, timestamp: string, state_json: string }> {
    // Limit to last 50 entries to avoid massive payloads
    const stmt = db.prepare('SELECT id, timestamp, state_json FROM state_history ORDER BY id DESC LIMIT 50');
    return stmt.all() as Array<{ id: number, timestamp: string, state_json: string }>;
}

export function rollbackTo(id: number, lastModifiedBy?: string, lastModifiedAction?: string) {
    const stmt = db.prepare('SELECT state_json FROM state_history WHERE id = ?');
    const result = stmt.get(id) as { state_json: string } | undefined;

    if (result) {
        let state: any = {};
        try {
            state = JSON.parse(result.state_json);
        } catch (e) { /* ignore */ }

        if (lastModifiedBy) state.lastModifiedBy = lastModifiedBy;
        if (lastModifiedAction) state.lastModifiedAction = lastModifiedAction;

        // To rollback, we just insert the old state as the new head of history.
        saveState(JSON.stringify(state));
    } else {
        throw new Error('Historical state not found');
    }
}
