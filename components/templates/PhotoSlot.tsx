// Bloco decorativo que ocupa o lugar de uma foto real do casal nas prévias
// de template. Sem borda própria — cada template desenha sua própria
// moldura ao redor.
export default function PhotoSlot({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Foto: ${label}`}
      className={`flex items-center justify-center bg-gradient-to-br from-black/5 to-black/10 ${className}`}
    >
      <span
        aria-hidden
        className="text-[9px] tracking-[0.2em] uppercase opacity-50 px-2 text-center leading-relaxed"
      >
        {label}
      </span>
    </div>
  );
}
