import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se crea con el espacio completo: calendario, publicaciones, historias, biblioteca,
          estrategia y asistente IA. Al crearlo vas a su Configuración para armar sus pilares,
          formatos y tipos de contenido; después completá su Memoria de Marca para que la IA
          escriba con su voz.
        </p>
      </div>
      <ClientForm action={createClientAction} submitLabel="Crear cliente" withBrandbookUpload />
    </div>
  );
}
