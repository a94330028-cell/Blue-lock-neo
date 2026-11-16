# BLUE LOCK NEO — PLANO DE EXECUÇÃO DAS 55 IDEIAS

Este documento é o backlog oficial das 55 propostas do usuário. **Não significa que todas foram implementadas.** Uma tarefa só passa para `concluído` após código integrado, testes e validação do jogo real. Os marcos existentes são aproximados e não garantem cobertura integral.

## IA e personalidade

- [x] **01. IA individual e estilos de jogo** — concluído e validado (v1.6.0)
- [x] **02. Sistema de Ego** — concluído e validado (v1.6.0)
- [x] **03. Despertares durante partidas** — concluído e validado (v1.6.0)
- [x] **04. Flow exclusivo** — concluído e validado (v1.6.0)
- [x] **05. Metavision** — concluído e validado (v1.6.0)
- [x] **06. Devoração de rivais** — concluído e validado (v1.7.0)
- [x] **07. Habilidades especiais** — concluído e validado (v1.7.0)
- [x] **08. Duelo de habilidades** — concluído e validado (v1.7.0)
- [x] **09. Partidas cinematográficas** — concluído e validado (v1.7.0)
- [x] **10. Futebol dinâmico** — concluído e validado (v1.7.0)
- [x] **11. Carreira personalizada** — implementado e validado (v1.8.0)
- [x] **12. Rivalidades automáticas** — implementado e validado (v1.8.0)
- [x] **13. Evolução individual** — implementado e validado (v1.8.0)
- [x] **14. Transferências** — implementado e validado (v1.8.0)
- [x] **15. Campeonatos** — implementado e validado (v1.8.0)
- [x] **16. Histórico e recordes** — implementado e validado (v1.8.0)
- [x] **17. Turbo 40×** — implementado e validado (v1.8.0)
- [x] **18. Narrativa automática** — implementado e validado (v1.8.0)

## Mecânicas de anime

- [ ] **19. Evolução de habilidades em três níveis** — parcial
- [ ] **20. Jogadas improvisadas** — parcial: saídas sob pressão em lances legais
- [ ] **21. Reações em cadeia** — parcial
- [ ] **22. Química entre jogadores** — parcial
- [ ] **23. Sistema de armas** — parcial
- [ ] **24. Instinto de artilheiro** — parcial
- [ ] **25. Evolução de posições** — parcial: movimentos situacionais sem alterar posição definitiva
- [ ] **26. Contra-ataques de Ego** — parcial
- [ ] **27. Conflitos entre companheiros** — pendente
- [ ] **28. Evolução por derrotas** — parcial
- [ ] **29. Adaptação da IA** — parcial
- [ ] **30. Momentos de genialidade** — parcial

## Partidas

- [ ] **31. Intensidade contextual** — parcial: ajustes discretos de pressão pelo placar e minuto
- [ ] **32. Câmera inteligente** — pendente
- [ ] **33. Defesas lendárias** — parcial
- [ ] **34. Inteligência tática coletiva** — parcial
- [ ] **35. Cansaço mental** — parcial
- [ ] **36. Combinações especiais** — parcial
- [ ] **37. Narração dinâmica** — pendente
- [ ] **38. Replay de melhores momentos** — parcial
- [ ] **39. Banco inteligente** — parcial
- [ ] **40. Domínio territorial** — parcial: amostras verificadas da posse no terço ofensivo

## Universo e modos

- [ ] **41. História emergente** — parcial
- [ ] **42. Ranking de Egoístas** — parcial
- [ ] **43. Prêmios da temporada** — parcial
- [ ] **44. Hall da Fama** — parcial
- [ ] **45. Olheiros** — parcial
- [ ] **46. Treinadores inteligentes** — parcial
- [ ] **47. Copa dos Egoístas** — parcial
- [ ] **48. Seleção mundial** — parcial: WORLD XI amistoso automático, falta competição de seleções
- [ ] **49. Linha do tempo dos personagens** — parcial
- [ ] **50. Modo espectador premium** — parcial

## Extras

- [ ] **51. Rei do Campo** — parcial
- [ ] **52. Níveis de rivalidade** — parcial
- [ ] **53. Fórmula de Gol** — parcial
- [ ] **54. Despertar de novas armas** — parcial
- [ ] **55. Enciclopédia de Egoístas** — parcial

## Integração incremental após a etapa 11–18 — Build de conteúdo 10.6.10

Este lote adiciona duas camadas testáveis sem substituir o motor: `web/neo-advanced-v200.js` e
`web/neo-universe-v220.js`, com testes em `tests/v200.test.cjs`.

- **IA e ações físicas:** passagem improvisada apenas com posse, pressão e rota de passe válida; memória de duelos perdidos, ligações de passes realmente lançados, instinto ofensivo e desgaste mental. Os ajustes nos atributos são limitados para não garantir gols.
- **Jogo e análise:** amostragem por tempo de bola efetiva no terço ofensivo e marcação de defesas confirmadas contra chutes com xG alto; somente os acontecimentos produzidos pelo motor entram no histórico.
- **Universo:** arquivo idempotente de partidas oficiais com ranking, prêmios apenas após todas as partidas, linha do tempo, Hall da Fama comprovado e olheiros baseados na nota registrada.
- **Modos:** atalho para Copa Mundial de Clubes com elencos existentes e Seleção Mundial NEO automática para amistosos, recalculada sem duplicar jogadores escalados no adversário. Isto não é uma competição de seleções nacionais nem conclui a ideia 48.
- **Interface:** painéis recolhidos por padrão. A página não recebe uma seção gigante sempre aberta.
- **Preservação:** não há migração destrutiva, o módulo não apaga retratos nem grava transferências automáticas. O build Android web 10.6.10 continua separado do número da versão binária.

**Estado de aceite:** este marco integra funcionalidades parciais de vários itens, mas **não conclui automaticamente 19–55**. Continuam necessárias verificações de todas as competências por item, partidas completas, balanceamento, melhorias de câmera e narração, banco inteligente, Seleção Mundial competitiva e validação de compatibilidade de APK assinado.

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

## Conclusão técnica — Ideias 6 a 10 (v1.7.0)

Concluídos os cinco requisitos do escopo de desenvolvimento desta etapa, com o módulo `web/neo-ego-saga-v180.js`, a interface `web/neo-ego-saga-v180.css` e `tests/v180.test.cjs`, além das regressões anteriores. A publicação do site foi confirmada no GitHub Actions. O resto do planejamento permanece aberto.

6. **Devoração de rivais:** duas derrotas em duelos reais ativam uma janela de adaptação contra aquele adversário; só a vitória efetiva posterior registra Devoração e o bônus termina no prazo. Nenhuma habilidade é copiada artificialmente.
7. **Habilidades especiais:** armas existentes continuam exigindo ativação, contexto, energia e recarga; seus atributos apropriados recebem pequenas diferenças táticas, e a finalização usa qualidade real da zona do chute.
8. **Duelo de habilidades:** os resultados continuam pertencendo ao motor original; o jogo registra técnicas realmente ativas e o vencedor real, com efeitos contextuais sem resultados predeterminados.
9. **Partidas cinematográficas:** o modo de transmissão, câmera, replay e efeitos já existentes são combinados com episódios de acontecimentos reais, linha do tempo da rodada e destaques discretos. Não há geração de vídeos ou imagens novas sem os recursos fornecidos pelo usuário.
10. **Futebol dinâmico:** pontas procuram companheiros livres na área, atacantes atacam o segundo poste, meias buscam o passe recuado e laterais criam linhas de apoio; impedimento, estado real da bola, qualidade da chance e movimento físico são preservados.

**Validação:** testes de cenas positivas e negativas, idempotência das súmulas, comparação de placares, sementes determinísticas, coordenadas finitas, cache de jogadas em Turbo 40× e build do site. Novos episódios passam a existir apenas após uma partida realmente registrada nessa versão.

## Conclusão técnica — Ideias 11 a 18 (v1.8.0)

Validação automatizada em `tests/v190.test.cjs` e regressões do simulador, além do módulo `web/neo-living-career-v190.js`, a camada de integração segura com a temporada em `web/app.js` e o contexto de jogo em `web/engine.js`. Os **itens 19 a 55 continuam pendentes ou parciais**.

11. **Carreira personalizada:** personagens criados pela ferramenta existente acumulam partidas, notas, gols, assistências, marcos e foco de treino com evolução registrada na temporada.
12. **Rivalidades automáticas:** duelos comprovados na súmula geram rivalidades de três níveis (inicial, intensa, lendária), com vitórias individuais e reação limitada de Ego.
13. **Evolução individual:** treinamentos baseados em atuações boas de verdade modificam atributos reais, respeitando teto, idempotência e limite de ganhos.
14. **Transferências:** o Mercado Neo transfere jogadores da liga entre clubes, promove reservas, demove um titular de destino para o banco, conserva 11 titulares únicos e preserva o histórico do atleta. Ofertas automáticas são opcionais e avaliadas após rodadas completas. **Personagens criados permanecem protegidos e não são transferidos por este mercado**, evitando conflito com o editor de personagens.
15. **Campeonatos:** Neo League e competições eliminatórias independentes existentes ficam reunidas num painel de histórico com campeão apenas quando oficialmente definido.
16. **Histórico e recordes:** estatísticas reais de partidas, artilharia, assistências, goleiros e maiores vitórias, sem premiar jogadores com 0 gols nem tratar empate como goleada.
17. **Turbo 40×:** opção de aceleração já existente é preservada, com testes repetindo sementes iguais e os mesmos passos de física para verificar resultados determinísticos.
18. **Narrativa automática:** Jornal Neo registra placares, destaques individuais, goleadas, rivalidades, treinamentos e transferências; todas as notícias têm uma origem verificável na súmula ou na movimentação confirmada.

**Compatibilidade:** os elencos-base permanecem intactos para copas e amistosos independentes, e os saves não são reinicializados. A carreira e as manchetes passam a registrar acontecimentos a partir da versão 1.8.0, sem atribuir conquistas fictícias a jogos antigos. O APK requer a mesma assinatura digital da versão instalada para atualização sem desinstalar.
