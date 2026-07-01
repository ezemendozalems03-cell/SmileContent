import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function ClientMetricasPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={BarChart3}
        title="Métricas"
        description="Alcance, mejores publicaciones y reportes de este cliente. Disponible en la Etapa 3."
      />
    </div>
  );
}
