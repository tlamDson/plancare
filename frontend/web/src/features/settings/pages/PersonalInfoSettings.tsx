import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslationStore } from "@/stores/useTranslationStore";

function parseClerkUnsafeMeta(metadata: unknown) {
  const m =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};
  const dobRaw = m.dob;
  return {
    preferredName:
      typeof m.preferredName === "string" ? m.preferredName : "",
    dob:
      typeof dobRaw === "string" || typeof dobRaw === "number"
        ? new Date(dobRaw)
        : undefined,
    gender: typeof m.gender === "string" ? m.gender : "",
    phone: typeof m.phone === "string" ? m.phone : "",
    address: typeof m.address === "string" ? m.address : "",
  };
}

export function PersonalInfoSettings() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslationStore();

  const isExternalAuth = Boolean(
    user?.externalAccounts && user.externalAccounts.length > 0,
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");

      const meta = parseClerkUnsafeMeta(user.unsafeMetadata);
      setPreferredName(meta.preferredName);
      setDob(meta.dob);
      setGender(meta.gender);
      setPhone(meta.phone);
      setAddress(meta.address);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (!isExternalAuth) {
        await user.update({
          firstName,
          lastName,
        });
      }
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          preferredName,
          dob: dob ? dob.toISOString() : null,
          gender,
          phone,
          address,
        },
      });
      toast.success(t("personal.toastSave"));
    } catch {
      toast.error(t("personal.toastFail"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
      const meta = parseClerkUnsafeMeta(user.unsafeMetadata);
      setPreferredName(meta.preferredName);
      setDob(meta.dob);
      setGender(meta.gender);
      setPhone(meta.phone);
      setAddress(meta.address);
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
          {t("personal.pageTitle")}
        </h3>
        <p className="text-muted-foreground mt-1">
          {t("personal.pageSubtitle")}
        </p>
      </div>

      <Separator />

      <form className="space-y-8">
        {/* Identity Section */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t("personal.identityTitle")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">{t("personal.firstName")}</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isExternalAuth}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">{t("personal.lastName")}</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isExternalAuth}
              />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <Label htmlFor="preferred-name">
                {t("personal.preferredName")}
              </Label>
              <Input
                id="preferred-name"
                placeholder="Johnny"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="dob">{t("personal.dob")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dob && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dob ? (
                      format(dob, "PPP")
                    ) : (
                      <span>{t("personal.pickDate")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={setDob}
                    initialFocus
                    defaultMonth={dob || new Date(2000, 0, 1)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{t("personal.gender")}</Label>
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
            {t("personal.contactTitle")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("personal.email")}</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("personal.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="address">{t("personal.address")}</Label>
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
            {t("personal.btnDiscard")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("personal.btnSave")}
          </Button>
        </div>
      </form>
    </div>
  );
}
