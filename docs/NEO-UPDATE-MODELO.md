# ⛩️ BLUE LOCK : NEO — MODELO OFICIAL DE ATUALIZAÇÕES

Este documento registra o molde escolhido para os avisos publicados pelo **NEO UPDATE BOT**, atribuído a **Dezinho**. A postagem automática é produzida por `tools/neo_update_announcement.py` a partir de `CHANGELOG.json` **depois** do deploy confirmado do GitHub Pages.

## Prévia da ficha v2.0

**⛩️ 𝐁𝐋𝐔𝐄 𝐋𝐎𝐂𝐊 : 𝐍𝐄𝐎**

*𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐔𝐏𝐃𝐀𝐓𝐄 𝐍𝐎𝐓𝐄𝐒*

━━━━━━━━━━━━━━━━━━━━━━━━

### 「 ⚽ 」𝐏𝐀𝐓𝐂𝐇 𝐍𝐎𝐓𝐄𝐒 — 𝐕𝟐.𝟎

> **✦ NOVA ATUALIZAÇÃO DISPONÍVEL**  
> 📅・**Lançamento:** 17/11/2026  
> 🏷️・**Versão:** `2.0.0`  
> 🖥️・**Plataformas:** Web & Mobile

*Uma nova etapa começa. O Blue Lock NEO continua evoluindo com novas mecânicas, sistemas aprimorados e uma experiência cada vez mais imersiva.*

━━━━━━━━━━━━━━━━━━━━━━━━

### ✦ 01 ┃ 𝐍𝐄𝐖 𝐂𝐎𝐍𝐓𝐄𝐍𝐓

🌀 **Novos conteúdos** — Centro de Evolução, memória entre partidas, notícias baseadas em resultados oficiais e 2.520 técnicas adicionais.

### ✦ 02 ┃ 𝐈𝐌𝐏𝐑𝐎𝐕𝐄𝐌𝐄𝐍𝐓𝐒

⚡ **Melhorias e otimizações** — IA adaptativa, mapas de calor, dossiês, replays baseados em quadros reais, testes de 120 partidas e compatibilidade com saves.

### ✦ 03 ┃ 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐂𝐇𝐀𝐍𝐆𝐄𝐒

🔵 **REWORK ┃ Finalizações e pênaltis** — Trajetórias alinhadas ao ponto correto da linha do gol. Defesas e erros continuam possíveis.

*BUFF e NERF são mostrados somente quando houver alteração verificada dessas categorias.*

### ✦ 04 ┃ 𝐁𝐔𝐆 𝐅𝐈𝐗𝐄𝐒

🛠️ **Correções e estabilidade** — Inconsistências da mira, chutes interrompidos, controle de módulos duplicados e regressões antigas.

━━━━━━━━━━━━━━━━━━━━━━━━

### 「 👁️ 」𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐌𝐄𝐍𝐓 𝐏𝐑𝐄𝐕𝐈𝐄𝐖

◇ **Em desenvolvimento:** Atualização incremental segura.  
◇ **Planejado:** Mais testes em aparelhos reais e milhares de partidas simuladas.  
◇ **Em avaliação:** Ajustes na câmera cinematográfica para smartphones.

━━━━━━━━━━━━━━━━━━━━━━━━

### 𝐎𝐍𝐋𝐘 𝐓𝐇𝐄 𝐁𝐄𝐒𝐓 𝐒𝐔𝐑𝐕𝐈𝐕𝐄.

*“O campo não pertence aos mais fortes. Pertence àqueles que continuam evoluindo.”*

**BLUE LOCK NEO ┃ Evolution Project**

© 2026 · Desenvolvimento: **Dezinho**

## Como publicar as próximas versões

1. Registre mudanças reais na primeira release de `CHANGELOG.json`, com data e versão corretas.
2. Use `novidades`, `jogabilidade`, `visual`, `otimizacoes`, `correcoes`, `importantes`.
3. Para balanceamento, preencha `balance.buffs`, `balance.nerfs` ou `balance.reworks`. Campos vazios **não criam anúncios falsos**.
4. Para futuras novidades, use `preview.development`, `preview.planned`, `preview.evaluation`.
5. A publicação só é autorizada após validação do changelog, das artes e do site implantado. O bot usa marcador de deduplicação persistente no GitHub.
6. O aviso automático inclui o banner azul e o ícone amarelo fornecidos. A menção `||@everyone||` só aparece com `NEO_PING_EVERYONE=1` no workflow de publicação; prévias não pingam ninguém.

**Arte oficial usada no bot:** `web/assets/updates/neo-update-banner.png` e `web/assets/updates/neo-update-avatar.png`.

> A prévia acima é um molde humano. O conteúdo enviado ao Discord é produzido automaticamente a partir do changelog real e respeita os limites de embeds do Discord.
