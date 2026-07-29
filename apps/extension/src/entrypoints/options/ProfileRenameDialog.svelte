<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let profileName: string;
  export let existingNames: readonly string[] = [];
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: (name: string) => Promise<void>;

  let name = profileName;
  let submitting = false;
  let nameInput: HTMLInputElement | undefined;

  onMount(() => {
    void tick().then(() => {
      if (disabled) return;
      nameInput?.focus();
      nameInput?.select();
    });
  });

  $: normalizedName = name.trim();
  $: duplicate = existingNames.some(
    (candidate) =>
      candidate.localeCompare(normalizedName, undefined, { sensitivity: 'base' }) === 0,
  );
  $: reserved = normalizedName.startsWith('__') || /^(?:direct|system)$/iu.test(normalizedName);
  $: hidden = normalizedName.startsWith('_') && !reserved;
  $: errorKey =
    normalizedName.length === 0
      ? ('newProfile.error.empty' as const)
      : reserved
        ? ('newProfile.error.reserved' as const)
        : duplicate
          ? ('newProfile.error.conflict' as const)
          : undefined;
  $: canRename = !disabled && !submitting && errorKey === undefined;

  async function confirm(): Promise<void> {
    if (!canRename) return;
    submitting = true;
    try {
      await onConfirm(normalizedName);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="rename-backdrop" data-profile-rename-backdrop>
  <div
    class="rename-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="profile-rename-title"
    aria-describedby="profile-rename-name-message"
    data-profile-rename-dialog
    data-typed-locale={locale}
  >
    <header>
      <h2 id="profile-rename-title">{uiText('profile.rename.title', locale)}</h2>
      <button
        type="button"
        class="close-button"
        aria-label={uiText('common.close', locale)}
        disabled={submitting}
        onclick={onCancel}>×</button
      >
    </header>
    <div class="dialog-body">
      <label>
        <span>{uiText('profile.rename.label', locale)}</span>
        <input
          bind:this={nameInput}
          data-profile-rename-name-input
          aria-describedby="profile-rename-name-message"
          aria-invalid={errorKey !== undefined}
          value={name}
          disabled={disabled || submitting}
          oninput={(event) => (name = (event.currentTarget as HTMLInputElement).value)}
          onkeydown={(event) => {
            if (event.key === 'Enter') void confirm();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </label>
      <div
        id="profile-rename-name-message"
        class:error-message={errorKey !== undefined}
        class="field-message"
        role={errorKey ? 'alert' : 'status'}
      >
        {#if errorKey}
          {uiText(errorKey, locale)}
        {:else if hidden}
          {uiText('newProfile.hidden', locale)}
        {/if}
      </div>
    </div>
    <footer>
      <button type="button" data-profile-rename-cancel disabled={submitting} onclick={onCancel}
        >{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="primary"
        data-profile-rename-confirm
        disabled={!canRename}
        onclick={() => void confirm()}
      >
        {submitting
          ? uiText('profile.rename.renaming', locale)
          : uiText('profile.rename.action', locale)}
      </button>
    </footer>
  </div>
</div>

<style>
  .rename-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .rename-dialog {
    width: min(520px, 100%);
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  header,
  footer {
    display: flex;
    align-items: center;
    padding: 14px 18px;
  }

  header {
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }

  footer {
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid var(--border);
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }

  .close-button {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 24px;
  }

  .dialog-body {
    padding: 20px 18px;
  }

  label {
    display: grid;
    gap: 7px;
  }

  input {
    min-height: 34px;
    padding: 6px 9px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--input-bg);
    color: var(--text);
  }

  .field-message {
    min-height: 20px;
    margin-top: 6px;
    color: var(--muted);
    font-size: 12px;
  }

  .error-message {
    color: var(--danger);
  }

  footer button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  footer button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }
</style>
