# Como manter o mesmo APK atualizável por anos

## Primeira instalação: estabeleça uma assinatura permanente

Cada APK Android tem duas identidades importantes: o **applicationId** (`com.neoegoist.simulator`, fixo) e o **certificado de assinatura**. Para a instalação de versões futuras por cima da atual **sem apagar dados**, não altere nenhum dos dois.

O `versionCode` começa em `85` (`versionName: 8.5.0`) em `app/build.gradle`. Para uma nova versão nativa, mude `versionCode` para um número MAIOR (por exemplo 86) e atualize `versionName`. Atualize também `BuildVersion.CODE` no `MainActivity.java` se uma nova versão do motor Android for necessária.

Crie um arquivo de assinatura JKS **uma vez**, por exemplo com o `keytool` do Java (não rode o comando dentro do repositório):

```bash
keytool -genkeypair -v -keystore blue-lock-release.jks -alias blue-lock-neo -keyalg RSA -keysize 3072 -validity 10000
```

**Guarde o `.jks` e as senhas em lugar seguro; sem a mesma chave você não conseguirá assinar uma atualização compatível do APK original.** Não publique essa chave no GitHub, não coloque-a em uma pasta pública do site e não a envie no chat.

No GitHub, nas configurações do repositório (`Settings → Secrets and variables → Actions`), adicione:

- `BL_KEYSTORE_BASE64`: conteúdo da sua JKS em Base64 (sem linhas extras)
- `BL_SIGNING_STORE_PASSWORD`: senha da JKS
- `BL_SIGNING_KEY_ALIAS`: `blue-lock-neo` (ou o alias escolhido)
- `BL_SIGNING_KEY_PASSWORD`: senha da chave

O workflow `.github/workflows/gerar-apk.yml` compila um **APK-ASSINADO-ATUALIZAVEL** usando esses secrets. Só instale a **primeira versão assinada com essa chave** e continue usando a mesma em todos os lançamentos.

## Próximas atualizações

**Novidades do site/IA:** altere `web/` e `web/VERSION`, publique o conteúdo via Netlify. O APK atual baixa a nova versão internamente, preservando a origem de IndexedDB. **Não é necessário gerar outro APK.**

**Novas funções nativas do Android:** aumente o `versionCode`, compile `assembleRelease` com os mesmos secrets, baixe o novo APK e instale por cima do antigo sem desinstalar. Se Android disser que o app não pode ser atualizado, verifique se assinatura e `applicationId` são idênticos.

## Fotos e saves

O jogo usa sempre `https://appassets.androidplatform.net`, mesmo quando a versão web muda. Os retratos e a liga continuam na mesma origem do WebView e, portanto, podem persistir na atualização. Ainda assim, exporte seus backups periodicamente. Desinstalar ou limpar os dados do aplicativo pode removê-los.

## Atualizações e segurança

O aplicativo só aceita pacotes HTTPS do domínio fixo `blue-lock-neo-simulator.netlify.app`, verifica SHA-256 e limita o tamanho do ZIP. Mantenha protegida sua conta Netlify/GitHub; quem puder publicar nesses serviços também poderá distribuir novas versões do jogo. Se uma atualização falhar, use **Restaurar versão original**.
