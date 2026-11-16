# Blue Lock NEO v9.9.2 — Fotos no Android e buscas simples

A captura mostrava um erro de leitura de imagem e uma lista de pesquisa que abria cartões completos. Os dois fluxos foram alterados.

## Fotos
- Decodificação nativa do arquivo quando o Android WebView suportar.
- Leitura tradicional e recuperação alternativa por bytes se a primeira leitura falhar.
- Mensagem de erro não presume que a permissão do usuário está desativada.
- Corrigir imagens restaura referências e atualiza a mensagem sem tocar nos saves.
- Não há upload de fotos a servidores: imagens permanecem no armazenamento privado do dispositivo.

## Pesquisa
- Galeria principal: resultados compactos com somente nome + clube. Toque para ir à ficha de retrato.
- Galeria dos quatro clubes históricos: a mesma experiência; toque para selecionar um atleta.
- Painéis grandes só aparecem depois que você escolhe um resultado, mantendo os controles de troca de imagem.

## Publicação
- Site e cache 9.9.2
- Android build versionCode 103 / versionName 9.9.2
- Versão web atualizável sem desinstalar a versão assinada 9.9.1
- Teste automatizado de regressão para busca, decodificação de fotos e armazenamento preservado
