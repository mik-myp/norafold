import { createFileRoute } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import {
  DownloadIcon,
  ExternalLinkIcon,
  LanguagesIcon,
  PaletteIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AppearanceDrawer } from "@/features/appearance/appearance-settings";
import {
  resolveSettingsSection,
  validateSettingsSearch,
} from "@/features/settings/settings-sections";
import {
  getLanguagePreference,
  isLanguagePreference,
  setLanguagePreference,
  systemLanguage,
} from "@/i18n";
import type { UpdateCheckResult, UpdateErrorCode } from "@/shared/desktop-api";

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
  validateSearch: validateSettingsSearch,
  component: SettingsRoute,
});

function SettingsRoute() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const section = resolveSettingsSection(search);
  const [languagePreference, setLanguagePreferenceState] = useState(getLanguagePreference);
  const [version, setVersion] = useState<string>();
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult>();
  const [isChecking, setIsChecking] = useState(false);
  const desktop = typeof window === "undefined" ? undefined : window.desktop;

  useEffect(() => {
    if (!window.desktop) return;

    void window.desktop
      .getVersion()
      .then(setVersion)
      .catch(() => setVersion(undefined));
  }, []);

  async function handleCheckForUpdates() {
    if (!desktop) return;

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
    if (!desktop) return;

    try {
      await desktop.openRelease();
    } catch {
      setUpdateResult({ status: "error", code: "open-release" });
    }
  }

  return (
    <main className="flex min-h-full w-full flex-col bg-surface-raised">
      <header className="border-b px-5 py-5 sm:px-8 lg:px-10">
        <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
      </header>

      <div className="min-h-0 flex-1">
        {section === "general" ? (
          <section className="min-w-0 p-5 sm:p-6 md:p-8">
            <div className="w-full">
              <header>
                <h2 className="text-lg font-semibold">{t("settings.tabs.general")}</h2>
              </header>

              <div className="mt-5 divide-y border-y">
                <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <LanguagesIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{t("language.label")}</h3>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {t("settings.language.description")}
                      </p>
                    </div>
                  </div>
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
                    spacing={0}
                    className="w-fit max-w-full shrink-0 flex-wrap self-start"
                    variant="outline"
                  >
                    <ToggleGroupItem value={systemLanguage}>{t("language.system")}</ToggleGroupItem>
                    <ToggleGroupItem value="zh-CN">{t("language.zhCN")}</ToggleGroupItem>
                    <ToggleGroupItem value="en">{t("language.en")}</ToggleGroupItem>
                  </ToggleGroup>
                </section>
                <section className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <PaletteIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{t("settings.appearance.title")}</h3>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {t("settings.appearance.description")}
                      </p>
                    </div>
                  </div>
                  <AppearanceDrawer />
                </section>
              </div>
            </div>
          </section>
        ) : (
          <section className="min-w-0 p-5 sm:p-6 md:p-8">
            <div className="w-full">
              <header>
                <h2 className="text-lg font-semibold">{t("settings.updates.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.updates.description")}
                </p>
              </header>

              <section className="mt-6 flex flex-col gap-4 border-y py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <DownloadIcon className="size-4" />
                    </span>
                    <p className="pt-1 font-mono text-xs text-muted-foreground">
                      {t("settings.updates.currentVersion", { version: version ?? "-" })}
                    </p>
                  </div>
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
                </div>

                <Separator />

                {!desktop && (
                  <Alert className="border-warning/30 bg-warning/5">
                    <AlertTitle>{t("settings.updates.desktopOnly.title")}</AlertTitle>
                    <AlertDescription>
                      {t("settings.updates.desktopOnly.description")}
                    </AlertDescription>
                  </Alert>
                )}

                {updateResult?.status === "up-to-date" && (
                  <Alert className="border-success/30 bg-success/5">
                    <AlertTitle>{t("settings.updates.upToDate.title")}</AlertTitle>
                    <AlertDescription>
                      {t("settings.updates.upToDate.description")}
                    </AlertDescription>
                  </Alert>
                )}

                {updateResult?.status === "available" && (
                  <Alert className="border-info/30 bg-info/5">
                    <AlertTitle>
                      {t("settings.updates.available.title", {
                        version: updateResult.latestVersion,
                      })}
                    </AlertTitle>
                    <AlertDescription>
                      {t("settings.updates.available.description")}
                    </AlertDescription>
                  </Alert>
                )}

                {updateResult?.status === "error" && (
                  <Alert variant="destructive">
                    <AlertTitle>{t("settings.updates.error.title")}</AlertTitle>
                    <AlertDescription>
                      {getUpdateErrorMessage(t, updateResult.code)}
                    </AlertDescription>
                  </Alert>
                )}

                {updateResult?.status === "available" && (
                  <div>
                    <Button variant="outline" onClick={() => void handleOpenRelease()}>
                      <ExternalLinkIcon data-icon="inline-start" />
                      {t("settings.updates.download")}
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
