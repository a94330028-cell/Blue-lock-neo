# Blue Lock NEO 9.5.0 — Ranking único e MVP da liga

## Novo na v9.5.0
- **Preços reajustados:** atletas comuns ficam abaixo de ¥ 400 milhões, em vez de passar de ¥ 1 bilhão. O jogo recalcula as ofertas a partir dos dados existentes, sem apagar saves.
- **Um único ranking de mercado**, com o filtro por posições. O pódio e o ranking antigos deixam de aparecer como listas duplicadas.
- **🏆 MVP atual + Top 5 da temporada** dentro do mesmo painel, calculados exclusivamente pelas atuações registradas: gols, assistências, criação, desarmes, defesas e regularidade. **O preço não entra na escolha do MVP.**
- **Momentos memoráveis preservados em um painel recolhido**, para não ocupar a página inteira.
- **Android 9.5.0**, versionCode 97. Compatível com a assinatura estável das versões v9.0 a v9.4, caso os APKs anteriores tenham sido instalados com o mesmo certificado.
- Conteúdo offline, 87 retratos e dados da temporada preservados.

Veja [CHANGELOG-v9.5.0.md](CHANGELOG-v9.5.0.md).


## Atualização v9.4.0

- Interface limpa: sem placar duplicado, análises e câmera recolhidas, apenas quatro recordes visíveis até escolher Ver todos.
- Ranking: goleiros, zagueiros, laterais, volantes, meias centrais, meias ofensivos, pontas, atacantes, artilheiros, assistentes, defesa, passadores e mercado.
- Cards mostram jogador, clube, posição, OVR e preço; top 6 por padrão, opção top 15.
- Preços maiores por OVR/posição, com valorização extra de ações reais de goleiros, defensores e atacantes.
- Defesas: estatísticas individuais e recuperação de jogos antigos somente quando os dados foram registrados no histórico.
- Master Strikers atuam **até 45 minutos** por entrada, com possibilidade de segunda participação mais curta.
- Android v9.4.0 / versionCode 96. Os saves e os 87 retratos permanecem.

Leia [CHANGELOG-v9.4.0.md](CHANGELOG-v9.4.0.md).


## ⭐ v9.3.0 — escala profissional, mestres e defesa competitiva

- **Jogadores normais: até 90 OVR.** Kaiser, Rin, Aiku e Lorenzo: 90; Isagi e Barou: 89; Reo e Bachira: 88.
- **Mestres: 96–99 OVR.** Noel Noa e Julian Loki: 99; Chris Prince, Lavinho e Marc Snuffy: 98.
- Ações individuais de desarme, interceptação, bloqueio, disputa aérea, duelo e passe-chave contam para notas e **valores de mercado**, inclusive zagueiros, laterais e volantes.
- Mestres têm **janelas de aproximadamente 10–12 minutos de jogo**, e podem entrar **até duas vezes por partida**, conforme tática e oportunidades de parada (não há garantia de gol).
- UI mais compacta, com análises sob demanda e ranking específico de contribuições defensivas.
- Os saves existentes permanecem; a v9.3.0 exige o APK v9.3.0 para atualizar seu código Android. **Não publique chaves privadas no GitHub.**

A atualização está em [CHANGELOG-v9.3.0.md](CHANGELOG-v9.3.0.md).

## ✅ v9.1.2 — Números/Arsenal substituídos na barra inferior Android

A barra de navegação **do aplicativo Android** agora contém exatamente: **🎮 Jogar | 🏆 Liga | 📜 Recordes | 👑 Ranking | 👥 Jogadores | ⚙️ Mais**. A tela antiga de Números/Estatísticas, o Arsenal e a Galeria continuam em **Mais**, com suas funções preservadas. A compilação usa `versionCode 93` e desativa o cache de recursos do WebView para não mostrar a navegação antiga. Veja [CHANGELOG-v9.1.2.md](CHANGELOG-v9.1.2.md).

## 🔄 Atualizador GitHub Pages — v9.1.1

**Esta etapa está publicada e a compilação Android passou no GitHub Actions.** A partir do APK **9.1.1** (`versionCode 92`), o aplicativo consulta diretamente o GitHub Pages:

- Site: https://a94330028-cell.github.io/Blue-lock-neo/
- Manifesto de updates: https://a94330028-cell.github.io/Blue-lock-neo/updates/latest.json
- Código-fonte: `app/src/main/java/com/neoegoist/simulator/MainActivity.java`
- Gerador de pacotes: `tools/gerar_atualizacao.py`

O APK 9.1.1 está assinado com a mesma chave privada estável usada nos APKs 9.0/9.1 anteriores. A chave não foi colocada neste repositório. **O APK gerado automaticamente pelo GitHub Actions, sem os quatro Secrets BL_*, é uma versão de TESTE; não atualiza o APK com assinatura estável.** Para a atualização inicial da instalação 9.0/9.1, utilize o APK 9.1.1 de assinatura estável fornecido separadamente pelo mantenedor. A partir dele, futuras atualizações somente do conteúdo web poderão chegar pelo botão "Atualizar" quando um número maior for publicado no GitHub Pages.

Publicar no GitHub Pages **não atualiza o APK 9.1**, que ainda aponta para a Netlify. A mudança de servidor exige a instalação única da versão 9.1.1. Mantenha um backup de partidas, saves e retratos antes de atualizar.

Simulador de futebol 2D para Web e APK Android offline, baseado na Liga Neo Egoísta. Projeto de fã não oficial.

## Versão

**v9.1.0 (Android versionCode 91)**. Base do APK v8.9 com 87 retratos preservados, evolução da interface v9.0, registro técnico de chutes e duelos, central de desafios, premiações e jornal do campeonato. As funções pré-existentes permanecem no jogo.

## Começar

- **Site/PWA:** hospede o conteúdo da pasta `web/`. Para testar localmente, use um servidor HTTP estático nessa pasta.
- **APK Android:** este projeto usa Gradle, AGP e Java 17. Abra no Android Studio ou execute a Action `Gerar APK Blue Lock NEO (atualizável)`.
- **GitHub:** siga [README-v9.1-GITHUB.md](README-v9.1-GITHUB.md), incluindo publicação do atualizador e configuração da assinatura estável via Secrets.
- **Testes:** `node tests/neo-v91.test.js`.
- **Mudanças:** consulte [CHANGELOG-v9.1.md](CHANGELOG-v9.1.md).

A versão web offline empacotada no APK preserva os personagens, o catálogo de habilidades e os retratos originais. Retratos importados pelo usuário ficam no armazenamento privado do app; faça backup antes de reinstalar.

## Atualizações

O pacote `web/updates/blue-lock-web-9.1.0.zip` é servido junto com `web/updates/latest.json` quando o site é publicado. O aplicativo oferece atualizar o conteúdo web pela conexão configurada; sem publicação online, o APK ainda funciona offline com seu conteúdo embutido. Para atualizar o binário APK sem desinstalar, **a chave de assinatura precisa ser a mesma da instalação anterior**.

## Publicação GitHub — v9.1

- Código-fonte completo, 87 retratos e testes estão na branch `main`.
- GitHub Actions compila o APK de teste na rotina `Gerar APK Blue Lock NEO (atualizável)`.
- O fluxo `Publicar Blue Lock NEO e atualizações` publicou o conteúdo web pelo GitHub Pages.
- APKs de teste do GitHub Actions são assinados com chave de debug: **não atualizam instalações com a assinatura estável da v9.0/v9.1**.
- Para obter APKs de produção atualizáveis via GitHub Actions, configurar os secrets `BL_KEYSTORE_BASE64`, `BL_SIGNING_STORE_PASSWORD`, `BL_SIGNING_KEY_ALIAS` e `BL_SIGNING_KEY_PASSWORD`. Não enviar a chave privada ao repositório.
- **Atualização dentro do aplicativo:** a versão Android atual consulta `https://blue-lock-neo-simulator.netlify.app/updates/latest.json`. Publicar no GitHub Pages não atualiza esse endpoint da Netlify automaticamente. O ZIP web também precisa ser implantado na Netlify para que o botão interno de atualização encontre a nova versão.

## Estado de qualidade

Os testes automatizados verificam a coerência entre gols/placar, finalizações/xG, duelos e dados históricos. Os fluxos Android e navegador visual não foram executados em aparelho real nesta entrega; teste antes de disponibilizar a outras pessoas.
