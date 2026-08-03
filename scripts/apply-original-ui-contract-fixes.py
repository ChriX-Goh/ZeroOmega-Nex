from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


icon_path = 'apps/extension/src/entrypoints/popup/OriginalPopupIcon.svelte'
evidence_path = 'docs/AUDIT_EVIDENCE_02M_POPUP_ICON_COMPATIBILITY.md'

replace_once(
    icon_path,
    """    {#if kind === 'direct'}
      <path d="M1.2 4.2h8.1M7.1 1.9l2.4 2.3-2.4 2.3M12.8 9.8H4.7M6.9 7.5 4.5 9.8l2.4 2.3" />
    {:else if kind === 'system'}
      <path d="M7 1.2v5.2" />
      <path d="M3.1 3.4a5 5 0 1 0 7.8 0" />
    {:else if kind === 'fixed' || kind === 'globe'}
      <circle cx="7" cy="7" r="5.2" />
      <path
        d="M1.8 7h10.4M7 1.8c1.6 1.4 2.5 3.2 2.5 5.2S8.6 10.8 7 12.2C5.4 10.8 4.5 9 4.5 7S5.4 3.2 7 1.8Z"
      />
    {:else if kind === 'switch'}
      <path d="M1.5 4h7.2l-1.8-1.8M8.7 4 6.9 5.8M12.5 10H5.3l1.8 1.8M5.3 10l1.8-1.8" />
    {:else if kind === 'wrench'}
      <path
        d="M8.3 2.1a3.1 3.1 0 0 0-3.8 3.8L1.3 9.1a1.5 1.5 0 0 0 2.1 2.1L6.6 8a3.1 3.1 0 0 0 3.8-3.8L8.8 5.8 7.1 4.1Z"
      />""",
    """    {#if kind === 'direct'}
      <path
        class="solid"
        d="M1 2.4h7V.8l4.4 3.4L8 7.6V6H1ZM13 8H6v-1.6L1.6 9.8 6 13.2v-1.6h7Z"
      />
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
      />""",
)

replace_once(
    icon_path,
    """  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.55;
    stroke-linecap: round;
    stroke-linejoin: round;
  }""",
    """  svg {
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
  }""",
)

evidence = Path(evidence_path).read_text()
marker = 'The final default-glyph detail slice replaces the remaining line-frame approximation.'
if marker not in evidence:
    evidence += """

## Solid glyph detail slice

Ordinary Head `49201d946f30d0f4f22c5ad2110f57cbfe7fa7f3` passed all six permanent gates. Artifact `8844485148` (`sha256:9541671988c4825891c82c6005f2674f3b026d5a926a15e4a3a4fa94edd44529`) proves:

- all four leading icon boxes match Original at x `13`, y `17/50/86/119`, 14px square;
- both trailing globe boxes match Original within `0.02px` horizontally and exactly vertically;
- the Options wrench box matches Original at x `13`, y `156`, 14px square;
- action rectangles, text baselines, divider, active outline and Options row remain exact;
- CI, Firefox, Chromium, native Inspect and every Toolbar specialist step pass without reruns.

The final default-glyph detail slice replaces the remaining line-frame approximation with clean-room solid transfer, retweet and wrench paths, a heavier power symbol, and a solid globe with transparent land cutouts. It does not change boxes, colors, labels or interaction behavior. A subsequent ordinary artifact remains required before this visual detail is closed.
"""
Path(evidence_path).write_text(evidence)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', icon_path, evidence_path],
    check=True,
)
