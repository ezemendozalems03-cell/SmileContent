"use client";

import { Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  upsertBrandMemorySection,
  upsertBrandVisualIdentity,
  upsertBrandVoice,
} from "@/lib/actions/brand-memory";
import {
  useBrandMemory,
  useBrandVisualIdentity,
  useBrandVoice,
  useInvalidateBrandMemory,
} from "@/lib/queries/use-brand-memory";
import { BrandSectionForm, type BrandFieldDef } from "@/components/brand-memory/brand-section-form";
import { BrandProductsPanel } from "@/components/brand-memory/brand-products-panel";
import { BrandLearningPanel } from "@/components/brand-memory/brand-learning-panel";
import { BrandExamplesPanel } from "@/components/brand-memory/brand-examples-panel";
import { BrandbookImportButton } from "@/components/brand-memory/brandbook-import-button";

const GENERAL_FIELDS: BrandFieldDef[] = [
  { key: "nombre_comercial", label: "Nombre comercial", type: "text" },
  { key: "rubro", label: "Rubro", type: "text" },
  { key: "descripcion", label: "Descripción", type: "textarea" },
  { key: "historia", label: "Historia", type: "textarea", rows: 4 },
  { key: "mision", label: "Misión", type: "textarea", rows: 2 },
  { key: "vision", label: "Visión", type: "textarea", rows: 2 },
  { key: "valores", label: "Valores", type: "chips", wide: true },
];

const AUDIENCE_FIELDS: BrandFieldDef[] = [
  { key: "publico_edad", label: "Edad", type: "text", placeholder: "Ej: 25 a 45 años" },
  { key: "publico_pais", label: "País", type: "text" },
  { key: "publico_ciudad", label: "Ciudad", type: "text" },
  { key: "publico_nivel_socioeconomico", label: "Nivel socioeconómico", type: "text" },
  { key: "publico_problemas", label: "Problemas", type: "chips", wide: true },
  { key: "publico_deseos", label: "Deseos", type: "chips", wide: true },
  { key: "publico_objeciones", label: "Objeciones", type: "chips", wide: true },
  { key: "publico_intereses", label: "Intereses", type: "chips", wide: true },
  {
    key: "publico_lenguaje",
    label: "Lenguaje",
    type: "textarea",
    rows: 2,
    placeholder: "Cómo habla el público: voseo, jerga, formalidad...",
  },
];

const NETWORKS_FIELDS: BrandFieldDef[] = [
  { key: "red_instagram", label: "Instagram", type: "text", placeholder: "@usuario" },
  { key: "red_facebook", label: "Facebook", type: "text" },
  { key: "red_tiktok", label: "TikTok", type: "text", placeholder: "@usuario" },
  { key: "red_sitio_web", label: "Sitio web", type: "text" },
  { key: "red_whatsapp", label: "WhatsApp", type: "text" },
  { key: "competidores", label: "Competidores", type: "chips", wide: true },
  {
    key: "objetivos_marketing",
    label: "Objetivos de marketing",
    type: "chips",
    wide: true,
    placeholder: "Más consultas, más ventas, branding, autoridad, comunidad...",
  },
];

const VOICE_FIELDS: BrandFieldDef[] = [
  { key: "tono", label: "Tono", type: "text", placeholder: "Ej: cercano, directo, motivador" },
  { key: "personalidad", label: "Personalidad", type: "text" },
  { key: "nivel_formalidad", label: "Nivel de formalidad", type: "text", placeholder: "Ej: informal, vosea al público" },
  { key: "emojis_permitidos", label: "Emojis permitidos", type: "chips" },
  { key: "emojis_prohibidos", label: "Emojis prohibidos", type: "chips" },
  { key: "palabras_permitidas", label: "Palabras permitidas", type: "chips", wide: true },
  { key: "palabras_prohibidas", label: "Palabras prohibidas", type: "chips", wide: true },
  { key: "frases_tipicas", label: "Frases típicas", type: "chips", wide: true },
  { key: "ctas_habituales", label: "CTA habituales", type: "chips", wide: true },
];

const VISUAL_FIELDS: BrandFieldDef[] = [
  {
    key: "logo_descripcion",
    label: "Logo (descripción de uso)",
    type: "textarea",
    rows: 2,
    placeholder: "El archivo va en Biblioteca; acá describí versiones y usos.",
  },
  { key: "colores", label: "Colores", type: "chips", placeholder: "Ej: #1A1A2E azul noche" },
  { key: "tipografias", label: "Tipografías", type: "chips" },
  { key: "estilo_fotografico", label: "Estilo fotográfico", type: "textarea", rows: 2 },
  { key: "estilo_grafico", label: "Estilo gráfico", type: "textarea", rows: 2 },
  { key: "estilo_carruseles", label: "Estilo de carruseles", type: "textarea", rows: 2 },
  { key: "estilo_historias", label: "Estilo de historias", type: "textarea", rows: 2 },
  { key: "estilo_reels", label: "Estilo de reels", type: "textarea", rows: 2 },
];

export function BrandMemoryWorkspace({ clientId }: { clientId: string }) {
  const memoryQuery = useBrandMemory(clientId);
  const voiceQuery = useBrandVoice(clientId);
  const visualQuery = useBrandVisualIdentity(clientId);
  const invalidate = useInvalidateBrandMemory();

  const loading = memoryQuery.isLoading || voiceQuery.isLoading || visualQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Brain className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold">Memoria de Marca</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que la IA sabe de este cliente. Se carga una vez y se usa automáticamente en
            cada generación: nunca más vas a tener que explicar la marca.
          </p>
        </div>
        <BrandbookImportButton clientId={clientId} onImported={() => invalidate(clientId)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="publico">Público</TabsTrigger>
            <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="productos">Productos y servicios</TabsTrigger>
            <TabsTrigger value="redes">Redes y objetivos</TabsTrigger>
            <TabsTrigger value="aprendizaje">Aprendizajes</TabsTrigger>
            <TabsTrigger value="ejemplos">Ejemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="pt-4">
            <BrandSectionForm
              fields={GENERAL_FIELDS}
              row={memoryQuery.data ?? null}
              description="Quién es la marca: la IA usa esta ficha como base de todo lo que escribe."
              onSave={(values) => upsertBrandMemorySection(clientId, "general", values)}
              onSaved={() => invalidate(clientId)}
            />
          </TabsContent>

          <TabsContent value="publico" className="pt-4">
            <BrandSectionForm
              fields={AUDIENCE_FIELDS}
              row={memoryQuery.data ?? null}
              description="A quién le habla la marca: problemas, deseos y objeciones alimentan hooks y CTAs."
              onSave={(values) => upsertBrandMemorySection(clientId, "audience", values)}
              onSaved={() => invalidate(clientId)}
            />
          </TabsContent>

          <TabsContent value="comunicacion" className="pt-4">
            <BrandSectionForm
              fields={VOICE_FIELDS}
              row={voiceQuery.data ?? null}
              description="Cómo habla la marca. Las palabras prohibidas nunca aparecen en el contenido generado."
              onSave={(values) => upsertBrandVoice(clientId, values)}
              onSaved={() => invalidate(clientId)}
            />
          </TabsContent>

          <TabsContent value="visual" className="pt-4">
            <BrandSectionForm
              fields={VISUAL_FIELDS}
              row={visualQuery.data ?? null}
              description="La IA usa esto para las ideas visuales y las notas al diseñador. Los archivos (logo, manual) van en Biblioteca."
              onSave={(values) => upsertBrandVisualIdentity(clientId, values)}
              onSaved={() => invalidate(clientId)}
            />
          </TabsContent>

          <TabsContent value="productos" className="pt-4">
            <BrandProductsPanel clientId={clientId} />
          </TabsContent>

          <TabsContent value="redes" className="pt-4">
            <BrandSectionForm
              fields={NETWORKS_FIELDS}
              row={memoryQuery.data ?? null}
              description="Redes, competidores y objetivos de marketing. Los pilares de contenido se administran en Configuración → Pilares."
              onSave={(values) => upsertBrandMemorySection(clientId, "networks", values)}
              onSaved={() => invalidate(clientId)}
            />
          </TabsContent>

          <TabsContent value="aprendizaje" className="pt-4">
            <BrandLearningPanel clientId={clientId} />
          </TabsContent>

          <TabsContent value="ejemplos" className="pt-4">
            <BrandExamplesPanel clientId={clientId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
