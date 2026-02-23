import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function PersonalInfoSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          Personal Information
        </h3>
        <p className="text-muted-foreground mt-1">
          Manage your legal identity and public profile details.
        </p>
      </div>

      <Separator />

      <form className="space-y-8">
        {/* Identity Section */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Identity</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legal-name">Legal Name</Label>
              <Input id="legal-name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred-name">Preferred Name / Nickname</Label>
              <Input id="preferred-name" placeholder="Johnny" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" placeholder="Optional" />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Input
                id="address"
                placeholder="123 Travel Lane, City, State, ZIP"
              />
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
