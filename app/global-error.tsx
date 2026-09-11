"use client";

/**
 * O último recurso: a falha aconteceu no próprio layout raiz.
 *
 * Quando o erro estoura antes do layout existir, o `error.tsx` não tem onde
 * ser renderizado — e o Next volta a mostrar a tela dele, em inglês. Esta
 * substitui, e por isso precisa trazer o próprio `<html>` e o próprio
 * `<body>`: aqui não há layout, não há fonte carregada e não há folha de
 * estilo garantida. Tudo é embutido de propósito.
 *
 * O texto segue a mesma regra do resto do produto: diz o que houve, não culpa
 * ninguém, e oferece uma saída.
 */
export default function ErroGlobal({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f2ec",
          color: "#2b2a26",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7a756c",
            }}
          >
            Alguma coisa falhou
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "28px",
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            Essa tela não abriu
          </h1>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6, color: "#55504a" }}>
            O problema foi do nosso lado. Nada do que vocês já salvaram se
            perdeu.
          </p>
          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#2b2a26",
                color: "#f5f2ec",
                border: 0,
                borderRadius: "3px",
                padding: "12px 20px",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
            {/* `<a>` e não `<Link />` de propósito: aqui o layout raiz já
                falhou, e uma navegação do lado do cliente dependeria da mesma
                árvore que acabou de quebrar. Recarregar a página inteira é o
                que tem mais chance de funcionar. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/conta/pedidos"
              style={{
                border: "1px solid #d6d0c6",
                borderRadius: "3px",
                padding: "12px 20px",
                fontSize: "15px",
                color: "#2b2a26",
                textDecoration: "none",
              }}
            >
              Ir para meus pedidos
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
