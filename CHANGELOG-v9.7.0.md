# Blue Lock NEO 9.7.0 — Estúdio de personagens e copas históricas

## Quatro novos clubes jogáveis

- **Manchester United 2008** — elenco de referência da conquista da Champions League 2007/08, com 11 titulares e 12 reservas.
- **Flamengo 2019** — elenco da campanha de 2019, com 11 titulares e 15 reservas.
- **Sport Recife 2015** — elenco com 11 titulares e 17 reservas.
- **Mirassol 2025** — elenco com 11 titulares e 12 reservas.

Os jogadores foram cadastrados com nomes, posições, números e OVR ficcional limitado a 90, ajustado por atributos dentro da simulação. As formações 4-3-3 foram adaptadas para funcionar no motor, sem afirmar que representam a formação oficial de cada partida. Os retratos dos jogadores desses quatro clubes **não foram incluídos**: o usuário vai adicionar as fotos uma a uma na área **📸 Novos elencos**. As fotos são guardadas no armazenamento do próprio aparelho (IndexedDB), com exportação pela ferramenta de retratos existente.

## Criador de personagens

- Nome, equipe, posição, camisa, pé dominante, estilo, OVR inicial 60–85 e foto opcional.
- O jogador entra numa vaga de titular da equipe escolhida; o jogador substituído fica como reserva. O desempenho usa atributos correspondentes ao papel e estilo em partidas reais do simulador.
- Até 12 personagens por aparelho. Os dados são locais, não se trata de personagens online compartilhados entre contas.
- Retratos personalizados salvos na mesma biblioteca do aplicativo.

## Copas personalizadas

- Selecione 2–9 times (cinco clubes Blue Lock + quatro históricos) e escolha entre jogos únicos ou ida e volta.
- Rodadas automáticas, classificação J/V/E/D/GP/GC/SG/Pts, resultados e campeão.
- Simule confrontos reais com o motor de 22 jogadores. Passes, desarmes, defesas, gols, assistências e registros de atuação ficam disponíveis nas fichas.
- Competições ficam salvas em localStorage, com até 12 campeonatos; não alteram a Liga Neo Egoísta preexistente.
- Amistosos com os quatro clubes também podem ser escolhidos nos seletores do jogo.

## Imagem enviada do Kaiser e fichas

- Imagem recebida do usuário incluída em `assets/kaiser-retrato-enviado.jpg` como retrato padrão do Kaiser, sem substituir outras escolhas personalizadas do usuário.
- Preservadas as melhorias desenvolvidas na v9.6: retratos nos rankings, busca por nome, fichas clicáveis para todos os nomes, estatísticas por partida e histórico de participações.
- Fichas das copas usam somente o que o motor registrou, distinguindo métricas antigas não disponíveis de zero.

## Infraestrutura

- Android 9.7.0, versionCode 98, mesma identidade de aplicativo e requisitos de assinatura estável das versões anteriores.
- Pipeline de publicação sincroniza módulos de atributos, progressão, motor **e aplicação principal** em `index.html` antes do build, evitando inconsistências.
- JS, formação das copas, integração com motor, stats e separação da temporada testados via Node.
- Os 87 retratos Blue Lock preexistentes são preservados.

### Fontes dos elencos

- Manchester United 2008: relatório técnico da UEFA e escalação da final da Champions League 2007/08.
- Flamengo 2019: relação de inscritos da Libertadores e documentação da temporada 2019.
- Sport Recife 2015: relação de numeração do Sport e escalação publicada em junho de 2015 pelo ge.
- Mirassol 2025: elencos da CBF e formações do Campeonato Brasileiro em 2025 publicadas pelo ge.

Projeto de fã não oficial. Compilações de teste públicas usam assinatura diferente; não colocar a chave privada no GitHub.
