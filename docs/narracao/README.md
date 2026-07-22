# Narração para o vídeo de divulgação (ElevenLabs)

8 arquivos `.txt`, um por trecho do vídeo (roteiro completo em
[../prompt-video-divulgacao.md](../prompt-video-divulgacao.md)). Gere um
áudio por arquivo — assim cada fala encaixa exatamente no momento certo
da animação, em vez de tentar cortar um áudio corrido.

## Como usar no ElevenLabs

1. Abra **Text to Speech**.
2. Escolha uma voz em português (BR), tom caloroso/elegante — evite vozes
   "corporativas" ou muito jovens/animadas. Se o ElevenLabs oferecer,
   ajuste **Stability** um pouco mais alto (~60–70%) pra fala mais
   comedida, e **Similarity** padrão.
3. Abra cada arquivo desta pasta, um de cada vez, cole o texto, gere e
   baixe o áudio com o mesmo nome do arquivo (ex: `01-gancho.mp3`).
4. No editor de vídeo (CapCut/InShot), encaixe cada áudio no tempo
   indicado abaixo, sobre a gravação da animação.

## Mapa de tempos (bate com o roteiro da animação)

| Arquivo | Tempo no vídeo | Duração alvo |
|---|---|---|
| `01-gancho.txt` | 0:00–0:03 | ~3s |
| `02-problema.txt` | 0:03–0:07 | ~4s |
| `03-virada.txt` | 0:07–0:09 | ~2s |
| `04a-rsvp.txt` | 0:09–0:10.5 | ~1,5s |
| `04b-pix.txt` | 0:10.5–0:12.5 | ~2s |
| `04c-album.txt` | 0:12.5–0:16 | ~3,5s |
| `05-pacotes.txt` | 0:16–0:19 | ~3s |
| `06-cta.txt` | 0:19–0:22 | ~3s |

Se algum áudio sair maior que o tempo alvo, duas opções: aumente
levemente a velocidade de fala nas configurações do ElevenLabs, ou
estique um pouco aquele trecho da animação no Claude Design antes de
gravar a tela — não corte a frase no meio.

## Se preferir narração única (sem cortes)

Cole os 8 arquivos em sequência, na ordem acima, num único texto — dá
pra gerar de uma vez só, mas fica mais difícil bater exatamente com cada
troca de cena da animação. Recomendo os arquivos separados.
