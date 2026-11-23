/** Lowercase and strip accents so "cafe" finds "café". */
export const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
