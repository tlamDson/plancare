import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  User,
  ShieldCheck,
  Globe,
  Palette,
  Bot,
  PlaneTakeoff,
} from "lucide-react";

// Import the dumb UI components
import { PersonalInfoSettings } from "../pages/PersonalInfoSettings";
import { SecuritySettings } from "../pages/SecuritySettings";
import { LocalizationSettings } from "../pages/LocalizationSettings";
import { AppearanceSettings } from "../pages/AppearanceSettings";
import { AiAssistantSettings } from "../pages/AiAssistantSettings";
import { TravelPreferencesSettings } from "../pages/TravelPreferencesSettings";

const SETTINGS_TABS = [
  {
    id: "personal",
    name: "Personal Information",
    icon: User,
    Component: PersonalInfoSettings,
  },
  {
    id: "security",
    name: "Security & Access",
    icon: ShieldCheck,
    Component: SecuritySettings,
  },
  {
    id: "localization",
    name: "Localization",
    icon: Globe,
    Component: LocalizationSettings,
  },
  {
    id: "appearance",
    name: "Appearance",
    icon: Palette,
    Component: AppearanceSettings,
  },
  { id: "ai", name: "AI Assistant", icon: Bot, Component: AiAssistantSettings },
  {
    id: "preferences",
    name: "Travel Preferences",
    icon: PlaneTakeoff,
    Component: TravelPreferencesSettings,
  },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]["id"];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  const ActiveComponent =
    SETTINGS_TABS.find((tab) => tab.id === activeTab)?.Component ||
    PersonalInfoSettings;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0 bg-background h-[85vh] md:h-[700px] flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-muted/30 border-r md:h-full flex flex-col shrink-0">
          <div className="p-6 pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden md:py-2 flex flex-row md:flex-col pb-4 md:pb-0 gap-2 md:gap-0 border-b md:border-b-0 hide-scrollbar">
            {SETTINGS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full whitespace-nowrap md:whitespace-normal shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 ${isActive ? "text-primary-foreground" : ""}`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          <div className="max-w-2xl mx-auto pb-8">
            <ActiveComponent />
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}
