import PhotoPlaceholder from "@/components/demo/PhotoPlaceholder";

const MOMENTS = [
  "A cerimônia",
  "O sim",
  "Primeira dança",
  "A festa",
  "Os padrinhos",
  "O bolo",
];

// Prévia do álbum pós-casamento: seção que se abre na data do evento e
// vira o registro permanente da festa.
export default function DemoAlbum() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MOMENTS.map((moment) => (
          <PhotoPlaceholder
            key={moment}
            label={moment}
            className="aspect-square"
          />
        ))}
      </div>
      <p className="font-serif text-sm text-(--color-olive) max-w-xl mx-auto text-center leading-relaxed">
        Esta seção fica escondida até o dia do casamento. Depois da festa, o
        casal sobe as fotos reais e o site vira o álbum permanente do
        casamento — enquanto outros sites saem do ar, o de vocês fica para
        sempre.
      </p>
    </div>
  );
}
