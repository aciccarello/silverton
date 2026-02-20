<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import type { PageData } from './$types';
  
    let { data }: { data: PageData } = $props();
    let isRollingBack = $state(false);

    async function handleRollback(id: number) {
        if (!confirm('Are you sure you want to rollback to this state? All progress after this point will be lost.')) {
            return;
        }

        isRollingBack = true;
        try {
            const res = await fetch('/api/state/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
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
        ...((data.history[0]?.state as any)?.config || {})
    });
    let isSavingConfig = $state(false);

    async function saveConfig() {
        isSavingConfig = true;
        try {
            const res = await fetch('/api/state/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: currentConfig })
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
  <title>Admin - State History</title>
</svelte:head>

<div class="header">
    <h1>State History</h1>
    <a href="/" class="btn btn-outline">Back to Dashboard</a>
</div>

<div class="card" style="margin-bottom: var(--spacing-lg);">
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
</div>

{#if data.history.length === 0}
    <p>No history available.</p>
{:else}
    <div class="history-list animate-entrance">
        {#each data.history as record, i}
            <div class="card history-item" style="margin-bottom: var(--spacing-md)">
                <div class="history-header">
                    <h3>State #{record.id}</h3>
                    <span class="timestamp">{new Date(record.timestamp + 'Z').toLocaleString()}</span>
                </div>
                <div class="history-body">
                    <p><strong>Phase:</strong> {(record.state as any)?.currentPhase || 'Unknown'}</p>
                    <p><strong>Turn:</strong> {(record.state as any)?.turnNumber || 0}</p>
                    <p><strong>Players:</strong> {(record.state as any)?.players?.length || 0}</p>
                </div>
                <div class="history-actions">
                    <button 
                        class="btn btn-primary" 
                        disabled={isRollingBack} 
                        onclick={() => handleRollback(record.id)}>
                        Restore this State
                    </button>
                    {#if i === 0}
                        <span style="margin-left: var(--spacing-md); color: var(--color-text-secondary);">(Current State)</span>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        border-bottom: 2px solid var(--color-border);
        padding-bottom: var(--spacing-md);
    }
    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 1px solid var(--color-border);
        margin-bottom: var(--spacing-sm);
        padding-bottom: var(--spacing-sm);
    }
    .timestamp {
        font-family: var(--font-body);
        color: var(--color-text-secondary);
        font-size: 0.9rem;
    }
    .history-body {
        display: flex;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
    }
    .history-body p {
        margin: 0;
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
