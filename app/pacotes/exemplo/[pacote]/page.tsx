import { redirect } from "next/navigation";

// As demos mockadas por pacote foram substituídas pelos templates reais em
// /pacotes/estilos/[estilo] (que já aceitam ?pacote=X para abrir no pacote
// certo). Mantido para não quebrar links antigos.
export default function ExemploPacoteRedirect() {
  redirect("/");
}
