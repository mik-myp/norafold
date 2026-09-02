import { createFileRoute } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DownloadIcon,
  ExternalLinkIcon,
  LanguagesIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  RefreshCwIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import {
  getLanguagePreference,
  isLanguagePreference,
  setLanguagePreference,
  systemLanguage,
} from "@/i18n";
import type { UpdateCheckResult, UpdateErrorCode } from "@/shared/desktop-api";

const themePreferences = ["system", "light", "dark"] as const;
type ThemePreference = (typeof themePreferences)[number];

function isThemePreference(theme: string): theme is ThemePreference {
  return themePreferences.some((themePreference) => themePreference === theme);
}

function getUpdateErrorMessage(t: TFunction, code: UpdateErrorCode) {
  switch (code) {
    case "invalid-current-version":
      return t("settings.updates.error.invalid-current-version");
    case "invalid-response":
      return t("settings.updates.error.invalid-response");
    case "network":
      return t("settings.updates.error.network");
    case "open-release":
      return t("settings.updates.error.open-release");
    case "rate-limited":
      return t("settings.updates.error.rate-limited");
  }
}

export const Route = createFileRoute("/_app/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [languagePreference, setLanguagePreferenceState] = useState(getLanguagePreference);
  const [version, setVersion] = useState<string>();
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult>();
  const [isChecking, setIsChecking] = useState(false);
  const desktop = typeof window === "undefined" ? undefined : window.desktop;
  const currentTheme = theme ?? "";
  const themePreference: ThemePreference = isThemePreference(currentTheme)
    ? currentTheme
    : "system";

  useEffect(() => {
    if (!window.desktop) {
      return;
    }

    void window.desktop
      .getVersion()
      .then(setVersion)
      .catch(() => setVersion(undefined));
  }, []);

  async function handleCheckForUpdates() {
    if (!desktop) {
      return;
    }

    setIsChecking(true);
    setUpdateResult(undefined);

    try {
      setUpdateResult(await desktop.checkForUpdates());
    } catch {
      setUpdateResult({ status: "error", code: "network" });
    } finally {
      setIsChecking(false);
    }
  }

  async function handleOpenRelease() {
    if (!desktop) {
      return;
    }

    try {
      await desktop.openRelease();
    } catch {
      setUpdateResult({ status: "error", code: "open-release" });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
      </header>

      <Tabs defaultValue="general" className="gap-6">
        <TabsList aria-label={t("settings.tabs.label")}>
          <TabsTrigger value="general">
            <Settings2Icon data-icon="inline-start" />
            {t("settings.tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="updates">
            <DownloadIcon data-icon="inline-start" />
            {t("settings.tabs.updates")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LanguagesIcon />
                {t("language.label")}
              </CardTitle>
              <CardDescription>{t("settings.language.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                aria-label={t("language.label")}
                value={[languagePreference]}
                onValueChange={(value) => {
                  const nextLanguage = value[0];
                  if (nextLanguage && isLanguagePreference(nextLanguage)) {
                    setLanguagePreferenceState(nextLanguage);
                    void setLanguagePreference(nextLanguage);
                  }
                }}
                className="w-full flex-wrap"
                variant="outline"
              >
                <ToggleGroupItem value={systemLanguage}>{t("language.system")}</ToggleGroupItem>
                <ToggleGroupItem value="zh-CN">{t("language.zhCN")}</ToggleGroupItem>
                <ToggleGroupItem value="en">{t("language.en")}</ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PaletteIcon />
                {t("theme.label")}
              </CardTitle>
              <CardDescription>{t("settings.appearance.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                aria-label={t("theme.label")}
                value={[themePreference]}
                onValueChange={(value) => {
                  const nextTheme = value[0];
                  if (nextTheme && isThemePreference(nextTheme)) {
                    setTheme(nextTheme);
                  }
                }}
                className="w-full flex-wrap"
                variant="outline"
              >
                <ToggleGroupItem value="system">
                  <MonitorIcon data-icon="inline-start" />
                  {t("theme.system")}
                </ToggleGroupItem>
                <ToggleGroupItem value="light">
                  <SunIcon data-icon="inline-start" />
                  {t("theme.light")}
                </ToggleGroupItem>
                <ToggleGroupItem value="dark">
                  <MoonIcon data-icon="inline-start" />
                  {t("theme.dark")}
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadIcon />
                {t("settings.updates.title")}
              </CardTitle>
              <CardDescription>{t("settings.updates.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.updates.currentVersion", { version: version ?? "-" })}
              </p>

              {!desktop && (
                <Alert>
                  <AlertTitle>{t("settings.updates.desktopOnly.title")}</AlertTitle>
                  <AlertDescription>
                    {t("settings.updates.desktopOnly.description")}
                  </AlertDescription>
                </Alert>
              )}

              {updateResult?.status === "up-to-date" && (
                <Alert>
                  <AlertTitle>{t("settings.updates.upToDate.title")}</AlertTitle>
                  <AlertDescription>{t("settings.updates.upToDate.description")}</AlertDescription>
                </Alert>
              )}

              {updateResult?.status === "available" && (
                <Alert>
                  <AlertTitle>
                    {t("settings.updates.available.title", {
                      version: updateResult.latestVersion,
                    })}
                  </AlertTitle>
                  <AlertDescription>{t("settings.updates.available.description")}</AlertDescription>
                </Alert>
              )}

              {updateResult?.status === "error" && (
                <Alert variant="destructive">
                  <AlertTitle>{t("settings.updates.error.title")}</AlertTitle>
                  <AlertDescription>{getUpdateErrorMessage(t, updateResult.code)}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void handleCheckForUpdates()}
                  disabled={!desktop || isChecking}
                >
                  {isChecking ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RefreshCwIcon data-icon="inline-start" />
                  )}
                  {isChecking ? t("settings.updates.checking") : t("settings.updates.check")}
                </Button>
                {updateResult?.status === "available" && (
                  <Button variant="outline" onClick={() => void handleOpenRelease()}>
                    <ExternalLinkIcon data-icon="inline-start" />
                    {t("settings.updates.download")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
