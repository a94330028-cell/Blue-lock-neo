# Blue Lock NEO v8.4 — Publicação e APK

**Hospedagem Netlify já criada:** https://app.netlify.com/projects/blue-lock-neo-simulator
O deploy inicial ainda precisa ser enviado pela página **Deploys**. Não confunda criar o projeto com publicar o jogo.

**GitHub:** crie um repositório separado chamado `blue-lock-neo`; o conector autorizado consegue editar repositórios existentes, mas não permite criar repositórios.

1. Extraia este ZIP para uma pasta.
2. Envie todo o conteúdo da pasta para o novo repositório (incluindo `.github` e `web`). O GitHub Desktop ou `git push` preserva diretórios ocultos.
3. **Actions > Gerar APK Blue Lock NEO 8.4 > Run workflow**: ao terminar, baixe o artefato com `app-debug.apk`.
4. Para publicar no GitHub Pages, em **Settings > Pages > Source**, escolha **GitHub Actions**; execute **Actions > Publicar Blue Lock NEO no GitHub Pages**.

O APK preserva imagens no armazenamento privado entre execuções. **A chave debug varia entre runners; para instalar atualizações sobre a versão anterior sem apagar dados, configure assinatura estável.** Antes de atualizar, exporte retratos e liga.

O GitHub Pages em planos GitHub Free normalmente exige repositório público. Repositório privado pode hospedar o código via Netlify. A hospedagem de PWA não sincroniza imagens entre dispositivos.
