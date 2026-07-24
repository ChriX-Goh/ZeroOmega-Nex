# ZeroOmega Network Matching Boundaries

Status: source-derived inventory pinned to ZeroOmega `v3.5.0`.

## 1. Request host input

The legacy condition layer derives a request object from a URL parser and uses the parser's `hostname` value as `request.host`. The condition module does not perform an explicit, independent IDN normalization step before matching.

Consequences:

- Unicode-host behavior depends on the URL parser and browser/runtime representation supplied to the matcher;
- a Unicode pattern and its ASCII/Punycode equivalent must not be assumed interchangeable without target-browser vectors;
- Nex must normalize IDN through one explicit policy while preserving original text for migration reports;
- differential tests must cover both Unicode and ASCII forms on Firefox and Chromium.

The fixture corpus therefore carries the pair:

- `例子.测试`;
- `xn--fsqu00a.xn--0zwm56d`.

This records the compatibility question without prematurely claiming cross-browser equivalence.

## 2. IP parsing and normalization

The legacy parser:

1. removes surrounding square brackets when present;
2. tries IPv4 parsing;
3. falls back to IPv6 parsing;
4. returns no address when both fail;
5. normalizes valid addresses through the address library's corrected or canonical form.

`IpCondition` combines `ip` and `prefixLength` into a subnet expression. Invalid subnet input throws during condition analysis.

Matching rules:

- request hosts must themselves parse as IP literals;
- IPv4 and IPv6 families must match;
- subnet membership determines the result;
- prefix length zero represents every literal in that address family;
- a domain name must not trigger DNS resolution merely to satisfy an IP condition.

Nex requirements:

- validate IPv4 prefixes in `0..32`;
- validate IPv6 prefixes in `0..128`;
- preserve original spelling for reports but compare normalized addresses;
- never resolve domain names during IP-literal matching;
- keep IPv4 and IPv6 `/0` semantics distinct.

## 3. `<local>` behavior

The special Bypass pattern `<local>` matches:

- `127.0.0.1`;
- `::1`;
- any host containing no dot.

The final rule is broad: any IPv6 literal contains no dot and therefore satisfies the legacy test, not only loopback IPv6.

Nex must not silently reinterpret `<local>` as only RFC loopback addresses. It must either preserve this legacy behavior or offer a clearly named safer mode with a migration warning.

## 4. Bypass parsing order

The observed parser processes a Bypass pattern in this order:

1. handle `<local>`;
2. split an optional scheme at `://`;
3. try IP/CIDR parsing after splitting on `/`;
4. try the remaining server text as an IP literal, including bracketed IPv6;
5. when not already recognized as an IP, split the final colon as a possible port;
6. convert a leading dot into a wildcard form;
7. compile either a host matcher or, when a port exists, a full URL matcher.

This order creates compatibility-sensitive edge cases.

## 5. Scheme and port rules

When a Bypass pattern contains a port, the legacy implementation creates a URL regular expression rather than a host-only matcher.

Examples:

- `https://example.invalid:8443` requires the `https` scheme, exact host pattern, exact textual port, and a slash after the authority;
- `example.invalid:8443` accepts any scheme but still requires that exact port;
- an IPv6 literal needs brackets in URL form when combined with a port.

The parser stores the port as text and does not require it to be numeric before constructing the matcher. A value such as `https://example.invalid:not-a-port` is therefore accepted structurally but is effectively unusable for ordinary browser URLs.

Nex must validate numeric ports in `1..65535`. A nonnumeric or out-of-range Bypass port becomes a disabled migration item with an explicit warning rather than a silently retained never-match rule.

## 6. IPv6 and port ambiguity

A string such as `2001:db8::1:443` can be parsed as a valid unbracketed IPv6 literal. The legacy parser then treats the entire value as an address, not as address `2001:db8::1` plus port `443`.

The unambiguous URL-authority form is:

```text
[2001:db8::1]:443
```

Nex migration reports must identify unbracketed IPv6 values that appear intended to contain a port. They must not guess and rewrite them silently.

## 7. CIDR fallback behavior

For a pattern containing `/`, CIDR handling occurs only when:

- the part before `/` parses as an IP address; and
- the part after `/` begins with an integer accepted by `parseInt`.

A malformed value such as `192.0.2.0/not-a-prefix` does not become an IP condition. Processing continues and the complete text is eventually treated as a host-like wildcard expression, which cannot match a normal hostname containing no slash.

Nex must classify this as malformed CIDR and disable it with a precise migration warning. Reproducing an accidental never-match fallback is not useful compatibility.

## 8. Leading-dot host behavior

A non-IP Bypass server beginning with `.` is rewritten with a leading wildcard. Therefore `.example.invalid` carries suffix/subdomain intent rather than exact-host intent.

This behavior needs dedicated decision vectors for:

- `example.invalid`;
- `www.example.invalid`;
- deeper subdomains;
- unrelated suffixes.

## 9. Endpoint port validation

Legacy profile objects can carry endpoint `port` values directly. Some text-import helpers also use `parseInt` and fall back to port 80, but ordinary JSON backup import can contain arbitrary values.

Nex canonical endpoint validation requires:

- integer type;
- range `1..65535`;
- no implicit fallback from malformed input;
- separate reporting for a missing port versus an invalid port.

## 10. Fixture coverage

`fixtures/zeroomega-v2/network-edge-conditions.json` records:

- Unicode and ASCII/Punycode host patterns;
- IPv4 and IPv6 subnets;
- IPv4 and IPv6 prefix-zero cases;
- `<local>`;
- leading-dot host suffixes;
- scheme-plus-port Bypass;
- IPv4 and IPv6 CIDR Bypass;
- bracketed IPv6 literals;
- malformed CIDR fallback input;
- nonnumeric port input;
- unbracketed IPv6/port ambiguity.

The fixture is source-shape evidence. Behavioral route decisions are added separately so platform-dependent IDN handling is not accidentally declared exact.

## 11. Pinned source evidence

- `omega-pac/src/conditions.coffee` — request derivation, IP parsing, Bypass analysis, `<local>`, scheme/port handling, and `IpCondition` behavior.
- `omega-pac/src/profiles.coffee` — fixed-proxy matching and endpoint use.

No production matcher or importer is introduced in this research milestone.
