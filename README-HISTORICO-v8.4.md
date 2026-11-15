# Blue Lock NEO — Android APK com atualizações futuras

Este projeto contém **o jogo completo** (v8.4) e um **APK Android WebView atualizável** (shell v8.5).

## O que muda

- O APK abre mesmo offline, usando os arquivos que já vêm dentro dele.
- O jogo é exibido numa origem interna **fixa**: `https://appassets.androidplatform.net/`.
- A Liga, os retratos personalizados e as preferências continuam no mesmo IndexedDB/localStorage mesmo após instalar novas versões do **conteúdo web**.
- Ao abrir o aplicativo conectado à Internet, o Android verifica `https://blue-lock-neo-simulator.netlify.app/updates/latest.json` e **oferece** atualizações.
- O botão **⬇️ Atualizar jogo** permite verificar manualmente.
- A atualização é checada por **SHA-256** e descarregada no armazenamento privado do aplicativo. Se ocorrer erro, a versão anterior continua disponível.
- O botão **↩️ Restaurar versão original** restaura o conteúdo que veio com o APK, preservando os dados do usuário.
- Fotos podem ser escolhidas pelo seletor nativo do Android; backups podem ser exportados pelo seletor do sistema.

## Dois tipos de atualização

**A. Atualização do JOGO (mais frequente):**
Mudanças de habilidades, gráficos, narração, IA, regras, correções e interface. Basta publicar novo conteúdo na hospedagem; **não exige reinstalar APK**.

**B. Atualização do APK (rara):**
Mudanças em recursos nativos do Android, permissões e armazenamento. Exige compilar um novo APK, aumentando `versionCode` e usando **a mesma chave privada de assinatura**. Um APK assinado com outra chave não substitui o antigo.

## Como publicar as próximas versões do jogo

1. Edite os arquivos na pasta `web/` (por exemplo `web/engine.js`, `web/app.js` etc.).
2. Aumente o número em `web/VERSION`, ex.: `8.4.0` → `8.5.0`. **Não repita versões**; uma versão nova só é aplicada se o número for maior.
3. Execute `python3 tools/gerar_atualizacao.py`. Ele cria `web/updates/latest.json` e `web/updates/blue-lock-web-<versão>.zip`.
4. Publique **todo o conteúdo** da pasta `web/` em **https://blue-lock-neo-simulator.netlify.app/**. Ela já está associada ao projeto separado `blue-lock-neo-simulator`, mas precisa do primeiro deploy.
5. No Android, abra o jogo e aceite a atualização sugerida, ou toque em **⬇️ Atualizar jogo**.

O fluxo `.github/workflows/publicar-site.yml` executa os passos 3–4 automaticamente a cada push para `main`, **depois de configurar** o secret `NETLIFY_AUTH_TOKEN` no repositório. O ID do site Netlify já está no workflow. Sem esse secret, o workflow produz apenas um artefato do site para upload manual. A publicação nunca altera o projeto de Pokémon Emerald.

## Como compilar o APK pela primeira vez

GitHub Actions: envie o conteúdo **descompactado** desta pasta para um novo repositório GitHub, abra `Actions` e execute `Gerar APK Blue Lock NEO (atualizável)`. O artefato **APK-TESTE** é um APK de teste instalável; ele já consegue **baixar atualizações do jogo sem reinstalação**. Ele não é recomendado para atualizar o APK binário em lançamentos futuros porque a assinatura debug das máquinas temporárias pode mudar.

Para um APK de produção que você consiga instalar **por cima da versão anterior**, configure uma chave de assinatura privada e os secrets `BL_*` descritos em `ATUALIZAR-O-APK.md`. O workflow gerará o artefato **APK-ASSINADO-ATUALIZAVEL**.

A pasta também pode ser aberta pelo Android Studio (`Gradle 8.7`, `AGP 8.6.1`, `SDK 35`, `Java 17`).

## Limites importantes

- A atualização remota exige Internet e a publicação na hospedagem Netlify; **o APK offline não depende dela para jogar**.
- Desinstalar o aplicativo ou limpar seus dados pode remover fotos/saves. **Faça backups** no menu Galeria e Liga.
- Atualização automática significa **verificar e perguntar**, nunca trocar arquivos durante a partida sem autorização.
- O arquivo `.apk` **não foi compilado neste ambiente**, pois não há Android SDK. Este ZIP contém o projeto configurado e os fluxos de compilação.
- Projeto de fã, não oficial.


## Importar seus retratos antigos

Retratos guardados antes no navegador (por exemplo `127.0.0.1:14110`) **não aparecem automaticamente** no APK. Exporte as imagens e a temporada da versão antiga e use **Restaurar retratos** / **Importar temporada** na versão Android. São armazenamentos de aplicativos diferentes.
