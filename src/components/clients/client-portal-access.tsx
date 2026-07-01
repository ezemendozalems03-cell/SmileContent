"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { inviteClientUser, removeClientUser } from "@/lib/actions/client-portal";
import { X } from "lucide-react";

type ClientPortalUser = {
  profile_id: string;
  full_name: string;
  email: string;
};

export function ClientPortalAccess({
  clientId,
  users,
}: {
  clientId: string;
  users: ClientPortalUser[];
}) {
  const boundInvite = inviteClientUser.bind(null, clientId);
  const [state, formAction, pending] = useActionState(boundInvite, undefined);

  async function handleRemove(profileId: string) {
    if (!confirm("¿Quitar el acceso de este usuario al portal?")) return;
    const result = await removeClientUser(clientId, profileId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div className="space-y-3">
      {users.length > 0 ? (
        <div className="space-y-1.5">
          {users.map((user) => (
            <div
              key={user.profile_id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{user.full_name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <button
                type="button"
                onClick={() => handleRemove(user.profile_id)}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Todavía no invitaste a nadie al portal.</p>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="client_full_name">Nombre</Label>
          <Input id="client_full_name" name="full_name" required className="w-48" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client_email">Email</Label>
          <Input id="client_email" name="email" type="email" required className="w-64" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Invitando…" : "Invitar al portal"}
        </Button>
      </form>
      {state?.error ? (
        <Alert variant="destructive" className="py-1.5">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.success ? (
        <Alert className="py-1.5">
          <AlertDescription>Invitación enviada.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
