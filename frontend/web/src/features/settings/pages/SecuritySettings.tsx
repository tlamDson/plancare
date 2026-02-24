import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Smartphone, MonitorPlay, KeyRound, Users } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

export function SecuritySettings() {
  const { openUserProfile } = useClerk();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Security & Access</h3>
        <p className="text-muted-foreground mt-1">
          Manage your account security, 2FA, and authorized devices.
        </p>
      </div>

      <Separator />

      <div className="space-y-8">
        {/* Authentication */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Authentication
          </h4>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-medium">Password & Authentication</p>
              <p className="text-sm text-muted-foreground">
                Managed securely via Clerk
              </p>
            </div>
            <Button variant="outline" onClick={() => openUserProfile()}>
              Update Password
            </Button>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-medium">Two-Factor Authentication (2FA)</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security your account.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile()}
              >
                Manage 2FA
              </Button>
            </div>
          </div>
        </section>

        {/* Device History */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MonitorPlay className="w-4 h-4" /> Device History
          </h4>
          <div className="rounded-lg border shadow-sm divide-y">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MonitorPlay className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">MacBook Pro - Chrome</p>
                  <p className="text-xs text-muted-foreground">
                    New York, US • Active now
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">iPhone 14 Pro - Safari</p>
                  <p className="text-xs text-muted-foreground">
                    New York, US • Yesterday at 4:32 PM
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast.info(
                    "Revoking devices is currently disabled in demo mode",
                  )
                }
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Revoke
              </Button>
            </div>
          </div>
        </section>

        {/* Shared Access */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" /> Shared Access
          </h4>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-medium">Collaborator Approvals</p>
              <p className="text-sm text-muted-foreground">
                Review and approve who can view or modify your trip folders.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => toast.success("Access settings updated")}
            >
              Manage Access
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
