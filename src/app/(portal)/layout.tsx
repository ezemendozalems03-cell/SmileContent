import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { CurrentProfileProvider } from "@/components/layout/current-profile-provider";
import { PortalTopbar } from "@/components/portal/portal-topbar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase not connected yet — render the shell anyway, mirroring (app)/layout.tsx.
  }

  if (!profile || profile.role !== "client") {
    redirect("/dashboard");
  }

  return (
    <CurrentProfileProvider profile={profile}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PortalTopbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </CurrentProfileProvider>
  );
}
