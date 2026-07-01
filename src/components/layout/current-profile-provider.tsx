"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types/domain";

const CurrentProfileContext = createContext<Profile | null>(null);

export function CurrentProfileProvider({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return <CurrentProfileContext.Provider value={profile}>{children}</CurrentProfileContext.Provider>;
}

export function useCurrentProfile() {
  return useContext(CurrentProfileContext);
}
