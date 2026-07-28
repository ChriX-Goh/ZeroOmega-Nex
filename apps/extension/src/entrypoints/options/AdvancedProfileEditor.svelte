<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type AutoDetectProfile,
    type ProfileRouteTarget,
    type ProfileSpec,
    type UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let locale: AppLocale = currentAppLocale();
  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;

  let profile: AutoDetectProfile | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  $: profile = spec.profiles.find(
    (candidate): candidate is AutoDetectProfile =>
      candidate.id === profileId && candidate.kind === 'auto-detect',
  );
  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    routeProfiles = spec.profiles.filter(
      (candidate) => candidate.id !== profileId && !hiddenProfileIds.has(candidate.id),
    );
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (route === undefined) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRoute(value: string): ProfileRouteTarget | undefined {
    if (value === '') return undefined;
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  async function updateFallback(value: string): Promise<void> {
    const route = parseRoute(value);
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is AutoDetectProfile =>
        candidate.id === profileId && candidate.kind === 'auto-detect',
    );
    if (!target) return;
    if (route) target.fallbackRoute = route;
    else delete target.fallbackRoute;
    await onReplaceDraft(draft);
  }
</script>

{#if profile}
  <div data-auto-detect-profile-editor data-typed-locale={locale}>
    <section class="settings-section">
      <h2>{uiText('profile.kind.autoDetect', locale)}</h2>
      <p class="section-help">{uiText('autoDetect.help', locale)}</p>
      <label>
        {uiText('autoDetect.fallback', locale)}
        <select
          data-auto-detect-fallback
          aria-label={uiText('autoDetect.fallbackAria', locale)}
          value={routeValue(profile.fallbackRoute)}
          {disabled}
          on:change={(event) => updateFallback((event.currentTarget as HTMLSelectElement).value)}
        >
          <option value="">{uiText('autoDetect.noFallback', locale)}</option>
          <option value="direct">{uiText('route.direct', locale)}</option>
          <option value="system">{uiText('route.system', locale)}</option>
          {#each routeProfiles as target (target.id)}
            <option value={`profile:${target.id}`}>{target.name}</option>
          {/each}
        </select>
      </label>
    </section>
  </div>
{/if}
