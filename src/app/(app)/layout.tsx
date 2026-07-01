import { getCurrentProfile } from "@/lib/auth/session";
import { CurrentProfileProvider } from "@/components/layout/current-profile-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase not connected yet — render the shell anyway so the UI is
    // reviewable during scaffolding; every data-fetching page handles a
    // missing/failed Supabase call on its own.
  }

  return (
    <CurrentProfileProvider profile={profile}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </CurrentProfileProvider>
  );
}
