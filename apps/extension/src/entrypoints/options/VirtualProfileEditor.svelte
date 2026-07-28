<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type ProfileRouteTarget,
    type ProfileSpec,
    type UserProfile,
    type VirtualProfile,
  } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let locale: AppLocale = currentAppLocale();
  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onRequestReplacement: (fromProfileId: string, toProfileId: string) => Promise<void>;

  let profile: VirtualProfile | undefined;
  let candidates: readonly UserProfile[] = [];
  $: profile = spec.profiles.find(
    (candidate): candidate is VirtualProfile =>
      candidate.id === profileId && candidate.kind === 'virtual',
  );
  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    candidates = spec.profiles.filter(
      (candidate) => candidate.id !== profileId && !hiddenProfileIds.has(candidate.id),
    );
  }

  function routeValue(route: ProfileRouteTarget): string {
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRoute(value: string): ProfileRouteTarget | undefined {
    if (value === 'direct' || value === 'system') return { kind: value };
    if (value.startsWith('profile:')) return { kind: 'profile', profileId: value.slice(8) };
    return undefined;
  }

  async function updateTarget(value: string): Promise<void> {
    const route = parseRoute(value);
    if (!route) return;
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is VirtualProfile =>
        candidate.id === profileId && candidate.kind === 'virtual',
    );
    if (!target) return;
    target.targetRoute = route;
    await onReplaceDraft(draft);
  }

  async function replaceTargetReferences(): Promise<void> {
    if (!profile || profile.targetRoute.kind !== 'profile') return;
    await onRequestReplacement(profile.targetRoute.profileId, profile.id);
  }
</script>

{#if profile}
  <div data-virtual-profile-editor data-typed-locale={locale}>
    <section class="settings-section">
      <h2>{uiText('virtual.target.title', locale)}</h2>
      <p class="section-help">{uiText('virtual.target.help', locale)}</p>
      <select
        aria-label={uiText('virtual.target.aria', locale)}
        data-virtual-target
        value={routeValue(profile.targetRoute)}
        {disabled}
        on:change={(event) => updateTarget((event.currentTarget as HTMLSelectElement).value)}
      >
        <option value="direct">{uiText('route.direct', locale)}</option>
        <option value="system">{uiText('route.system', locale)}</option>
        {#each candidates as candidate (candidate.id)}
          <option value={`profile:${candidate.id}`}>{candidate.name}</option>
        {/each}
      </select>
    </section>

    <section class="settings-section">
      <h2>{uiText('virtual.migrate.title', locale)}</h2>
      <p class="section-help">{uiText('virtual.migrate.help', locale)}</p>
      <button
        type="button"
        data-virtual-replace
        disabled={disabled || profile.targetRoute.kind !== 'profile'}
        on:click={replaceTargetReferences}>{uiText('virtual.migrate.action', locale)}</button
      >
    </section>
  </div>
{/if}
