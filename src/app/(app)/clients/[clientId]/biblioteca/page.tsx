import { Library } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function ClientBibliotecaPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Library}
        title="Biblioteca de marca"
        description="Logos, manual de marca, fotos, videos y plantillas. Disponible en la Etapa 2."
      />
    </div>
  );
}
