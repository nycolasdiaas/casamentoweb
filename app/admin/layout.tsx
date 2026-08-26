import { Suspense } from "react";
import { uiPrensa } from "@/lib/fonts/ui";
import AdminNav from "@/components/admin/AdminNav";
import { getSessionAdminId } from "@/lib/auth/session";
import { getAdminById } from "@/lib/repositories/admins";

/**
 * Painel do admin: tudo aqui depende de sessão e lê o banco, então é
 * dinâmico por natureza — não existe shell estático útil para uma tela que
 * só faz sentido depois de autenticar.
 *
 * O <Suspense> vive aqui, e não em cada página, porque a fronteira é a mesma
 * para todas: nada do /admin é cacheável entre usuários.
 *
 * Ver docs/sdd-geracao-automatica.md §3.2.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O escopo `.ui-prensa` precisa envolver o admin: os tokens --c-* vivem
  // DENTRO dele, e sem isso a migração de cor não resolveria nada — as
  // classes existiriam apontando para variáveis inexistentes.
  //
  // `admin` sobrescreve os MESMOS tokens com o tema escuro da prancha G. É
  // por isso que a virada custa uma palavra e não uma folha de estilo: as
  // telas já falam em `--c-ink`, `--c-surface`, `--c-rule`; o que muda é para
  // onde essas variáveis apontam.
  //
  // A separação não é estética. O casal está no dia mais importante da vida
  // dele; a equipe está trabalhando, várias vezes por dia, e precisa de uma
  // tela que não a confunda com o painel do cliente quando as duas estiverem
  // abertas lado a lado.
  return (
    <div className={`${uiPrensa} admin flex-1 flex flex-col`}>
      {/* A barra tem o PRÓPRIO <Suspense>.
          Ela lê a sessão, e com `cacheComponents` ligado toda leitura não
          cacheada fora de um limite bloqueia a rota inteira — o build reprova
          com "Uncached data was accessed outside of <Suspense>". Com o limite
          aqui, o conteúdo da página não espera a barra e vice-versa. */}
      <Suspense fallback={<BarraVazia />}>
        <BarraDoAdmin />
      </Suspense>
      <Suspense fallback={<PainelCarregando />}>{children}</Suspense>
    </div>
  );
}

/**
 * O admin ganha esqueleto de LISTA, não a logo: aqui quem espera é a equipe,
 * várias vezes por dia, e a silhueta das linhas diz o que vem — o rito da
 * marca só cansaria quem já sabe onde está.
 */
function PainelCarregando() {
  return (
    <main className="flex-1 flex flex-col gap-4 trilho py-12 text-(--c-ink)">
      <div className="motion-skeleton h-6 w-40" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="motion-skeleton h-24 w-full"
          style={{ "--motion-delay": `${i * 90}ms` } as React.CSSProperties}
        />
      ))}
    </main>
  );
}

/**
 * A barra só existe depois de autenticar: sem sessão (a tela de login) ela não
 * é montada, e assim `/admin/login` continua sendo uma tela limpa.
 */
async function BarraDoAdmin() {
  const adminId = await getSessionAdminId();
  const admin = adminId ? await getAdminById(adminId) : null;
  if (!admin) return null;

  const iniciais = admin.name
    ? admin.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("")
    : "EQ";

  return <AdminNav iniciais={iniciais} />;
}

/** Reserva a altura da barra enquanto a sessão é lida — sem pulo de layout. */
function BarraVazia() {
  return <div className="h-[57px] border-b border-(--c-rule) bg-(--c-surface)" />;
}
