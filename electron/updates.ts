import type { UpdateCheckResult } from "../src/shared/desktop-api.js";

export const githubReleaseUrl = "https://github.com/mik-myp/norafold/releases/latest";
const githubLatestReleaseApi = "https://api.github.com/repos/mik-myp/norafold/releases/latest";

type Version = readonly [major: number, minor: number, patch: number];
type ReleaseFetcher = (input: string, init?: RequestInit) => Promise<Response>;

function parseVersion(version: string): Version | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    return undefined;
  }

  const numbers: Version = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (numbers.some((number) => !Number.isSafeInteger(number))) {
    return undefined;
  }

  return numbers;
}

function compareVersions(left: Version, right: Version) {
  for (const index of [0, 1, 2] as const) {
    if (left[index] !== right[index]) {
      return left[index] > right[index] ? 1 : -1;
    }
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getLatestVersion(value: unknown) {
  if (!isRecord(value) || typeof value.tag_name !== "string") {
    return undefined;
  }

  const version = value.tag_name.replace(/^v/, "");
  return parseVersion(version) ? version : undefined;
}

export async function checkForUpdates(
  currentVersion: string,
  fetcher: ReleaseFetcher = fetch,
): Promise<UpdateCheckResult> {
  const current = parseVersion(currentVersion);
  if (!current) {
    return { status: "error", code: "invalid-current-version" };
  }

  let response: Response;
  try {
    response = await fetcher(githubLatestReleaseApi, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "norafold",
      },
    });
  } catch {
    return { status: "error", code: "network" };
  }

  if (response.status === 403 || response.status === 429) {
    return { status: "error", code: "rate-limited" };
  }

  if (!response.ok) {
    return { status: "error", code: "network" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "error", code: "invalid-response" };
  }

  const latestVersion = getLatestVersion(payload);
  if (!latestVersion) {
    return { status: "error", code: "invalid-response" };
  }

  const latest = parseVersion(latestVersion);
  if (!latest || compareVersions(latest, current) <= 0) {
    return { status: "up-to-date", currentVersion };
  }

  return { status: "available", currentVersion, latestVersion };
}
