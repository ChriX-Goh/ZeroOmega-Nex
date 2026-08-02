from pathlib import Path

# The historical atomic finalizer invokes this file after the active patch script.
# Default-profile fixtures were already corrected in the first original-entry slice.
required = [
    Path("packages/profile-workflow/src/defaults.ts"),
    Path("packages/profile-workflow/src/defaults.test.ts"),
]
missing = [str(path) for path in required if not path.is_file()]
if missing:
    raise RuntimeError(f"required default-contract files are missing: {missing}")
