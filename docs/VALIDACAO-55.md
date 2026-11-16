# BLUE LOCK NEO — Painel de validação das 55 ideias

A regra do projeto é: **primeiro validar, depois passar para o próximo bloco**. A presença de código, a compilação de um APK ou o funcionamento em apenas uma partida não basta para fechar uma ideia.

## Bloco 19–30: teste técnico realizado

- Testes positivos e negativos: **12 de 12 aprovados** no [workflow #43904207200](https://github.com/a94330028-cell/Blue-lock-neo/actions/runs/43904207200).
- Simulação com sementes fixas: 3 partidas completas e resultados repetíveis, sem alteração dos elencos-base.
- Navegador Chromium real: 1366×768, 1600×900 e 390×844, **sem exceções JavaScript**; carregamento da temporada, Recordes e alternância da escalação foram verificados.
- Compilações de site e APK: passaram no mesmo commit de referência.
- Correções aplicadas: conclusão real de passes, recuperação real de posse e reinício do jogo, ponte da temporada salva.

## Etapa seguinte: temporada e estabilidade

O [workflow de validação](https://github.com/a94330028-cell/Blue-lock-neo/actions/workflows/validar-12.yml) executa também `tests/v230-season.test.cjs`, cobrindo uma liga com **20 rodadas, 40 confrontos**, a progressão oficial e os dados salvos. A aprovação será registrada quando essa execução terminar com sucesso.

| Ideia | Objetivo verificável | Cenário individual | Temporada longa | Aprovação final |
|---|---|---|---|---|
| 19 | Domínio melhora sem desbloquear habilidade indisponível | Aprovado | Em validação | Pendente |
| 20 | Improviso só com posse, pressão e linha legal | Aprovado | Em validação | Pendente |
| 21 | Reação em cadeia depende de técnica ou passe confirmado | Aprovado | Em validação | Pendente |
| 22 | Química depende de passe realmente recebido | Aprovado | Em validação | Pendente |
| 23 | Arma altera apenas o atributo/contexto correto | Aprovado | Em validação | Pendente |
| 24 | Instinto depende da área e de chances verificadas | Aprovado | Em validação | Pendente |
| 25 | Posições são flexíveis sem modificar o elenco titular | Aprovado | Em validação | Pendente |
| 26 | Contra-ataque exige recuperação real, não saída de bola | Aprovado | Em validação | Pendente |
| 27 | Rivalidade de companheiros surge de finalizações reais | Aprovado | Em validação | Pendente |
| 28 | Evolução por derrotas não duplica progressão | Aprovado | Em validação | Pendente |
| 29 | Adaptação só ocorre após duelos realmente perdidos | Aprovado | Em validação | Pendente |
| 30 | Genialidade exige Flow, pressão, energia e recarga | Aprovado | Em validação | Pendente |

## Etapas que dependem de uso em aparelho real

Testar o APK **instalado sobre a versão anterior** no mesmo Android, preservando retratos do usuário, saves, progresso, habilidades, preferências e a recuperação offline. Verificar desempenho, memória, abas e partidas reais em dispositivos com capacidades diferentes. Essa etapa não é substituída pela emulação de resolução do navegador.

## Critério de encerramento

Marcar um item como *validado* somente depois dos testes de mecanismo, integração, temporada e usabilidade aplicáveis. Quando houver pendências, mantê-las explícitas. **Não avançar automaticamente para as ideias 31–42 antes do aceite completo do bloco 19–30.**
