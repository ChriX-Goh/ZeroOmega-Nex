from pathlib import Path

validation_path = Path('packages/profile-spec/src/validation.ts')
validation_text = validation_path.read_text()
validation_import_old = '''import Ajv2020 from 'ajv/dist/2020.js';
import type { ErrorObject } from 'ajv';

import { profileSpecJsonSchema } from './schema.js';

import type {
'''
validation_import_new = '''import type { ErrorObject } from 'ajv';

import generatedValidateStructure from './profile-spec-validator.generated.js';

import type {
'''
if validation_text.count(validation_import_old) != 1:
    raise SystemExit(
        f'validation import anchor count: {validation_text.count(validation_import_old)}'
    )
validation_text = validation_text.replace(
    validation_import_old,
    validation_import_new,
    1,
)
validation_compile_old = '''const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
  validateFormats: false,
});

const validateStructure = ajv.compile<ProfileSpec>(profileSpecJsonSchema);
'''
validation_compile_new = '''type ProfileSpecStructureValidator = ((input: unknown) => input is ProfileSpec) & {
  errors?: readonly ErrorObject[] | null;
};

const validateStructure = generatedValidateStructure as unknown as ProfileSpecStructureValidator;
'''
if validation_text.count(validation_compile_old) != 1:
    raise SystemExit(
        f'validation compiler anchor count: {validation_text.count(validation_compile_old)}'
    )
validation_text = validation_text.replace(
    validation_compile_old,
    validation_compile_new,
    1,
)
validation_path.write_text(validation_text)

activation_path = Path('apps/extension/src/lib/profile-workflow-activation.ts')
activation_text = activation_path.read_text()
activation_replacements = [
    (
        '  createVerifiedPacSnapshot,',
        '  createBrowserSafePacSnapshot,',
        'browser snapshot import',
    ),
    (
        'ReturnType<typeof createVerifiedPacSnapshot>',
        'ReturnType<typeof createBrowserSafePacSnapshot>',
        'browser snapshot failure type',
    ),
    (
        'const snapshot = await createVerifiedPacSnapshot(',
        'const snapshot = await createBrowserSafePacSnapshot(',
        'browser snapshot activation call',
    ),
]
for old, new, label in activation_replacements:
    count = activation_text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    activation_text = activation_text.replace(old, new, 1)
activation_path.write_text(activation_text)
