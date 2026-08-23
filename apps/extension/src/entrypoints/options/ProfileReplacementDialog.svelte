<script lang="ts">
  import type { ProfileSpec, UserProfile } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let spec: ProfileSpec;
  export let initialFromProfileId: string;
  export let initialToProfileId: string;
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: (fromProfileId: string, toProfileId: string) => Promise<void>;

  let fromProfileId = initialFromProfileId;
  let toProfileId = initialToProfileId;
  let candidates: readonly UserProfile[] = [];
  let fromProfile: UserProfile | undefined;
  let toProfile: UserProfile | undefined;

  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    candidates = spec.profiles.filter((profile) => !hiddenProfileIds.has(profile.id));
  }
  $: fromProfile = candidates.find((profile) => profile.id === fromProfileId);
  $: toProfile = candidates.find((profile) => profile.id === toProfileId);

  function profileColor(profile: UserProfile | undefined): string {
    if (!profile) return '#90a4ae';
    const visited = new Set<string>();
    let current: UserProfile | undefined = profile;
    while (current?.kind === 'virtual' && current.targetRoute.kind === 'profile') {
      if (visited.has(current.id)) return '#90a4ae';
      visited.add(current.id);
      const targetProfileId: string = current.targetRoute.profileId;
      current = spec.profiles.find((candidate) => candidate.id === targetProfileId);
    }
    if (current?.kind === 'virtual') {
      return current.targetRoute.kind === 'direct'
        ? (spec.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee')
        : (spec.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88');
    }
    return current?.color ?? '#90a4ae';
  }
</script>

<div class="replacement-backdrop" data-profile-replacement-backdrop>
  <div
    class="replacement-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="profile-replacement-title"
    aria-describedby="profile-replacement-description"
    data-profile-replacement-dialog
    data-typed-locale={locale}
  >
    <h2 id="profile-replacement-title">{uiText('profile.replace.title', locale)}</h2>
    <p id="profile-replacement-description" class="replacement-question">
      {#if locale === 'en'}
        {uiText('profile.replace.questionPrefix', locale)}
        <select
          aria-label={uiText('profile.replace.fromAria', locale)}
          data-profile-replacement-from
          bind:value={fromProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>
        {uiText('profile.replace.questionMiddle', locale)}
        <select
          aria-label={uiText('profile.replace.toAria', locale)}
          data-profile-replacement-to
          bind:value={toProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>{uiText('profile.replace.questionSuffix', locale)}
      {:else}
        {uiText('profile.replace.questionPrefix', locale)}
        <select
          aria-label={uiText('profile.replace.toAria', locale)}
          data-profile-replacement-to
          bind:value={toProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>
        {uiText('profile.replace.questionMiddle', locale)}
        <select
          aria-label={uiText('profile.replace.fromAria', locale)}
          data-profile-replacement-from
          bind:value={fromProfileId}
          {disabled}
        >
          {#each candidates as candidate (candidate.id)}
            <option value={candidate.id}>{candidate.name}</option>
          {/each}
        </select>{uiText('profile.replace.questionSuffix', locale)}
      {/if}
    </p>

    <div class="replacement-preview" data-profile-replacement-preview>
      <span class="profile-inline">
        <ProfileIcon
          kind={fromProfile?.kind ?? 'fixed'}
          color={profileColor(fromProfile)}
          size={24}
        />
        <strong>{fromProfile?.name ?? uiText('route.missing', locale)}</strong>
      </span>
      <span class="replacement-arrow" aria-hidden="true">→</span>
      <span class="profile-inline">
        <ProfileIcon kind={toProfile?.kind ?? 'fixed'} color={profileColor(toProfile)} size={24} />
        <strong>{toProfile?.name ?? uiText('route.missing', locale)}</strong>
      </span>
    </div>

    <p class="replacement-help">{uiText('profile.replace.help', locale)}</p>

    <div class="dialog-actions">
      <button type="button" data-profile-replacement-cancel {disabled} onclick={onCancel}
        >{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="warning"
        data-profile-replacement-confirm
        disabled={disabled || !fromProfile || !toProfile}
        onclick={() => void onConfirm(fromProfileId, toProfileId)}
        >{uiText('common.replace', locale)}</button
      >
    </div>
  </div>
</div>

<style>
  .replacement-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .replacement-dialog {
    width: min(680px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 500;
  }

  .replacement-question,
  .replacement-help {
    margin: 0 0 16px;
  }

  .replacement-question select {
    display: inline-block;
    width: auto;
    min-width: 150px;
    margin: 0 5px;
  }

  .replacement-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--page-bg);
  }

  .profile-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .replacement-arrow {
    color: var(--muted);
    font-size: 20px;
  }

  .replacement-help {
    color: var(--muted);
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

  button.warning {
    border-color: #b77800;
    background: #b77800;
    color: #fff;
  }
</style>
