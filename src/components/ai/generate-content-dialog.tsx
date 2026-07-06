"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Copy as CopyIcon, RefreshCw, Save, Sparkles, Wand2 } from "lucide-react";
import { generateAiContent, regenerateAiSection, saveAiGenerationAsContent } from "@/lib/actions/ai";
import {
  AI_CONTENT_TYPES,
  AI_SECTION_LABELS,
  sectionsForType,
  type AiResult,
  type AiSection,
} from "@/lib/ai/schemas";
import { useClientsList } from "@/lib/queries/use-clients";
import { useBrandProducts } from "@/lib/queries/use-brand-memory";
import { useTaxonomy } from "@/lib/queries/use-taxonomy";
import { queryKeys } from "@/lib/queries/keys";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipsInput } from "@/components/shared/chips-input";
import type { AiContentType } from "@/lib/types/database.types";

const NONE = "__none__";

type FormState = {
  clientId: string;
  tema: string;
  tipoContenido: AiContentType;
  objetivo: string;
  productoId: string;
  fechaPublicacion: string;
  pilarId: string;
  subpilarId: string;
  formatoId: string;
  subFormatoId: string;
  contentObjetivo: string;
};

const TIPO_ITEMS = Object.fromEntries(AI_CONTENT_TYPES.map((t) => [t.value, t.label]));

/** Nombres de `formats` candidatos a coincidir con cada tipo de generación, en orden de preferencia. */
const FORMATO_GUESS: Record<AiContentType, string[]> = {
  carrusel: ["carrusel"],
  reel: ["reel"],
  historia: ["historia"],
  post: ["post", "post estático"],
  tiktok: ["tiktok"],
  email: [],
  campana: [],
};

function guessFormatoId(formats: { id: string; name: string }[], tipo: AiContentType): string | null {
  for (const candidate of FORMATO_GUESS[tipo]) {
    const match = formats.find((f) => f.name.trim().toLowerCase() === candidate);
    if (match) return match.id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Editores de secciones del resultado
// ---------------------------------------------------------------------------

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SlidesEditor({ result, update }: { result: AiResult; update: (patch: Partial<AiResult>) => void }) {
  if (!result.slides) return null;
  return (
    <FieldBlock label="Slides (estructura del carrusel)">
      <div className="space-y-3">
        {result.slides.map((slide, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground">Slide {i + 1}</p>
            <Input
              value={slide.titulo}
              placeholder="Título"
              onChange={(e) => {
                const slides = [...result.slides!];
                slides[i] = { ...slide, titulo: e.target.value };
                update({ slides });
              }}
            />
            <Textarea
              rows={2}
              value={slide.texto}
              placeholder="Texto del slide"
              onChange={(e) => {
                const slides = [...result.slides!];
                slides[i] = { ...slide, texto: e.target.value };
                update({ slides });
              }}
            />
            <Textarea
              rows={2}
              value={slide.idea_visual}
              placeholder="Idea visual"
              onChange={(e) => {
                const slides = [...result.slides!];
                slides[i] = { ...slide, idea_visual: e.target.value };
                update({ slides });
              }}
            />
          </div>
        ))}
      </div>
    </FieldBlock>
  );
}

function EscenasEditor({ result, update }: { result: AiResult; update: (patch: Partial<AiResult>) => void }) {
  if (!result.escenas) return null;
  return (
    <FieldBlock label="Escenas">
      <div className="space-y-3">
        {result.escenas.map((escena, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground">Escena {i + 1}</p>
            <Textarea
              rows={2}
              value={escena.descripcion}
              placeholder="Qué se graba"
              onChange={(e) => {
                const escenas = [...result.escenas!];
                escenas[i] = { ...escena, descripcion: e.target.value };
                update({ escenas });
              }}
            />
            <Input
              value={escena.texto_en_pantalla ?? ""}
              placeholder="Texto en pantalla"
              onChange={(e) => {
                const escenas = [...result.escenas!];
                escenas[i] = { ...escena, texto_en_pantalla: e.target.value || null };
                update({ escenas });
              }}
            />
            <Textarea
              rows={2}
              value={escena.voz_en_off ?? ""}
              placeholder="Voz en off"
              onChange={(e) => {
                const escenas = [...result.escenas!];
                escenas[i] = { ...escena, voz_en_off: e.target.value || null };
                update({ escenas });
              }}
            />
          </div>
        ))}
      </div>
    </FieldBlock>
  );
}

function HistoriaEditor({ result, update }: { result: AiResult; update: (patch: Partial<AiResult>) => void }) {
  if (!result.secuencia_historia) return null;
  return (
    <FieldBlock label="Secuencia de historias">
      <div className="space-y-3">
        {result.secuencia_historia.map((frame, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground">Historia {i + 1}</p>
            <Textarea
              rows={2}
              value={frame.descripcion}
              placeholder="Qué se ve"
              onChange={(e) => {
                const secuencia = [...result.secuencia_historia!];
                secuencia[i] = { ...frame, descripcion: e.target.value };
                update({ secuencia_historia: secuencia });
              }}
            />
            <Input
              value={frame.texto ?? ""}
              placeholder="Texto sobre la imagen"
              onChange={(e) => {
                const secuencia = [...result.secuencia_historia!];
                secuencia[i] = { ...frame, texto: e.target.value || null };
                update({ secuencia_historia: secuencia });
              }}
            />
            <Input
              value={frame.interaccion ?? ""}
              placeholder="Interacción (encuesta, pregunta, sticker...)"
              onChange={(e) => {
                const secuencia = [...result.secuencia_historia!];
                secuencia[i] = { ...frame, interaccion: e.target.value || null };
                update({ secuencia_historia: secuencia });
              }}
            />
            <Textarea
              rows={2}
              value={frame.idea_visual}
              placeholder="Idea visual"
              onChange={(e) => {
                const secuencia = [...result.secuencia_historia!];
                secuencia[i] = { ...frame, idea_visual: e.target.value };
                update({ secuencia_historia: secuencia });
              }}
            />
          </div>
        ))}
      </div>
    </FieldBlock>
  );
}

function ResultEditor({
  tipo,
  result,
  update,
}: {
  tipo: AiContentType;
  result: AiResult;
  update: (patch: Partial<AiResult>) => void;
}) {
  return (
    <div className="space-y-4">
      <FieldBlock label="Título interno">
        <Input value={result.titulo_interno} onChange={(e) => update({ titulo_interno: e.target.value })} />
      </FieldBlock>

      {result.hook !== null && (
        <FieldBlock label={tipo === "email" ? "Asunto (hook)" : "Hook"}>
          <Textarea rows={2} value={result.hook ?? ""} onChange={(e) => update({ hook: e.target.value })} />
        </FieldBlock>
      )}

      {result.campana_concepto !== null && (
        <FieldBlock label="Concepto de campaña">
          <Textarea
            rows={3}
            value={result.campana_concepto ?? ""}
            onChange={(e) => update({ campana_concepto: e.target.value })}
          />
        </FieldBlock>
      )}

      {result.campana_piezas && result.campana_piezas.length > 0 && (
        <FieldBlock label="Piezas de la campaña">
          <div className="space-y-3">
            {result.campana_piezas.map((pieza, i) => (
              <div key={i} className="space-y-2 rounded-md border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Pieza {i + 1} · {pieza.tipo}
                </p>
                <Input
                  value={pieza.titulo}
                  onChange={(e) => {
                    const piezas = [...result.campana_piezas!];
                    piezas[i] = { ...pieza, titulo: e.target.value };
                    update({ campana_piezas: piezas });
                  }}
                />
                <Textarea
                  rows={2}
                  value={pieza.descripcion}
                  onChange={(e) => {
                    const piezas = [...result.campana_piezas!];
                    piezas[i] = { ...pieza, descripcion: e.target.value };
                    update({ campana_piezas: piezas });
                  }}
                />
              </div>
            ))}
          </div>
        </FieldBlock>
      )}

      {result.guion !== null && (
        <FieldBlock label="Guion (voz en off)">
          <Textarea rows={5} value={result.guion ?? ""} onChange={(e) => update({ guion: e.target.value })} />
        </FieldBlock>
      )}

      <SlidesEditor result={result} update={update} />
      <EscenasEditor result={result} update={update} />
      <HistoriaEditor result={result} update={update} />

      {result.interaccion_sugerida !== null && (
        <FieldBlock label="Interacción sugerida">
          <Textarea
            rows={2}
            value={result.interaccion_sugerida ?? ""}
            onChange={(e) => update({ interaccion_sugerida: e.target.value })}
          />
        </FieldBlock>
      )}

      {result.email && (
        <>
          <FieldBlock label="Asunto del email">
            <Input
              value={result.email.asunto}
              onChange={(e) => update({ email: { ...result.email!, asunto: e.target.value } })}
            />
          </FieldBlock>
          <FieldBlock label="Preheader">
            <Input
              value={result.email.preheader}
              onChange={(e) => update({ email: { ...result.email!, preheader: e.target.value } })}
            />
          </FieldBlock>
          <FieldBlock label="Cuerpo del email">
            <Textarea
              rows={8}
              value={result.email.cuerpo}
              onChange={(e) => update({ email: { ...result.email!, cuerpo: e.target.value } })}
            />
          </FieldBlock>
        </>
      )}

      <FieldBlock label="Copy (pie de publicación)">
        <Textarea rows={6} value={result.copy} onChange={(e) => update({ copy: e.target.value })} />
      </FieldBlock>

      <FieldBlock label="CTA">
        <Input value={result.cta} onChange={(e) => update({ cta: e.target.value })} />
      </FieldBlock>

      <FieldBlock label="Hashtags">
        <ChipsInput value={result.hashtags} onChange={(hashtags) => update({ hashtags })} />
      </FieldBlock>

      {result.notas_disenador !== null && (
        <FieldBlock label="Notas para el diseñador">
          <Textarea
            rows={3}
            value={result.notas_disenador ?? ""}
            onChange={(e) => update({ notas_disenador: e.target.value })}
          />
        </FieldBlock>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diálogo principal
// ---------------------------------------------------------------------------

export function GenerateContentDialog({
  open,
  onOpenChange,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}) {
  const { data: clients } = useClientsList();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    clientId: defaultClientId ?? "",
    tema: "",
    tipoContenido: "post",
    objetivo: "",
    productoId: NONE,
    fechaPublicacion: "",
    pilarId: NONE,
    subpilarId: NONE,
    formatoId: NONE,
    subFormatoId: NONE,
    contentObjetivo: NONE,
  });
  const [generating, setGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<AiSection | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [savePending, startSaveTransition] = useTransition();

  const { data: products } = useBrandProducts(form.clientId);
  const { data: taxonomy } = useTaxonomy(form.clientId || undefined);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Sugiere el Formato de la taxonomía apenas se conoce el cliente o cambia el
  // tipo de generación, sin pisar una elección manual posterior (misma clave).
  const [autoFormatoKey, setAutoFormatoKey] = useState("");
  const formatoKey = `${form.clientId}:${form.tipoContenido}`;
  if (taxonomy && formatoKey !== autoFormatoKey) {
    setAutoFormatoKey(formatoKey);
    const guess = guessFormatoId(taxonomy.formats, form.tipoContenido);
    if (guess) setForm((prev) => ({ ...prev, formatoId: guess, subFormatoId: NONE }));
  }

  const subpilarOptions = (taxonomy?.subpillars ?? []).filter((sp) => sp.pillar_id === form.pilarId);
  const subFormatoOptions = (taxonomy?.subFormats ?? []).filter((sf) => sf.format_id === form.formatoId);

  function updateResult(patch: Partial<AiResult>) {
    setResult((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await generateAiContent({
        clientId: form.clientId,
        tema: form.tema,
        tipoContenido: form.tipoContenido,
        objetivo: form.objetivo,
        productoId: form.productoId,
        fechaPublicacion: form.fechaPublicacion,
        pilarId: form.pilarId,
        subpilarId: form.subpilarId,
        formatoId: form.formatoId,
        subFormatoId: form.subFormatoId,
        contentObjetivo: form.contentObjetivo,
      });
      if ("error" in response) {
        toast.error(response.error);
        return;
      }
      setGenerationId(response.generationId);
      setResult(response.result);
      setSavedCount(0);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateSection(seccion: AiSection) {
    if (!generationId || !result) return;
    setRegeneratingSection(seccion);
    try {
      const response = await regenerateAiSection(
        { generationId, seccion },
        result as unknown as Record<string, unknown>,
      );
      if ("error" in response) {
        toast.error(response.error);
        return;
      }
      setGenerationId(response.generationId);
      setResult(response.result);
      toast.success(`${AI_SECTION_LABELS[seccion]} regenerado.`);
    } finally {
      setRegeneratingSection(null);
    }
  }

  function handleSave() {
    if (!generationId || !result) return;
    startSaveTransition(async () => {
      const response = await saveAiGenerationAsContent(
        generationId,
        result as unknown as Record<string, unknown>,
      );
      if ("error" in response) {
        toast.error(response.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
      setSavedCount((n) => n + 1);
      toast.success(
        savedCount === 0
          ? "Guardado en el pipeline de contenido (etapa Guion)."
          : "Duplicado guardado en el pipeline.",
      );
    });
  }

  function resetAll() {
    setGenerationId(null);
    setResult(null);
    setSavedCount(0);
  }

  const clientName = clients?.find((c) => c.id === form.clientId)?.name;
  const busy = generating || regeneratingSection !== null;
  const canGenerate = form.clientId && form.tema.trim().length >= 3 && !busy;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && busy) return; // no cerrar en medio de una generación
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Generar con IA
            {clientName && result && (
              <span className="text-sm font-normal text-muted-foreground">· {clientName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La IA ya conoce la marca por su Memoria de Marca: tono, público, productos, palabras
              prohibidas y ejemplos aprobados. Solo indicá qué generar.
            </p>

            {!defaultClientId && (
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  items={Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]))}
                  value={form.clientId || null}
                  onValueChange={(v) => {
                    set("clientId", v ?? "");
                    set("productoId", NONE);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elegí un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tema *</Label>
              <Textarea
                rows={2}
                value={form.tema}
                onChange={(e) => set("tema", e.target.value)}
                placeholder='Ej: "Moto ideal para trabajar en Cuba"'
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Formato de generación *</Label>
                <Select
                  items={TIPO_ITEMS}
                  value={form.tipoContenido}
                  onValueChange={(v) => set("tipoContenido", (v as AiContentType) ?? "post")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo de marketing</Label>
                <Input
                  value={form.objetivo}
                  onChange={(e) => set("objetivo", e.target.value)}
                  placeholder="Ej: más consultas por WhatsApp"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Producto / servicio</Label>
                <Select
                  items={{
                    [NONE]: "Sin producto",
                    ...Object.fromEntries((products ?? []).map((p) => [p.id, p.nombre])),
                  }}
                  value={form.productoId}
                  onValueChange={(v) => set("productoId", v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin producto</SelectItem>
                    {(products ?? [])
                      .filter((p) => p.activo)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de publicación</Label>
                <Input
                  type="date"
                  value={form.fechaPublicacion}
                  onChange={(e) => set("fechaPublicacion", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Clasificación — igual que el calendario, para que quede prolijo en la tabla.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pilar</Label>
                  <Select
                    items={{
                      [NONE]: "Sin pilar",
                      ...Object.fromEntries((taxonomy?.pillars ?? []).map((p) => [p.id, p.name])),
                    }}
                    value={form.pilarId}
                    onValueChange={(v) => {
                      set("pilarId", v ?? NONE);
                      set("subpilarId", NONE);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin pilar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin pilar</SelectItem>
                      {taxonomy?.pillars.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subpilar</Label>
                  <Select
                    items={{
                      [NONE]: "Sin subpilar",
                      ...Object.fromEntries(subpilarOptions.map((sp) => [sp.id, sp.name])),
                    }}
                    value={form.subpilarId}
                    onValueChange={(v) => set("subpilarId", v ?? NONE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin subpilar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin subpilar</SelectItem>
                      {subpilarOptions.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Formato (taxonomía)</Label>
                  <Select
                    items={{
                      [NONE]: "Sin formato",
                      ...Object.fromEntries((taxonomy?.formats ?? []).map((f) => [f.id, f.name])),
                    }}
                    value={form.formatoId}
                    onValueChange={(v) => {
                      set("formatoId", v ?? NONE);
                      set("subFormatoId", NONE);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin formato</SelectItem>
                      {taxonomy?.formats.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub-formato</Label>
                  <Select
                    items={{
                      [NONE]: "Sin sub-formato",
                      ...Object.fromEntries(subFormatoOptions.map((sf) => [sf.id, sf.name])),
                    }}
                    value={form.subFormatoId}
                    onValueChange={(v) => set("subFormatoId", v ?? NONE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin sub-formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin sub-formato</SelectItem>
                      {subFormatoOptions.map((sf) => (
                        <SelectItem key={sf.id} value={sf.id}>
                          {sf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contenido</Label>
                <Select
                  items={{
                    [NONE]: "Sin tipo",
                    ...Object.fromEntries((taxonomy?.objectives ?? []).filter((o) => o.is_active).map((o) => [o.name, o.name])),
                  }}
                  value={form.contentObjetivo}
                  onValueChange={(v) => set("contentObjetivo", v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin tipo</SelectItem>
                    {(taxonomy?.objectives ?? [])
                      .filter((o) => o.is_active)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.name}>
                          {o.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerate} disabled={!canGenerate}>
                <Wand2 className="size-4" />
                {generating ? "Generando... (puede tardar un minuto)" : "Generar contenido"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={busy}>
                <RefreshCw className={generating ? "size-3.5 animate-spin" : "size-3.5"} />
                Regenerar todo
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={busy}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {regeneratingSection ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Regenerando {AI_SECTION_LABELS[regeneratingSection]}...
                    </>
                  ) : (
                    <>
                      Regenerar sección
                      <ChevronDown className="size-3.5" />
                    </>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {sectionsForType(form.tipoContenido).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => handleRegenerateSection(s)}>
                      {AI_SECTION_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" onClick={resetAll} disabled={busy}>
                Nuevo pedido
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={busy || savePending}>
                  {savedCount === 0 ? <Save className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                  {savePending
                    ? "Guardando..."
                    : savedCount === 0
                      ? "Guardar"
                      : "Guardar duplicado"}
                </Button>
              </div>
            </div>

            <ResultEditor tipo={form.tipoContenido} result={result} update={updateResult} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
