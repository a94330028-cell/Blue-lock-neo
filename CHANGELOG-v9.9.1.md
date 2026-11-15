# Blue Lock NEO v9.9.1 — Ícone Kaiser NEO

## O que mudou
- A arte em preto e branco do Kaiser, com aro neon azul e selo NEO, substitui os ícones PWA do site.
- Foram adicionadas versões em PNG de 192×192 e 512×512, além do favicon 32×32.
- O manifesto web aponta para os novos arquivos `icons/kaiser-192.png` e `icons/kaiser-512.png`.
- Os ícones do Android foram reconstruídos nos cinco tamanhos oficiais de launcher (mdpi a xxxhdpi).
- O cache offline foi versionado para evitar mostrar os arquivos antigos.
- A versão nativa passou a 9.9.1, versionCode 102.
- Nenhum save, retrato personalizado ou recurso de partida foi alterado.

## Como receber a mudança
- **Site/PWA:** abra o endereço do jogo, recarregue; dependendo do Android/Chrome, talvez seja necessário remover e adicionar novamente o atalho para atualizar a miniatura.
- **APK nativo:** o ícone da lista de aplicativos só muda após instalar um APK novo contendo esses recursos. Atualização web isolada não altera `@mipmap/ic_launcher`. Para atualizar sobre o APK anterior sem perder dados, use a mesma chave de assinatura.
