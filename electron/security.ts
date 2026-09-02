import path from "node:path";

export const appScheme = "app";
export const appHost = "norafold";
export const appOrigin = `${appScheme}://${appHost}`;

type RendererRequestResult =
  | { allowed: true; filePath: string }
  | { allowed: false; status: 400 | 403 };

export function resolveRendererRequest(
  rendererRoot: string,
  requestUrl: string,
  method: string,
): RendererRequestResult {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(requestUrl);
  } catch {
    return { allowed: false, status: 400 };
  }

  if (
    parsedUrl.protocol !== `${appScheme}:` ||
    parsedUrl.host !== appHost ||
    (method !== "GET" && method !== "HEAD")
  ) {
    return { allowed: false, status: 403 };
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch {
    return { allowed: false, status: 400 };
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(rendererRoot, relativePath);
  const pathFromRoot = path.relative(rendererRoot, filePath);

  if (
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(pathFromRoot)
  ) {
    return { allowed: false, status: 403 };
  }

  return { allowed: true, filePath };
}

export function isTrustedNavigation(url: string, developmentServerUrl?: string) {
  try {
    const parsedUrl = new URL(url);
    const navigationOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const trustedOrigin = developmentServerUrl ? new URL(developmentServerUrl).origin : appOrigin;

    return navigationOrigin === trustedOrigin;
  } catch {
    return false;
  }
}
