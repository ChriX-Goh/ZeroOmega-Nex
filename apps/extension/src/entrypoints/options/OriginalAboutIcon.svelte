<script lang="ts">
  export let kind: 'comment' | 'download' | 'alert' | 'info' | 'privacy' | 'help';
</script>

<svg
  data-original-about-icon={kind}
  aria-hidden="true"
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if kind === 'comment'}
    <path d="M2 3h12v8H7l-3.5 2.5V11H2Z" />
  {:else if kind === 'download'}
    <path d="M8 2v7m-3-3 3 3 3-3M3 11v2h10v-2" />
  {:else if kind === 'alert'}
    <path d="M8 1.8 14 13H2Z" />
    <path d="M8 5.2v3.7M8 11.4h.01" />
  {:else if kind === 'info'}
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7v4M8 4.5h.01" />
  {:else if kind === 'privacy'}
    <path d="M1.8 8s2.2-3.5 6.2-3.5S14.2 8 14.2 8 12 11.5 8 11.5 1.8 8 1.8 8Z" />
    <path d="M4.3 4.2 11.7 11.8" />
  {:else}
    <circle cx="8" cy="8" r="6" />
    <path d="M6.4 6.2a1.8 1.8 0 1 1 2.7 1.6c-.8.4-1.1.9-1.1 1.7M8 11.8h.01" />
  {/if}
</svg>

<style>
  svg {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
  }
</style>
