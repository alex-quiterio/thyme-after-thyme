import tseslint from "typescript-eslint";

// Dependency direction: ui -> application -> domain; infrastructure -> application -> domain.
// main.tsx (composition root) is the only file allowed to see every layer.
const rule = (...banned) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        { group: ["../*"], message: "Use an alias import (@domain/..., @ui/...) across folders." },
        ...banned.map(([group, message]) => ({ group, message })),
      ],
    },
  ],
});

const layer = (dir, ...banned) => ({
  files: [`apps/timer/src/${dir}/**/*.{ts,tsx}`],
  rules: rule(...banned),
});

export default tseslint.config(
  { ignores: ["**/dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  { files: ["**/*.test.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
  layer("domain",
    [["@application/*", "@infrastructure/*", "@ui/*"], "domain depends on nothing else"],
    [["react", "react-dom/*", "@kitchen/*"], "domain stays framework- and library-free"]),
  layer("application",
    [["@infrastructure/*", "@ui/*"], "application only talks to ports"],
    [["react", "react-dom/*", "@kitchen/*"], "application stays framework- and library-free"]),
  layer("infrastructure",
    [["@ui/*"], "infrastructure must not know the UI"]),
  layer("ui",
    [["@infrastructure/*", "@kitchen/*"], "ui gets its adapters from main.tsx via the application layer"]),
);
