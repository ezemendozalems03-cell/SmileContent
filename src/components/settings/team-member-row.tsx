"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateProfileRole, updateProfileActive } from "@/lib/actions/auth";
import { INTERNAL_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import type { Profile } from "@/lib/types/domain";
import type { UserRole } from "@/lib/types/database.types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TeamMemberRow({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const [role, setRole] = useState<UserRole>(profile.role);
  const [isActive, setIsActive] = useState(profile.is_active);

  async function handleRoleChange(value: string | null) {
    if (!value) return;
    const previous = role;
    setRole(value as UserRole);
    const result = await updateProfileRole(profile.id, value as UserRole);
    if (result?.error) {
      setRole(previous);
      toast.error(result.error);
    }
  }

  async function handleActiveChange(checked: boolean) {
    setIsActive(checked);
    const result = await updateProfileActive(profile.id, checked);
    if (result?.error) {
      setIsActive(!checked);
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <Avatar size="sm">
        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
        <AvatarFallback className="text-[10px]">{initials(profile.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {profile.full_name} {isSelf ? <span className="text-muted-foreground">(vos)</span> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
      </div>
      <Select value={role} onValueChange={handleRoleChange} disabled={isSelf}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INTERNAL_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Switch checked={isActive} onCheckedChange={handleActiveChange} disabled={isSelf} />
    </div>
  );
}
