<script lang="ts">
  export let kind:
    | 'interface'
    | 'general'
    | 'import'
    | 'theme'
    | 'builtin'
    | 'new'
    | 'apply'
    | 'discard';
</script>

<svg
  data-options-nav-icon={kind}
  aria-hidden="true"
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if kind === 'interface'}
    <path
      d="M10.3 2.2a3.5 3.5 0 0 0-4.2 4.4l-3.8 3.8a1.6 1.6 0 0 0 2.3 2.3l3.8-3.8a3.5 3.5 0 0 0 4.4-4.2l-2 2-1.7-.4-.4-1.7 1.6-2.4Z"
    />
  {:else if kind === 'general'}
    <circle cx="8" cy="8" r="2.25" />
    <path
      d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1"
    />
  {:else if kind === 'import'}
    <path d="M8 1.5v8m-3-3 3 3 3-3M3 11v2.5h10V11" />
  {:else if kind === 'theme'}
    <circle cx="8" cy="8" r="6" />
    <path d="M8 2a6 6 0 0 0 0 12Z" fill="currentColor" stroke="none" />
  {:else if kind === 'builtin'}
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12M8 2a9 9 0 0 1 0 12M8 2a9 9 0 0 0 0 12" />
  {:else if kind === 'new'}
    <path d="M8 2.5v11M2.5 8h11" />
  {:else if kind === 'apply'}
    <circle cx="8" cy="8" r="6" />
    <path d="m4.8 8.1 2.1 2.1 4.4-4.5" />
  {:else}
    <circle cx="8" cy="8" r="6" />
    <path d="m5.5 5.5 5 5m0-5-5 5" />
  {/if}
</svg>

<style>
  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
  }
</style>
