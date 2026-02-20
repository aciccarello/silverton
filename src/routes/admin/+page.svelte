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
</script>

<svelte:head>
  <title>Admin - State History</title>
</svelte:head>

<div class="header">
    <h1>State History</h1>
    <a href="/" class="btn btn-outline">Back to Dashboard</a>
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
                    <p><strong>Phase:</strong> {record.state?.currentPhase || 'Unknown'}</p>
                    <p><strong>Turn:</strong> {record.state?.turnNumber || 0}</p>
                    <p><strong>Players:</strong> {record.state?.players?.length || 0}</p>
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
</style>
