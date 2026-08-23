<script lang="ts">
  import { onMount, tick } from 'svelte';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import type { PacProfileCapability } from '../../lib/browser-target-capabilities';
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText, type UiTextKey } from '../../lib/ui-messages';

  type NewProfileKind = 'fixed' | 'switch' | 'pac' | 'virtual';

  export let existingNames: readonly string[] = [];
  export let disabled = false;
  export let pacCapability: PacProfileCapability = {
    supported: true,
    reason: 'proxy-settings',
  };
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onCreate: (kind: NewProfileKind, name: string) => Promise<void>;

  const choices: readonly {
    kind: NewProfileKind;
    color: string;
    titleKey: UiTextKey;
    descriptionKey: UiTextKey;
  }[] = [
    {
      kind: 'fixed',
      color: '#64b5f6',
      titleKey: 'newProfile.fixed.title',
      descriptionKey: 'newProfile.fixed.description',
    },
    {
      kind: 'switch',
      color: '#8bc34a',
      titleKey: 'newProfile.switch.title',
      descriptionKey: 'newProfile.switch.description',
    },
    {
      kind: 'pac',
      color: '#ffb74d',
      titleKey: 'newProfile.pac.title',
      descriptionKey: 'newProfile.pac.description',
    },
    {
      kind: 'virtual',
      color: '#9575cd',
      titleKey: 'newProfile.virtual.title',
      descriptionKey: 'newProfile.virtual.description',
    },
  ];

  let name = '';
  let kind: NewProfileKind = 'fixed';
  let submitting = false;
  let nameInput: HTMLInputElement | undefined;

  onMount(() => {
    void tick().then(() => {
      if (!disabled) nameInput?.focus();
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
  $: canCreate =
    !disabled &&
    !submitting &&
    errorKey === undefined &&
    (kind !== 'pac' || pacCapability.supported);

  async function create(): Promise<void> {
    if (!canCreate) return;
    submitting = true;
    try {
      await onCreate(kind, normalizedName);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="new-profile-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="new-profile-title"
    data-typed-locale={locale}
    data-pac-profile-supported={pacCapability.supported}
    data-pac-profile-capability-reason={pacCapability.reason}
  >
    <header>
      <h1 id="new-profile-title">{uiText('newProfile.title', locale)}</h1>
    </header>

    <div class="dialog-body">
      <label class="profile-name-field">
        <span>{uiText('profile.name', locale)}</span>
        <input
          bind:this={nameInput}
          data-new-profile-name-input
          aria-describedby="new-profile-name-message"
          aria-invalid={errorKey !== undefined}
          value={name}
          {disabled}
          on:input={(event) => (name = (event.currentTarget as HTMLInputElement).value)}
          on:keydown={(event) => {
            if (event.key === 'Enter') void create();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </label>
      <div
        id="new-profile-name-message"
        class:error-message={errorKey !== undefined}
        class="field-message"
      >
        {#if errorKey}
          {uiText(errorKey, locale)}
        {:else if hidden}
          {uiText('newProfile.hidden', locale)}
        {/if}
      </div>

      <fieldset class="profile-type-choices" {disabled}>
        <legend>{uiText('newProfile.type', locale)}</legend>
        {#each choices as choice (choice.kind)}
          <label class:disabled-choice={choice.kind === 'pac' && !pacCapability.supported}>
            <input
              type="radio"
              name="profile-type"
              value={choice.kind}
              data-new-profile-kind={choice.kind}
              checked={kind === choice.kind}
              disabled={disabled || (choice.kind === 'pac' && !pacCapability.supported)}
              on:change={() => (kind = choice.kind)}
            />
            <ProfileIcon kind={choice.kind} color={choice.color} size={31} />
            <span>
              <strong>{uiText(choice.titleKey, locale)}</strong>
              <small>{uiText(choice.descriptionKey, locale)}</small>
              {#if choice.kind === 'pac' && !pacCapability.supported}
                <small class="error-message">{uiText('newProfile.pac.unsupported', locale)}</small>
              {/if}
            </span>
          </label>
        {/each}
      </fieldset>
    </div>

    <footer>
      <button type="button" disabled={submitting} on:click={onCancel}
        >{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="primary"
        data-new-profile-create
        disabled={!canCreate}
        on:click={create}
      >
        {submitting ? uiText('common.creating', locale) : uiText('common.create', locale)}
      </button>
    </footer>
  </div>
</div>
