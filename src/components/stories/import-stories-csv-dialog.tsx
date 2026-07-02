"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCsvFile, type ParsedCsv } from "@/lib/import/csv-parse";
import { STORY_CSV_IMPORTABLE_FIELDS, STORY_CSV_IGNORE_VALUE } from "@/lib/import/story-csv-fields";
import {
  importStoriesFromCsv,
  type MappedStoryRow,
  type ImportedStoryRow,
  type SkippedStoryRow,
  type FailedStoryRow,
} from "@/lib/actions/stories-import";
import { queryKeys } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "upload" | "map" | "results";

function normalizeHeaderForGuess(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const norm = normalizeHeaderForGuess(header);
    const match = STORY_CSV_IMPORTABLE_FIELDS.find(
      (f) => normalizeHeaderForGuess(f.label) === norm || normalizeHeaderForGuess(f.key) === norm,
    );
    mapping[header] = match ? match.key : STORY_CSV_IGNORE_VALUE;
  }
  return mapping;
}

function buildMappedRows(csv: ParsedCsv, mapping: Record<string, string>): MappedStoryRow[] {
  return csv.rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const header of csv.headers) {
      const target = mapping[header];
      if (target && target !== STORY_CSV_IGNORE_VALUE) mapped[target] = row[header] ?? "";
    }
    return mapped as MappedStoryRow;
  });
}

export function ImportStoriesCsvDialog({
  open,
  onOpenChange,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ imported: ImportedStoryRow[]; skipped: SkippedStoryRow[]; failed: FailedStoryRow[] } | null>(
    null,
  );

  function reset() {
    setStep("upload");
    setCsv(null);
    setMapping({});
    setDragOver(false);
    setParsing(false);
    setSubmitting(false);
    setResult(null);
  }

  async function handleFile(file: File | undefined) {
    if (!file || !defaultClientId) return;
    setParsing(true);
    try {
      const parsed = await parseCsvFile(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error("El archivo no tiene columnas o filas para importar.");
        return;
      }
      setCsv(parsed);
      setMapping(guessMapping(parsed.headers));
      setStep("map");
    } catch (err) {
      toast.error("No se pudo leer el archivo CSV", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setParsing(false);
    }
  }

  const requiredFields = STORY_CSV_IMPORTABLE_FIELDS.filter((f) => f.required);
  const mappedKeys = Object.values(mapping);
  const missingRequired = requiredFields.filter((f) => !mappedKeys.includes(f.key));

  async function handleImport() {
    if (!csv || !defaultClientId) return;
    setSubmitting(true);
    const rows = buildMappedRows(csv, mapping);
    const response = await importStoriesFromCsv({ clientId: defaultClientId, rows });
    setSubmitting(false);

    if ("error" in response) {
      toast.error(response.error);
      return;
    }

    setResult(response);
    queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    if (response.imported.length > 0) {
      toast.success(`${response.imported.length} historia${response.imported.length === 1 ? "" : "s"} importada${response.imported.length === 1 ? "" : "s"}`);
    }
    setStep("results");
  }

  const previewRows = csv ? buildMappedRows(csv, mapping).slice(0, 5) : [];
  const mappedTargetKeys = STORY_CSV_IMPORTABLE_FIELDS.filter((f) => mappedKeys.includes(f.key));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className={cn("flex max-h-[85vh] flex-col", "max-w-lg", step === "map" && "max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Subí un CSV con historias para crear varias a la vez."
              : step === "map"
                ? "Indicá a qué campo corresponde cada columna del archivo."
                : "Resultado de la importación."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
        {step === "upload" ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors",
                dragOver && "border-primary bg-accent/30",
              )}
            >
              <UploadCloud className="size-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {parsing ? "Leyendo archivo…" : "Arrastrá un archivo .csv o hacé clic para subir"}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>
        ) : null}

        {step === "map" && csv ? (
          <div className="space-y-4">
            <div className="grid max-h-56 grid-cols-1 gap-x-4 gap-y-1 overflow-y-auto pr-1 sm:grid-cols-2">
              {csv.headers.map((header) => (
                <div key={header} className="flex items-center gap-1.5">
                  <span className="w-20 shrink-0 truncate text-xs text-muted-foreground" title={header}>
                    {header}
                  </span>
                  <Select
                    items={{
                      [STORY_CSV_IGNORE_VALUE]: "Ignorar",
                      ...Object.fromEntries(STORY_CSV_IMPORTABLE_FIELDS.map((f) => [f.key, f.label])),
                    }}
                    value={mapping[header] ?? STORY_CSV_IGNORE_VALUE}
                    onValueChange={(v) => v && setMapping((prev) => ({ ...prev, [header]: v }))}
                  >
                    <SelectTrigger size="sm" className="h-6 w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={STORY_CSV_IGNORE_VALUE}>Ignorar</SelectItem>
                      {STORY_CSV_IMPORTABLE_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                          {f.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {missingRequired.length > 0 ? (
              <p className="text-xs text-amber-400">
                Mapeá una columna a {missingRequired.map((f) => f.label).join(" y a ")} para continuar.
              </p>
            ) : null}

            {mappedTargetKeys.length > 0 ? (
              <div className="max-h-48 overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {mappedTargetKeys.map((f) => (
                        <TableHead key={f.key} className="whitespace-nowrap text-xs">
                          {f.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {mappedTargetKeys.map((f) => (
                          <TableCell key={f.key} className="max-w-40 truncate text-xs">
                            {(row as Record<string, string>)[f.key] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Vista previa de las primeras {previewRows.length} filas de {csv.rows.length}.
            </p>
          </div>
        ) : null}

        {step === "results" && result ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-emerald-400">
              {result.imported.length} importada{result.imported.length === 1 ? "" : "s"}
            </p>
            {result.imported.some((r) => r.warnings.length > 0) ? (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {result.imported
                  .filter((r) => r.warnings.length > 0)
                  .map((r) => (
                    <li key={r.rowIndex}>
                      <span className="font-medium text-foreground">{r.nombre}</span> — {r.warnings.join("; ")}
                    </li>
                  ))}
              </ul>
            ) : null}

            {result.skipped.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium text-amber-400">
                  {result.skipped.length} omitida{result.skipped.length === 1 ? "" : "s"} (duplicada
                  {result.skipped.length === 1 ? "" : "s"}):
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.skipped.map((r) => (
                    <li key={r.rowIndex}>
                      <span className="font-medium text-foreground">{r.nombre}</span> — {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.failed.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium text-red-400">
                  {result.failed.length} con error:
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {result.failed.map((r) => (
                    <li key={r.rowIndex}>
                      <span className="font-medium text-foreground">{r.nombre}</span> — {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        </div>

        <DialogFooter>
          {step === "map" ? (
            <Button onClick={handleImport} disabled={missingRequired.length > 0 || submitting}>
              {submitting ? "Importando…" : "Importar"}
            </Button>
          ) : step === "results" ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Listo
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
