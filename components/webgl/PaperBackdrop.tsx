"use client";

import { useEffect, useRef } from "react";

/**
 * Pano de fundo em WebGL para as páginas de VENDA (landing e vitrine).
 *
 * O que ele desenha: fibra de papel de algodão prensado e uma difusão lenta de
 * tinta. É do assunto — o sistema visual é "Prensa" (papel, tinta ferrogálica,
 * marca de registro) — e não um campo de partículas, que é o fundo WebGL
 * genérico que qualquer gerador produz.
 *
 * ── Por que ele NÃO está no site do convidado ───────────────────────────────
 *
 * O core do three.js é ~170 KB gzip. O site do convidado está medido em 194 KB
 * gzip de primeira carga, é aberto pelo WhatsApp no celular e tem meta de LCP
 * de 2,5 s: colocar isto lá quase dobraria a primeira dobra para ganhar uma
 * textura que ninguém pediu. A regra do projeto já era essa — "a técnica sim,
 * a dependência não" — e foi por ela que o BlurText do reactbits virou CSS
 * puro em vez de trazer framer-motion junto.
 *
 * Aqui o preço se paga: são páginas de venda, vistas no computador por quem
 * está decidindo comprar, e o three chega DEPOIS da primeira pintura.
 *
 * ── As quatro travas ────────────────────────────────────────────────────────
 *
 * 1. `prefers-reduced-motion` é conferido ANTES do import dinâmico: quem pediu
 *    menos movimento não paga o download. Mesma disciplina que o GSAP já usa.
 * 2. Sem WebGL, sai calado — o fundo em CSS por baixo continua lá.
 * 3. `IntersectionObserver` congela o laço quando o elemento sai da tela.
 *    Fundo animado rodando fora de vista é bateria queimada à toa.
 * 4. `devicePixelRatio` travado em 1.5. Num monitor 3x seriam 9x os pixels
 *    para um efeito que é, de propósito, quase imperceptível.
 */
export default function PaperBackdrop({
  className = "",
  /** cor da tinta que se difunde — hex já resolvido, não token */
  tinta = "#b8412c",
  /** intensidade, 0 a 1. Acima de ~0.25 deixa de ser textura e vira enfeite. */
  forca = 0.16,
}: {
  className?: string;
  tinta?: string;
  forca?: number;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;

    // TRAVA 1: quem pediu menos movimento não baixa 170 KB de three.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // TRAVA 2: sem WebGL, o fundo em CSS por baixo já resolve.
    const teste = document.createElement("canvas");
    if (!teste.getContext("webgl2") && !teste.getContext("webgl")) return;

    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (!vivo || !alvo.current) return;

      const cena = new THREE.Scene();
      // Ortográfica com um quad de -1..1: o mínimo que existe para rodar um
      // fragment shader em tela cheia. Sem geometria, sem luz, sem câmera que
      // se mexa.
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const cor = new THREE.Color(tinta);
      const uniforms = {
        uTempo: { value: 0 },
        uResolucao: { value: new THREE.Vector2(1, 1) },
        uTinta: { value: new THREE.Vector3(cor.r, cor.g, cor.b) },
        uForca: { value: forca },
        // Posição do ponteiro em UV, já suavizada. Fora da tela fica no centro,
        // com peso zero — o efeito não pode depender de haver mouse.
        uPonteiro: { value: new THREE.Vector2(0.5, 0.5) },
        uPeso: { value: 0 },
        // 0 → 1 na entrada. A tinta nasce do centro em vez de já estar lá.
        uEntrada: { value: 0 },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          varying vec2 vUv;
          uniform float uTempo;
          uniform vec2  uResolucao;
          uniform vec3  uTinta;
          uniform float uForca;
          uniform vec2  uPonteiro;
          uniform float uPeso;
          uniform float uEntrada;

          // Hash + ruído de valor. Barato e suficiente: isto é textura de
          // fundo, não superfície de material.
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float ruido(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          // Fractal de 5 oitavas: dá a irregularidade da fibra sem custar caro.
          float fbm(vec2 p) {
            float soma = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 5; i++) {
              soma += amp * ruido(p);
              p *= 2.02;
              amp *= 0.5;
            }
            return soma;
          }

          void main() {
            vec2 uv = vUv;
            // proporção corrigida, senão a fibra estica em tela larga
            uv.x *= uResolucao.x / max(uResolucao.y, 1.0);

            float t = uTempo * 0.035;

            // DOMAIN WARPING: o campo de ruído é deslocado por outro campo de
            // ruído. É isso que faz parecer tinta ESPALHANDO no papel, em vez
            // de nuvem passando.
            vec2 q = vec2(fbm(uv * 2.4 + vec2(0.0, t)),
                          fbm(uv * 2.4 + vec2(5.2, 1.3 - t)));
            vec2 r = vec2(fbm(uv * 2.4 + 3.5 * q + vec2(1.7, 9.2) + 0.3 * t),
                          fbm(uv * 2.4 + 3.5 * q + vec2(8.3, 2.8) - 0.2 * t));
            float massa = fbm(uv * 2.4 + 3.0 * r);

            // O PONTEIRO ALIMENTA A TINTA.
            // Perto do cursor o limiar baixa, então mais do campo de ruído
            // passa a contar como mancha — o papel "absorve" mais ali. Não é
            // um brilho grudado no mouse: a tinta que aparece é a que já
            // existia no campo, só que revelada. Por isso o efeito segue o
            // desenho do papel em vez de parecer uma lanterna.
            vec2 pAjustado = uPonteiro;
            pAjustado.x *= uResolucao.x / max(uResolucao.y, 1.0);
            float perto = exp(-distance(uv, pAjustado) * 3.4) * uPeso;

            // Só a cauda alta do campo vira tinta visível: poucas manchas
            // grandes, em vez de sujeira espalhada por igual.
            float mancha = smoothstep(0.58 - 0.17 * perto, 0.95, massa);

            // Fibra do papel: ruído fino que quebra o degradê e mata o
            // "banding" que fundo liso mostra em tela grande.
            float fibra = ruido(vUv * uResolucao * 0.9) - 0.5;

            // ENTRADA: a tinta se espalha do centro para fora, como uma gota
            // caindo no papel. Sem isto ela já estaria toda lá quando a página
            // pinta, e o efeito se perderia — ninguém vê o que nunca começou.
            float raio = distance(vUv, vec2(0.5)) * 1.25;
            float nascimento = smoothstep(0.0, 0.55, uEntrada * 1.55 - raio);

            vec3 corFinal = uTinta * mancha;
            float alfa = (mancha * uForca * (1.0 + 0.85 * perto) + fibra * 0.035)
                       * nascimento;

            gl_FragColor = vec4(corFinal, clamp(alfa, 0.0, 1.0));
          }
        `,
      });

      const geometria = new THREE.PlaneGeometry(2, 2);
      cena.add(new THREE.Mesh(geometria, material));

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
      renderer.setClearAlpha(0);
      // TRAVA 4
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      alvo.current.appendChild(renderer.domElement);

      const medir = () => {
        const caixa = alvo.current;
        if (!caixa) return;
        const w = caixa.clientWidth;
        const h = caixa.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        uniforms.uResolucao.value.set(w, h);
      };
      medir();

      const ro = new ResizeObserver(medir);
      ro.observe(alvo.current);

      // ── Ponteiro ──────────────────────────────────────────────────────────
      // O alvo é onde o cursor está; o valor no shader persegue esse alvo com
      // inércia. Tinta não teleporta — sem a suavização o efeito gruda no
      // mouse e denuncia que é um brilho, não um líquido.
      const alvoPonteiro = { x: 0.5, y: 0.5, peso: 0 };

      const aoMover = (e: PointerEvent) => {
        const caixa = alvo.current?.getBoundingClientRect();
        if (!caixa || !caixa.width || !caixa.height) return;
        alvoPonteiro.x = (e.clientX - caixa.left) / caixa.width;
        // Y invertido: no shader a origem é embaixo, no DOM é em cima.
        alvoPonteiro.y = 1 - (e.clientY - caixa.top) / caixa.height;
        alvoPonteiro.peso = 1;
      };
      const aoSair = () => {
        alvoPonteiro.peso = 0;
      };
      // No elemento pai (a seção), não no canvas: o canvas tem
      // `pointer-events: none`, então ele nunca receberia o evento.
      const ouvinte = alvo.current.parentElement ?? window;
      ouvinte.addEventListener("pointermove", aoMover as EventListener);
      ouvinte.addEventListener("pointerleave", aoSair as EventListener);

      let quadro = 0;
      let naTela = true;
      const inicio = performance.now();

      const laco = (agora: number) => {
        if (!vivo || !naTela) {
          quadro = 0;
          return;
        }
        const t = (agora - inicio) / 1000;
        uniforms.uTempo.value = t;

        // Entrada em ~1,7s. Curva de desaceleração: começa depressa e assenta,
        // o mesmo peso do `--e-saida` do resto do produto.
        const bruto = Math.min(t / 1.7, 1);
        uniforms.uEntrada.value = 1 - Math.pow(1 - bruto, 3);

        // Perseguição com inércia (~12% por quadro).
        const p = uniforms.uPonteiro.value;
        p.x += (alvoPonteiro.x - p.x) * 0.12;
        p.y += (alvoPonteiro.y - p.y) * 0.12;
        uniforms.uPeso.value +=
          (alvoPonteiro.peso - uniforms.uPeso.value) * 0.06;

        renderer.render(cena, camera);
        quadro = requestAnimationFrame(laco);
      };

      // TRAVA 3
      const io = new IntersectionObserver(
        ([entrada]) => {
          naTela = entrada.isIntersecting;
          if (naTela && quadro === 0) quadro = requestAnimationFrame(laco);
        },
        { rootMargin: "120px" }
      );
      io.observe(alvo.current);

      quadro = requestAnimationFrame(laco);

      limpar = () => {
        cancelAnimationFrame(quadro);
        ouvinte.removeEventListener("pointermove", aoMover as EventListener);
        ouvinte.removeEventListener("pointerleave", aoSair as EventListener);
        ro.disconnect();
        io.disconnect();
        geometria.dispose();
        material.dispose();
        // Sem isto o contexto WebGL fica pendurado. O navegador só permite ~16
        // ao mesmo tempo, e navegar entre páginas com fundo derrubaria os
        // seguintes calado.
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      vivo = false;
      limpar?.();
    };
  }, [tinta, forca]);

  return (
    <div
      ref={alvo}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}
