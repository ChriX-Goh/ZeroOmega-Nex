from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


for path_name, label in (
    ("scripts/e2e-chromium-toolbar.mjs", "Chromium"),
    ("scripts/e2e-firefox.mjs", "Firefox"),
):
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    marker = """    },
  );
  const virtualReplaced =""" if label == "Chromium" else """      },
    );
    const virtualReplaced ="""
    insertion = """    },
  );
  virtualDraft.settings.quickSwitch.routes.push(
    { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
    { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
  );
  const virtualReplaced =""" if label == "Chromium" else """      },
    );
    virtualDraft.settings.quickSwitch.routes.push(
      { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
      { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
    );
    const virtualReplaced ="""
    text = replace_once(text, marker, insertion, f"{label} Virtual quick-switch routes")
    path.write_text(text, encoding="utf-8")
