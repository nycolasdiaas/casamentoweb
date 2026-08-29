/**
 * A4 · Campo de formulário.
 *
 * Três coisas que a base não fazia e que estão na prancha:
 *
 * 1. O rótulo é RÓTULO, não placeholder. Placeholder some quando a pessoa
 *    digita — e some justamente quando ela precisa conferir se preencheu o
 *    campo certo. `/conta/entrar` fazia isso nos dois campos.
 * 2. O erro aparece ABAIXO do campo, nunca num alerta no topo (Voz V4).
 * 3. `aria-describedby` liga o erro ao campo, e `aria-invalid` é o que o CSS
 *    usa para pintar o fio vermelho — um só atributo servindo o leitor de
 *    tela e o desenho.
 *
 * A mensagem de erro segue a fórmula "o que houve + como resolver", numa
 * frase, sem a palavra "inválido".
 *
 * O `id` sai do `name` (e não de `useId`) de propósito: `useId` é hook, e
 * hook obriga o arquivo inteiro a virar cliente. Estes campos precisam
 * funcionar dentro de `<form action={serverAction}>` num componente de
 * servidor — que é o formulário padrão do produto.
 */

type Base = {
  rotulo: string;
  /** Ajuda curta acima do campo. Tira ansiedade; não instrui o óbvio. */
  ajuda?: string;
  erro?: string;
  /** Vai à direita do rótulo — "Esqueci a senha", "opcional". */
  acessorio?: React.ReactNode;
};

function Moldura({
  id,
  rotulo,
  ajuda,
  erro,
  acessorio,
  children,
}: Base & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="rotulo text-(--c-ink-2)">
          {rotulo}
        </label>
        {acessorio}
      </div>
      {ajuda && <p className="t-corpo-p text-(--c-ink-2)">{ajuda}</p>}
      {children}
      {erro && (
        <p id={`${id}-erro`} className="erro-do-campo">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Campo({
  rotulo,
  ajuda,
  erro,
  acessorio,
  className,
  id: idExterno,
  ...props
}: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = idExterno ?? `campo-${props.name ?? rotulo}`;
  return (
    <Moldura
      id={id}
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      acessorio={acessorio}
    >
      <input
        {...props}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`campo ${className ?? ""}`}
      />
    </Moldura>
  );
}

export function AreaDeTexto({
  rotulo,
  ajuda,
  erro,
  acessorio,
  className,
  id: idExterno,
  ...props
}: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = idExterno ?? `campo-${props.name ?? rotulo}`;
  return (
    <Moldura
      id={id}
      rotulo={rotulo}
      ajuda={ajuda}
      erro={erro}
      acessorio={acessorio}
    >
      <textarea
        {...props}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`campo ${className ?? ""}`}
      />
    </Moldura>
  );
}
