import type { Localized } from "@shared/locales";

const en = {
  back: "← All recipes",
  coverLabel: "Cookbook",
  searchLabel: "Search recipes",
  searchPlaceholder: "Search by name or ingredient…",
  noMatch: (q: string) => `No recipe matches “${q}”. Try an ingredient, for example courgette.`,
  recipe: "recipe",
  notes: "notes",
  timers: (n: number) => `${n} timer${n > 1 ? "s" : ""}`,
  number: "No.",
  hint: "Tap a ⏱ time to start a timer. It keeps running in the Timers tab.",
  ready: "✓ Ready!",
  silence: "Silence",
  cancel: "Cancel",
  cancelTimer: (d: string) => `Cancel ${d} timer`,
  moreRecipes: "More recipes",
  step: (n: number, done: boolean) => `Step ${n}${done ? ", done" : ""}`,
  importButton: "Import recipes",
  importHint: "JSON (one recipe or a full export) or Markdown files. They're kept on this device.",
  importResult: (added: number, unchanged: number) => {
    const parts = [
      added > 0 && `${added} recipe${added > 1 ? "s" : ""} added`,
      unchanged > 0 && `${unchanged} already in your book`,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Nothing new to import.";
  },
  importProblems: "Couldn't import:",
  tooBig: "file too large (max 2 MB)",
  dismiss: "Dismiss",
  restore: "Restore default recipes",
  yours: "yours",
  removeThis: "Remove from my book",
  confirmRemove: (title: string) => `Remove “${title}” from your book? You can restore the default recipes any time.`,
};

export const messages: Localized<typeof en> = {
  en,
  pt: {
    back: "← Todas as receitas",
    coverLabel: "Caderno de receitas",
    searchLabel: "Pesquisar receitas",
    searchPlaceholder: "Pesquisar por nome ou ingrediente…",
    noMatch: (q) => `Nenhuma receita corresponde a “${q}”. Experimente um ingrediente, por exemplo courgette.`,
    recipe: "receita",
    notes: "notas",
    timers: (n) => `${n} temporizador${n > 1 ? "es" : ""}`,
    number: "N.º",
    hint: "Toque num tempo ⏱ para iniciar um temporizador. Continua a contar no separador Temporizadores.",
    ready: "✓ Pronto!",
    silence: "Silenciar",
    cancel: "Cancelar",
    cancelTimer: (d) => `Cancelar temporizador de ${d}`,
    moreRecipes: "Mais receitas",
    step: (n, done) => `Passo ${n}${done ? ", feito" : ""}`,
    importButton: "Importar receitas",
    importHint: "Ficheiros JSON (uma receita ou uma exportação completa) ou Markdown. Ficam guardados neste dispositivo.",
    importResult: (added, unchanged) => {
      const parts = [
        added > 0 && `${added} receita${added > 1 ? "s" : ""} adicionada${added > 1 ? "s" : ""}`,
        unchanged > 0 && `${unchanged} já ${unchanged > 1 ? "estavam" : "estava"} no seu caderno`,
      ].filter(Boolean);
      return parts.length ? parts.join(" · ") : "Nada de novo para importar.";
    },
    importProblems: "Não foi possível importar:",
    tooBig: "ficheiro demasiado grande (máx. 2 MB)",
    dismiss: "Fechar",
    restore: "Repor receitas originais",
    yours: "sua",
    removeThis: "Remover do meu caderno",
    confirmRemove: (title) => `Remover “${title}” do seu caderno? Pode repor as receitas originais quando quiser.`,
  },
  it: {
    back: "← Tutte le ricette",
    coverLabel: "Ricettario",
    searchLabel: "Cerca ricette",
    searchPlaceholder: "Cerca per nome o ingrediente…",
    noMatch: (q) => `Nessuna ricetta corrisponde a “${q}”. Prova con un ingrediente, per esempio zucchine.`,
    recipe: "ricetta",
    notes: "note",
    timers: (n) => `${n} timer`,
    number: "N.",
    hint: "Tocca un tempo ⏱ per avviare un timer. Continua a scorrere nella scheda Timer.",
    ready: "✓ Pronto!",
    silence: "Silenzia",
    cancel: "Annulla",
    cancelTimer: (d) => `Annulla il timer di ${d}`,
    moreRecipes: "Altre ricette",
    step: (n, done) => `Passo ${n}${done ? ", fatto" : ""}`,
    importButton: "Importa ricette",
    importHint: "File JSON (una ricetta o un'esportazione completa) o Markdown. Restano su questo dispositivo.",
    importResult: (added, unchanged) => {
      const parts = [
        added > 0 && `${added} ${added > 1 ? "ricette aggiunte" : "ricetta aggiunta"}`,
        unchanged > 0 && `${unchanged} già ${unchanged > 1 ? "presenti" : "presente"} nel tuo ricettario`,
      ].filter(Boolean);
      return parts.length ? parts.join(" · ") : "Niente di nuovo da importare.";
    },
    importProblems: "Impossibile importare:",
    tooBig: "file troppo grande (max 2 MB)",
    dismiss: "Chiudi",
    restore: "Ripristina le ricette originali",
    yours: "tua",
    removeThis: "Rimuovi dal mio ricettario",
    confirmRemove: (title) => `Rimuovere “${title}” dal tuo ricettario? Puoi ripristinare le ricette originali quando vuoi.`,
  },
};
