<script lang="ts">
  import { gameStore } from "$lib/state/gameStore.svelte";

  let {
    logInAs,
    handleAddPlayer,
  }: {
    logInAs: (playerId: string) => void;
    handleAddPlayer: (name: string) => void;
  } = $props();

  let newPlayerName = $state("");

  function onJoin(e: Event) {
    e.preventDefault();
    if (newPlayerName.trim()) {
      handleAddPlayer(newPlayerName);
      newPlayerName = "";
    }
  }
</script>

<div class="card" style="text-align: center;">
  <h2>Join Game</h2>

  <div style="margin: var(--spacing-lg) 0;">
    <p
      style="margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);"
    >
      Select an existing player to log in:
    </p>
    {#if gameStore.players.length === 0}
      <p><em>No players registered yet.</em></p>
    {:else}
      <div class="btn-container btn-container--vertical">
        {#each gameStore.players as player}
          <button
            class="btn btn-outline"
            style="border-color: {player.color}; color: {player.color}; width: 100%;"
            onclick={() => logInAs(player.id)}
          >
            {player.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div
    style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-lg);"
  >
    <p
      style="margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);"
    >
      Or register a new player:
    </p>
    {#if gameStore.currentPhase === "setup"}
      <form
        style="display: flex; gap: 0.5rem; justify-content: center;"
        onsubmit={onJoin}
      >
        <input
          type="text"
          bind:value={newPlayerName}
          placeholder="Your Name"
          style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-elevated); color: var(--color-text-primary);"
        />
        <button
          type="submit"
          class="btn btn-primary"
          style="padding: 0.5rem 1rem;"
        >
          Join
        </button>
      </form>
    {:else}
      <p><em>Registration is closed once the game starts.</em></p>
    {/if}
  </div>
</div>
