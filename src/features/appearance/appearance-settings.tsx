import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { CircleCheckIcon, PaletteIcon, RotateCcwIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { themeStorageKey } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppearance } from "@/features/appearance/appearance-context";
import {
  isOneOf,
  themePresets,
  type ContentLayout,
  type Direction,
  type SidebarCollapsible,
  type SidebarVariant,
  type ThemeFont,
  type ThemePreset,
  type ThemeRadius,
  type ThemeScale,
} from "@/features/appearance/appearance-options";
import { cn } from "@/lib/utils";

const themePreferences = ["system", "light", "dark"] as const;

function resetThemePreference(setTheme: (theme: string) => void) {
  setTheme("system");

  try {
    window.localStorage.removeItem(themeStorageKey);
  } catch {
    // Restricted browser contexts may disable storage; next-themes still updates this session.
  }
}

function SectionTitle({
  title,
  showReset,
  onReset,
}: {
  title: string;
  showReset: boolean;
  onReset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground/75">
      <span>{title}</span>
      {showReset && (
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="size-4 rounded-sm"
          aria-label={t("settings.appearance.resetSection", { section: title })}
          onClick={onReset}
        >
          <RotateCcwIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}

function PreviewItem({
  value,
  label,
  children,
  className,
  previewClassName,
  largeCheck = false,
}: {
  value: string;
  label: string;
  children: ReactNode;
  className?: string;
  previewClassName?: string;
  largeCheck?: boolean;
}) {
  return (
    <RadioPrimitive.Root
      value={value}
      aria-label={label}
      className={cn(
        "group flex min-w-0 flex-col items-stretch transition duration-200 ease-in outline-none",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-12 items-center justify-center rounded-md ring-1 ring-border group-focus-visible:ring-2 group-data-checked:shadow-2xl group-data-checked:ring-primary",
          previewClassName,
        )}
      >
        {children}
        <CircleCheckIcon
          className={cn(
            "absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 fill-primary text-primary-foreground group-data-unchecked:hidden",
            largeCheck ? "size-6" : "size-5",
          )}
        />
      </div>
      <span className="mt-1.5 truncate text-center text-xs">{label}</span>
    </RadioPrimitive.Root>
  );
}

function ThemePreview({ mode }: { mode: (typeof themePreferences)[number] }) {
  const isDark = mode === "dark";
  const isSystem = mode === "system";

  return (
    <div
      className={cn(
        "flex size-full overflow-hidden rounded-md",
        isDark ? "bg-[#0d1628]" : isSystem ? "bg-primary/15" : "bg-[#ecedef]",
      )}
    >
      <div
        className={cn(
          "flex w-[29%] flex-col gap-1 p-1.5",
          isDark ? "bg-[#1d2b3f]" : isSystem ? "bg-primary/25" : "bg-[#d9d9d9]",
        )}
      >
        <span
          className={cn(
            "block size-2 rounded-full",
            isDark ? "bg-[#426187]" : isSystem ? "bg-primary" : "bg-white",
          )}
        />
        <span
          className={cn("mt-1 h-1 w-full rounded-full", isDark ? "bg-[#426187]" : "bg-white")}
        />
        <span
          className={cn("h-1 w-3/4 rounded-full opacity-75", isDark ? "bg-[#426187]" : "bg-white")}
        />
        <span
          className={cn("h-1 w-4/5 rounded-full opacity-60", isDark ? "bg-[#426187]" : "bg-white")}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-end gap-1">
          {[5, 9, 12, 16].map((height) => (
            <span
              key={height}
              className={cn(
                "block w-1 rounded-sm",
                isDark ? "bg-[#2a62bc]" : isSystem ? "bg-primary/50" : "bg-[#c0c4c4]",
              )}
              style={{ height }}
            />
          ))}
          <span
            className={cn(
              "ms-auto block size-4 rounded-full",
              isDark ? "bg-[#2f5491]/70" : isSystem ? "bg-primary/25" : "bg-white",
            )}
          />
        </div>
        <span
          className={cn(
            "block min-h-0 flex-1 rounded-sm",
            isDark ? "bg-[#17273f]" : isSystem ? "bg-primary/20" : "bg-white",
          )}
        />
      </div>
    </div>
  );
}

function PreviewLines({ rows, gap }: { rows: number; gap: string }) {
  return (
    <div className="absolute inset-2.5 flex flex-col justify-center" style={{ gap }}>
      {Array.from({ length: rows }, (_, index) => 85 - index * 10).map((width) => (
        <span
          key={width}
          className="block h-0.5 rounded-full bg-foreground/60"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

function SidebarPreview({ variant }: { variant: SidebarVariant }) {
  return (
    <div className="flex size-full p-1.5 text-primary group-data-unchecked:text-muted-foreground">
      <div
        className={cn(
          "flex w-[27%] flex-col gap-1 p-1",
          variant === "floating" && "rounded-sm bg-current text-primary-foreground",
        )}
      >
        <span className="block size-1.5 rounded-full bg-current opacity-80" />
        <span className="mt-1 block h-0.5 w-full rounded-full bg-current opacity-70" />
        <span className="block h-0.5 w-4/5 rounded-full bg-current opacity-50" />
        <span className="block h-0.5 w-3/4 rounded-full bg-current opacity-60" />
      </div>
      <div
        className={cn(
          "ms-1 flex flex-1 flex-col gap-1",
          variant === "inset" && "rounded-sm bg-current/20 p-1",
          variant === "sidebar" && "bg-current/15 p-1",
        )}
      >
        {variant === "floating" && <span className="mt-1 block h-0.5 w-1/4 bg-current/60" />}
        <span className="block h-1 w-2/3 rounded-sm bg-current/40" />
        <span className="block min-h-0 flex-1 rounded-sm bg-current/25" />
      </div>
    </div>
  );
}

function LayoutPreview({ layout }: { layout: "default" | SidebarCollapsible }) {
  return (
    <div className="flex size-full gap-1 p-1.5 text-primary group-data-unchecked:text-muted-foreground">
      <span
        className={cn(
          "block rounded-sm bg-current/80",
          layout === "offcanvas" ? "hidden" : layout === "icon" ? "w-2" : "w-[28%]",
        )}
      />
      <div className="flex flex-1 flex-col gap-1">
        <span className="block h-1 rounded-sm bg-current/80" />
        <div className="flex flex-1 gap-1">
          <span className="block flex-1 rounded-sm bg-current/40" />
          <span className="block w-1/3 rounded-sm bg-current/25" />
        </div>
      </div>
    </div>
  );
}

function ContentPreview({ centered }: { centered: boolean }) {
  return (
    <div className="absolute inset-2 flex flex-col gap-1.5">
      <span className="block h-1.5 w-full rounded-sm bg-foreground/40" />
      <div className={cn("flex flex-1 flex-col gap-1", centered ? "mx-auto w-1/2" : "w-full")}>
        <span className="block h-0.5 w-full rounded-full bg-foreground/60" />
        <span className="block h-0.5 w-3/4 rounded-full bg-foreground/60" />
      </div>
    </div>
  );
}

function AppearanceControls() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { open, setOpen } = useSidebar();
  const {
    appearance,
    defaults,
    setPreset,
    setFont,
    setRadius,
    setScale,
    setSidebarVariant,
    setSidebarCollapsible,
    setContentLayout,
    setDirection,
  } = useAppearance();
  const themePreference = isOneOf(theme ?? null, themePreferences) ? theme : "system";
  const layoutValue = open ? "default" : appearance.sidebarCollapsible;
  const presetLabels: Record<ThemePreset, string> = {
    default: t("settings.appearance.preset.options.default"),
    anthropic: t("settings.appearance.preset.options.anthropic"),
    "simple-large": t("settings.appearance.preset.options.simple-large"),
    underground: t("settings.appearance.preset.options.underground"),
    "rose-garden": t("settings.appearance.preset.options.rose-garden"),
    "lake-view": t("settings.appearance.preset.options.lake-view"),
    "sunset-glow": t("settings.appearance.preset.options.sunset-glow"),
    "forest-whisper": t("settings.appearance.preset.options.forest-whisper"),
    "ocean-breeze": t("settings.appearance.preset.options.ocean-breeze"),
    "lavender-dream": t("settings.appearance.preset.options.lavender-dream"),
  };
  const sidebarOptions = [
    { value: "inset", label: t("settings.appearance.sidebar.options.inset") },
    { value: "floating", label: t("settings.appearance.sidebar.options.floating") },
    { value: "sidebar", label: t("settings.appearance.sidebar.options.sidebar") },
  ] as const;
  const layoutOptions = [
    { value: "default", label: t("settings.appearance.layout.options.default") },
    { value: "icon", label: t("settings.appearance.layout.options.icon") },
    { value: "offcanvas", label: t("settings.appearance.layout.options.offcanvas") },
  ] as const;
  const contentLayoutOptions = [
    { value: "full", label: t("settings.appearance.contentLayout.options.full") },
    { value: "centered", label: t("settings.appearance.contentLayout.options.centered") },
  ] as const;

  return (
    <>
      <section>
        <SectionTitle
          title={t("settings.appearance.theme.title")}
          showReset={themePreference !== "system"}
          onReset={() => resetThemePreference(setTheme)}
        />
        <RadioGroupPrimitive
          value={themePreference}
          onValueChange={(value) => {
            if (isOneOf(value, themePreferences)) setTheme(value);
          }}
          className="grid w-full max-w-md grid-cols-3 gap-4"
          aria-label={t("settings.appearance.theme.label")}
        >
          {[
            { value: "system", label: t("theme.system") },
            { value: "light", label: t("theme.light") },
            { value: "dark", label: t("theme.dark") },
          ].map(({ value, label }) => (
            <PreviewItem
              key={value}
              value={value}
              label={label}
              previewClassName="aspect-[79.86/51.14] h-auto"
              largeCheck
            >
              <ThemePreview mode={value as (typeof themePreferences)[number]} />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section>
        <SectionTitle
          title={t("settings.appearance.preset.title")}
          showReset={appearance.preset !== defaults.preset}
          onReset={() => setPreset(defaults.preset)}
        />
        <RadioGroupPrimitive
          value={appearance.preset}
          onValueChange={(value) => setPreset(value as ThemePreset)}
          className="grid w-full grid-cols-4 gap-3"
          aria-label={t("settings.appearance.preset.label")}
        >
          {themePresets.map((preset) => (
            <PreviewItem key={preset.value} value={preset.value} label={presetLabels[preset.value]}>
              <span className="flex size-full overflow-hidden rounded-[inherit]">
                <span className="block flex-1" style={{ backgroundColor: preset.swatches[0] }} />
                <span className="block flex-1" style={{ backgroundColor: preset.swatches[1] }} />
              </span>
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section>
        <SectionTitle
          title={t("settings.appearance.font.title")}
          showReset={appearance.font !== defaults.font}
          onReset={() => setFont(defaults.font)}
        />
        <RadioGroupPrimitive
          value={appearance.font}
          onValueChange={(value) => setFont(value as ThemeFont)}
          className="grid w-full max-w-md grid-cols-3 gap-4"
          aria-label={t("settings.appearance.font.label")}
        >
          {[
            {
              value: "default",
              label: t("settings.appearance.font.options.default"),
              fontFamily: undefined,
            },
            {
              value: "sans",
              label: t("settings.appearance.font.options.sans"),
              fontFamily: "var(--font-public-sans)",
            },
            {
              value: "serif",
              label: t("settings.appearance.font.options.serif"),
              fontFamily: "var(--font-serif)",
            },
          ].map(({ value, label, fontFamily }) => (
            <PreviewItem key={value} value={value} label={label}>
              {/* i18next-instrument-ignore -- conventional font preview sample */}
              <span className="text-lg font-medium" style={{ fontFamily }}>
                Aa
              </span>
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section>
        <SectionTitle
          title={t("settings.appearance.radius.title")}
          showReset={appearance.radius !== defaults.radius}
          onReset={() => setRadius(defaults.radius)}
        />
        <RadioGroupPrimitive
          value={appearance.radius}
          onValueChange={(value) => setRadius(value as ThemeRadius)}
          className="grid w-full grid-cols-6 gap-2"
          aria-label={t("settings.appearance.radius.label")}
        >
          {[
            { value: "default", label: "Auto", radius: "1rem" },
            { value: "none", label: "0", radius: "0" },
            { value: "sm", label: "0.3", radius: "0.3rem" },
            { value: "md", label: "0.5", radius: "0.5rem" },
            { value: "lg", label: "0.75", radius: "0.75rem" },
            { value: "xl", label: "1.0", radius: "1rem" },
          ].map((option) => (
            <PreviewItem key={option.value} value={option.value} label={option.label}>
              <span
                className="absolute top-2.5 left-2.5 size-4 border-t-2 border-l-2 border-foreground/70"
                style={{ borderTopLeftRadius: option.radius }}
              />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section>
        <SectionTitle
          title={t("settings.appearance.scale.title")}
          showReset={appearance.scale !== defaults.scale}
          onReset={() => setScale(defaults.scale)}
        />
        <RadioGroupPrimitive
          value={appearance.scale}
          onValueChange={(value) => setScale(value as ThemeScale)}
          className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label={t("settings.appearance.scale.label")}
        >
          {[
            {
              value: "sm",
              label: t("settings.appearance.scale.options.sm"),
              rows: 4,
              gap: "3px",
            },
            {
              value: "default",
              label: t("settings.appearance.scale.options.default"),
              rows: 3,
              gap: "6px",
            },
            {
              value: "lg",
              label: t("settings.appearance.scale.options.lg"),
              rows: 2,
              gap: "10px",
            },
            {
              value: "xl",
              label: t("settings.appearance.scale.options.xl"),
              rows: 1,
              gap: "14px",
            },
          ].map((option) => (
            <PreviewItem key={option.value} value={option.value} label={option.label}>
              <PreviewLines rows={option.rows} gap={option.gap} />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section className="max-md:hidden">
        <SectionTitle
          title={t("settings.appearance.sidebar.title")}
          showReset={appearance.sidebarVariant !== defaults.sidebarVariant}
          onReset={() => setSidebarVariant(defaults.sidebarVariant)}
        />
        <RadioGroupPrimitive
          value={appearance.sidebarVariant}
          onValueChange={(value) => setSidebarVariant(value as SidebarVariant)}
          className="grid w-full max-w-md grid-cols-3 gap-4"
          aria-label={t("settings.appearance.sidebar.label")}
        >
          {sidebarOptions.map(({ value, label }) => (
            <PreviewItem
              key={value}
              value={value}
              label={label}
              previewClassName="aspect-[79.86/51.14] h-auto"
              largeCheck
            >
              <SidebarPreview variant={value} />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section className="max-md:hidden">
        <SectionTitle
          title={t("settings.appearance.layout.title")}
          showReset={layoutValue !== "default"}
          onReset={() => {
            setOpen(true);
            setSidebarCollapsible(defaults.sidebarCollapsible);
          }}
        />
        <RadioGroupPrimitive
          value={layoutValue}
          onValueChange={(value) => {
            if (value === "default") {
              setOpen(true);
              return;
            }
            setOpen(false);
            setSidebarCollapsible(value as SidebarCollapsible);
          }}
          className="grid w-full max-w-md grid-cols-3 gap-4"
          aria-label={t("settings.appearance.layout.label")}
        >
          {layoutOptions.map(({ value, label }) => (
            <PreviewItem
              key={value}
              value={value}
              label={label}
              previewClassName="aspect-[79.86/51.14] h-auto"
              largeCheck
            >
              <LayoutPreview layout={value} />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section className="max-md:hidden">
        <SectionTitle
          title={t("settings.appearance.contentLayout.title")}
          showReset={appearance.contentLayout !== defaults.contentLayout}
          onReset={() => setContentLayout(defaults.contentLayout)}
        />
        <RadioGroupPrimitive
          value={appearance.contentLayout}
          onValueChange={(value) => setContentLayout(value as ContentLayout)}
          className="grid w-full grid-cols-2 gap-4"
          aria-label={t("settings.appearance.contentLayout.label")}
        >
          {contentLayoutOptions.map(({ value, label }) => (
            <PreviewItem key={value} value={value} label={label}>
              <ContentPreview centered={value === "centered"} />
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>

      <section>
        <SectionTitle
          title={t("settings.appearance.direction.title")}
          showReset={appearance.direction !== defaults.direction}
          onReset={() => setDirection(defaults.direction)}
        />
        <RadioGroupPrimitive
          value={appearance.direction}
          onValueChange={(value) => setDirection(value as Direction)}
          className="grid w-full max-w-md grid-cols-3 gap-4"
          aria-label={t("settings.appearance.direction.label")}
        >
          {[
            {
              value: "ltr",
              label: t("settings.appearance.direction.options.ltr"),
            },
            {
              value: "rtl",
              label: t("settings.appearance.direction.options.rtl"),
            },
          ].map(({ value, label }) => (
            <PreviewItem
              key={value}
              value={value}
              label={label}
              previewClassName="aspect-[79.86/51.14] h-auto"
              largeCheck
            >
              <div
                className={cn(
                  "flex size-full gap-1 p-1.5 text-primary group-data-unchecked:text-muted-foreground",
                  value === "rtl" && "flex-row-reverse",
                )}
              >
                <span className="block w-[27%] bg-current/70" />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="block h-1 w-1/3 bg-current/70" />
                  <span className="block h-1 w-2/3 bg-current/40" />
                  <span className="block min-h-0 flex-1 bg-current/25" />
                </div>
              </div>
            </PreviewItem>
          ))}
        </RadioGroupPrimitive>
      </section>
    </>
  );
}

export function AppearanceDrawer() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const { setOpen } = useSidebar();
  const { resetAppearance } = useAppearance();

  function handleReset() {
    setOpen(true);
    resetThemePreference(setTheme);
    resetAppearance();
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            aria-label={t("settings.appearance.open")}
            aria-describedby="appearance-drawer-description"
          />
        }
      >
        <PaletteIcon data-icon="inline-start" />
        {t("settings.appearance.open")}
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-full flex-col gap-0 overflow-hidden bg-background p-0 text-foreground shadow-none data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border/70 bg-background/95 px-4 py-3 text-start backdrop-blur sm:px-6 sm:py-4">
          <SheetTitle>{t("settings.appearance.title")}</SheetTitle>
          <SheetDescription id="appearance-drawer-description" className="text-foreground/75">
            {t("settings.appearance.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <AppearanceControls />
        </div>
        <SheetFooter className="grid grid-cols-1 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="destructive"
            className="w-full bg-destructive text-white hover:bg-destructive/90"
            aria-label={t("settings.appearance.resetAllLabel")}
            onClick={handleReset}
          >
            {t("settings.appearance.resetAll")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
