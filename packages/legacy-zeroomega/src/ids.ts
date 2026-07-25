const encoder = new TextEncoder();

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (const byte of encoder.encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function slug(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return normalized || 'item';
}

export function legacyStableId(namespace: string, ...parts: readonly string[]): string {
  const source = parts.join('\u001f');
  return `${namespace}-${slug(parts[0] ?? namespace)}-${fnv1a(`${namespace}\u001e${source}`)}`;
}

export function legacySecretRef(kind: string, sourcePath: string): string {
  return `secret-${slug(kind)}-${fnv1a(`${kind}\u001e${sourcePath}`)}`;
}
