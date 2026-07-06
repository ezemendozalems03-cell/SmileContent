"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importBrandbook } from "@/lib/actions/brand-import";

/**
 * "Importar brandbook": la IA lee el manual de marca (PDF subido o texto
 * pegado) y completa la Memoria de Marca. Suma sobre lo existente; no borra
 * lo cargado a mano.
 */
export function BrandbookImportButton({
  clientId,
  onImported,
}: {
  clientId: string;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file && !texto.trim()) {
      toast.error("Subí un PDF o pegá el texto del brandbook.");
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      if (file) formData.set("file", file);
      if (texto.trim()) formData.set("texto", texto);
      const result = await importBrandbook(clientId, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Brandbook importado: ${result.camposCargados} campos cargados` +
          (result.productosCreados > 0 ? ` y ${result.productosCreados} productos/servicios.` : "."),
      );
      onImported();
      setOpen(false);
      setTexto("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileUp className="size-3.5" />
        Importar brandbook
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && importing) return; // no cerrar en medio de la lectura
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar brandbook</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La IA lee el manual de marca y completa la Memoria de Marca: tono, público,
              colores, productos… Suma sobre lo que ya está cargado, no lo pisa.
            </p>

            <div className="space-y-2">
              <Label htmlFor="brandbook-file">Subir PDF (máx. 10 MB)</Label>
              <Input id="brandbook-file" ref={fileRef} type="file" accept="application/pdf,.pdf" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandbook-texto">…o pegá el texto acá</Label>
              <Textarea
                id="brandbook-texto"
                rows={8}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Copiá y pegá el brandbook, un doc de onboarding, el brief del cliente…"
              />
              <p className="text-xs text-muted-foreground">Si cargás ambos, se usa el PDF.</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Leyendo… (puede tardar un minuto)
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
