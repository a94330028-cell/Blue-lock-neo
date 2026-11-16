# BLUE LOCK NEO — PLANO DE EXECUÇÃO DAS 55 IDEIAS

Este documento é o backlog oficial das 55 propostas do usuário. **Não significa que todas foram implementadas.** Uma tarefa só passa para `concluído` após código integrado, testes e validação do jogo real. Os marcos existentes são aproximados e não garantem cobertura integral.

## IA e personalidade

- [x] **01. IA individual e estilos de jogo** — concluído e validado (v1.6.0)
- [x] **02. Sistema de Ego** — concluído e validado (v1.6.0)
- [x] **03. Despertares durante partidas** — concluído e validado (v1.6.0)
- [x] **04. Flow exclusivo** — concluído e validado (v1.6.0)
- [x] **05. Metavision** — concluído e validado (v1.6.0)
- [ ] **06. Devoração de rivais** — parcial
- [ ] **07. Habilidades especiais** — parcial
- [ ] **08. Duelo de habilidades** — parcial
- [ ] **09. Partidas cinematográficas** — pendente
- [ ] **10. Futebol dinâmico** — parcial
- [ ] **11. Carreira personalizada** — pendente
- [ ] **12. Rivalidades automáticas** — parcial
- [ ] **13. Evolução individual** — parcial
- [ ] **14. Transferências** — pendente
- [ ] **15. Campeonatos** — parcial
- [ ] **16. Histórico e recordes** — parcial
- [ ] **17. Turbo 40×** — parcial
- [ ] **18. Narrativa automática** — parcial

## Mecânicas de anime

- [ ] **19. Evolução de habilidades em três níveis** — parcial
- [ ] **20. Jogadas improvisadas** — pendente
- [ ] **21. Reações em cadeia** — parcial
- [ ] **22. Química entre jogadores** — parcial
- [ ] **23. Sistema de armas** — parcial
- [ ] **24. Instinto de artilheiro** — parcial
- [ ] **25. Evolução de posições** — pendente
- [ ] **26. Contra-ataques de Ego** — parcial
- [ ] **27. Conflitos entre companheiros** — pendente
- [ ] **28. Evolução por derrotas** — parcial
- [ ] **29. Adaptação da IA** — parcial
- [ ] **30. Momentos de genialidade** — parcial

## Partidas

- [ ] **31. Intensidade contextual** — pendente
- [ ] **32. Câmera inteligente** — pendente
- [ ] **33. Defesas lendárias** — parcial
- [ ] **34. Inteligência tática coletiva** — parcial
- [ ] **35. Cansaço mental** — parcial
- [ ] **36. Combinações especiais** — parcial
- [ ] **37. Narração dinâmica** — pendente
- [ ] **38. Replay de melhores momentos** — parcial
- [ ] **39. Banco inteligente** — parcial
- [ ] **40. Domínio territorial** — pendente

## Universo e modos

- [ ] **41. História emergente** — parcial
- [ ] **42. Ranking de Egoístas** — parcial
- [ ] **43. Prêmios da temporada** — parcial
- [ ] **44. Hall da Fama** — parcial
- [ ] **45. Olheiros** — parcial
- [ ] **46. Treinadores inteligentes** — parcial
- [ ] **47. Copa dos Egoístas** — parcial
- [ ] **48. Seleção mundial** — pendente
- [ ] **49. Linha do tempo dos personagens** — parcial
- [ ] **50. Modo espectador premium** — parcial

## Extras

- [ ] **51. Rei do Campo** — parcial
- [ ] **52. Níveis de rivalidade** — parcial
- [ ] **53. Fórmula de Gol** — parcial
- [ ] **54. Despertar de novas armas** — parcial
- [ ] **55. Enciclopédia de Egoístas** — parcial

## Critérios obrigatórios de aceite

1. As mecânicas precisam alterar decisões ou estatísticas reais, não apenas gerar mensagens ou efeitos.
2. Nenhuma simulação deve forçar gols, campeões, habilidades, transferências ou prêmios sem eventos válidos.
3. A IA precisa preservar variedade de jogadas, impedimentos, colisões, posição e física da bola.
4. Todo sistema persistente deve ser idempotente e preservar retratos, temporadas, jogadores criados, arquivos do usuário e atualização de APK.
5. Testes de regressão, simulação com sementes fixas, mobile, Turbo 40× e compilação Android devem passar.
6. Usar arte própria/licenciada ou fornecida pelo usuário, evitando distribuir imagens não autorizadas do anime.
7. Torneios mundiais e transferências só serão considerados completos quando houver fluxo jogável, UI e persistência.

## Próximos lotes

- **Lote A — IA e física:** posicionamento, duelos, instinto de artilheiro, defesa e tomadas de decisão.
- **Lote B — Arsenal de anime:** despertar, Metavision, Flow, duelos de habilidades, reações e efeitos.
- **Lote C — Universo persistente:** rivalidades, evolução, carreira, transferências e prêmios.
- **Lote D — Competições:** Copa dos Egoístas, Seleção Mundial e campeonatos.
- **Lote E — Apresentação:** câmera, replays, narrador, galeria, enciclopédia e modo espectador.
- **Lote F — Estabilização:** testes de carga, otimização mobile, migração e segurança de saves.

## Situação validável — 1.5.0

A versão 1.5.0 entregou melhorias reais de IA coletiva, memória de goleiros, adaptação de treinadores, prevenção de chutes repetitivos e uma Enciclopédia por partidas. Mecânicas anteriores já incluem Copa eliminatória jogável de 2, 4 ou 8 clubes, Flow, Metavision, química, habilidades e replays de gol. A existência dessas peças **não significa** conclusão integral dos itens.

Continuam faltando para dar as 55 ideias como concluídas: carreira totalmente abrangente, transferências e olheiros com decisões reais de mercado, Seleção Mundial/convocações, temporadas persistentes multi-modo, competições internacionais e modo de 100 partidas simultâneas estável em celular, além de polimento cinematográfico e testes extensivos. Não marcar como concluído antes de aceitar cada sistema.

## Conclusão técnica — Ideias 1 a 5 (v1.6.0)

Esta marcação se refere aos **cinco itens do planejamento**, não às 55 funcionalidades restantes. Evidências: `web/neo-five-pillars-v170.js`, `tests/v170.test.cjs`, motor original e as regressões executadas em GitHub Actions.

1. **IA individual:** perfis individuais estáveis de jogadores que determinam decisões reais de passe, finalização e movimentação; atributos e escolhas preservados na carreira.
2. **Sistema de Ego:** ajustes contextuais limitados a ações reais, com influência do estilo e do placar, respeitando as condições existentes para ativar o Flow e registrando o pico efetivo.
3. **Despertares:** apenas para técnicas realmente ativadas com o atleta em Flow e experiência suficiente, com duração curta, limite de uma ocorrência por atleta e sem inventar habilidades.
4. **Flow exclusivo:** cada jogador possui identidade nominal e especialidade própria, bônus situacionais e limites por fadiga; o gatilho original por Ego e seus cooldowns continuam valendo.
5. **Metavision:** releitura de linhas de passe e posição projetada dos adversários com a bola nos pés; não ignora impedimento, pressão nem distância máxima.

A aba Recordes apresenta os **Cinco Pilares do Ego** e seu histórico limitado de partidas salvas. Testes incluem decisões positivas/negativas, penalidade por impedimento, caducidade dos bônus, idempotência e simulações com diferentes sementes no motor real. Novos registros são coletados somente depois da atualização, sem reconstruir estatísticas históricas inexistentes.
