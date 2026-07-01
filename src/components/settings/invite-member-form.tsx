"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { inviteTeamMember } from "@/lib/actions/auth";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteTeamMember, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre</Label>
        <Input id="full_name" name="full_name" required className="w-48" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="w-64" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Invitando…" : "Invitar"}
      </Button>
      {state?.error ? (
        <Alert variant="destructive" className="w-full py-1.5">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.success ? (
        <Alert className="w-full py-1.5">
          <AlertDescription>Invitación enviada.</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
