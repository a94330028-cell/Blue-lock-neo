# Blue Lock NEO — Android atualizável v8.5

- Android WebView mantendo a origem HTTPS local fixa para fotos e liga.
- Busca de atualizações em `https://blue-lock-neo-simulator.netlify.app/updates/latest.json` ao abrir o app, e pelo botão manual.
- Download de ZIP completo, verificação SHA-256, limites de segurança, troca atômica de conteúdo e fallback para a versão anterior.
- Restauração opcional da versão embutida no APK sem apagar o banco IndexedDB.
- `web/VERSION` e gerador de atualizações para próximas versões.
- Workflow de publicação do Netlify que cria pacotes atualizáveis automaticamente.
- Workflow Android para APK debug e APK release com chave permanente privada.
- Preservados os recursos de jogo, animações, campo corrigido e galeria da v8.4.

Nenhum APK final compilado neste ambiente (Android SDK não disponível).
