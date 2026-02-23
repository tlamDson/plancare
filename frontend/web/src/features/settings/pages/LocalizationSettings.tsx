import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function LocalizationSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          Localization & Units
        </h3>
        <p className="text-muted-foreground mt-1">
          Customize measurement systems, currency, and language preferences.
        </p>
      </div>

      <Separator />

      <form className="space-y-8">
        {/* Measurement Systems */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Measurements & Units
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Temperature</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred temperature unit.
                </p>
              </div>
              <div className="flex items-center bg-muted p-1 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-4 bg-background shadow-sm"
                >
                  °C
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-4 text-muted-foreground"
                >
                  °F
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Distance</Label>
                <p className="text-sm text-muted-foreground">
                  Used for maps and driving directions.
                </p>
              </div>
              <div className="flex items-center bg-muted p-1 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-4 text-muted-foreground"
                >
                  Miles
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-4 bg-background shadow-sm"
                >
                  Km
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Default Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used for cost estimates and budgets.
                </p>
              </div>
              <div className="flex items-center">
                <Button variant="outline" className="w-32 justify-between">
                  USD ($)
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Translation */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Languages & Translation
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Primary Language
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your default interface language.
                </p>
              </div>
              <div className="flex items-center">
                <Button variant="outline" className="w-32 justify-between">
                  English (US)
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label
                  htmlFor="auto-translate"
                  className="text-base font-medium"
                >
                  Auto-Translate Content
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate points of interest and reviews to your
                  primary language.
                </p>
              </div>
              <Switch id="auto-translate" defaultChecked />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button variant="outline" type="button">
            Discard
          </Button>
          <Button type="button">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
