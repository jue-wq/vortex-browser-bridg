export const DEFAULT_FILTER_RULES = [
  "||doubleclick.net^",
  "||googlesyndication.com^",
  "||googleadservices.com^",
  "||adservice.google.com^",
  "||amazon-adsystem.com^",
  "||taboola.com^",
  "||outbrain.com^",
  "||scorecardresearch.com^",
  "||adnxs.com^",
  "||criteo.com^",
  "||hotjar.com^",
  "||google-analytics.com^",
  "||connect.facebook.net/tr^",
  "||ads-twitter.com^",
  "||bat.bing.com^",
  "##.adsbygoogle",
  "##.advertisement",
  "##.ad-banner",
  "##[class*='sponsor-ad']"
] as const;

type ResourceType = "main_frame" | "sub_frame" | "stylesheet" | "script" | "image" | "font" | "object" | "xmlhttprequest" | "ping" | "media" | "websocket" | "other";
interface NetworkRule {
  raw: string;
  pattern: string;
  host?: string;
  path?: string;
  exception: boolean;
  important: boolean;
  thirdParty?: boolean;
  types: ResourceType[];
  domains: string[];
  excludedDomains: string[];
}
interface CosmeticRule { hosts: string[]; excludedHosts: string[]; selectors: string[]; exception: boolean; }
export interface RequestContext { url: string; initiator?: string; type?: string; }
export interface DnrRule {
  id: number;
  priority: number;
  action: { type: "block" | "allow" };
  condition: { urlFilter: string; resourceTypes?: ResourceType[]; initiatorDomains?: string[]; excludedInitiatorDomains?: string[]; domainType?: "thirdParty" | "firstParty" };
}

const RESOURCE_TYPES: Record<string, ResourceType> = {
  document: "main_frame", subdocument: "sub_frame", stylesheet: "stylesheet", script: "script",
  image: "image", font: "font", object: "object", xmlhttprequest: "xmlhttprequest",
  ping: "ping", media: "media", websocket: "websocket", other: "other"
};

function domainMatches(host: string, ruleHost: string): boolean {
  return host === ruleHost || host.endsWith(`.${ruleHost}`);
}
function cleanSelector(selector: string): string | null {
  const value = selector.trim();
  if (!value || value.length > 500 || /[{}<>;]/.test(value)) return null;
  return value;
}
function parseNetworkRule(line: string): NetworkRule | null {
  let value = line.trim();
  if (!value || value.startsWith("!") || value.startsWith("[") || value.startsWith("#")) return null;
  const exception = value.startsWith("@@");
  if (exception) value = value.slice(2);
  const optionIndex = value.indexOf("$");
  const pattern = (optionIndex < 0 ? value : value.slice(0, optionIndex)).trim();
  if (!pattern || !pattern.startsWith("||")) return null;
  const domainAndPath = pattern.slice(2).replace(/\^.*$/, "");
  const slashIndex = domainAndPath.indexOf("/");
  const host = (slashIndex < 0 ? domainAndPath : domainAndPath.slice(0, slashIndex)).toLowerCase();
  const path = slashIndex < 0 ? undefined : domainAndPath.slice(slashIndex);
  if (!host || !/^[a-z0-9.-]+$/.test(host)) return null;
  const tokens = optionIndex < 0 ? [] : value.slice(optionIndex + 1).split(",");
  const types: ResourceType[] = [];
  const domains: string[] = [];
  const excludedDomains: string[] = [];
  let thirdParty: boolean | undefined;
  for (const token of tokens) {
    if (token === "third-party") thirdParty = true;
    else if (token === "~third-party") thirdParty = false;
    else if (token.startsWith("domain=")) {
      for (const domainToken of token.slice(7).split("|")) {
        if (domainToken.startsWith("~")) excludedDomains.push(domainToken.slice(1).toLowerCase());
        else if (domainToken) domains.push(domainToken.toLowerCase());
      }
    } else if (RESOURCE_TYPES[token]) types.push(RESOURCE_TYPES[token]!);
  }
  return {raw: line, pattern, host, ...(path ? {path} : {}), exception, important: tokens.includes("important"), thirdParty, types, domains, excludedDomains};
}
function parseCosmeticRule(line: string): CosmeticRule | null {
  const marker = line.includes("#@#") ? "#@#" : "##";
  const index = line.indexOf(marker);
  if (index < 0) return null;
  const hostPart = line.slice(0, index);
  const selectorPart = line.slice(index + marker.length);
  const selectors = selectorPart.split(",").map(cleanSelector).filter((item): item is string => item !== null);
  if (!selectors.length) return null;
  const hosts: string[] = [];
  const excludedHosts: string[] = [];
  for (const item of hostPart.split(",")) {
    if (item.startsWith("~")) excludedHosts.push(item.slice(1).toLowerCase());
    else if (item) hosts.push(item.toLowerCase());
  }
  return {hosts, excludedHosts, selectors, exception: marker === "#@#"};
}

export class FilterEngine {
  private networkRules: NetworkRule[] = [];
  private cosmeticRules: CosmeticRule[] = [];
  constructor(lines: readonly string[] = DEFAULT_FILTER_RULES) { this.replace(lines); }

  replace(lines: readonly string[]): void {
    this.networkRules = [];
    this.cosmeticRules = [];
    for (const line of lines) {
      const network = parseNetworkRule(line);
      if (network) this.networkRules.push(network);
      else {
        const cosmetic = parseCosmeticRule(line);
        if (cosmetic) this.cosmeticRules.push(cosmetic);
      }
    }
  }

  shouldBlock(context: RequestContext): boolean {
    let target: URL;
    try { target = new URL(context.url); } catch { return false; }
    if (!["http:", "https:"].includes(target.protocol)) return false;
    let sourceHost = "";
    try { sourceHost = context.initiator ? new URL(context.initiator).hostname.toLowerCase() : ""; } catch { /* no initiator */ }
    const matching = this.networkRules.filter(rule => {
      if (!rule.host || !domainMatches(target.hostname.toLowerCase(), rule.host!)) return false;
      if (rule.path && !target.pathname.startsWith(rule.path)) return false;
      if (rule.types.length && context.type && !rule.types.includes(context.type as ResourceType)) return false;
      if (rule.types.length && !context.type) return false;
      if (rule.thirdParty !== undefined && sourceHost && (sourceHost === target.hostname) === rule.thirdParty) return false;
      if (rule.domains.length && (!sourceHost || !rule.domains.some(domain => domainMatches(sourceHost, domain)))) return false;
      if (rule.excludedDomains.some(domain => sourceHost && domainMatches(sourceHost, domain))) return false;
      return true;
    });
    if (matching.some(rule => rule.exception && rule.important)) return false;
    if (matching.some(rule => !rule.exception)) return true;
    return false;
  }

  getCosmeticSelectors(hostname: string): string[] {
    const host = hostname.toLowerCase();
    const candidates = new Set<string>();
    const exceptions = new Set<string>();
    for (const rule of this.cosmeticRules) {
      const matches = (!rule.hosts.length || rule.hosts.some(item => domainMatches(host, item))) &&
        !rule.excludedHosts.some(item => domainMatches(host, item));
      if (!matches) continue;
      for (const selector of rule.selectors) (rule.exception ? exceptions : candidates).add(selector);
    }
    return [...candidates].filter(selector => !exceptions.has(selector));
  }

  toDnrRules(): DnrRule[] {
    return this.networkRules.flatMap((rule, index) => {
      if (!rule.host) return [];
      return [{
        id: index + 1,
        priority: rule.important ? 3 : rule.exception ? 2 : 1,
        action: {type: rule.exception ? "allow" : "block"},
        condition: {
          urlFilter: rule.pattern,
          ...(rule.types.length ? {resourceTypes: rule.types} : {}),
          ...(rule.domains.length ? {initiatorDomains: rule.domains} : {}),
          ...(rule.excludedDomains.length ? {excludedInitiatorDomains: rule.excludedDomains} : {}),
          ...(rule.thirdParty === undefined ? {} : {domainType: rule.thirdParty ? "thirdParty" : "firstParty"})
        }
      }];
    });
  }
}
