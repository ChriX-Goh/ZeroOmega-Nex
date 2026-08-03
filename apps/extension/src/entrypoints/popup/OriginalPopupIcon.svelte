<script lang="ts">
  type OriginalPopupIconKind =
    | 'direct'
    | 'system'
    | 'fixed'
    | 'switch'
    | 'rule-list'
    | 'pac'
    | 'virtual'
    | 'auto-detect'
    | 'external'
    | 'globe'
    | 'wrench';

  export let kind: OriginalPopupIconKind;
  export let color = '#337ab7';
  export let size = 14;
  export let position: 'leading' | 'trailing' | 'options' = 'leading';
</script>

<span
  class:trailing={position === 'trailing'}
  class:options={position === 'options'}
  class="original-popup-icon"
  data-original-popup-icon={kind}
  data-original-popup-icon-position={position}
  style={`--original-popup-icon-color: ${color}; --original-popup-icon-size: ${size}px`}
  aria-hidden="true"
>
  <svg viewBox="0 0 14 14" focusable="false">
    {#if kind === 'direct'}
      <path class="solid" d="M1 2.4h7V.8l4.4 3.4L8 7.6V6H1ZM13 8H6v-1.6L1.6 9.8 6 13.2v-1.6h7Z" />
    {:else if kind === 'system'}
      <path class="heavy" d="M7 1.1v5.4" />
      <path class="heavy" d="M3.1 3.5a5 5 0 1 0 7.8 0" />
    {:else if kind === 'fixed' || kind === 'globe'}
      <path
        class="solid globe"
        fill-rule="evenodd"
        d="M7 1.1a5.9 5.9 0 1 1 0 11.8A5.9 5.9 0 0 1 7 1.1ZM3.1 3.5c.7-.7 1.6-1.2 2.6-1.4l.2 1.4-.8.7.5 1.2-1.2.8-1.2-.5-.8.5a4.7 4.7 0 0 1 .7-2.7Zm4.4 3.1 1.3-.6 1 .5.2 1.1 1.2.8-.5 1.8-1.5.1-.8 1.5a4.7 4.7 0 0 1-2.1.2l.2-1.4-1-.8.4-1.5Z"
      />
    {:else if kind === 'switch'}
      <path
        class="solid"
        d="M1 2.1h7.4V.7l4.1 3.1-4.1 3.1V5.5H3.1v2H1ZM13 11.9H5.6v1.4L1.5 10.2l4.1-3.1v1.4h5.3v-2H13Z"
      />
    {:else if kind === 'wrench'}
      <path
        class="solid wrench"
        fill-rule="evenodd"
        d="M8.2.8a4 4 0 0 0-3.7 5.4L.9 9.8a1.9 1.9 0 0 0 2.7 2.7l3.6-3.6a4 4 0 0 0 5.3-4.7L9.9 6.8 7.2 4.1l2.6-2.6A4 4 0 0 0 8.2.8ZM2 10.4a.8.8 0 1 1 1.1 1.1A.8.8 0 0 1 2 10.4Z"
      />
    {:else if kind === 'rule-list'}
      <path d="M4.8 3h7M4.8 7h7M4.8 11h7M1.8 3h.1M1.8 7h.1M1.8 11h.1" />
    {:else if kind === 'pac'}
      <path d="M3 1.5h5l3 3V12.5H3ZM8 1.5v3h3M5 7l-1 1 1 1M8.5 7l1 1-1 1" />
    {:else if kind === 'virtual'}
      <path d="M2 4h6a3 3 0 0 1 3 3v4M8.8 8.8 11 11l2.2-2.2M2 10h3.5" />
    {:else if kind === 'auto-detect'}
      <circle cx="7" cy="7" r="5" /><circle cx="7" cy="7" r="1.8" />
      <path d="M7 1v1.2M7 11.8V13M1 7h1.2M11.8 7H13" />
    {:else}
      <path d="M2 11.5V5.2L7 2l5 3.2v6.3M4.5 11.5V8h5v3.5M1 12.5h12" />
    {/if}
  </svg>
</span>

<style>
  .original-popup-icon {
    display: inline-block;
    width: var(--original-popup-icon-size);
    height: var(--original-popup-icon-size);
    margin-right: 8px;
    color: var(--original-popup-icon-color);
    line-height: var(--original-popup-icon-size);
    vertical-align: -1px;
  }

  .original-popup-icon.trailing {
    margin-right: 0;
    margin-left: 6px;
  }

  .original-popup-icon.options {
    margin-right: 8px;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.55;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .solid {
    fill: currentColor;
    stroke: none;
  }

  .heavy {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.15;
  }
</style>
