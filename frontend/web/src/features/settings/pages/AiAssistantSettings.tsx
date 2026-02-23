import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AiAssistantSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          AI Assistant Configurations
        </h3>
        <p className="text-muted-foreground mt-1">
          Tune the AI engine and manage your floating travel assistant.
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Chatbot Settings */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Global Travel Assistant
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="ai-toggle" className="text-base font-medium">
                  Enable Floating Assistant
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep the AI chatbot accessible in the bottom right corner
                  across all pages.
                </p>
              </div>
              <Switch id="ai-toggle" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm opacity-100">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="ai-logo" className="text-base font-medium">
                  Display AI Logo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show the animated AI orb on the floating button when closed.
                </p>
              </div>
              <Switch id="ai-logo" defaultChecked />
            </div>
          </div>
        </section>

        {/* Model Constraints */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Behavior Limits
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="budget-strict"
                  className="text-base font-medium"
                >
                  Strict Budget Enforcement
                </Label>
                <p className="text-sm text-muted-foreground">
                  Prevent the AI from ever suggesting activities that exceed
                  your set tier limit.
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
