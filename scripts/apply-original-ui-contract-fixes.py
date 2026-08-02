import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


app_path = 'apps/extension/src/entrypoints/options/App.svelte'
compat_path = 'apps/extension/src/entrypoints/options/original-compat.css'
icon_path = Path('apps/extension/src/entrypoints/options/OptionsNavIcon.svelte')

replace_once(
    app_path,
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';",
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import OptionsNavIcon from './OptionsNavIcon.svelte';",
)

for label, kind in [
    ("uiText('options.nav.interface', locale)", 'interface'),
    ("uiText('options.nav.general', locale)", 'general'),
    ("uiText('legacy.pageTitle', locale)", 'import'),
    ("uiText('options.nav.theme', locale)", 'theme'),
    ("uiText('options.nav.newProfile', locale)", 'new'),
    ("uiText('options.actions.discard', locale)", 'discard'),
]:
    replace_once(
        app_path,
        f'          <span>{{{label}}}</span>',
        f'          <OptionsNavIcon kind="{kind}" />\n          <span>{{{label}}}</span>',
    )

replace_once(
    app_path,
    """          <span class="builtin-marker" aria-hidden="true">◎</span><span
            >{uiText('options.nav.builtIn', locale)}</span
          >""",
    """          <OptionsNavIcon kind="builtin" />
          <span>{uiText('options.nav.builtIn', locale)}</span>""",
)
replace_once(
    app_path,
    "            <ProfileIcon kind={profile.kind} color={profile.color ?? '#90a4ae'} size={22} />",
    "            <ProfileIcon kind={profile.kind} color={profile.color ?? '#90a4ae'} size={16} />",
)
replace_once(
    app_path,
    """          <span>{uiText(saving ? 'options.actions.working' : 'options.actions.apply', locale)}</span
          >""",
    """          <OptionsNavIcon kind="apply" />
          <span>{uiText(saving ? 'options.actions.working' : 'options.actions.apply', locale)}</span
          >""",
)

if icon_path.exists():
    raise RuntimeError(f'{icon_path}: expected new file')
icon_path.write_text(
    """<script lang="ts">
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
    <path d="M10.3 2.2a3.5 3.5 0 0 0-4.2 4.4l-3.8 3.8a1.6 1.6 0 0 0 2.3 2.3l3.8-3.8a3.5 3.5 0 0 0 4.4-4.2l-2 2-1.7-.4-.4-1.7 1.6-2.4Z" />
  {:else if kind === 'general'}
    <circle cx="8" cy="8" r="2.25" />
    <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
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
"""
)

compat = Path(compat_path)
compat_source = compat.read_text()
marker = '/* Paired official Options geometry — desktop baseline. */'
if marker in compat_source:
    raise RuntimeError(f'{compat_path}: geometry marker already exists')
compat.write_text(
    compat_source
    + """

/* Paired official Options geometry — desktop baseline. */
.about-navigation {
  display: none;
}

@media (min-width: 761px) {
  .app-shell {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .side-brand {
    padding: 18px 0 10px 30px;
  }

  .side-navigation {
    padding: 0 0 24px 30px;
  }

  .nav-group h2 {
    margin: 10px 0 8px;
    padding: 7px 0 5px;
  }

  .nav-group > button {
    grid-template-columns: 16px minmax(0, 1fr);
    gap: 4px;
    min-height: 36px;
    padding: 7px 14px;
  }

  .nav-group > button > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profiles-nav {
    flex: 0 0 auto;
  }

  .actions {
    margin-top: 0;
  }

  .editor {
    padding: 18px 25px 48px;
  }

  .editor-heading {
    margin-bottom: 22px;
    padding-bottom: 8px;
  }

  .editor-heading h1 {
    margin: 0 0 6px;
  }

  .original-about-page {
    max-width: none;
  }

  .about-product {
    margin: 16px 0 22px;
  }

  .about-license {
    margin-top: 118px;
  }
}
"""
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        app_path,
        compat_path,
        str(icon_path),
    ],
    check=True,
)
