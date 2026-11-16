# Blue Lock NEO — Desktop para Windows

O aplicativo Windows usa a mesma versão do simulador publicada em `web/`, com a interface desktop ativada em telas largas (arquivo `web/neo-desktop.css`). O layout Android permanece responsivo e independente.

## Atualização pelo GitHub
O workflow `.github/workflows/gerar-pc.yml` gera instalador NSIS e versão portátil em Windows x64. Depois de uma build aprovada, publica ambos em GitHub Releases. Quando o aplicativo instalado inicia, ele consulta as releases que contêm `latest.yml` e pode baixar e aplicar uma versão Windows mais nova. As releases Android não entram na seleção do desktop.

**Instale a variante `Setup` para receber atualizações pelo aplicativo.** A variante `Portable` não deve ser usada como se fosse um instalador com atualização garantida.

O perfil local de dados do desktop permanece na mesma origem `127.0.0.1:43819` para preservar os saves do próprio aplicativo entre versões. O navegador, o APK e o PC **não sincronizam automaticamente** seus armazenamentos locais; essa função exigiria contas e armazenamento remoto. Faça backup dos dados e dos retratos antes de trocar de dispositivo.

## Desenvolvimento
```sh
cd desktop
npm install
npm start
```

## Publicação
Os executáveis aparecerão em **Actions → Publicar aplicativo PC do Blue Lock NEO** e em **Releases** depois que o workflow terminar com sucesso. O aplicativo não é declarado pronto apenas por existirem arquivos no repositório; confira a primeira build e teste a atualização de uma versão instalada.

No Windows, executáveis sem assinatura de código podem gerar alertas de segurança do sistema. A assinatura de código é recomendada para distribuição ampla.
