<script lang="ts">
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText, type UiTextKey } from '../../lib/ui-messages';
  import type { ThemeMode } from '../../lib/ui-theme';

  export let locale: AppLocale = currentAppLocale();
  export let mode: ThemeMode;
  export let onChange: (mode: ThemeMode) => void;

  const choices: readonly {
    value: ThemeMode;
    titleKey: UiTextKey;
    descriptionKey: UiTextKey;
  }[] = [
    {
      value: 'auto',
      titleKey: 'theme.auto.title',
      descriptionKey: 'theme.auto.description',
    },
    {
      value: 'light',
      titleKey: 'theme.light.title',
      descriptionKey: 'theme.light.description',
    },
    {
      value: 'dark',
      titleKey: 'theme.dark.title',
      descriptionKey: 'theme.dark.description',
    },
  ];
</script>

<section class="settings-section" data-theme-panel data-typed-locale={locale}>
  <h2>{uiText('theme.appearance', locale)}</h2>
  <div class="theme-choices" role="radiogroup" aria-label={uiText('theme.groupAria', locale)}>
    {#each choices as choice}
      <button
        type="button"
        class:active={mode === choice.value}
        role="radio"
        aria-checked={mode === choice.value}
        onclick={() => onChange(choice.value)}
      >
        <strong>{uiText(choice.titleKey, locale)}</strong>
        <span>{uiText(choice.descriptionKey, locale)}</span>
      </button>
    {/each}
  </div>
  <p class="section-help">{uiText('theme.defaultHelp', locale)}</p>
</section>
