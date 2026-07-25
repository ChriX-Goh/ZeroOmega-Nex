<script lang="ts">
  type ProfileIconKind =
    | 'direct'
    | 'system'
    | 'fixed'
    | 'switch'
    | 'rule-list'
    | 'pac'
    | 'auto-detect'
    | 'external';

  export let kind: ProfileIconKind;
  export let color = '#90a4ae';
  export let size = 20;
</script>

<span
  class="profile-type-icon"
  data-profile-kind={kind}
  style={`--profile-icon-color: ${color}; --profile-icon-size: ${size}px`}
  aria-hidden="true"
>
  <svg viewBox="0 0 24 24" focusable="false">
    {#if kind === 'direct'}
      <circle cx="12" cy="12" r="8.25" />
      <path
        d="M4.2 12h15.6M12 3.8c2.2 2.2 3.4 5 3.4 8.2S14.2 18 12 20.2C9.8 18 8.6 15.2 8.6 12S9.8 6 12 3.8Z"
      />
    {:else if kind === 'system'}
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.8" />
      <path d="M8 20h8M10 16v4M14 16v4" />
    {:else if kind === 'fixed'}
      <rect x="4" y="4" width="16" height="5" rx="1.4" />
      <rect x="4" y="11" width="16" height="5" rx="1.4" />
      <path d="M7 6.5h.01M7 13.5h.01M9.5 19.5h5" />
    {:else if kind === 'switch'}
      <path d="M5 6h7a4 4 0 0 1 4 4v8" />
      <path d="m13 15 3 3 3-3M5 18h3a4 4 0 0 0 4-4V8" />
      <path d="m9 9 3-3 3 3" />
    {:else if kind === 'rule-list'}
      <path d="M9 6h10M9 12h10M9 18h10" />
      <path d="m4.5 6 1 1 2-2M4.5 12l1 1 2-2M4.5 18l1 1 2-2" />
    {:else if kind === 'pac'}
      <path d="M7 3.8h7l4 4V20H7z" />
      <path d="M14 3.8V8h4M11 11l-2 2 2 2M14 11l2 2-2 2" />
    {:else if kind === 'auto-detect'}
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4" />
    {:else}
      <path d="M5 18V8l7-4 7 4v10" />
      <path d="M8 18v-5h8v5M3 20h18" />
    {/if}
  </svg>
</span>

<style>
  .profile-type-icon {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    width: var(--profile-icon-size);
    height: var(--profile-icon-size);
    color: var(--profile-icon-color);
  }

  svg {
    width: 100%;
    height: 100%;
    fill: color-mix(in srgb, currentColor 16%, transparent);
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
