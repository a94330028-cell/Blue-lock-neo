# Blue Lock NEO — primeira assinatura Android permanente

**Canal:** APK Android de conteúdo NEO FOUNDATION 10.6.45, nome exibido 2.0.0,
`versionCode 120`. O site e as atualizações de conteúdo continuam independentes.

## Segurança e recuperação

- A chave privada PKCS#12 foi criada fora do repositório e entregue ao proprietário
  em backup privado. **Jamais** coloque o `.p12`, `GITHUB-SECRETS.txt`, senhas
  ou o ZIP privado em commits, Releases públicos ou na pasta `web/`.
- Guarde pelo menos duas cópias privadas do backup da assinatura. Se a chave
  permanente se perder, novas instalações não poderão atualizar o APK assinado.
- SHA-256 público do certificado aprovado:
  `8cc61064a383d8d81ea0b8ed56f9d188358ad15e931ec6173fe624a1eaf425cd`.
- GitHub Actions compara essa impressão digital com a do APK realmente compilado;
  uma chave diferente faz o build de produção falhar.

## Configurar o GitHub

O proprietário deve abrir **Settings → Secrets and variables → Actions** do
repositório e criar, como *Repository secrets*, os quatro nomes abaixo. Os
valores exatos são fornecidos dentro do backup privado em `GITHUB-SECRETS.txt`.

1. `BL_KEYSTORE_BASE64`: arquivo `.p12` convertido para Base64.
2. `BL_SIGNING_STORE_PASSWORD`: senha da chave gerada.
3. `BL_SIGNING_KEY_ALIAS`: alias da chave gerada.
4. `BL_SIGNING_KEY_PASSWORD`: senha interna (igual à senha do armazenamento
   na chave PKCS#12 inicial).

Depois de salvar todos os segredos, execute manualmente **Actions → Gerar APK
Blue Lock NEO (atualizável) → Run workflow → main**. A assinatura é verificada
antes da publicação, e a tag específica
`v2.0.0-android-10.6.45` só pode ser publicada uma vez.

## Migração de APKs antigos — não forçar atualização

Os APKs já distribuídos antes desta assinatura podem usar um certificado
diferente (incluindo Debug). O Android **não permite** instalar por cima um
APK com o mesmo `applicationId` e outra assinatura.

1. No app antigo, exporte **o backup da temporada** pelo Menu e **o backup dos
   retratos personalizados** pela Galeria. Confirme que ambos os arquivos
   estão em local externo à instalação, que podem ser lidos e que têm conteúdo.
2. Enquanto só quiser as mudanças de jogo, prefira **Atualizar** (pacote OTA)
   no APK antigo; isso não exige desinstalar nem trocar a assinatura.
3. Se quiser usar o APK nativo novo, faça a migração de dados em aparelho/perfil
   de teste primeiro. Uma reinstalação pode apagar `localStorage` e IndexedDB;
   não desinstale sem um procedimento de restauração comprovado.
4. Para os lançamentos posteriores, mantenha essa mesma chave privada e avance
   `versionCode` e a tag de Release.

**Estado atual:** certificado e build preparados; publicação de novo APK
condicionada à configuração privada dos segredos no GitHub e à homologação
num Android real. O APK Debug nunca deve ser usado como Release estável.
