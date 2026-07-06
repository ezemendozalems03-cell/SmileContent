/**
 * Color determinístico por nombre para etiquetas de taxonomía (formato, pilar,
 * tipo de contenido…), estilo Notion: el mismo nombre siempre recibe el mismo
 * color, sin configuración manual.
 */
const TAG_COLOR_CLASSES = [
  "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  "bg-lime-500/15 text-lime-300 border-lime-500/30",
  "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  "bg-teal-500/15 text-teal-300 border-teal-500/30",
  "bg-pink-500/15 text-pink-300 border-pink-500/30",
];

export function tagColorClass(name: string): string {
  let hash = 0;
  const normalized = name.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return TAG_COLOR_CLASSES[hash % TAG_COLOR_CLASSES.length];
}
