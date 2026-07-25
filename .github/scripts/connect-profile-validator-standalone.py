from pathlib import Path

path = Path('packages/profile-spec/src/validation.ts')
text = path.read_text()
old = '''import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';

import { profileSpecJsonSchema } from './schema.js';

import type {
'''
new = '''import type { ErrorObject } from 'ajv';

import generatedValidateStructure from './profile-spec-validator.generated.js';

import type {
'''
if text.count(old) != 1:
    raise SystemExit(f'validation import anchor count: {text.count(old)}')
text = text.replace(old, new, 1)
old_compile = '''const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
  validateFormats: false,
});

const validateStructure = ajv.compile<ProfileSpec>(profileSpecJsonSchema);
'''
new_compile = '''type ProfileSpecStructureValidator = ((input: unknown) => input is ProfileSpec) & {
  errors?: readonly ErrorObject[] | null;
};

const validateStructure = generatedValidateStructure as unknown as ProfileSpecStructureValidator;
'''
if text.count(old_compile) != 1:
    raise SystemExit(f'validation compiler anchor count: {text.count(old_compile)}')
text = text.replace(old_compile, new_compile, 1)
path.write_text(text)
