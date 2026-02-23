import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";

export function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          Aesthetics & Accessibility
        </h3>
        <p className="text-muted-foreground mt-1">
          Customize the appearance of the app and configure accessibility
          options.
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Theme */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Theme Settings
          </h4>
          <p className="text-sm text-muted-foreground">
            Select or customize your interface color scheme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Light Mode */}
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                  : "border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800"
              }`}
            >
              <div className="w-full h-24 rounded-md bg-white border shadow-sm flex items-center justify-center p-2">
                <div className="w-full h-full bg-slate-100 rounded border flex flex-col gap-2 p-2 relative overflow-hidden">
                  <div className="w-1/2 h-2 bg-slate-300 rounded" />
                  <div className="w-3/4 h-2 bg-slate-200 rounded" />
                  <div className="w-1/4 h-2 bg-emerald-500 rounded" />
                </div>
              </div>
              <span className="font-medium text-sm">Light</span>
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                  : "border-transparent bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800"
              }`}
            >
              <div className="w-full h-24 rounded-md bg-zinc-950 border border-zinc-800 shadow-sm flex items-center justify-center p-2">
                <div className="w-full h-full bg-zinc-900 rounded border border-zinc-800 flex flex-col gap-2 p-2 relative overflow-hidden">
                  <div className="w-1/2 h-2 bg-zinc-700 rounded" />
                  <div className="w-3/4 h-2 bg-zinc-800 rounded" />
                  <div className="w-1/4 h-2 bg-emerald-500 rounded" />
                </div>
              </div>
              <span className="font-medium text-sm">Dark</span>
            </button>

            {/* System Mode */}
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "system"
                  ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                  : "border-transparent bg-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800"
              }`}
            >
              <div className="w-full h-24 rounded-md bg-gradient-to-br from-white to-zinc-950 border shadow-sm flex items-center justify-center p-2">
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-zinc-900 rounded border border-zinc-500/50 flex flex-col gap-2 p-2 relative overflow-hidden">
                  <div className="w-1/2 h-2 bg-zinc-500 rounded" />
                  <div className="w-3/4 h-2 bg-zinc-600 rounded" />
                  <div className="w-1/4 h-2 bg-emerald-500 rounded" />
                </div>
              </div>
              <span className="font-medium text-sm">System</span>
            </button>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Accessibility
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="high-contrast"
                  className="text-base font-medium"
                >
                  High Contrast
                </Label>
                <p className="text-sm text-muted-foreground w-11/12">
                  Increases color contrast across the interface for better
                  readability.
                </p>
              </div>
              <Switch id="high-contrast" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="infinite-scroll"
                  className="text-base font-medium"
                >
                  Infinite Scroll
                </Label>
                <p className="text-sm text-muted-foreground w-11/12">
                  Automatically load the next page of itineraries instead of
                  using pagination.
                </p>
              </div>
              <Switch id="infinite-scroll" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="map-controls" className="text-base font-medium">
                  Persistent Map Controls
                </Label>
                <p className="text-sm text-muted-foreground w-11/12">
                  Always display zoom and pan controls on interactive map views.
                </p>
              </div>
              <Switch id="map-controls" defaultChecked />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
