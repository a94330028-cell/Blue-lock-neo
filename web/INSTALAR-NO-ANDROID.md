# Instalar Blue Lock NEO v8.3 como aplicativo Android

**O arquivo ZIP não é um APK.** Ele contém um aplicativo web instalável (PWA), com ícone, tela própria, funcionamento offline após o primeiro acesso e retratos mantidos em IndexedDB no aparelho.

1. Extraia o ZIP e publique **todo o conteúdo da pasta** (inclusive `service-worker.js`, `manifest.webmanifest`, `icons/`, `assets/` e `systems/`) em um **mesmo endereço HTTPS permanente**, como em uma hospedagem estática. Nunca mude o domínio após importar fotos.
2. Abra esse endereço no Chrome ou Samsung Internet do Android.
3. Toque em **📲 Instalar aplicativo** ou no menu ⋮ → **Instalar aplicativo / Adicionar à tela inicial**.
4. Abra pelo ícone na tela inicial e toque em **🔐 Proteger fotos**. O sistema pode aprovar ou negar o pedido.
5. Na Galeria, adicione fotos; ao fechar e reabrir o aplicativo, o IndexedDB no mesmo endereço recupera as imagens.
6. Use **📦 Exportar meus retratos** para um backup de segurança. O backup é essencial antes de limpar dados, mudar de endereço, reinstalar o app ou trocar de celular.

**Atenção:** abrir por `file://` ou em servidores `127.0.0.1` com portas variáveis não oferece a mesma experiência de app instalável; o armazenamento é vinculado à origem (protocolo + host + porta). A instalação pelo navegador não cria um APK independente para distribuição. Nem `navigator.storage.persist()` impede que o usuário apague manualmente os dados.
