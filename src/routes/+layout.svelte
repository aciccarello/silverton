<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
  <header class="app-header container">
    <nav>
      <a href="/" class="nav-link">Dashboard</a>
      <a href="/admin" class="nav-link">Admin</a>
    </nav>
  </header>
  <main class="container">
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: var(--spacing-xl);
  }

  .app-header {
    padding-top: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .app-header nav {
    display: flex;
    gap: var(--spacing-lg);
    justify-content: flex-end;
  }

  .nav-link {
    font-family: var(--font-heading);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .nav-link:hover {
    color: var(--color-primary);
  }
</style>
