import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function PersonalInfoSettings() {
  const { user, isLoaded } = useUser();

  const [legalName, setLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLegalName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");

      const meta = user.unsafeMetadata as Record<string, any>;
      setPreferredName(meta?.preferredName || "");
      setDob(meta?.dob || "");
      setGender(meta?.gender || "");
      setPhone(meta?.phone || "");
      setAddress(meta?.address || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          preferredName,
          dob,
          gender,
          phone,
          address,
        },
      });
      toast.success("Personal information updated");
    } catch (error) {
      toast.error("Failed to update information");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (user) {
      setLegalName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      const meta = user.unsafeMetadata as Record<string, any>;
      setPreferredName(meta?.preferredName || "");
      setDob(meta?.dob || "");
      setGender(meta?.gender || "");
      setPhone(meta?.phone || "");
      setAddress(meta?.address || "");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <Label htmlFor="legal-name">Legal Name (from Google)</Label>
              <Input id="legal-name" value={legalName} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred-name">Preferred Name / Nickname</Label>
              <Input
                id="preferred-name"
                placeholder="Johnny"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                placeholder="Optional"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
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
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Input
                id="address"
                placeholder="123 Travel Lane, City, State, ZIP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button
            variant="outline"
            type="button"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
