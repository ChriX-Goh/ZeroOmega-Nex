<script lang="ts">
  type ThemeMode = 'auto' | 'light' | 'dark';
  export let mode: ThemeMode;
  export let onChange: (mode: ThemeMode) => void;

  const choices: readonly { mode: ThemeMode; title: string; description: string }[] = [
    {
      mode: 'auto',
      title: 'Automatic',
      description: 'Follow the operating-system light or dark appearance.',
    },
    {
      mode: 'light',
      title: 'Light',
      description: 'Always use the original light options appearance.',
    },
    { mode: 'dark', title: 'Dark', description: 'Always use the dark options appearance.' },
  ];
</script>

<section class="settings-section theme-options">
  <h2>Appearance</h2>
  <div class="theme-grid" role="radiogroup" aria-label="Options theme">
    {#each choices as choice (choice.mode)}
      <button
        type="button"
        role="radio"
        aria-checked={mode === choice.mode}
        class:active={mode === choice.mode}
        on:click={() => onChange(choice.mode)}
      >
        <span class={`theme-preview theme-preview-${choice.mode}`} aria-hidden="true"
          ><i></i><b></b></span
        >
        <strong>{choice.title}</strong>
        <span>{choice.description}</span>
      </button>
    {/each}
  </div>
  <p class="section-help">
    Automatic is the default and changes immediately when the system appearance changes.
  </p>
</section>
