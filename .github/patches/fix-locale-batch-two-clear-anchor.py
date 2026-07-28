from pathlib import Path

path = Path('.github/patches/apply-locale-batch-two-rule-lists.py')
text = path.read_text()
old = "    '>Clear</button>': \" >{uiText('ruleList.clear', locale)}</button>\",\n"
# The original component is formatted as `onclick={clearUrl}>Clear</button` followed by the closing `>` line.
# Replace the brittle one-line dictionary key with the actual stable structural anchor.
actual_old = "    '>Clear</button>': \">{uiText('ruleList.clear', locale)}</button>\",\n"
actual_new = "    'onclick={clearUrl}>Clear</button\\n        >': \"onclick={clearUrl}>{uiText('ruleList.clear', locale)}</button\\n        >\",\n"
if text.count(actual_old) != 1:
    raise SystemExit(f'expected one Rule List Clear replacement entry, found {text.count(actual_old)}')
path.write_text(text.replace(actual_old, actual_new, 1))
