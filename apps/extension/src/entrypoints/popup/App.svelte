<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import { browser } from 'wxt/browser';

  const profiles = [
    { name: 'Auto Switch', color: '#8bc34a', active: true },
    { name: 'Proxy', color: '#64b5f6', active: false },
    { name: 'Direct', color: '#bdbdbd', active: false },
    { name: 'System Proxy', color: '#616161', active: false },
  ] as const;

  let openingSettings = false;
  let settingsError = '';

  async function openOptions(): Promise<void> {
    if (openingSettings) return;

    openingSettings = true;
    settingsError = '';

    try {
      await browser.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Unable to open the ZeroOmega Nex options page.', error);
      settingsError = 'Unable to open Options.';
      openingSettings = false;
    }
  }
</script>

<main class="popup-shell" aria-label="ZeroOmega Nex profile switcher">
  <section aria-label="Profiles" class="profile-list">
    {#each profiles as profile}
      <button
        class:active={profile.active}
        type="button"
        disabled
        title={profile.active
          ? `${profile.name} is active`
          : 'Profile switching is not enabled yet'}
      >
        <span class="profile-marker" style={`--profile-color: ${profile.color}`}></span>
        <span class="profile-name">{profile.name}</span>
        {#if profile.active}
          <svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">
            <path d="m3.2 8.3 2.8 2.8 6.8-7" />
          </svg>
        {/if}
      </button>
    {/each}
  </section>

  <footer class="popup-footer">
    <button
      class="settings-button"
      type="button"
      onclick={openOptions}
      disabled={openingSettings}
      aria-label="Open ZeroOmega Nex options"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M8.8 2.2h2.4l.5 1.8c.5.2 1 .5 1.4.8l1.8-.5 1.2 2.1-1.3 1.3c.1.5.1 1.1 0 1.6l1.3 1.3-1.2 2.1-1.8-.5c-.4.4-.9.6-1.4.8l-.5 1.8H8.8L8.3 13a5 5 0 0 1-1.4-.8l-1.8.5-1.2-2.1 1.3-1.3a6 6 0 0 1 0-1.6L3.9 6.4l1.2-2.1 1.8.5c.4-.3.9-.6 1.4-.8l.5-1.8Z"
        />
        <circle cx="10" cy="8.5" r="2.2" />
      </svg>
      <span>{openingSettings ? 'Opening…' : 'Options'}</span>
    </button>
    <span class="product-name">{productIdentity.name}</span>
  </footer>

  {#if settingsError}
    <p class="settings-error" role="alert">{settingsError}</p>
  {/if}
</main>
