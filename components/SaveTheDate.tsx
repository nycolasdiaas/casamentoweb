import Image from "next/image";

export default function SaveTheDate() {
  return (
    <section className="flex justify-center bg-(--color-paper)">
      <Image
        src="/save-the-date.jpeg"
        alt="Save the Date - Isabelle e Nycolas - 16 de outubro de 2026"
        width={1135}
        height={1600}
        className="w-full max-w-sm h-auto"
        priority
      />
    </section>
  );
}
