# BLUE LOCK NEO — Painel de validação das 55 ideias

A regra do projeto é: **primeiro validar, depois passar para o próximo bloco**. A presença de código, a compilação de um APK ou o funcionamento em apenas uma partida não basta para fechar uma ideia.

## Bloco 19–30: teste técnico realizado

- Testes positivos e negativos: **12 de 12 aprovados** no [workflow #43904207200](https://github.com/a94330028-cell/Blue-lock-neo/actions/runs/43904207200).
- Simulação com sementes fixas: 3 partidas completas e resultados repetíveis, sem alteração dos elencos-base.
- Navegador Chromium real: 1366×768, 1600×900 e 390×844, **sem exceções JavaScript**; carregamento da temporada, Recordes e alternância da escalação foram verificados.
- Compilações de site e APK: passaram no mesmo commit de referência.
- Correções aplicadas: conclusão real de passes, recuperação real de posse e reinício do jogo, ponte da temporada salva.

## Etapa seguinte: temporada e estabilidade

O [workflow de validação](https://github.com/a94330028-cell/Blue-lock-neo/actions/workflows/validar-12.yml) executou `tests/v230-season.test.cjs` na [execução aprovada #43905051970](https://github.com/a94330028-cell/Blue-lock-neo/actions/runs/43905051970). Foram **20 rodadas e 40 partidas oficiais**, com 97 gols (média de 2,42), 10 empates, cinco clubes com vitórias, classificação consistente, registro único de resultados e premiações somente após o fim da temporada. O save completo teve **3.468.241 bytes (3,308 MiB)**, dentro do limite de 4,65 MB definido no teste. O resultado é uma amostra com semente fixa, não comprova sozinho equilíbrio em todas as temporadas possíveis.

| Ideia | Objetivo verificável | Cenário individual | Temporada longa | Aprovação final |
|---|---|---|---|---|
| 19 | Domínio melhora sem desbloquear habilidade indisponível | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 20 | Improviso só com posse, pressão e linha legal | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 21 | Reação em cadeia depende de técnica ou passe confirmado | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 22 | Química depende de passe realmente recebido | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 23 | Arma altera apenas o atributo/contexto correto | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 24 | Instinto depende da área e de chances verificadas | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 25 | Posições são flexíveis sem modificar o elenco titular | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 26 | Contra-ataque exige recuperação real, não saída de bola | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 27 | Rivalidade de companheiros surge de finalizações reais | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 28 | Evolução por derrotas não duplica progressão | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 29 | Adaptação só ocorre após duelos realmente perdidos | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |
| 30 | Genialidade exige Flow, pressão, energia e recarga | Aprovado | Aprovado (20 rodadas) | Pendente (aparelho real) |

## Etapas que dependem de uso em aparelho real

Testar o APK **instalado sobre a versão anterior** no mesmo Android, preservando retratos do usuário, saves, progresso, habilidades, preferências e a recuperação offline. Verificar desempenho, memória, abas e partidas reais em dispositivos com capacidades diferentes. Essa etapa não é substituída pela emulação de resolução do navegador.

## Critério de encerramento

Marcar um item como *validado* somente depois dos testes de mecanismo, integração, temporada e usabilidade aplicáveis. Quando houver pendências, mantê-las explícitas. **Não avançar automaticamente para as ideias 31–42 antes do aceite completo do bloco 19–30.**
