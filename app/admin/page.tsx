import { redirect } from "next/navigation";

// O painel da Enlace começa nos pedidos. O casamento pessoal (convidados,
// confirmações, presentes) é outro projeto e vive em /admin/casamento — sem
// link cruzado no meio da operação da plataforma.
export default function AdminHomePage() {
  redirect("/admin/pedidos");
}
