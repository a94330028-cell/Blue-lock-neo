# Blue Lock NEO 9.1 — Repositório pronto para GitHub

1. Crie um repositório, preferencialmente privado enquanto estiver testando o uso de retratos.
2. Envie **o conteúdo desta pasta descompactada** para a raiz do repositório na branch `main` (não envie o ZIP como único arquivo).
3. Abra `Actions` → `Publicar Blue Lock e preparar atualizações do APK`. Sem `NETLIFY_AUTH_TOKEN`, a Action só gera o ZIP do site para publicação manual.
4. Configure o secret `NETLIFY_AUTH_TOKEN` (token Netlify do seu site) caso queira deploy automatizado. Confirme que o ID Netlify no workflow corresponde ao seu site antes de publicar.
5. Os arquivos `web/updates/latest.json` e `web/updates/blue-lock-web-9.1.0.zip` já vêm preparados para publicação.
6. Se você já tem o APK v9.0 instalado, o `Blue-Lock-NEO-v9.1-CHRONICLES.apk` foi compilado com **a mesma chave da v9.0** e deve ser aceito como atualização de pacote, desde que o aplicativo instalado realmente use aquela assinatura.
7. Para produzir outros APKs assinados no GitHub Actions, configure em `Settings` → `Secrets and variables` → `Actions`:
   - `BL_KEYSTORE_BASE64`: conteúdo da chave `.p12` da v9.0 codificada em Base64, sem compartilhar publicamente.
   - `BL_SIGNING_STORE_PASSWORD`: senha da chave v9.0.
   - `BL_SIGNING_KEY_ALIAS`: `blue_lock_neo_v9`.
   - `BL_SIGNING_KEY_PASSWORD`: a mesma senha do arquivo `.p12`.
8. Rode `Gerar APK Blue Lock NEO (atualizável)` pela aba `Actions` e use **APK-ASSINADO-ATUALIZAVEL** para continuar atualizando por cima.
9. Faça backup das temporadas/retratos antes de testar updates. Nunca envie `.p12`, senhas, arquivos de backup privado de retratos nem um APK que contenha material sem permissão para repositório público.

## Como atualizar só o jogo depois, sem gerar outro APK

- Edite `web/` e mantenha `app/src/main/assets/site/` sincronizado para a próxima compilação.
- Aumente `web/VERSION` para um número maior, por exemplo `9.1.1`.
- Rode `python3 tools/gerar_atualizacao.py`, publique **a pasta web inteira** no endereço do atualizador confiável e atualize pelo botão dentro do APK.
- A instalação dessas atualizações depende da hospedagem e da configuração nativa já existente. Não coloque secrets Android no GitHub público.

## Limites dos testes

O código foi testado por simulações automatizadas e verificação de integridade do APK. O navegador Chromium deste ambiente bloqueou páginas locais, portanto não houve teste visual completo nem instalação em aparelho Android. Nenhuma dessas validações foi alegada como realizada.
