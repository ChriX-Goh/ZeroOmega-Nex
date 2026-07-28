from pathlib import Path

script = Path('scripts/capture-visual-evidence.mjs')
text = script.read_text()
old = """const sourceHead =
  process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
"""
new = """const sourceHead =
  process.env.ZEROOMEGA_SOURCE_HEAD ??
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
"""
if text.count(old) != 1:
    raise SystemExit(f'visual source Head anchor mismatch: {text.count(old)}')
script.write_text(text.replace(old, new))

workflow = Path('.github/workflows/m8-visual-evidence.yml')
text = workflow.read_text()
old_checkout = """      - name: Checkout
        uses: actions/checkout@v4

"""
new_checkout = """      - name: Checkout exact Head
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}

"""
if text.count(old_checkout) != 1:
    raise SystemExit(f'visual checkout anchor mismatch: {text.count(old_checkout)}')
text = text.replace(old_checkout, new_checkout)
old_capture = """      - name: Capture visual evidence
        shell: bash
        run: |
          set -o pipefail
          pnpm evidence:visual 2>&1 | tee m8-visual-evidence.log
"""
new_capture = """      - name: Capture visual evidence
        shell: bash
        env:
          ZEROOMEGA_SOURCE_HEAD: ${{ github.event.pull_request.head.sha || github.sha }}
        run: |
          set -o pipefail
          pnpm evidence:visual 2>&1 | tee m8-visual-evidence.log
"""
if text.count(old_capture) != 1:
    raise SystemExit(f'visual capture anchor mismatch: {text.count(old_capture)}')
workflow.write_text(text.replace(old_capture, new_capture))
