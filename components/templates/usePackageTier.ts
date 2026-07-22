"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PACKAGES, type PackageTier } from "@/lib/packages";

function parseTier(value: string | null): PackageTier {
  return PACKAGES.some((pkg) => pkg.tier === value)
    ? (value as PackageTier)
    : "para-sempre";
}

// Lê ?pacote= da URL de forma reativa (via useSearchParams, que o Next.js
// atualiza mesmo em navegação client-side entre a mesma rota — diferente de
// ler window.location.search só na montagem, que falha porque o App Router
// reaproveita a página já montada ao navegar para a mesma rota com uma
// querystring diferente). Selecionar uma pill dentro da página guarda uma
// escolha manual, que é descartada assim que a URL mudar de novo.
export function usePackageTier(): [PackageTier, (tier: PackageTier) => void] {
  const searchParams = useSearchParams();
  const urlTier = parseTier(searchParams.get("pacote"));
  const [manualTier, setManualTier] = useState<PackageTier | null>(null);

  useEffect(() => {
    setManualTier(null);
  }, [urlTier]);

  return [manualTier ?? urlTier, setManualTier];
}
