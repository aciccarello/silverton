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
