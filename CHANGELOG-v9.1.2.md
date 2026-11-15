# Blue Lock NEO v9.1.2 — Navegação Android corrigida

## Correção principal
A barra inferior exibida no Android foi realmente modificada. Agora a ordem é:

**🎮 Jogar | 🏆 Liga | 📜 Recordes | 👑 Ranking | 👥 Jogadores | ⚙️ Mais**

Antes, a barra Android ainda usava os itens antigos `Números` e `Arsenal`, embora as áreas Recordes/Ranking existissem no jogo. Essa inconsistência foi corrigida em `web/mobile-upgrade.js`.

## Preservação das funções antigas
- Arsenal, Estatísticas e Galeria continuam disponíveis em **Mais**.
- A aba **Mais** permanece selecionada ao abrir uma dessas três áreas.
- Ranking e Recordes mantêm seus relatórios existentes.
- Os 87 retratos embutidos e os dados de temporada não foram alterados.

## Cache e atualização
- O service worker muda de chave de cache para `blue-lock-neo-v9.1.2-navigation`.
- O Android passa a usar `WebSettings.LOAD_NO_CACHE` para carregar os arquivos de interface atualizados sem limpar localStorage ou IndexedDB.
- Android `versionName 9.1.2`, `versionCode 93`.
- O atualizador web continua usando o GitHub Pages configurado.

## Qualidade
- Adicionado teste `node tests/navigation-v912.test.js` ao workflow Android, validando as seis abas e os destinos antigos.
- APK de teste e release sem assinatura compilados no GitHub Actions; APK de distribuição deve ser assinado com a chave privada estável.
- Não foi realizado teste em aparelho Android físico nesta etapa.
