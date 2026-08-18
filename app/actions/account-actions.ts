"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { isEmailConfigured, sendPreviewReadyEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createUserSessionCookie,
  clearUserSessionCookie,
  getSessionUserId,
} from "@/lib/auth/userSession";
import { createUser, getUserByEmail } from "@/lib/repositories/users";
import { getAdminByEmail } from "@/lib/repositories/admins";
import { clearSessionCookie as clearAdminSessionCookie } from "@/lib/auth/session";
import {
  createOrder,
  updateOrder,
  submitOrderById,
  getOrderById,
} from "@/lib/repositories/orders";
import { situacaoDePedidos, MENSAGEM_LIMITE } from "@/lib/orderLimits";
import { cancelarPedidoComSite } from "@/lib/site/cancelOrder";
import { canCancelOrder } from "@/lib/orderStatus";
import { provisionSiteForOrder } from "@/lib/site/provision";
import { parseContentForm } from "@/lib/site/contentInput";
import { saveSiteContent } from "@/lib/repositories/siteContent";
import { getUserById } from "@/lib/repositories/users";
import { getBaseUrl } from "@/lib/baseUrl";
import { PACKAGES, type PackageTier } from "@/lib/packages";
import { TEMPLATE_STYLES } from "@/lib/templates";
import { isFontStyle, isHexColor } from "@/lib/customization";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(formData: FormData) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit(`signup:${ip}`);
  if (!allowed) return { error: RATE_LIMIT_MESSAGE };

  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const whatsapp = formData.get("whatsapp")?.toString().trim() ?? "";

  if (name.length < 2) return { error: "Conta o nome de vocês pra gente 😊" };
  if (!EMAIL_PATTERN.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) {
    return { error: "A senha precisa de pelo menos 8 caracteres." };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "Já existe uma conta com esse e-mail. Tente entrar." };
  }

  const user = await createUser({
    name,
    email,
    passwordHash: await hashPassword(password),
    whatsapp: whatsapp || undefined,
  });

  await clearAdminSessionCookie();
  await createUserSessionCookie(user.id);
  redirect("/conta");
}

// Hash descartável (senha aleatória) para gastar o mesmo tempo de scrypt
// quando o e-mail não existe — evita distinguir "conta inexistente" de
// "senha errada" por diferença de tempo de resposta.
const DUMMY_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000:" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000";

export async function signinAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const ip = await getClientIp();
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`signin:${ip}`),
    email ? checkRateLimit(`signin-email:${email}`) : Promise.resolve({ allowed: true }),
  ]);
  if (!ipOk.allowed || !emailOk.allowed) return { error: RATE_LIMIT_MESSAGE };

  // Esta tela entra SÓ como casal. Antes ela também aceitava credencial de
  // admin e mandava direto pro /admin — era por isso que quem já tinha logado
  // como admin nunca conseguia entrar como casal. Admin tem a tela dele.
  const user = email ? await getUserByEmail(email) : null;
  if (user && (await verifyPassword(password, user.passwordHash))) {
    // Derruba qualquer sessão de admin aberta no mesmo navegador: um browser
    // fica em um papel de cada vez, nunca nos dois.
    await clearAdminSessionCookie();
    await createUserSessionCookie(user.id);
    redirect("/conta");
  }

  const admin = email ? await getAdminByEmail(email) : null;
  if (admin && (await verifyPassword(password, admin.passwordHash))) {
    // Credencial certa, porta errada — continua sem criar sessão nenhuma aqui.
    //
    // A resposta é a MESMA de senha errada, de propósito. A mensagem anterior
    // ("essa é uma conta de administrador") dizia a quem digitasse um e-mail
    // qualquer se aquele endereço era de admin — enumeração de conta de graça,
    // e logo a mais interessante de descobrir. Quem é da equipe já sabe onde
    // fica a porta dele.
    return { error: "E-mail ou senha incorretos." };
  }

  // Nenhuma conta bateu. Se o e-mail nem existe, roda um scrypt descartável
  // para o tempo de resposta ser indistinguível de "senha errada".
  if (!user && !admin) {
    await verifyPassword(password, DUMMY_HASH);
  }

  return { error: "E-mail ou senha incorretos." };
}

export async function signoutAction() {
  await clearUserSessionCookie();
  redirect("/");
}

function parseOrderForm(formData: FormData) {
  const packageTier = formData.get("packageTier")?.toString() ?? "";
  const templateStyle = formData.get("templateStyle")?.toString() ?? "";

  if (!PACKAGES.some((pkg) => pkg.tier === packageTier)) {
    return { error: "Escolha um pacote." as const };
  }
  // Template é opcional: vazio = casal monta do zero com cores/fonte próprias
  if (
    templateStyle !== "" &&
    !TEMPLATE_STYLES.some((style) => style.id === templateStyle)
  ) {
    return { error: "Estilo de template inválido." as const };
  }

  // A data é validada AQUI para o casal ser avisado, e não descobrir depois
  // que o site nasceu sem contagem regressiva. O provisionamento tem a
  // própria trava (parseWeddingDate), mas ela é a rede de segurança: recusa
  // calada, sem ninguém para avisar.
  const dataBruta = formData.get("weddingDate")?.toString().trim() ?? "";
  if (dataBruta) {
    const anoDigitado = new Date(dataBruta).getFullYear();
    if (Number.isNaN(anoDigitado) || anoDigitado < 2000 || anoDigitado > 2100) {
      return { error: "Confira o ano do casamento — a data não parece certa." as const };
    }
  }

  const primaryColor = formData.get("primaryColor")?.toString().trim() ?? "";
  const secondaryColor =
    formData.get("secondaryColor")?.toString().trim() ?? "";
  const tertiaryColor = formData.get("tertiaryColor")?.toString().trim() ?? "";
  const fontStyle = formData.get("fontStyle")?.toString() ?? "";

  return {
    input: {
      packageTier: packageTier as PackageTier,
      templateStyle: templateStyle || null,
      primaryColor: isHexColor(primaryColor) ? primaryColor : undefined,
      secondaryColor: isHexColor(secondaryColor) ? secondaryColor : undefined,
      tertiaryColor: isHexColor(tertiaryColor) ? tertiaryColor : undefined,
      fontStyle: isFontStyle(fontStyle) ? fontStyle : undefined,
      styleNotes: formData.get("styleNotes")?.toString().trim() || undefined,
      coupleNames: formData.get("coupleNames")?.toString().trim() || undefined,
      weddingDate: formData.get("weddingDate")?.toString().trim() || undefined,
      // `photosLink` saiu do formulário: o casal sobe as fotos pela tela de
      // acompanhamento, com a prévia do site do lado, onde ele vê onde cada
      // foto cai. Pedir um link de Drive antes disso era pedir trabalho no
      // momento errado — e ninguém abria a pasta.
      notes: formData.get("notes")?.toString().trim() || undefined,
    },
  };
}

// Retorna o pedido se ele existe E pertence ao casal logado; senão null.
async function getOwnedOrder(userId: string, orderId: string) {
  if (!orderId) return null;
  const order = await getOrderById(orderId);
  if (!order || order.userId !== userId) return null;
  return order;
}

export async function saveOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const orderId = formData.get("orderId")?.toString() ?? "";
  const existing = await getOwnedOrder(userId, orderId);

  if (existing) {
    if (existing.status !== "draft") {
      return { error: "Este pedido já foi enviado e não pode ser editado." };
    }
    await updateOrder(existing.id, parsed.input);
    revalidatePath(`/conta/pedido/${existing.id}`);
    return { saved: true };
  }

  // Primeiro salvamento de um pedido novo: cria e leva para a tela de edição
  // (que já tem o id) para os próximos salvamentos atualizarem o mesmo.
  //
  // A trava do limite mora AQUI, e não só no botão: esconder o link de novo
  // pedido é cortesia com quem navega, não regra. Quem chegar em
  // /conta/pedido/novo pela URL, por um link antigo ou por duas abas abertas
  // passa por este mesmo caminho.
  const situacao = await situacaoDePedidos(userId);
  if (!situacao.podeCriar) return { error: MENSAGEM_LIMITE };

  const created = await createOrder(userId, parsed.input);
  revalidatePath("/conta/pedidos");
  redirect(`/conta/pedido/${created.id}`);
}

export async function submitOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const parsed = parseOrderForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const orderId = formData.get("orderId")?.toString() ?? "";
  const existing = await getOwnedOrder(userId, orderId);

  let finalOrderId: string;
  if (existing) {
    if (existing.status !== "draft") {
      return { error: "Este pedido já foi enviado." };
    }
    await updateOrder(existing.id, parsed.input);
    await submitOrderById(existing.id);
    finalOrderId = existing.id;
  } else {
    // Mesma trava do save: este ramo cria pedido do zero.
    const situacao = await situacaoDePedidos(userId);
    if (!situacao.podeCriar) return { error: MENSAGEM_LIMITE };

    const created = await createOrder(userId, parsed.input);
    await submitOrderById(created.id);
    finalOrderId = created.id;
  }

  // Provisiona o site na hora. É o passo que tira o humano do caminho: o
  // casal envia o briefing e a prévia já existe, em vez de esperar dias.
  //
  // Falha aqui NÃO derruba o envio do pedido: o pedido continua registrado e
  // o admin trata como exceção. Perder o pedido do casal por causa de um
  // tropeço no provisionamento seria muito pior do que provisionar depois.
  try {
    const order = await getOrderById(finalOrderId);
    const user = await getUserById(userId);
    if (order && user) {
      const baseUrl = await getBaseUrl();
      const resultado = await provisionSiteForOrder(order, user.name, baseUrl);
      if (!resultado.ok) {
        console.error(
          `[provision] pedido ${finalOrderId} não provisionado: ${resultado.reason}`
        );
      } else {
        // O CONTEÚDO respondido no questionário entra AGORA, no mesmo request.
        //
        // Era esta a crítica do Nycolas: "como se cria um site sem seu
        // conteúdo? O que vem primeiro?". Antes o questionário perguntava
        // como o site ia PARECER e nunca o que ele ia DIZER, então o casal
        // respondia sete perguntas e recebia uma casca — e as telas do menu
        // lateral abriam vazias.
        //
        // `parseContentForm` e não um caminho próprio: ele grava a hora em UTC
        // a partir do fuso do site, e duplicar isso faria a cerimônia das 16h
        // virar 19h e ganhar três horas a cada salvamento.
        //
        // Falhar aqui NÃO derruba o pedido: o site já existe e o casal edita
        // pelo painel. Perder o conteúdo é ruim; perder o pedido é pior.
        try {
          const conteudo = parseContentForm(formData);
          if (conteudo.ok) {
            await saveSiteContent(resultado.siteId, conteudo.value);
          } else {
            console.error(
              `[provision] conteúdo do pedido ${finalOrderId} recusado: ${conteudo.error}`
            );
          }
        } catch (erro) {
          console.error(
            `[provision] conteúdo do pedido ${finalOrderId} não gravado:`,
            erro
          );
        }
      }

      if (resultado.ok && resultado.created && isEmailConfigured()) {
        // Só no primeiro provisionamento: `created` false significa que o site
        // já existia, e reenviar "sua prévia está pronta" seria ruído.
        //
        // Em `after()` porque falar com o SMTP é lento e pode falhar: o casal
        // não espera o e-mail para ver a tela seguinte, e uma falha de envio
        // não pode derrubar um pedido que já está registrado. Ver §7 do SDD.
        //
        // O link da prévia é lido do pedido, não montado aqui — quem grava o
        // `previewUrl` (com o token secreto) é o provisionamento.
        after(async () => {
          try {
            const atualizado = await getOrderById(finalOrderId);
            if (!atualizado?.previewUrl) return;
            await sendPreviewReadyEmail(
              user.email,
              user.name,
              atualizado.previewUrl,
              `${baseUrl}/conta/pedidos/${finalOrderId}`
            );
          } catch (error) {
            console.error(`[email] prévia do pedido ${finalOrderId}:`, error);
          }
        });
      }
    }
  } catch (error) {
    console.error(`[provision] falha no pedido ${finalOrderId}:`, error);
  }

  // Vai direto para as FOTOS, não para o hub.
  //
  // O requisito previa uma etapa de fotos DENTRO do questionário, e ela nunca
  // saiu por um impedimento real: o upload precisa de um `siteId`, e o site só
  // existe depois deste envio. Segurar os arquivos em memória para subir
  // depois significaria perdê-los no redirecionamento, e criar o site antes da
  // última etapa faria todo abandono virar site órfão.
  //
  // A saída é a ordem, não a arquitetura: as fotos são a etapa seguinte, com o
  // site já criado e o upload funcionando de verdade. O casal cai na tela onde
  // pode subir, com a prévia a um clique — em vez de no hub, que é uma lista.
  //
  // Também é o passo que faltava para o site nascer completo: conteúdo veio no
  // questionário, fotos vêm aqui, e nada abre vazio.
  revalidatePath("/conta");
  revalidatePath("/conta/pedidos");
  redirect(`/conta/pedidos/${finalOrderId}/fotos`);
}

export async function cancelOrderAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/conta/entrar");

  const orderId = formData.get("orderId")?.toString() ?? "";
  const order = await getOwnedOrder(userId, orderId);

  // Só cancela o que é do casal e ainda não foi pago. E leva o site junto:
  // sem isso, cancelar deixaria um site sem dono acumulando no banco — ver
  // `cancelarPedidoComSite`.
  //
  // O status já barra pedido pago, mas `paymentStatus` é conferido de novo
  // porque ele pode chegar a PAID antes de o status acompanhar (webhook ou
  // retorno do checkout). Cancelar algo já pago apagaria a compra de alguém.
  const pago =
    order?.paymentStatus === "PAID" || !canCancelOrder(order?.status ?? "draft");

  if (order && !pago) {
    await cancelarPedidoComSite(order.id);
  }

  revalidatePath("/conta");
  revalidatePath("/conta/pedidos");
  redirect("/conta/pedidos");
}
