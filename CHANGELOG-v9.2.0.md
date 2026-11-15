# Blue Lock NEO v9.2.0 — EGO Broadcast Extended

## Atualização visível
- Botão fixo **⬆️ Atualizar** na interface do jogo, mesmo se não houver atualização disponível.
- Central de atualização dentro de **Mais**, com versão instalada, ação para verificar e estados offline.
- Em APK Android, o botão utiliza `BlueLockAndroid.checkForUpdates()`, que verifica o manifesto oficial, mostra aviso de nova versão e preserva saves/retratos.
- Na web, consulta o manifesto local com cache desativado.
- Hospedagem de atualizações: GitHub Pages (`/Blue-lock-neo/updates/latest.json`).
- O arquivo `neo-broadcast-v920.js` é incluído no cache offline do PWA.

## Partidas muito maiores, sem mexer na simulação de temporada
Escolha a duração aproximada da partida assistida em 1×:
- **5 minutos:** Clássica.
- **10 minutos:** Estendida.
- **15 minutos:** Cinematográfica (padrão).
- **20 minutos:** Épica.

O motor ajusta relógio e física de maneira conjunta para dar mais tempo às disputas e oportunidades reais sem inflar excessivamente os placares. A simulação automática da temporada conserva o relógio original de alta velocidade; nenhuma partida é gerada artificialmente.

## Melhorias de transmissão
- Placar vivo de finalizações, no alvo, defesas, desarmes, xG, duelos, habilidades, escanteios e gols.
- Gráfico de pressão baseado na posse da bola e finalizações recentes.
- Linha do tempo de 90 minutos com marcação dos gols reais.
- MVP parcial derivado das notas dos jogadores.
- Histórico de lances narrados pelo motor, técnicas e confrontos individuais.
- Arquivo local das últimas 35 partidas acompanhadas integralmente.
- Histórico de eventos do motor expandido de 70 para 180.
- Preservação dos 87 retratos, das seis abas da v9.1.2, da liga e dos backups.

## Engenharia e testes
- Android `versionCode 94`, `versionName 9.2.0`, conteúdo offline `web/VERSION=9.2.0`.
- Testes `tests/navigation-v912.test.js` e `tests/broadcast-v920.test.js` no GitHub Actions.
- JavaScript verificado com `node --check`, motor testado em partidas padrão e longas.
- Um APK de produção que atualiza o anterior exige a mesma assinatura. Secrets privados não são colocados no GitHub.
- Teste em aparelho Android físico continua recomendado antes de distribuir amplamente.
