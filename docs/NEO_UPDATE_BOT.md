# Blue Lock NEO — Sistema oficial de anúncios no Discord

**Status:** workflow, painel de versões e validações implementados. O envio para o canal oficial só é habilitado depois de configurar o segredo e publicar as duas imagens exatas deste projeto.

## Como funciona

1. Um commit em `main` dispara o workflow **Publicar Blue Lock NEO e atualizações**.
2. Os testes, o jogo e o arquivo `web/CHANGELOG.json` são reconstruídos a partir do `CHANGELOG.json` principal.
3. O GitHub Pages recebe os arquivos. **Somente se `actions/deploy-pages` concluir com sucesso** é possível prosseguir.
4. O workflow confere os dois arquivos de imagem e seus SHA256. Se faltarem, não há mensagem ao Discord, mas o site continua publicado.
5. O script verifica publicamente `/Blue-lock-neo/VERSION` para confirmar que o número da versão está disponível no site.
6. O anúncio é montado apenas com as categorias não vazias do changelog e segue o limite de caracteres da API do Discord.
7. Uma reserva em `refs/tags/neo-updates/<versão>/pending` impede envios concorrentes. Após cada mensagem confirmada por `wait=true`, é criada uma tag por parte. Ao final, é criada `refs/tags/neo-updates/<versão>/sent`.
8. Novas execuções pulam versões já anunciadas. Se a entrega ficar indefinida, a reserva permanece, exigindo revisão antes do reenvio.

**Nenhum anúncio é disparado por commits simples, execução de testes, builds de APK ou deploy com falha.**

## 1. Imagens obrigatórias

O banner horizontal e o avatar quadrado enviados pelo autor serão servidos pelo próprio Pages. Eles devem ser adicionados aos caminhos **exatos** abaixo, sem edição, compressão, redimensionamento ou substituição:

| Uso | Caminho | Dimensões | SHA256 do original |
| --- | --- | --- | --- |
| Banner do embed | `web/assets/updates/neo-update-banner.jpg` | 1536 × 614 | `bd56fa4c5ee2c4f6d9cdf259da6c14bae1ab25077d81f9253c7be5fb555f6768` |
| Avatar do webhook | `web/assets/updates/neo-update-avatar.jpg` | 1536 × 1536 | `7572eea5ed7bf33e8fa1af5c63d4753dd55fb79a3d16a4178c5d508e70e02cbe` |

**Importante:** os anexos originais tinham nomes terminados em `.png`, mas seu conteúdo é **JPEG**. Renomeie para os caminhos `.jpg` acima preservando os bytes. O script valida o cabeçalho JPEG e o hash de cada arquivo.

URLs públicas esperadas após um deploy bem-sucedido:

- https://a94330028-cell.github.io/Blue-lock-neo/assets/updates/neo-update-banner.jpg
- https://a94330028-cell.github.io/Blue-lock-neo/assets/updates/neo-update-avatar.jpg

Elas não podem ser consideradas disponíveis antes do upload. **A ausência ou modificação de qualquer arte bloqueia o anúncio** e o site continua operando.

## 2. Segredo do Discord

No repositório GitHub: **Settings → Secrets and variables → Actions → New repository secret**, crie exatamente:

- **Nome:** `DISCORD_WEBHOOK_URL`
- **Valor:** URL privada do webhook do canal correto, criada em **Discord → Configurações do servidor → Integrações → Webhooks**.

Nunca publique o webhook em `.env`, `CHANGELOG.json`, Issues, logs ou prints. **Não é necessário token de bot Discord.** O script só aceita webhooks HTTPS oficiais e envia `allowed_mentions: {parse: []}`.

## 3. Changelog obrigatório

Edite o **`CHANGELOG.json` da raiz** antes de publicar cada nova versão. Atualize também o `web/VERSION` para o mesmo `X.Y.Z`.

O primeiro item em `releases` deve ter a versão atual, data ISO `AAAA-MM-DD` e pelo menos uma categoria com alterações reais:

- `novidades`
- `correcoes`
- `jogabilidade`
- `visual`
- `otimizacoes`
- `importantes`

Não adicione recursos incompletos ou resultados não comprovados. Categorias vazias serão omitidas dos embeds. O site e o Discord leem o mesmo changelog, sem manter duas cópias editáveis.

## 4. Prévia segura e reenvio

**Actions → NEO UPDATE BOT — revisão e reenvio manual → Run workflow:**

- `preview`: valida e anexa o JSON dos embeds como **NEO-UPDATE-BOT-DRY-RUN**. Não conecta ao Discord.
- `announce`: anuncia apenas a versão atualmente publicada se ainda não estiver registrada como enviada.
- `retry_pending`: permite retomar uma versão reservada após revisar a falha. Mensagens que já têm tag de confirmação não serão reenviadas.

Teste local:

```bash
python3 tools/neo_update_announcement.py validate
python3 tools/neo_update_announcement.py preview --output neo-update-preview.json
python3 -m unittest discover -s tests -p test_neo_announcer.py
```

Para conferir a existência dos originais, use `python3 tools/neo_update_announcement.py validate --require-media`.

## 5. Limitações de entrega e segurança

O GitHub mantém estado de deduplicação em tags e o Discord retorna o ID de cada mensagem com `wait=true`. Se o Discord aceitar a mensagem e a conexão cair antes de confirmar, **nenhuma integração webhook pode garantir exatamente uma entrega em todos os cenários**. Nesse caso o sistema bloqueia automaticamente novas tentativas e registra uma pendência para revisão. Evite acionar `retry_pending` antes de conferir o canal e os logs.

Os payloads não incluem menções automáticas, só usam links HTTPS oficiais e nunca enviam dados dos jogadores, arquivos de save, fotos pessoais ou credenciais.

## 6. Interface no aplicativo

Em **Mais → 🚀 ATUALIZAÇÕES**, o jogador vê o histórico de versões e um indicador de novidades não lidas. A seção só é marcada como lida depois de ser aberta. Não interfere na partida, nos salvamentos, nas imagens ou nas configurações do Android.

---
BLUE LOCK NEO • OFFICIAL UPDATE SYSTEM
