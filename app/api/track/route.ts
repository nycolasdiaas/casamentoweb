import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isEventKind, visitorHash, referrerHost, deviceFromUserAgent } from "@/lib/metrics";
import {
  recordEvent,
  touchLastSeen,
  recentEventCount,
} from "@/lib/repositories/siteEvents";
import { getSiteBySlug } from "@/lib/repositories/sites";

// Beacon de métricas. Ver docs/sdd-geracao-automatica.md §6.1.
//
// Chamado pelo cliente, fora do caminho de render — com `use cache` a página
// do casal nem toca no banco, então a coleta não pode acontecer no servidor
// durante a renderização.
//
// Falha em silêncio DE PROPÓSITO: métrica nunca pode quebrar (nem atrasar) o
// site de um casamento. Qualquer erro vira 204.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return noContent();

    const { siteSlug, kind, path, section } = body as Record<string, unknown>;

    if (typeof siteSlug !== "string" || typeof kind !== "string") {
      return noContent();
    }
    if (!isEventKind(kind)) return noContent();

    const site = await getSiteBySlug(siteSlug);
    if (!site) return noContent();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? "";
    const hash = visitorHash(ip, userAgent);

    // Endpoint público e sem autenticação: limita quem tentar inflar as
    // métricas de um site. 60 eventos/min por visitante cobre folgado a
    // navegação real (view + aberturas de presente + RSVP).
    if (hash) {
      const recentes = await recentEventCount(site.id, hash, 60);
      if (recentes >= 60) return noContent();
    }

    await recordEvent({
      siteId: site.id,
      kind,
      path: typeof path === "string" ? path.slice(0, 300) : null,
      section: typeof section === "string" ? section.slice(0, 60) : null,
      referrerHost: referrerHost(request.headers.get("referer")),
      device: deviceFromUserAgent(userAgent),
      // Geo vem de header da Vercel — derivado do IP, mas o IP não é gravado.
      country: request.headers.get("x-vercel-ip-country"),
      region: request.headers.get("x-vercel-ip-country-region"),
      visitorHash: hash,
    });

    if (kind === "view") {
      await touchLastSeen(site.id);
    }

    return noContent();
  } catch {
    return noContent();
  }
}

function noContent() {
  return new NextResponse(null, { status: 204 });
}
