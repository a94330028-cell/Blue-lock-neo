# NEO FOUNDATION — requisitos, integridade e homologação

**Situação:** desenvolvimento; nenhuma atualização pública foi liberada por este documento.

## Objetivo

Confiar na mesma partida oficial em todas as telas do Blue Lock NEO: liga,
seleção da rodada, rankings, Masters, mercado fictício, técnico e histórico.
Preservar saves, retratos importados e atletas criados ao migrar versões.

## Requisitos verificáveis

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| NF-01 | Registro atômico | Uma partida só altera a temporada depois de confirmar a persistência. Falha de quota mantém o save anterior íntegro. |
| NF-02 | Idempotência | Repetir a gravação de uma partida não soma gols, pontos, aparições ou valores novamente. |
| NF-03 | Estatísticas | J = V + E + D; soma dos GP = soma dos GC; gols, assistências e relatórios usam eventos reais. |
| NF-04 | Rodadas | Contadores continuam avançando depois da rodada 7 e até o fim da temporada. |
| NF-05 | Masters | No máximo uma entrada por Master e clube por partida; `games` corresponde às entradas reais. |
| NF-06 | Rankings | Mestres com entradas reais entram nos rankings elegíveis, sem contaminar o histórico de atletas comuns. |
| NF-07 | Seleção da rodada | Cada rodada usa apenas jogos registrados nela; versão parcial indicada até concluir os confrontos. |
| NF-08 | Técnico | Forma recente e derrotas afetam escolhas reais; reservas precisam ser compatíveis com a posição. |
| NF-09 | Formações | Todas mantêm 11 jogadores válidos, goleiro real e laterais/pontas nos lados corretos. |
| NF-10 | Simulação | Modos 1, 3 e rodada/temporada seguem o mesmo registro seguro e não duplicam partidas. |
| NF-11 | Clubes | History e equipes adicionadas pelo jogador participam das mesmas regras e filtros. |
| NF-12 | Saves | Migração segura e evidência obrigatória antes de reparar estatísticas históricas. |
| NF-13 | Compatibilidade | O HTML offline do Android usa exatamente o motor e a interface do código-fonte atual. |
| NF-14 | Formatos completos | Para 2 a 6 clubes e 2/4/6 confrontos, cada dupla se enfrenta o número exato de vezes, com mando equilibrado; ninguém joga duas vezes na mesma rodada. |
| NF-15 | Três jogos com integridade temporal | O botão continua simulando até três jogos, mas nunca coloca o mesmo clube em dois campos simultâneos. A rodada seguinte só começa após registrar a anterior; técnicos recebem o novo histórico. |
| NF-16 | Liga longa | Em 20 rodadas / 60 partidas reais, classificação, gols, partidas, Masters e relatórios seguem consistentes até a última rodada. |

## Regras de recuperação

- A fonte primária de uma partida é seu placar final e relatório de jogadores/eventos.
- Só recalcular gols ou assistências acumulados se **todos** os jogos concluídos
  do campeonato tiverem relatórios individuais e autoria compatível com o placar.
- Não apagar números anteriores quando o save não contiver evidência suficiente.
- Masters precisam ter uma substituição correspondente para contar jogos ou lances.
- Não inferir preços a partir de OVR; propostas em ienes são dados fictícios de atuação.
- O processo não modifica retratos, elenco, habilidades, partidas ou placares antigos.
- Antes de qualquer migração automática, arquivar os bytes originais do save em
  IndexedDB e verificar que o backup pode ser lido integralmente; sem backup,
  a migração é adiada e o save anterior continua intacto.

## Estratégia de testes

1. Temporada com cinco clubes e 20 jogos, atravessando a rodada 7.
2. Falha de gravação e erro de quota simulados antes do primeiro commit.
3. Gravação repetida de partida já concluída deve ser recusada.
4. Reconstituir gols/assistências perdidos apenas a partir de relatórios completos.
5. Recusar reparo destrutivo para relatórios incompletos.
6. Verificar Masters reais nos rankings e valores sem jogos fictícios.
7. Testar treinador, escalações e History pelos testes existentes.
8. Reconstruir `web/index.html` com `tools/sync_inline_v930.py` e validar Android.
9. No navegador, abrir um save antigo, comprovar a cópia íntegra no IndexedDB
   e somente então verificar o avanço do formato e dos rankings.
10. Na pull request, montar o APK Debug com as mesmas fontes de `web/` e
    armazená-lo como artefato de homologação, **sem publicá-lo como Release**.
11. Checar todos os formatos de 2–6 times, 2/4/6 confrontos, mando e folgas.
12. Simular 60 partidas reais de seis times em 20 rodadas, reconstruir os totais
    e verificar aparições de Masters sem rodada congelada.
13. Garantir que três campos de uma só solicitação se dividam em ondas
    cronológicas quando um clube precisar jogar novamente em outra rodada.

## Gates de publicação

- Todos os P0 e testes de compatibilidade aprovados.
- Nenhuma corrupção, duplicação ou perda de dados identificada.
- Não publicar APK nem Release até validar o mesmo pacote que será distribuído.
- Se uma falha não for corrigida, o status da atualização permanece incompleto.

## Fora do escopo da primeira etapa técnica

- Rebalanceamento de gols, OVR e desempenho de cada jogador (EGO BRAIN).
- Redesign cinematográfico completo e novos efeitos (EGO ARENA).
- Competições inéditas, economia externa e monetização.

Esses sistemas permanecem previstos para fases seguintes da atualização maior.
