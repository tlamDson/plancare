import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslationStore } from "@/stores/useTranslationStore";

export function AiAssistantSettings() {
  const { t } = useTranslationStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          {t("ai.pageTitle")}
        </h3>
        <p className="text-muted-foreground mt-1">{t("ai.pageSubtitle")}</p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Chatbot Settings */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t("ai.globalTitle")}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="ai-toggle" className="text-base font-medium">
                  {t("ai.enableFloating")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("ai.enableFloatingDesc")}
                </p>
              </div>
              <Switch id="ai-toggle" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm opacity-100">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="ai-logo" className="text-base font-medium">
                  {t("ai.displayLogo")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("ai.displayLogoDesc")}
                </p>
              </div>
              <Switch id="ai-logo" defaultChecked />
            </div>
          </div>
        </section>

        {/* Model Constraints */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t("ai.limitsTitle")}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="budget-strict"
                  className="text-base font-medium"
                >
                  {t("ai.strictBudget")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("ai.strictBudgetDesc")}
                </p>
              </div>
              <Switch id="budget-strict" defaultChecked />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
