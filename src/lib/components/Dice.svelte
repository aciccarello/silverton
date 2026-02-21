<script lang="ts">
  interface Props {
    results: number[];
    isRolling: boolean;
    diceCount?: number;
    children?: import('svelte').Snippet;
  }

  let { results, isRolling, diceCount = 2, children }: Props = $props();

  // Helper for dots on a die
  function getDots(value: number) {
    const positions = [
      [],               // 0 (unused)
      [4],              // 1 (center)
      [0, 8],           // 2 (top-left, bottom-right)
      [0, 4, 8],        // 3 (top-left, center, bottom-right)
      [0, 2, 6, 8],     // 4 (four corners)
      [0, 2, 4, 6, 8],  // 5 (four corners + center)
      [0, 2, 4, 6, 8],  // 5 (four corners + center)
      [0, 2, 3, 5, 6, 8] // 6 (two vertical columns)
    ];
    return positions[value] || [];
  }
</script>

<div class="dice-container" class:animate-shake={isRolling}>
  {#if isRolling}
    {#each Array(diceCount) as _}
      <div class="mini-die dummy">?</div>
    {/each}
  {:else if results.length > 0}
    {#each results as val}
      <div class="mini-die animate-bounce-in">
        {#each Array(9) as _, dotIdx}
          <div class="mini-dot" class:visible={getDots(val).includes(dotIdx)}></div>
        {/each}
      </div>
    {/each}
  {:else}
    {#if children}
      {@render children()}
    {:else}
      <span class="placeholder">Ready</span>
    {/if}
  {/if}
</div>

<style>
  .dice-container {
    display: flex;
    gap: 8px;
    min-height: 32px;
    align-items: center;
  }

  .mini-die {
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 4px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    padding: 3px;
    gap: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .mini-die.dummy {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-primary);
    font-weight: bold;
    font-size: 1.1rem;
    background: var(--color-bg-elevated);
    border: 1px dashed var(--color-border);
  }

  .mini-dot {
    background: #2c3e50;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .mini-dot.visible {
    opacity: 1;
  }

  .placeholder {
    color: var(--color-text-secondary);
    font-style: italic;
    font-size: 0.9rem;
    opacity: 0.7;
  }
</style>
