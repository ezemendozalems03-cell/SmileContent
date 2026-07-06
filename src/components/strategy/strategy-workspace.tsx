"use client";

import { BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyPanel } from "@/components/strategy/strategy-panel";
import { MonthlyPlanTab } from "@/components/strategy/monthly-plan-tab";
import { RulesFrequencyTab } from "@/components/strategy/rules-frequency-tab";
import { CampaignsTab } from "@/components/strategy/campaigns-tab";

export function StrategyWorkspace({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BrainCircuit className="size-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold">AI Strategy</h1>
          <p className="text-sm text-muted-foreground">
            El director de contenido de la marca: analiza la memoria de marca, el calendario y el
            historial; detecta oportunidades y planifica antes de producir.
          </p>
        </div>
      </div>

      <Tabs defaultValue="panel">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="plan">Plan mensual</TabsTrigger>
          <TabsTrigger value="reglas">Reglas y frecuencia</TabsTrigger>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
        </TabsList>

        <TabsContent value="panel" className="pt-4">
          <StrategyPanel clientId={clientId} />
        </TabsContent>
        <TabsContent value="plan" className="pt-4">
          <MonthlyPlanTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="reglas" className="pt-4">
          <RulesFrequencyTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="campanas" className="pt-4">
          <CampaignsTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
