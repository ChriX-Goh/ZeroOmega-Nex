<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';

  const profiles = [
    { name: 'Proxy', type: 'Fixed Profile', color: '#64b5f6' },
    { name: 'Auto Switch', type: 'Switch Profile', color: '#8bc34a' },
    { name: 'Rule List', type: 'Rule List Profile', color: '#ffb74d' },
  ] as const;
</script>

<div class="app-shell">
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">Ω</span>
      <div>
        <strong>{productIdentity.name}</strong>
        <span>{productIdentity.milestone}</span>
      </div>
    </div>
    <div class="actions">
      <button type="button" disabled>Revert</button>
      <button type="button" class="primary" disabled>Apply changes</button>
    </div>
  </header>

  <aside class="sidebar">
    <div class="sidebar-title">Profiles</div>
    <nav aria-label="Profiles">
      {#each profiles as profile, index}
        <button class:active={index === 0} type="button" disabled={index !== 0}>
          <span class="profile-marker" style={`--profile-color: ${profile.color}`}></span>
          <span class="profile-copy">
            <strong>{profile.name}</strong>
            <small>{profile.type}</small>
          </span>
        </button>
      {/each}
    </nav>

    <button type="button" class="add-profile" disabled>
      <span aria-hidden="true">＋</span>
      <span>New profile</span>
    </button>

    <div class="settings-links" aria-label="Settings sections">
      <button type="button" disabled>General</button>
      <button type="button" disabled>Import / Export</button>
      <button type="button" disabled>Interface</button>
      <button type="button" disabled>About</button>
    </div>
  </aside>

  <main class="editor">
    <header class="editor-heading">
      <div class="profile-title">
        <span class="large-profile-marker"></span>
        <div>
          <h1>Proxy</h1>
          <p>Fixed Profile</p>
        </div>
      </div>
      <div class="profile-actions">
        <button type="button" disabled>Rename</button>
        <button type="button" class="danger" disabled>Delete</button>
      </div>
    </header>

    <section class="settings-section">
      <h2>Proxy servers</h2>
      <p class="section-help">
        Use one proxy for all protocols or configure each protocol separately.
      </p>
      <div class="proxy-table" role="group" aria-label="Proxy server shell">
        <div class="proxy-row proxy-headings" aria-hidden="true">
          <span>Protocol</span>
          <span>Server</span>
          <span>Port</span>
        </div>
        <div class="proxy-row">
          <select aria-label="Protocol" disabled><option>HTTP</option></select>
          <input aria-label="Server" value="127.0.0.1" disabled />
          <input aria-label="Port" value="7890" disabled />
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h2>Bypass list</h2>
      <p class="section-help">Hosts listed here connect directly instead of using this profile.</p>
      <textarea aria-label="Bypass list" rows="5" disabled
        >localhost
127.0.0.1
&lt;local&gt;</textarea
      >
    </section>

    <section class="settings-section shell-status">
      <h2>Milestone 1 status</h2>
      <p>
        This page is the interaction and layout shell. Profile editing, importing, policy
        compilation, and browser proxy control remain disabled until their gated milestones.
      </p>
      <dl>
        <div>
          <dt>Proxy permission</dt>
          <dd>Not requested</dd>
        </div>
        <div>
          <dt>Global request listener</dt>
          <dd>Absent</dd>
        </div>
      </dl>
    </section>
  </main>
</div>
