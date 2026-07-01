import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crea con el espacio completo: calendario, publicaciones, historias y biblioteca.
        </p>
      </div>
      <ClientForm action={createClientAction} submitLabel="Crear cliente" />
    </div>
  );
}
