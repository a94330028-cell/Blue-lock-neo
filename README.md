# Blue Lock NEO 9.1.2 — Atualizador GitHub Pages

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
