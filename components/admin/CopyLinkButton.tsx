"use client";

import { useState } from "react";

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/rsvp/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs font-serif tracking-[0.05em] border border-(--c-rule) px-3 py-1.5 text-(--c-ink)"
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
