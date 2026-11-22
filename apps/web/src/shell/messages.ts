import type { Localized } from "@shared/locales";

const en = {
  tagline: "kitchen tools for people who keep burning the garlic",
  navLabel: "Kitchen tools",
  languageLabel: "Language",
  install: "Install app",
  update: {
    title: "A fresher batch is ready",
    text: "A new version of Thyme After Thyme is available. Updating reloads the page; your running timers are kept.",
    now: "Update now",
    later: "Later",
  },
};

export const messages: Localized<typeof en> = {
  en,
  pt: {
    tagline: "ferramentas de cozinha para quem se esquece sempre do alho ao lume",
    navLabel: "Ferramentas de cozinha",
    languageLabel: "Idioma",
    install: "Instalar app",
    update: {
      title: "Uma fornada fresquinha está pronta",
      text: "Está disponível uma nova versão do Thyme After Thyme. Atualizar recarrega a página; os temporizadores em curso são mantidos.",
      now: "Atualizar agora",
      later: "Mais tarde",
    },
  },
  it: {
    tagline: "strumenti da cucina per chi continua a bruciare l'aglio",
    navLabel: "Strumenti da cucina",
    languageLabel: "Lingua",
    install: "Installa l'app",
    update: {
      title: "Una nuova infornata è pronta",
      text: "È disponibile una nuova versione di Thyme After Thyme. Aggiornare ricarica la pagina; i timer in corso vengono mantenuti.",
      now: "Aggiorna ora",
      later: "Più tardi",
    },
  },
};
