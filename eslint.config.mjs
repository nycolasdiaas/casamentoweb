import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import searchParamsEmSuspense from "./eslint-rules/searchparams-em-suspense.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Permite parâmetros/variáveis prefixados com _ (ex: prevState não usado
  // em actions de useActionState).
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Cache Components: `searchParams` no corpo de uma página com
  // `generateStaticParams` reprova o `next build` com uma mensagem que aponta
  // para o <body>, não para a linha. A regra aponta a linha, no editor, antes
  // do build. Ver o cabeçalho do arquivo da regra.
  {
    files: ["app/**/page.tsx"],
    plugins: { enlace: { rules: { "searchparams-em-suspense": searchParamsEmSuspense } } },
    rules: { "enlace/searchparams-em-suspense": "error" },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
