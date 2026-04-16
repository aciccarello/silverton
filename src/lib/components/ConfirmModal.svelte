<script lang="ts">
  import { confirmStore } from "$lib/state/confirmStore.svelte";
  import { onMount } from "svelte";

  let dialog = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (confirmStore.isOpen) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  });

  function onCancel() {
    confirmStore.handleCancel();
  }

  function onConfirm() {
    confirmStore.handleConfirm();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  onclose={onCancel}
  onkeydown={handleKeyDown}
  onclick={(e) => e.target === dialog && onCancel()}
  class="confirm-modal"
>
  <div class="modal-content card">
    <h3>Confirmation</h3>
    <p>{confirmStore.message}</p>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick={onCancel}>Cancel</button>
      <button class="btn btn-primary" onclick={onConfirm}>Confirm</button>
    </div>
  </div>
</dialog>

<style>
  .confirm-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 0;
    border: none;
    background: transparent;
    max-width: 500px;
    width: 90%;
    margin: 0;
  }

  .confirm-modal::backdrop {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    padding: var(--spacing-lg);
    text-align: center;
    border: 2px solid var(--color-primary);
    box-shadow:
      0 0 30px rgba(0, 0, 0, 0.8),
      0 0 20px var(--color-glow);
  }

  .modal-content h3 {
    margin-top: 0;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .modal-content p {
    margin: var(--spacing-md) 0 var(--spacing-lg);
    font-size: 1.1rem;
    color: var(--color-text-primary);
  }

  .modal-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .modal-actions .btn {
    min-width: 120px;
  }

  /* Animation */
  .confirm-modal[open] .modal-content {
    animation: modal-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes modal-enter {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
