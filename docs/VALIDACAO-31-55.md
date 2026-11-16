# BLUE LOCK NEO — Validação das ideias 31–55

## Implementação existente e novas verificações

- **31–40:** `web/neo-match-pulse-v240.js` integra intensidade contextual, pistas de câmera, detecção de defesas, posicionamento coletivo, desgaste mental, sequências de passes, narração de logs reais, destaques, substituições registradas e posse territorial amostrada.
- **41–55:** `web/neo-universe-v220.js` e `web/neo-universe-spotlight-v250.js` exibem resultados, ranking, prêmios após temporada, Hall da Fama, olheiros, rivalidades, enciclopédia e fórmulas derivadas de estatísticas reais. Parte dos modos e da profundidade de cada ideia permanece parcial.
- **Testes:** `tests/v250.test.cjs` cobre eventos individuais; `tests/v255-season.test.cjs` executa **20 rodadas e 40 partidas reais** e exige histórico consistente, troféus e premiações verificáveis, saves sem duplicação e relatórios 31–40 persistidos.
- **Publicação:** os workflows de site e APK agora executam o teste longo antes da compilação/publicação.
- **Discord:** conteúdo `10.6.13` e notas novas no `CHANGELOG.json`; o identificador muda com o conteúdo validado e impede reenvio de um mesmo anúncio. O envio só acontece após deploy confirmado e com webhook configurado.

## Status de aceite por ideia

| Ideias | Integração atual | Verificação automatizada | Ainda necessário |
|---|---|---|---|
| 31, 34, 35, 36, 39, 40 | Parcial, ligada ao motor real | Cenas isoladas e temporada completa | Equilíbrio multi-semente e jogabilidade em aparelho |
| 32 | Pistas de câmera ligadas à bola e ao lance | Cenas de posse/chute | Teste visual de câmera efetivamente animada |
| 33 | Registros de defesas perigosas | Cenários controlados | Amostra de defesas e apresentação visual |
| 37, 38 | Narração e destaques de lances reais | Teste de logs e persistência | Replay visual reproduzível e qualidade narrativa |
| 41–47 | Universo vivo, ranking, prêmios, Hall e copa de clubes existente | Dados reais e conclusão de temporada | Profundidade funcional individual dos modos |
| 48 | WORLD XI experimental em amistosos | Integração existente | Competição de seleções real ainda não implementada |
| 49–55 | Linha do tempo, espectador, Rei do Campo, rivalidades, fórmulas e enciclopédia | Dados reais de partidas e carreira | Aceite individual e UX, especialmente despertar de novas armas |

**Critério de verdade:** a aprovação de uma suíte automatizada não implica que todas as 25 ideias estão integralmente implementadas. Somente declarar “implementado e validado” quando o requisito completo tiver sido demonstrado. Não inventar campeões, habilidades, fotos, estatísticas nem aprovação de testes Android físicos.
