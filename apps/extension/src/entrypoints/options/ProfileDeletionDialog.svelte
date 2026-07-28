<script lang="ts">
  import type { ProfileReferenceBlocker } from '@zeroomega-nex/profile-workflow';
  import { onMount, tick } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { profileKindText, uiMessage, uiText } from '../../lib/ui-messages';

  export let profileName: string;
  export let blockers: readonly ProfileReferenceBlocker[] = [];
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: () => Promise<void>;

  let initialButton: HTMLButtonElement | undefined;

  onMount(() => {
    void tick().then(() => initialButton?.focus());
  });
</script>

<div class="deletion-backdrop" data-profile-deletion-backdrop>
  {#if blockers.length > 0}
    <div
      class="deletion-dialog"
      role="alertdialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="profile-deletion-blocked-title"
      aria-describedby="profile-deletion-blocked-description profile-deletion-blocked-instruction"
      data-profile-deletion-dialog
      data-profile-deletion-mode="blocked"
      data-typed-locale={locale}
    >
      <h2 id="profile-deletion-blocked-title">{uiText('profile.delete.blockedTitle', locale)}</h2>
      <p id="profile-deletion-blocked-description">
        {uiMessage('profile.delete.blockedDescription', { profileName }, locale)}
      </p>
      <ul class="reference-list" data-profile-deletion-blockers>
        {#each blockers as blocker (blocker.profileId)}
          <li data-profile-deletion-blocker={blocker.profileId}>
            <strong>{blocker.profileName}</strong>
            <span>{profileKindText(blocker.profileKind, locale)}</span>
          </li>
        {/each}
      </ul>
      <p id="profile-deletion-blocked-instruction">
        {uiText('profile.delete.blockedInstruction', locale)}
      </p>
      <div class="dialog-actions">
        <button
          bind:this={initialButton}
          type="button"
          data-profile-deletion-close
          onclick={onCancel}>{uiText('common.close', locale)}</button
        >
      </div>
    </div>
  {:else}
    <div
      class="deletion-dialog"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="profile-deletion-confirm-title"
      aria-describedby="profile-deletion-confirm-description"
      data-profile-deletion-dialog
      data-profile-deletion-mode="confirm"
      data-typed-locale={locale}
    >
      <h2 id="profile-deletion-confirm-title">{uiText('profile.delete.confirmTitle', locale)}</h2>
      <p id="profile-deletion-confirm-description">
        {uiMessage('profile.delete.confirmDescription', { profileName }, locale)}
      </p>
      <div class="dialog-actions">
        <button
          bind:this={initialButton}
          type="button"
          data-profile-deletion-cancel
          {disabled}
          onclick={onCancel}>{uiText('common.cancel', locale)}</button
        >
        <button
          type="button"
          class="danger"
          data-profile-deletion-confirm
          {disabled}
          onclick={() => void onConfirm()}>{uiText('common.delete', locale)}</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .deletion-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .deletion-dialog {
    width: min(520px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 9px;
    font-size: 20px;
    font-weight: 500;
  }

  p {
    margin: 0 0 16px;
    color: var(--muted);
  }

  .reference-list {
    max-height: 260px;
    margin: 0 0 18px;
    padding: 0;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  .reference-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 2px;
    border-bottom: 1px solid var(--border);
  }

  .reference-list span {
    color: var(--muted);
    font-size: 12px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  button.danger {
    border-color: var(--danger);
    background: var(--danger);
    color: #fff;
  }
</style>
