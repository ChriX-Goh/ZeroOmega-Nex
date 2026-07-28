<script lang="ts">
  import ProfileIcon from '../../components/ProfileIcon.svelte';

  type NewProfileKind = 'fixed' | 'switch' | 'pac' | 'virtual';

  export let existingNames: readonly string[] = [];
  export let disabled = false;
  export let pacSupported = true;
  export let onCancel: () => void;
  export let onCreate: (kind: NewProfileKind, name: string) => Promise<void>;

  const choices: readonly {
    kind: NewProfileKind;
    color: string;
    title: string;
    description: string;
  }[] = [
    {
      kind: 'fixed',
      color: '#64b5f6',
      title: 'Proxy Profile',
      description: 'Configure proxy servers separately for each URL scheme.',
    },
    {
      kind: 'switch',
      color: '#8bc34a',
      title: 'Switch Profile',
      description: 'Select another profile by URL, host, or other switching conditions.',
    },
    {
      kind: 'pac',
      color: '#ffb74d',
      title: 'PAC Profile',
      description: 'Use a PAC script from a URL or edit the script directly.',
    },
    {
      kind: 'virtual',
      color: '#9575cd',
      title: 'Virtual Profile',
      description: 'Create a stable alias that points to another profile.',
    },
  ];

  let name = '';
  let kind: NewProfileKind = 'fixed';
  let submitting = false;

  $: normalizedName = name.trim();
  $: duplicate = existingNames.some(
    (candidate) =>
      candidate.localeCompare(normalizedName, undefined, { sensitivity: 'base' }) === 0,
  );
  $: reserved = normalizedName.startsWith('__') || /^(?:direct|system)$/iu.test(normalizedName);
  $: hidden = normalizedName.startsWith('_') && !reserved;
  $: error =
    normalizedName.length === 0
      ? 'Profile name cannot be empty.'
      : reserved
        ? 'Names beginning with two underscores and built-in profile names are reserved.'
        : duplicate
          ? 'A profile with the same name already exists.'
          : '';
  $: canCreate = !disabled && !submitting && error === '' && (kind !== 'pac' || pacSupported);

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
  <section
    class="new-profile-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="new-profile-title"
  >
    <header>
      <h1 id="new-profile-title">New Profile</h1>
    </header>

    <div class="dialog-body">
      <label class="profile-name-field">
        <span>Profile name</span>
        <input
          autofocus
          aria-describedby="new-profile-name-message"
          aria-invalid={error !== ''}
          value={name}
          {disabled}
          on:input={(event) => (name = (event.currentTarget as HTMLInputElement).value)}
          on:keydown={(event) => {
            if (event.key === 'Enter') void create();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </label>
      <div id="new-profile-name-message" class:error-message={error !== ''} class="field-message">
        {#if error}{error}{:else if hidden}Profiles beginning with an underscore are hidden from the
          popup but can still be used as switching results.{/if}
      </div>

      <fieldset class="profile-type-choices" {disabled}>
        <legend>Profile type</legend>
        {#each choices as choice (choice.kind)}
          <label class:disabled-choice={choice.kind === 'pac' && !pacSupported}>
            <input
              type="radio"
              name="profile-type"
              value={choice.kind}
              data-new-profile-kind={choice.kind}
              checked={kind === choice.kind}
              disabled={disabled || (choice.kind === 'pac' && !pacSupported)}
              on:change={() => (kind = choice.kind)}
            />
            <ProfileIcon kind={choice.kind} color={choice.color} size={31} />
            <span>
              <strong>{choice.title}</strong>
              <small>{choice.description}</small>
              {#if choice.kind === 'pac' && !pacSupported}
                <small class="error-message"
                  >PAC profiles are not supported by this browser target.</small
                >
              {/if}
            </span>
          </label>
        {/each}
      </fieldset>
    </div>

    <footer>
      <button type="button" disabled={submitting} on:click={onCancel}>Cancel</button>
      <button
        type="button"
        class="primary"
        data-new-profile-create
        disabled={!canCreate}
        on:click={create}
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
    </footer>
  </section>
</div>
