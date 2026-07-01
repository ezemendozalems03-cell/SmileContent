"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  NestedTaxonomySection,
  type ParentItem,
} from "@/components/settings/nested-taxonomy-section";
import {
  createPillar,
  deletePillar,
  createSubpillar,
  deleteSubpillar,
  createFormat,
  deleteFormat,
  createSubFormat,
  deleteSubFormat,
  createStoryType,
  deleteStoryType,
} from "@/lib/actions/taxonomy";
import type { Pillar, Subpillar, Format, SubFormat, StoryType } from "@/lib/types/domain";

function toParentItems(
  parents: (Pillar | Format | StoryType)[],
  childrenByParent: Map<string, { id: string; name: string }[]>,
): ParentItem[] {
  return parents.map((p) => ({ id: p.id, name: p.name, children: childrenByParent.get(p.id) ?? [] }));
}

export function PillarsFormatsManager({
  clientId,
  pillars,
  subpillars,
  formats,
  subFormats,
  storyTypes,
}: {
  clientId: string | null;
  pillars: Pillar[];
  subpillars: Subpillar[];
  formats: Format[];
  subFormats: SubFormat[];
  storyTypes: StoryType[];
}) {
  const globalPillars = pillars.filter((p) => p.client_id === null);
  const ownPillars = clientId ? pillars.filter((p) => p.client_id === clientId) : undefined;

  const globalFormats = formats.filter((f) => f.client_id === null);
  const ownFormats = clientId ? formats.filter((f) => f.client_id === clientId) : undefined;

  const globalStoryTypes = storyTypes.filter((s) => s.client_id === null);
  const ownStoryTypes = clientId ? storyTypes.filter((s) => s.client_id === clientId) : undefined;

  const subpillarsByPillar = new Map<string, { id: string; name: string }[]>();
  for (const sp of subpillars) {
    const list = subpillarsByPillar.get(sp.pillar_id) ?? [];
    list.push({ id: sp.id, name: sp.name });
    subpillarsByPillar.set(sp.pillar_id, list);
  }

  const subFormatsByFormat = new Map<string, { id: string; name: string }[]>();
  for (const sf of subFormats) {
    const list = subFormatsByFormat.get(sf.format_id) ?? [];
    list.push({ id: sf.id, name: sf.name });
    subFormatsByFormat.set(sf.format_id, list);
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        <NestedTaxonomySection
          title="Pilares de contenido"
          description="Cada publicación se clasifica bajo un pilar (y opcionalmente un subpilar)."
          globalItems={toParentItems(globalPillars, subpillarsByPillar)}
          ownItems={ownPillars ? toParentItems(ownPillars, subpillarsByPillar) : undefined}
          createParentAction={createPillar.bind(null, clientId)}
          onDeleteParent={(id) => deletePillar(clientId, id)}
          onDeleteChild={(id) => deleteSubpillar(clientId, id)}
          getCreateChildAction={(pillarId) => createSubpillar.bind(null, clientId, pillarId)}
          childLabel="Subpilar"
          addPlaceholder="Nuevo pilar…"
        />

        <Separator />

        <NestedTaxonomySection
          title="Formatos"
          description="Reel, Carrusel, Post estático, Historia, TikTok, etc. — con sus sub-formatos."
          globalItems={toParentItems(globalFormats, subFormatsByFormat)}
          ownItems={ownFormats ? toParentItems(ownFormats, subFormatsByFormat) : undefined}
          createParentAction={createFormat.bind(null, clientId)}
          onDeleteParent={(id) => deleteFormat(clientId, id)}
          onDeleteChild={(id) => deleteSubFormat(clientId, id)}
          getCreateChildAction={(formatId) => createSubFormat.bind(null, clientId, formatId)}
          childLabel="Sub-formato"
          addPlaceholder="Nuevo formato…"
        />

        <Separator />

        <NestedTaxonomySection
          title="Tipos de historia"
          description="Encuesta, Pregunta, Quiz, Oferta, etc."
          globalItems={toParentItems(globalStoryTypes, new Map())}
          ownItems={ownStoryTypes ? toParentItems(ownStoryTypes, new Map()) : undefined}
          createParentAction={createStoryType.bind(null, clientId)}
          onDeleteParent={(id) => deleteStoryType(clientId, id)}
          addPlaceholder="Nuevo tipo de historia…"
        />
      </CardContent>
    </Card>
  );
}
