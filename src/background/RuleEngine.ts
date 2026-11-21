export interface InterceptionSettings {
  enabled: boolean;
  minSizeBytes: number;
  excludedDomains: string[];
  allowedDomains: string[];
  incognitoAllowed: boolean;
  bypassPressed: boolean;
  includedMimeTypes: string[];
  includedExtensions: string[];
}
export interface DownloadCandidate {
  url: string;
  filename?: string;
  mimeType?: string;
  totalBytes?: number;
  incognito?: boolean;
}
export type RuleDecision = {capture: true; reason: "matched"} | {capture: false; reason: string};

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^\\.+/, "").replace(/\\.+$/, "");
}
function matchesDomain(host: string, configured: string): boolean {
  const domain = normalizeDomain(configured);
  return domain.length > 0 && (host === domain || host.endsWith(`.${domain}`));
}

export function decideCapture(candidate: DownloadCandidate, settings: InterceptionSettings): RuleDecision {
  if (!settings.enabled) return {capture: false, reason: "disabled"};
  if (candidate.incognito && !settings.incognitoAllowed) return {capture: false, reason: "incognito"};
  if (settings.bypassPressed) return {capture: false, reason: "bypass"};
  let parsed: URL;
  try { parsed = new URL(candidate.url); }
  catch { return {capture: false, reason: "invalid-url"}; }
  if (!["http:", "https:"].includes(parsed.protocol)) return {capture: false, reason: "scheme"};
  const host = parsed.hostname.toLowerCase().replace(/\\.+$/, "");
  if (settings.excludedDomains.some(domain => matchesDomain(host, domain))) return {capture: false, reason: "excluded-domain"};
  if (settings.allowedDomains.length && !settings.allowedDomains.some(domain => matchesDomain(host, domain))) return {capture: false, reason: "not-allowed-domain"};
  if (candidate.totalBytes !== undefined && candidate.totalBytes >= 0 && candidate.totalBytes < settings.minSizeBytes) return {capture: false, reason: "below-size"};
  const path = (candidate.filename ?? parsed.pathname).split(/[?#]/, 1)[0] ?? "";
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const mime = (candidate.mimeType ?? "").split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const matches = settings.includedExtensions.some(value => value.trim().toLowerCase().replace(/^\\./, "") === extension) || settings.includedMimeTypes.some(type => mime.startsWith(type.trim().toLowerCase()));
  if ((settings.includedExtensions.length || settings.includedMimeTypes.length) && !matches) return {capture: false, reason: "type-not-included"};
  return {capture: true, reason: "matched"};
}
export const defaultInterceptionSettings: InterceptionSettings = {
  enabled: true, minSizeBytes: 0, excludedDomains: [], allowedDomains: [],
  incognitoAllowed: false, bypassPressed: false, includedMimeTypes: [], includedExtensions: []
};
