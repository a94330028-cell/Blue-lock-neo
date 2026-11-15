# Blue Lock NEO v8.4 — Aplicativo Android nativo

**Este ZIP contém um projeto Android para GERAR o APK. Não é o APK já compilado.**

## O que é diferente da versão PWA

- É um aplicativo Android (Activity/WebView) com jogo e imagens locais incluídos no pacote.
- O jogo roda pelo endereço virtual estável `https://appassets.androidplatform.net/index.html`, servido localmente do próprio APK, sem servidor e sem publicar um site.
- As fotos que você importar são armazenadas no IndexedDB particular do app. Elas permanecem depois de fechar e abrir e devem permanecer em atualizações do mesmo app **desde que o APK novo seja assinado com a mesma chave**.
- Escolher retrato abre o seletor de arquivos Android (`onShowFileChooser`).
- Exportar liga ou retratos abre o seletor de destino Android (`ACTION_CREATE_DOCUMENT`).
- **Desinstalar o aplicativo ou limpar seus dados pode apagar as fotos e temporadas.** Exporte os backups.
- O APK não depende de acesso à internet para o motor. Retratos de URLs externas precisam de conexão.

## Compilar APK no Android Studio

1. Abra a pasta do projeto no Android Studio.
2. Aguarde a sincronização Gradle e instalação do SDK Android 35, se necessário.
3. Escolha **Build > Build APK(s)**, compilação Debug.
4. O arquivo gerado é `app/build/outputs/apk/debug/app-debug.apk`.
5. Transfira o APK para o Android e instale. Evite alterar `applicationId` nas atualizações se quiser preservar dados.

## Compilar sem instalar Android Studio (GitHub Actions)

1. Crie um repositório **privado** no GitHub e envie **o conteúdo desta pasta** (inclusive `.github/workflows`).
2. Vá a **Actions > Gerar APK Blue Lock NEO > Run workflow**.
3. Quando terminar, baixe o artefato `Blue-Lock-NEO-v8.4-APK` e extraia `app-debug.apk`.
4. No celular, abra o `.apk` e instale (quando solicitado, permita instalação pelo app que está abrindo o arquivo).

Esse caminho exige o upload para seu repositório e que o GitHub Actions esteja habilitado. O APK Debug usa chave própria do ambiente de build; gerar com chave diferente pode exigir desinstalação para atualizar, perdendo dados. Para manter os dados, gere as atualizações com a **mesma chave de assinatura** e use os botões de backup.

## Privacidade das fotos

As imagens escolhidas no Android ficam no armazenamento privado do app, sem serem enviadas para um servidor. URLs de fotos externas e links da Wiki ainda podem fazer requisições quando houver internet. Evite limpar dados ou desinstalar sem exportar seus backups.

## Limitações

Este projeto não foi compilado em APK nem testado num dispositivo Android neste ambiente, porque faltam Android SDK e ferramentas de compilação. O código Java e a estrutura foram revisados, mas a primeira compilação pode exigir algum ajuste no Android Studio. As versões do Gradle e do plugin Android foram escolhidas para uso conjunto.
