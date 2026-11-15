# Publicação pelo celular — passos essenciais

Você já tem um projeto Netlify exclusivo do Blue Lock: https://app.netlify.com/projects/blue-lock-neo-simulator

**Primeiro:** publique a pasta `web` do projeto pela área de Deploys desse site. Ela contém o jogo e o arquivo `updates/latest.json`; é isso que permite ao APK encontrar novas versões. **Não envie o ZIP inteiro do Android como site.**

**Segundo:** em https://github.com/new, crie um repositório dedicado, por exemplo `blue-lock-neo-android`. O código precisa estar descompactado, mantendo `app/`, `web/`, `tools/` e `.github/workflows/`. Não sobrescreva o repositório de Pokémon Emerald. O GitHub não extrai automaticamente um ZIP enviado como arquivo para a raiz; use um computador, o GitHub Codespaces, ou outra forma de subir as pastas.

**Terceiro:** abra a aba Actions e execute `Gerar APK Blue Lock NEO (atualizável)`. Você pode baixar o artefato de teste e instalar no celular. Para atualizar futuramente **o próprio APK** sem perder dados, primeiro configure a assinatura permanente conforme `ATUALIZAR-O-APK.md` e instale o APK assinado, não o debug.

**Quarto:** para automatizar a hospedagem, crie um token de acesso na sua conta Netlify e salve-o **diretamente no GitHub Secrets** com o nome `NETLIFY_AUTH_TOKEN`. Nunca cole tokens em chats. Depois, cada push em `web/` pode gerar e publicar o pacote atualizado, que o APK oferece ao abrir.

**Lembre-se:** ainda não foi criado nenhum APK compilado neste ambiente. O projeto está preparado para o GitHub Actions/Android Studio fazer a compilação.


## Importar seus retratos antigos

Retratos guardados antes no navegador (por exemplo `127.0.0.1:14110`) **não aparecem automaticamente** no APK. Exporte as imagens e a temporada da versão antiga e use **Restaurar retratos** / **Importar temporada** na versão Android. São armazenamentos de aplicativos diferentes.
