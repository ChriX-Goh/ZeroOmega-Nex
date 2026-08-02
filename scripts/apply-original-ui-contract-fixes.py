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
style_path = 'apps/extension/src/entrypoints/options/original-compat.css'
icon_path = Path('apps/extension/src/entrypoints/options/OriginalAboutIcon.svelte')
locale_inventory_path = 'scripts/generate-locale-inventory.mjs'
ui_guard_path = 'scripts/validate-ui-compatibility.mjs'

replace_once(
    app_path,
    "  import OptionsNavIcon from './OptionsNavIcon.svelte';",
    "  import OptionsNavIcon from './OptionsNavIcon.svelte';\n  import OriginalAboutIcon from './OriginalAboutIcon.svelte';",
)

copy_replacements = {
    "privacy: 'ZeroOmega 不跟踪用户，也不会在网页中插入广告。',": "privacy: 'ZeroOmega 不跟踪用户，也不会在网页中插入广告。请参阅我们的',\n          privacyPolicy: '隐私政策',",
    "help: '使用 ZeroOmega 时遇到问题，请查阅常见问题或报告问题。',": "help: '还有其他问题？需要有关使用 ZeroOmega 的帮助？请参阅我们的',\n          faq: '常见问题',",
    "privacy: 'ZeroOmega 不追蹤使用者，也不會在網頁中插入廣告。',": "privacy: 'ZeroOmega 不追蹤使用者，也不會在網頁中插入廣告。請參閱我們的',\n            privacyPolicy: '隱私權政策',",
    "help: '使用 ZeroOmega 時遇到問題，請查閱常見問題或回報問題。',": "help: '還有其他問題？需要有關使用 ZeroOmega 的協助？請參閱我們的',\n            faq: '常見問題',",
    "privacy: 'ZeroOmega does not track you or insert ads into webpages.',": "privacy: 'ZeroOmega does not track you or insert ads into webpages. Please see our',\n            privacyPolicy: 'privacy policy',",
    "help: 'Need help with using ZeroOmega? See the FAQ or report an issue.',": "help: 'Other questions? Need help with using ZeroOmega? Please see our',\n            faq: 'FAQ',",
}
for old, new in copy_replacements.items():
    replace_once(app_path, old, new)

replace_once(
    app_path,
    """            rel="noreferrer">{originalCopy.reportIssues}</a
          >""",
    """            rel="noreferrer"
            ><OriginalAboutIcon kind="comment" />
            <span>{originalCopy.reportIssues}</span></a
          >""",
)
replace_once(
    app_path,
    """          <button type="button" onclick={saveErrorLog}>{originalCopy.saveErrorLog}</button>""",
    """          <button type="button" onclick={saveErrorLog}>
            <OriginalAboutIcon kind="download" />
            <span>{originalCopy.saveErrorLog}</span>
          </button>""",
)
replace_once(
    app_path,
    """          <button type="button" class="danger" onclick={() => void resetOptions()}>
            {originalCopy.resetOptions}
          </button>""",
    """          <button type="button" class="danger" onclick={() => void resetOptions()}>
            <OriginalAboutIcon kind="alert" />
            <span>{originalCopy.resetOptions}</span>
          </button>""",
)
replace_once(
    app_path,
    """        <div class="about-notices">
          <p>{originalCopy.noServices}</p>
          <p>{originalCopy.privacy}</p>
          <p>{originalCopy.help}</p>
        </div>""",
    """        <div class="about-notices">
          <p class="text-warning">
            <OriginalAboutIcon kind="info" />
            <span>{originalCopy.noServices}</span>
          </p>
          <p class="text-success">
            <OriginalAboutIcon kind="privacy" />
            <span
              >{originalCopy.privacy}
              <a href="https://github.com/FelisCatus/SwitchyOmega/wiki/Privacy#english"
                >{originalCopy.privacyPolicy}</a
              >.</span
            >
          </p>
          <p class="text-info">
            <OriginalAboutIcon kind="help" />
            <span
              >{originalCopy.help}
              <a href="https://github.com/FelisCatus/SwitchyOmega/wiki/FAQ"
                >{originalCopy.faq}</a
              >.</span
            >
          </p>
        </div>""",
)
replace_once(
    app_path,
    """        <footer class="about-license">
          <p>ZeroOmega</p>
          <p>Copyright 2012-2017 The SwitchyOmega Authors. All rights reserved.</p>
          <p>Copyright 2024-2025 The ZeroOmega Authors.</p>
          <p>
            ZeroOmega is free software licensed under GNU General Public License Version 3 or later.
          </p>
        </footer>""",
    """        <footer class="about-license">
          <p>ZeroOmega</p>
          <p>
            Copyright 2012-2017
            <a href="https://github.com/FelisCatus/SwitchyOmega/blob/master/AUTHORS"
              >The SwitchyOmega Authors</a
            >. All rights reserved.
          </p>
          <p>
            Copyright 2024-2025
            <a href="https://github.com/zero-peak/ZeroOmega/graphs/contributors"
              >The ZeroOmega Authors</a
            >.
          </p>
          <p>
            ZeroOmega is
            <a href="https://www.gnu.org/philosophy/free-sw.en.html">free software</a>
            licensed under
            <a href="https://www.gnu.org/licenses/gpl.html">GNU General Public License</a>
            Version 3 or later.
          </p>
          <p>
            ZeroOmega is made possible by the
            <a href="https://github.com/zero-peak/ZeroOmega">ZeroOmega</a>
            open source project and other
            <a href="https://github.com/FelisCatus/SwitchyOmega/blob/master/AUTHORS"
              >open source software</a
            >.
          </p>
        </footer>""",
)

if icon_path.exists():
    raise RuntimeError(f'{icon_path}: expected new file')
icon_path.write_text(
    """<script lang="ts">
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
"""
)

style = Path(style_path)
style_source = style.read_text()
marker = '/* Official About semantics and link geometry. */'
if marker in style_source:
    raise RuntimeError(f'{style_path}: About semantics marker already exists')
style.write_text(
    style_source
    + """

/* Official About semantics and link geometry. */
.about-actions a,
.about-actions button {
  gap: 5px;
}

.about-notices p {
  display: flex;
  gap: 5px;
  align-items: baseline;
}

.about-notices .text-warning {
  color: #8a6d3b;
}

.about-notices .text-success {
  color: #3c763d;
}

.about-notices .text-info {
  color: #31708f;
}

.about-notices a,
.about-license a {
  color: #337ab7;
  text-decoration: none;
}

.about-notices a:hover,
.about-notices a:focus-visible,
.about-license a:hover,
.about-license a:focus-visible {
  text-decoration: underline;
}
"""
)

replace_once(
    locale_inventory_path,
    """  'ZeroOmega is free software licensed under GNU General Public License Version 3 or later.',
]);""",
    """  'ZeroOmega is free software licensed under GNU General Public License Version 3 or later.',
  'Copyright 2012-2017',
  'The SwitchyOmega Authors',
  'All rights reserved.',
  'Copyright 2024-2025',
  'The ZeroOmega Authors',
  'ZeroOmega is',
  'free software',
  'licensed under',
  'GNU General Public License',
  'Version 3 or later.',
  'ZeroOmega is made possible by the',
  'open source project and other',
  'open source software',
]);""",
)

replace_once(
    ui_guard_path,
    """  [
    !advancedProfileOperations.includes('! Add AutoProxy rules here.'),
    'New Rule List profiles must not persist instructional text as rule data.',
  ],
];""",
    """  [
    !advancedProfileOperations.includes('! Add AutoProxy rules here.'),
    'New Rule List profiles must not persist instructional text as rule data.',
  ],
  [
    optionsApp.includes('<OriginalAboutIcon kind="comment" />') &&
      optionsApp.includes('<OriginalAboutIcon kind="download" />') &&
      optionsApp.includes('<OriginalAboutIcon kind="alert" />') &&
      optionsApp.includes('<OriginalAboutIcon kind="info" />') &&
      optionsApp.includes('<OriginalAboutIcon kind="privacy" />') &&
      optionsApp.includes('<OriginalAboutIcon kind="help" />') &&
      optionsApp.includes('https://github.com/FelisCatus/SwitchyOmega/wiki/Privacy#english') &&
      optionsApp.includes('https://github.com/FelisCatus/SwitchyOmega/wiki/FAQ') &&
      optionsApp.includes('https://github.com/FelisCatus/SwitchyOmega/blob/master/AUTHORS') &&
      optionsApp.includes('https://github.com/zero-peak/ZeroOmega/graphs/contributors') &&
      optionsApp.includes('https://www.gnu.org/philosophy/free-sw.en.html') &&
      optionsApp.includes('https://www.gnu.org/licenses/gpl.html') &&
      optionsApp.includes('ZeroOmega is made possible by the'),
    'The original About page must retain its action glyphs, status glyphs, official links, author attribution, license links, and open-source credit.',
  ],
];""",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        app_path,
        style_path,
        str(icon_path),
        locale_inventory_path,
        ui_guard_path,
    ],
    check=True,
)
subprocess.run(['pnpm', 'locale:inventory'], check=True)
