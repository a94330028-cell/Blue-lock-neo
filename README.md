# BLUE LOCK NEO — Simulador Android + web

Projeto de fã independente. A versão Android inclui o jogo offline e pode baixar atualizações de conteúdo por conexão HTTPS. Os retratos ficam no armazenamento privado do WebView (não devem ser removidos em atualizações de conteúdo).

## Baixar o APK no GitHub
1. Acesse **Actions → Gerar APK Blue Lock NEO (atualizável)**.
2. Escolha **Run workflow** (ou a execução iniciada pelo push).
3. Espere a execução ficar verde e abra **Artifacts → Blue-Lock-NEO-APK-TESTE**.
4. Extraia o ZIP e instale o **app-debug.apk** no seu Android.

⚠️ Debug APKs gerados em computadores/execuções diferentes não mantêm necessariamente a mesma assinatura. A atualização do **conteúdo do jogo** dentro do app é independente disso. Para substituir o APK nativo sem perder os dados, configure uma chave de assinatura release permanente no GitHub Secrets (quatro segredos BL_* documentados em `ATUALIZAR-O-APK.md`).

## Publicar o site
A pasta `web/` recebe o HTML completo quando `python3 tools/assemble_web.py` é executado. As partes em `packed/` armazenam o jogo de modo compactado. O workflow **Publicar Blue Lock NEO e atualizações** prepara os arquivos do site e publica no GitHub Pages. Para a primeira publicação, em Settings → Pages selecione **Source: GitHub Actions**.

## Notas importantes
- Página atual: versão 8.4.0, conforme os arquivos fornecidos.
- O Manifesto de atualização aponta para `https://a94330028-cell.github.io/Blue-lock-neo/updates/latest.json` e será publicado no GitHub Pages depois de ativar Pages em Settings → Pages → GitHub Actions. O site Netlify separado também pode hospedar o jogo, mas as atualizações do APK usam o domínio do GitHub Pages.
- Antes de atualizar o aplicativo, exporte backups da liga e dos retratos.
- Não instale dois pacotes com `applicationId` diferente; isso criaria outro armazenamento.
- Nenhuma imagem do usuário é enviada para este repositório automaticamente.
