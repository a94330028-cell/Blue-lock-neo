# Blue Lock NEO v9.0

O arquivo `Blue-Lock-NEO-v9.0-EGO-BROADCAST.apk` acompanha a entrega separadamente.

Para atualizar um APK já instalado mantendo os dados, compile este código com a assinatura privada usada na instalação anterior. O código-fonte não contém essa chave.

No workflow de GitHub, configure os secrets BL_KEYSTORE_BASE64, BL_SIGNING_STORE_PASSWORD, BL_SIGNING_KEY_ALIAS, BL_SIGNING_KEY_PASSWORD. Em seguida execute a Action `Gerar APK Blue Lock NEO` (release). O build de debug usa uma chave diferente e não substitui instalações de assinatura estável.

O projeto preserva os arquivos da v8.5 e atualiza o conteúdo web para a base v8.9 com 87 retratos. `web/VERSION` e `app/src/main/assets/site/VERSION` agora são 9.0.0.

O pacote de atualização web, gerado por `python3 tools/gerar_atualizacao.py`, pode ser publicado no host confiável já configurado no app; assim o aplicativo pode instalar arquivos web novos sem reinstalar. Faça backup da temporada e dos retratos antes de qualquer reinstalação.
