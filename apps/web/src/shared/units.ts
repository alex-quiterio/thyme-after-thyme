/** The units a recipe quantity can be expressed in (shared by the recipe book and the scaler). */
export const units = ["g", "kg", "ml", "L", "cup", "tbsp", "tsp", "pcs"] as const;
export type Unit = (typeof units)[number];
