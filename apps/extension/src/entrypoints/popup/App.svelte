<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';

  const profiles = [
    { name: 'Auto Switch', color: '#8bc34a', active: true },
    { name: 'Proxy', color: '#64b5f6', active: false },
    { name: 'Direct', color: '#bdbdbd', active: false },
    { name: 'System Proxy', color: '#616161', active: false },
  ] as const;
</script>

<main class="popup-shell">
  <header class="popup-header">
    <div>
      <strong>{productIdentity.name}</strong>
      <span>{productIdentity.milestone}</span>
    </div>
    <button type="button" aria-label="Open settings" title="Settings">⚙</button>
  </header>

  <section aria-label="Profiles" class="profile-list">
    {#each profiles as profile}
      <button class:active={profile.active} type="button" disabled={!profile.active}>
        <span class="profile-color" style={`--profile-color: ${profile.color}`}></span>
        <span>{profile.name}</span>
        {#if profile.active}<span class="current">Current</span>{/if}
      </button>
    {/each}
  </section>

  <footer>Milestone 1 shell — no proxy behavior is enabled.</footer>
</main>
