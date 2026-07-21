import { redirect } from "next/navigation";

// A landing da plataforma virou a home ("/"). Mantido para não quebrar
// links antigos que ainda apontam para /pacotes.
export default function PacotesRedirect() {
  redirect("/");
}
