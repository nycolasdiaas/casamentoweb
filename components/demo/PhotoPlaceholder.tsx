// Bloco decorativo que ocupa o lugar das fotos reais do casal nas demos.
export default function PhotoPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Foto do casal: ${label}`}
      className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-(--color-blush) to-(--color-paper) border border-(--color-gold) ${className}`}
    >
      <span aria-hidden className="font-script text-3xl text-(--color-gold)">
        {label}
      </span>
      <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-(--color-muted)">
        Foto do casal
      </span>
    </div>
  );
}
