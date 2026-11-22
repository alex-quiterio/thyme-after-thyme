import tseslint from "typescript-eslint";

// Per tool: ui -> application -> domain, infrastructure -> application -> domain.
// Tools never import each other. main.tsx (composition root) may import everything.
const TOOLS = ["timer", "scaler"];
const layers = ["domain", "application", "infrastructure", "ui"];

const noRelativeUp = { group: ["../*"], message: "Use an alias import (@timer/domain/..., @shared/...) across folders." };
const lib = ["react", "react-dom", "react-dom/*", "@kitchen/*"];

const ban = (tool, layer) => {
  const others = TOOLS.filter((t) => t !== tool).map((t) => `@${t}/*`);
  const own = (l) => `@${tool}/${l}/*`;
  const patterns = [
    noRelativeUp,
    { group: [...others, "@shell/*"], message: "Tools must not depend on each other or on the shell." },
  ];
  if (layer === "domain")
    patterns.push({ group: [own("application"), own("infrastructure"), own("ui"), ...lib], message: "domain depends on nothing" });
  if (layer === "application")
    patterns.push({ group: [own("infrastructure"), own("ui"), ...lib], message: "application only talks to ports" });
  if (layer === "infrastructure")
    patterns.push({ group: [own("ui"), "react", "react-dom", "react-dom/*"], message: "infrastructure must not know the UI" });
  if (layer === "ui")
    patterns.push({ group: [own("infrastructure"), "@kitchen/*"], message: "ui gets adapters through main.tsx" });
  return { files: [`apps/web/src/tools/${tool}/${layer}/**/*.{ts,tsx}`], rules: { "no-restricted-imports": ["error", { patterns }] } };
};

export default tseslint.config(
  { ignores: ["**/dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  { files: ["**/*.test.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
  ...TOOLS.flatMap((tool) => layers.map((layer) => ban(tool, layer))),
  {
    files: ["apps/web/src/shell/**/*.{ts,tsx}", "apps/web/src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [noRelativeUp, { group: TOOLS.map((t) => `@${t}/*`), message: "shell/shared must not import tools" }] }],
    },
  },
);
