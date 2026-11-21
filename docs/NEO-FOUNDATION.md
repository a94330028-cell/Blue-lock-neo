# NEO FOUNDATION — requisitos, integridade e homologação

**Situação:** validação de lançamento do conteúdo web 10.6.45. A publicação
do site e do ZIP de atualização Android não substitui o APK instalado.
O novo APK público depende de assinatura estável e homologação em aparelho real.

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
| NF-17 | Técnico adaptativo | O treinador troca formações após derrotas, testa esquemas válidos com no máximo três novos titulares, mantém os que vencem e revê os que falham. Reservas são avaliados **relativamente** aos titulares, sem um bloqueio arbitrário de OVR 80. |
| NF-18 | Calibração esportiva | Uma amostra fixa de 40 partidas reais deve conservar volume crível de gols e chutes, assistências atribuídas a passes autênticos, vantagem significativa (não garantida) para History e pênaltis com conversão possível sem gols automáticos. |
| NF-19 | Técnico durante a partida | Notas que partem de 6,0 podem provocar substituição por baixo rendimento após tempo suficiente. Placar, cansaço e OVR relativo orientam decisões; no máximo cinco trocas e três janelas, intervalo não consome janela. Troca impedida pelo portador da bola é adiada, não perdida. Táticas manuais permanecem bloqueadas. |
| NF-20 | Mestre e reserva na mesma parada | Uma entrada de Master nunca permite que um reserva herde `isMaster`. Trocas comuns são aplicadas antes da entrada Master; pedidos que atinjam Master ativo são adiados. Estatísticas e rankings devem continuar reconciliáveis com a súmula original. |
| NF-21 | Persistência na atualização WebView | Depois de navegar para `?web=versão` na **mesma origem**, o save oficial do `localStorage`, a imagem e a preferência do jogador no IndexedDB permanecem idênticos, inclusive os bytes reais do retrato. |
| NF-22 | Pacote Android não destrutivo | Identidade do aplicativo e origem local são estáveis; WebView mantém DOM Storage/IndexedDB; ZIP validado com SHA-256; pasta de versão incompleta é rejeitada na inicialização e substituída por pacote íntegro numa nova tentativa, sem apagar bancos do usuário. Marcador da versão é confirmado no disco antes da ativação. Mudanças em `app/**` executam CI. |
| NF-23 | Publicação segura | O site e o ZIP SHA-256 podem avançar sem reinstalar o APK. GitHub Releases não promove builds Debug sob o nome de produção; só gera um novo APK público com chave de assinatura configurada e versão/tag ainda não utilizada. |

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
14. Simular sequências de três derrotas, vitória e fracasso da nova formação:
    o próximo `Match` deve usar a escalação real do técnico, manter 11 únicos,
    respeitar posições, girar atletas mal avaliados e nunca degradar OVR de
    forma extrema; verificar também clubes cujo melhor reserva tem OVR abaixo de 80.
15. Medir 40 jogos do motor com sementes fixas: gols por partida entre 2,4 e 7,
    assistências comprovadas em pelo menos 50% dos gols, 9–25 chutes por jogo;
    History deve vencer a maioria, mas não todos os confrontos da amostra.
    Verificar 60 pênaltis reais resolvidos (33–57 conversões), nenhuma assistência
    fictícia em pênalti, autoria íntegra dos gols e repetibilidade das sementes.
16. Conferir trocas durante a partida: atacante sem ações úteis até o intervalo,
    reservas compatíveis e com OVR aceitável, jogador cansado mesmo com vitória,
    titular produtivo preservado, substituição adiada se estiver com a bola,
    limite de três janelas, intervalo com trocas gratuitas e mudança de postura
    ao perder, vencer ou empatar no fim. Rodar também uma partida autêntica
    inteira e conferir todas as substituições no relatório oficial.
17. Fazer Master e substituição normal coincidirem na mesma parada; ao final
    da janela o reserva deve retornar sem flag de Master. Não permitir troca
    comum diretamente sobre Master ativo. Reconciliar gols/assistências de
    temporada completa, inclusive atletas que substituíram um Master.
18. No Chromium real, criar um retrato próprio no IndexedDB, verificar seu hash
    e salvar a temporada oficial; navegar ao mesmo endereço com `?web=10.6.45`,
    aguardando o boot completo. O texto integral da temporada, a seleção da foto,
    os bytes da imagem e o registro físico do Blob devem permanecer idênticos.
19. Verificar de forma estática que o Android conserva package ID, origem WebView,
    armazenamento local e rollback não destrutivo; recusar conteúdo incompleto
    na inicialização, substituir pastas antigas incompletas somente em
    `web-updates` e confirmar a preferência da versão antes do reload. Qualquer
    alteração em `app/**` aciona automaticamente testes web e compilação de APK
    Debug na PR.
20. Verificar o canal público antes de merge: build de conteúdo nunca é inferior
    ao do APK embarcado; APK Debug jamais vira download de produção; se a chave
    estiver ausente, somente site/ZIP são disponibilizados e o binário Android
    permanece como artefato de testes.

## Instalação real e atualização: homologação pendente

O Chromium testa persistência **no navegador**, não substitui a WebView de um
telefone. A compilação do APK não prova atualização de aplicativo já instalado.
Antes do lançamento público, executar com um aparelho Android real:

1. Fazer backup externo da temporada (Menu → exportar backup) **e das imagens
   personalizadas** (Galeria → exportar retratos). Confirmar os dois JSONs fora
   do armazenamento interno do jogo antes de qualquer experimento.
2. Instalar uma versão anterior e registrar jogos, dinheiro, rankings, mestre,
   XI da rodada e uma foto personalizada. Fechar e abrir para confirmar que
   ambos os bancos persistiram. Guardar o placar e a foto de referência.
3. Aplicar uma atualização **com o mesmo ID de pacote e a mesma assinatura**.
   Não limpar dados nem desinstalar. Abrir e comparar a temporada, todos os
   contadores, os retratos, a edição anterior e a volta ao conteúdo embarcado.
4. Tentar um ZIP corrompido/fora da lista confiável: deve falhar mantendo a
   versão antiga e sem apagar nenhum save. Verificar que a atualização só é
   instalada depois do consentimento no diálogo.
5. Confirmar no aparelho a mesma versão funcional após fechar/reabrir e
   reiniciar o Android. Validar desempenho e espaço de armazenamento.

**Atenção à assinatura:** um APK *Debug* pode ter certificado diferente do APK
*Release* já instalado. O Android normalmente bloqueia a instalação por cima
nessa situação. **Não desinstalar a versão pública para forçar um teste:** isso
pode apagar os dados locais. Para o ensaio de atualização, usar duas versões de
teste assinadas com a mesma chave, ou um aparelho/perfil de teste separado.
Um novo Release também exige versão Android crescente e assinatura de produção
compatível; o build Debug da PR **não é um pacote público**.

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
