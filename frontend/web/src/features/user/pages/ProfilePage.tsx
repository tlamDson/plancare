/**
 * Profile Page
 *
 * User account overview
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "../components/UserProfile";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal details and preferences
          </p>
        </div>
        <UserProfile />
      </div>
    </DashboardLayout>
  );
}
