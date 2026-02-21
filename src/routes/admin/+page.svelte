<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { confirmStore } from '$lib/state/confirmStore.svelte';
    import type { PageData } from './$types';
  
    let { data }: { data: PageData } = $props();
    let isRollingBack = $state(false);

    async function handleRollback(id: number) {
        const confirmed = await confirmStore.confirm('Are you sure you want to rollback to this state? All progress after this point will be lost.');
        if (!confirmed) {
            return;
        }

        isRollingBack = true;
        try {
            const res = await fetch('/api/state/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id,
                    lastModifiedBy: 'Admin',
                    lastModifiedAction: `Rolled back to state #${id}`
                })
            });

            if (res.ok) {
                // If successful, reload the page to fetch the new history which now includes the rollback as the latest item
                await invalidateAll();
                alert('Successfully rolled back state!');
            } else {
                const err = await res.json();
                alert('Rollback failed: ' + err.error);
            }
        } catch (e) {
            console.error(e);
            alert('An unexpected error occurred.');
        } finally {
            isRollingBack = false;
        }
    }

    // Config state
    let currentConfig = $state({
        startingMoney: 1600,
        visibleAmount: 4000,
        gameGoal: 6000,
    });

    $effect(() => {
        const serverConfig = (data.history[0]?.state as any)?.config;
        if (serverConfig) {
            import('svelte').then(({ untrack }) => {
                untrack(() => {
                    Object.assign(currentConfig, serverConfig);
                });
            });
        }
    });

    let isSavingConfig = $state(false);

    async function saveConfig() {
        isSavingConfig = true;
        try {
            const res = await fetch('/api/state/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    config: currentConfig,
                    lastModifiedBy: 'Admin',
                    lastModifiedAction: 'Updated game configuration'
                })
            });
            if (res.ok) {
                alert('Configuration updated successfully!');
                await invalidateAll();
            } else {
                alert('Failed to update config.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save config.');
        } finally {
            isSavingConfig = false;
        }
    }
</script>

<svelte:head>
  <title>Administration</title>
</svelte:head>

<div class="header">
    <h1>Administration</h1>
    <a href="/" class="btn btn-outline">Back to Dashboard</a>
</div>

<section class="card" style="margin-bottom: var(--spacing-lg);">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--spacing-sm);">
        <h2>Game Configuration</h2>
        <button class="btn btn-primary" onclick={saveConfig} disabled={isSavingConfig}>
            {isSavingConfig ? 'Saving...' : 'Save Config'}
        </button>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
        <label class="input-group">
            <span style="color: var(--color-text-secondary);">Starting Money</span>
            <input type="number" bind:value={currentConfig.startingMoney} />
        </label>
        <label class="input-group">
            <span style="color: var(--color-text-secondary);">Visible Amount</span>
            <input type="number" bind:value={currentConfig.visibleAmount} />
        </label>
        <label class="input-group">
            <span style="color: var(--color-text-secondary);">Game Goal</span>
            <input type="number" bind:value={currentConfig.gameGoal} />
        </label>
    </div>
</section>

<section class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--spacing-md); border-bottom: 1px solid var(--color-border); padding-bottom: var(--spacing-sm);">
        <h2>State History</h2>
    </div>

    {#if data.history.length === 0}
        <p>No history available.</p>
    {:else}
        <div class="table-container animate-entrance">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Phase</th>
                        <th>Turn</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.history as record, i}
                        <tr class:current-state={i === 0}>
                            <td>#{record.id}</td>
                            <td>{new Date(record.timestamp + 'Z').toLocaleString()}</td>
                            <td>
                                <span class="user-badge">{(record.state as any)?.lastModifiedBy || 'Unknown'}</span>
                            </td>
                            <td class="action-cell">{(record.state as any)?.lastModifiedAction || '-'}</td>
                            <td style="text-transform: capitalize;">{(record.state as any)?.currentPhase || 'setup'}</td>
                            <td>{(record.state as any)?.turnNumber || 1}</td>
                            <td style="text-align: right;">
                                {#if i === 0}
                                    <span class="current-label">Active</span>
                                {:else}
                                    <button 
                                        class="btn btn-sm btn-outline" 
                                        disabled={isRollingBack} 
                                        onclick={() => handleRollback(record.id)}>
                                        Restore
                                    </button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</section>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        border-bottom: 2px solid var(--color-border);
        padding-bottom: var(--spacing-md);
    }
    .table-container {
        overflow-x: auto;
    }
    .history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    .history-table th, .history-table td {
        padding: 0.75rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border);
    }
    .history-table th {
        color: var(--color-text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
    }
    .current-state {
        background: rgba(230, 161, 34, 0.05);
    }
    .user-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border);
        font-size: 0.85rem;
    }
    .action-cell {
        color: var(--color-text-secondary);
        font-style: italic;
    }
    .current-label {
        color: var(--color-primary);
        font-weight: bold;
        font-size: 0.8rem;
        text-transform: uppercase;
    }
    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .input-group input {
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid var(--color-border);
        background: var(--color-bg-base);
        color: var(--color-text-primary);
        font-family: inherit;
        font-size: 1rem;
    }
</style>
