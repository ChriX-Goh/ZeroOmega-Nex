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
    <div>
      <strong>{productIdentity.name}</strong>
      <span>{productIdentity.milestone}</span>
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
        <button class:active={index === 0} type="button">
          <span class="profile-color" style={`--profile-color: ${profile.color}`}></span>
          <span>
            <strong>{profile.name}</strong>
            <small>{profile.type}</small>
          </span>
        </button>
      {/each}
    </nav>
    <button type="button" class="add-profile" disabled>＋ New profile</button>
    <div class="settings-links">
      <button type="button" disabled>Import / Export</button>
      <button type="button" disabled>Interface</button>
      <button type="button" disabled>About</button>
    </div>
  </aside>

  <main class="editor">
    <div class="editor-heading">
      <span class="large-profile-color"></span>
      <div>
        <h1>Proxy</h1>
        <p>Fixed Profile</p>
      </div>
    </div>

    <section class="card">
      <h2>Proxy servers</h2>
      <div class="form-grid">
        <label>
          Protocol
          <select disabled><option>HTTP</option></select>
        </label>
        <label>
          Server
          <input value="127.0.0.1" disabled />
        </label>
        <label>
          Port
          <input value="7890" disabled />
        </label>
      </div>
      <p class="notice">
        This is a layout shell only. Profile editing, importing, compilation, and browser proxy
        control begin in later gated milestones.
      </p>
    </section>

    <section class="card architecture-card">
      <h2>Architecture state</h2>
      <dl>
        <div><dt>Proxy permission</dt><dd>Not requested</dd></div>
        <div><dt>Global request listener</dt><dd>Absent</dd></div>
        <div><dt>Current stage</dt><dd>Tooling and UI shell</dd></div>
      </dl>
    </section>
  </main>
</div>
