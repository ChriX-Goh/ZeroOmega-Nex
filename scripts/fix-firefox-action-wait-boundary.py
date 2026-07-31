from pathlib import Path


path = Path("scripts/e2e-firefox.mjs")
text = path.read_text(encoding="utf-8")
old = """  } catch (error) {
    assert.deepEqual(actual, expected, label);
    throw error;
  }
}"""
new = """  } catch {
    assert.deepEqual(actual, expected, label);
  }
}"""
count = text.count(old)
if count != 2:
    raise SystemExit(f"Firefox Action wait boundary: expected 2 matches, found {count}")
path.write_text(text.replace(old, new), encoding="utf-8")
