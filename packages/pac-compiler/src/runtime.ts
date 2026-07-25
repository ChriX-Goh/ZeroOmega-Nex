export const PAC_RUNTIME_SOURCE = String.raw`function zoNormHost(input) {
  var value = String(input).replace(/^\s+|\s+$/g, "");
  if (value.charAt(0) === "[" && value.charAt(value.length - 1) === "]") {
    value = value.slice(1, -1);
  }
  if (value.charAt(value.length - 1) === ".") value = value.slice(0, -1);
  return value.toLowerCase();
}
function zoSplit(pattern) {
  var input = String(pattern).split("|");
  var output = [];
  for (var i = 0; i < input.length; i += 1) {
    var value = input[i].replace(/^\s+|\s+$/g, "");
    if (value) output.push(value);
  }
  return output;
}
function zoEscapeRe(character) {
  return "\\^$.*+?()[]{}|".indexOf(character) !== -1 ? "\\" + character : character;
}
function zoWildOne(pattern, value) {
  var source = "^";
  for (var i = 0; i < pattern.length; i += 1) {
    var character = pattern.charAt(i);
    source += character === "*" ? ".*" : character === "?" ? "." : zoEscapeRe(character);
  }
  return new RegExp(source + "$", "i").test(value);
}
function zoWild(pattern, value) {
  var alternatives = zoSplit(pattern);
  for (var i = 0; i < alternatives.length; i += 1) {
    if (zoWildOne(alternatives[i], value)) return true;
  }
  return false;
}
function zoHost(pattern, host) {
  var normalizedHost = zoNormHost(host);
  var alternatives = zoSplit(pattern);
  for (var i = 0; i < alternatives.length; i += 1) {
    var value = zoNormHost(alternatives[i]);
    if (value === "*") return true;
    var prefix = value.indexOf("**.") === 0 ? 3 : value.indexOf("*.") === 0 ? 2 : value.indexOf(".") === 0 ? 1 : 0;
    if (prefix) {
      var suffix = value.slice(prefix);
      if (normalizedHost === suffix || normalizedHost.slice(-(suffix.length + 1)) === "." + suffix) return true;
      continue;
    }
    if (value.indexOf("*") !== -1 || value.indexOf("?") !== -1) {
      if (zoWildOne(value, normalizedHost)) return true;
      continue;
    }
    if (normalizedHost === value) return true;
  }
  return false;
}
function zoRe(pattern, flags, value) {
  try {
    return new RegExp(pattern, flags || "").test(value);
  } catch (error) {
    return false;
  }
}
function zoScheme(url) {
  var colon = String(url).indexOf(":");
  return colon === -1 ? "" : String(url).slice(0, colon).toLowerCase();
}
function zoPort(url, scheme) {
  var match = /^[a-z][a-z0-9+.-]*:\/\/(?:\[[^\]]+\]|[^\/:]+)(?::(\d+))?/i.exec(String(url));
  if (match && match[1]) return Number(match[1]);
  return scheme === "http" || scheme === "ws" ? 80 : scheme === "https" || scheme === "wss" ? 443 : scheme === "ftp" ? 21 : undefined;
}
function zoIpText(input) {
  var value = String(input).replace(/^\s+|\s+$/g, "");
  if (value.charAt(0) === "[" && value.charAt(value.length - 1) === "]") value = value.slice(1, -1);
  var zone = value.indexOf("%");
  return zone === -1 ? value : value.slice(0, zone);
}
function zoIpv4Parts(input) {
  var parts = input.split(".");
  if (parts.length !== 4) return null;
  var values = [];
  for (var i = 0; i < parts.length; i += 1) {
    if (!/^\d{1,3}$/.test(parts[i])) return null;
    var value = Number(parts[i]);
    if (value < 0 || value > 255 || Math.floor(value) !== value) return null;
    values.push(value);
  }
  return values;
}
function zoIpv6Segment(segment) {
  if (segment.indexOf(".") !== -1) {
    var ipv4 = zoIpv4Parts(segment);
    return ipv4 ? [(ipv4[0] << 8) | ipv4[1], (ipv4[2] << 8) | ipv4[3]] : null;
  }
  if (!/^[0-9a-f]{1,4}$/i.test(segment)) return null;
  return [parseInt(segment, 16)];
}
function zoIpv6Side(input) {
  if (!input) return [];
  var segments = input.split(":");
  var values = [];
  for (var i = 0; i < segments.length; i += 1) {
    if (!segments[i]) return null;
    var parsed = zoIpv6Segment(segments[i]);
    if (!parsed) return null;
    for (var j = 0; j < parsed.length; j += 1) values.push(parsed[j]);
  }
  return values;
}
function zoIpBytes(input) {
  var value = zoIpText(input);
  if (!value) return null;
  if (value.indexOf(":") === -1) {
    var ipv4 = zoIpv4Parts(value);
    return ipv4 ? { family: 4, bytes: ipv4 } : null;
  }
  var pieces = value.split("::");
  if (pieces.length > 2) return null;
  var left = zoIpv6Side(pieces[0] || "");
  var right = zoIpv6Side(pieces[1] || "");
  if (!left || !right) return null;
  var groups = [];
  var i;
  if (pieces.length === 1) {
    if (left.length !== 8) return null;
    groups = left;
  } else {
    var omitted = 8 - left.length - right.length;
    if (omitted < 1) return null;
    for (i = 0; i < left.length; i += 1) groups.push(left[i]);
    for (i = 0; i < omitted; i += 1) groups.push(0);
    for (i = 0; i < right.length; i += 1) groups.push(right[i]);
  }
  if (groups.length !== 8) return null;
  var bytes = [];
  for (i = 0; i < groups.length; i += 1) {
    bytes.push((groups[i] >> 8) & 255, groups[i] & 255);
  }
  return { family: 6, bytes: bytes };
}
function zoIsIp(input) {
  return zoIpBytes(input) !== null;
}
function zoIp(candidate, network, prefix) {
  var left = zoIpBytes(candidate);
  var right = zoIpBytes(network);
  if (!left || !right || left.family !== right.family) return false;
  var bits = left.family === 4 ? 32 : 128;
  if (prefix < 0 || prefix > bits || Math.floor(prefix) !== prefix) return false;
  var full = Math.floor(prefix / 8);
  var remainder = prefix % 8;
  for (var i = 0; i < full; i += 1) {
    if (left.bytes[i] !== right.bytes[i]) return false;
  }
  if (!remainder) return true;
  var mask = (255 << (8 - remainder)) & 255;
  return (left.bytes[full] & mask) === (right.bytes[full] & mask);
}
function zoParseHostPort(input) {
  if (input.charAt(0) === "[") {
    var close = input.indexOf("]");
    if (close !== -1) {
      var remainder = input.slice(close + 1);
      return { host: input.slice(0, close + 1), port: /^:\d+$/.test(remainder) ? Number(remainder.slice(1)) : undefined };
    }
  }
  if (zoIsIp(input)) return { host: input };
  var colon = input.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(input.slice(colon + 1))) {
    return { host: input.slice(0, colon), port: Number(input.slice(colon + 1)) };
  }
  return { host: input };
}
function zoBypassOne(pattern, url, host, scheme, port) {
  var value = String(pattern).replace(/^\s+|\s+$/g, "");
  var normalizedHost = zoNormHost(host);
  if (value.toLowerCase() === "<local>") {
    return normalizedHost.indexOf(".") === -1 && normalizedHost.indexOf(":") === -1 && !zoIsIp(normalizedHost);
  }
  var schemeMatch = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(value);
  var target = zoParseHostPort(schemeMatch ? schemeMatch[2] : value);
  if (schemeMatch && schemeMatch[1].toLowerCase() !== scheme) return false;
  if (target.port !== undefined && target.port !== port) return false;
  var hostPattern = zoNormHost(target.host);
  var slash = hostPattern.lastIndexOf("/");
  if (slash > 0 && /^\d{1,3}$/.test(hostPattern.slice(slash + 1)) && zoIsIp(hostPattern.slice(0, slash))) {
    return zoIp(normalizedHost, hostPattern.slice(0, slash), Number(hostPattern.slice(slash + 1)));
  }
  if (zoIsIp(hostPattern)) return hostPattern === normalizedHost;
  return zoHost(hostPattern, normalizedHost);
}
function zoBypass(pattern, url, host, scheme, port) {
  var alternatives = zoSplit(pattern);
  for (var i = 0; i < alternatives.length; i += 1) {
    if (zoBypassOne(alternatives[i], url, host, scheme, port)) return true;
  }
  return false;
}
function zoLevels(host) {
  var value = zoNormHost(host);
  if (!value) return 0;
  return value.split(".").length - 1;
}
function zoWeekday(days) {
  var current = new Date().getDay();
  for (var i = 0; i < days.length; i += 1) if (days[i] === current) return true;
  return false;
}
function zoHour(start, end) {
  var current = new Date().getHours();
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}`;
