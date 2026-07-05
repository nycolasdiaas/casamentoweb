import Link from "next/link";
import SaveTheDate from "@/components/SaveTheDate";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <SaveTheDate />
      <nav className="flex justify-center bg-(--color-paper) pb-10">
        <Link
          href="/presentes"
          className="font-serif text-sm tracking-[0.1em] text-(--color-olive) border border-(--color-gold) px-6 py-3 transition-colors hover:bg-(--color-blush)"
        >
          Lista de Presentes 🎁
        </Link>
      </nav>
    </main>
  );
}
