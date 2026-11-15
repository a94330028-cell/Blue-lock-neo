# Blue Lock NEO v9.9.0 — Seleção dinâmica, galeria histórica e inteligência

## Criar jogador, nunca criar equipe
O usuário só cria o próprio personagem, escolhido para um clube existente. O criador antigo e os backups permanecem intactos; nenhum editor para criação de equipes pelo usuário é adicionado.

## Time do Campeonato que muda a cada rodada
- A última **rodada integralmente concluída com súmulas** determina o XI atual. Rodadas parcialmente disputadas não substituem o XI anterior.
- Suporte à Liga Neo Egoísta e aos campeonatos personalizados (seletor).
- Pontuação por jogo: nota, gols, assistências, passes, chutes, dribles, desarmes, interceptações, bloqueios, duelos e defesas, com ponderação por posição.
- Formação 4-3-3: goleiro, laterais, dois zagueiros, volante, meio-campistas e atacantes.
- Critérios visíveis para cada atleta, titulares sem duplicação e banco calculado das demais atuações.
- Atualiza automaticamente depois do término da rodada sem modificar placares ou histórico.
- Quando houver onze atletas avaliados, a seleção é uma **equipe de sistema** disponível em amistosos, não uma equipe criada pelo usuário.
- Dados antigos sem súmulas detalhadas não geram estatísticas fictícias.

## Galeria dos nove clubes
- A galeria antiga mostra agora os cinco clubes Blue Lock + Manchester United 2008, Flamengo 2019, Sport Recife 2015 e Mirassol 2025.
- Inclui titulares e reservas, com filtro de equipe.
- As fotos são importadas pelo usuário usando o mesmo armazenamento IndexedDB, sem trocar imagens já cadastradas nem buscar rostos aleatórios.
- A Seleção do Campeonato é excluída da galeria para não duplicar os mesmos jogadores.

## Melhorias de inteligência e apresentação
- Meias infiltram na área para buscar resultado em finais de partida.
- Pontas do lado oposto atacam o segundo poste.
- Centroavantes pressionados podem recuar para construir jogadas.
- Atletas com leitura de jogo procuram opção de passe livre quando estão sob pressão.
- Efeitos curtos de quadra sincronizados com ações verdadeiras de chute, defesa e disputa; respeitam a preferência de movimento reduzido.

## Compatibilidade e testes
- Android 9.9.0 / versionCode 101; mantém a assinatura estável quando configurada.
- Offline web, backups, retratos customizados e temporada original preservados.
- Testes automatizados de rodada fechada, mudança de seleção, não duplicação, papéis e adaptação das decisões.

Este é um simulador de fã. Ratings e pontuação da seleção são mecânicas do jogo, não informações oficiais dos clubes ou do mangá.
