<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type ProfileRouteTarget,
    type ProfileSpec,
    type UserProfile,
    type VirtualProfile,
  } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

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
  <section class="settings-section" data-virtual-profile-editor>
    <h2>Target profile</h2>
    <p class="section-help">
      A virtual profile is a stable alias. Change this target later without editing every rule that
      refers to the virtual profile.
    </p>
    <select
      aria-label="Virtual Profile target"
      data-virtual-target
      value={routeValue(profile.targetRoute)}
      {disabled}
      on:change={(event) => updateTarget((event.currentTarget as HTMLSelectElement).value)}
    >
      <option value="direct">Direct</option>
      <option value="system">System Proxy</option>
      {#each candidates as candidate (candidate.id)}
        <option value={`profile:${candidate.id}`}>{candidate.name}</option>
      {/each}
    </select>
  </section>

  <section class="settings-section">
    <h2>Migrate to Virtual Profile</h2>
    <p class="section-help">
      Replace references to the selected target with this virtual profile. Future target changes can
      then be made here in one place.
    </p>
    <button
      type="button"
      data-virtual-replace
      disabled={disabled || profile.targetRoute.kind !== 'profile'}
      on:click={replaceTargetReferences}>Replace target profile</button
    >
  </section>
{/if}
