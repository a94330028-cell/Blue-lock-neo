# Blue Lock NEO v1.3.0 — EGO COMBAT

A nova atualização incorpora **Flow situacional, Metavision com leitura real das linhas de passe, aprendizagem após duelos, reações de Ego, despertar durante Flow e confrontos entre habilidades que efetivamente aconteceram**. Sem alterar resultados nem apagar saves.

A aba **Recordes → EGO COMBAT** reúne os acontecimentos registrados nas partidas. O plano das 55 ideias segue documentado em [ROADMAP-55](docs/ROADMAP-55.md); não significa que todas já estejam concluídas.

---

# Blue Lock NEO v1.2.0 — EGO EVOLUTION

Nesta versão, a inteligência usa cada vez mais o histórico *real* dos atletas e dos confrontos: passes de duplas entrosadas, marcação adaptativa de adversários dominantes, decisões sob desgaste mental, evolução dos níveis das armas e arquivo de acontecimentos no painel **Recordes**.

- **Arquivo de Egoístas:** rivalidades, duplas, domínio de armas e relatos de partidas oficialmente salvas.
- **Evolução persistente:** confiança, forma recente e adaptação após derrotas no mesmo sistema de carreira já existente.
- **IA tática:** marcação contextual de atacantes perigosos, passes apoiados na química e reações ao desgaste mental.
- **Desempenho:** avaliações defensivas em cache por passo para reduzir custo no Turbo 40×.
- **Segurança:** os recursos preservam os dados, retratos, temporadas, placares e lances de mercado.

As demais 55 ideias do projeto são propostas futuras e não são declaradas como implementadas.

[▶ Abrir Blue Lock NEO](https://a94330028-cell.github.io/Blue-lock-neo/)

---

# Blue Lock NEO v1.1.0 — IA Tática + Turbo 40× + NEO UPDATE CENTER

**Nova atualização oficial:** o simulador mantém toda a temporada, escalações e os retratos locais existentes.

- **Turbo 40×:** botão ao lado da velocidade e opção no seletor. Executa os mesmos passos de simulação do jogo normal, sem inventar gols. A taxa efetiva pode ser menor em aparelhos lentos.
- **IA de jogo:** passes mais inteligentes quando há pressão, coberturas próximas à área defensiva e novas infiltrações no segundo poste ou no fim da partida.
- **NEO UPDATE CENTER:** banner e avatar oficiais, destaques da versão, histórico completo e nova aparência da central flutuante.
- **Discord:** embeds com identidade NEO UPDATE BOT, banner oficial e avatar no cabeçalho.
- **Correção:** o verificador web agora distingue a versão pública 1.1.0 do número interno 10.6.2 usado para atualizar o APK de builds anteriores.

**Jogar:** https://a94330028-cell.github.io/Blue-lock-neo/

---

# Blue Lock NEO v1.0.0 — Primeiro lançamento oficial

Este é o **primeiro lançamento público**. O histórico de builds 9.x/10.x era interno; a versão pública do jogo agora é **1.0.0**. Não é necessário apagar dados ou recomeçar a Liga.

### Novidades desta versão

- Liga Neo Egoísta com simulação de partidas, estatísticas, rivalidades e destaques por rodada.
- Seleção do Campeonato, rankings da Liga e avaliação de atletas por posição.
- Retratos offline, edição de fotos e backup, sem envio automático de imagens pessoais.
- Nova página **Mais → 🚀 Atualizações**, com indicador de novidades não lidas e botão para copiar o resumo da versão.
- Melhorias no aviso de atualizações e compatibilidade da entrega para quem vinha de APKs 10.x.
- Integração segura do NEO UPDATE BOT ao GitHub Pages, com banner e avatar originais já publicados. **Falta cadastrar o Secret `DISCORD_WEBHOOK_URL`** antes do primeiro anúncio no canal.

### Compatibilidade

A versão exibida é **1.0.0**. O número interno de entrega para o atualizador Android é **10.6.1** para não ser interpretado como uma versão mais antiga por APKs beta. A assinatura do APK continua precisando ser compatível.

[Configurar NEO UPDATE BOT](docs/NEO_UPDATE_BOT.md)

---

# Blue Lock NEO 10.6.0 — Atualizações oficiais e Discord

- **🚀 ATUALIZAÇÕES:** histórico oficial na aba Mais, carregado de `CHANGELOG.json`, com indicador discreto de versão não lida.
- **『⚡』𝐍𝐄𝐎 𝐔𝐏𝐃𝐀𝐓𝐄𝐒・𝐁𝐎𝐓:** anúncios por Discord Webhook só após a confirmação de sucesso no GitHub Pages e conferência da versão pública.
- **Antiduplicação:** tags GitHub de reserva, confirmação por parte e envio concluído; sem anúncio em build incompleto.
- **Validação:** categorias vazias omitidas, embeds com limites da API, URLs oficiais, prevenção de menções e prévia sem mandar nada ao canal.
- **Configuração necessária:** incluir o segredo `DISCORD_WEBHOOK_URL` e publicar as duas artes originais em `web/assets/updates/`. **Sem isso o webhook permanece desativado**, embora a interface de histórico funcione.
- **Preservação:** este sistema não altera saves, retratos, rankings, campeonato ou jogabilidade.

**Instruções completas:** [docs/NEO_UPDATE_BOT.md](docs/NEO_UPDATE_BOT.md)

---

# Blue Lock NEO 10.5.1 — Liga e Leilão corrigidos

- **Seleção do Campeonato sem clones:** cada jogador só entra uma vez no XI, e a equipe especial não repete atletas nos rankings.
- **Somente participantes da Liga:** Bastard München, Barcha, Manshine City, PXG e Ubers disputam o mercado e ranking. Clubes históricos continuam disponíveis em amistosos e copas.
- **Lances iniciam em ¥0:** boas partidas aumentam, partidas ruins reduzem e o mínimo é zero; o OVR não dá bônus inicial.
- **Migração segura:** antigas cifras artificiais são reconstruídas usando partidas reais já salvas, preservando gols, classificação, fotos e habilidades.
- **Atualização web 10.5.1:** use Atualizar no APK sem desinstalar e sem apagar dados.

---

# Blue Lock NEO 10.5.0 — Fotos principais, escudos e Melhor XI

- **Fotos principais:** os 87 arquivos locais importados anteriormente aparecem antes das artes genéricas automáticas. Uma escolha manual de retrato continua respeitada.
- **Galeria:** opção ⭐ Foto principal e atualização das fotos nas escalações, ranking e Melhor XI após uma substituição.
- **Android:** opções 📁 Tentar pelo Arquivos e 📋 Colar imagem copiada para aparelhos em que o seletor falha. Novo leitor nativo para fotos modernas, exigindo APK compatível com assinatura atual.
- **Equipes:** escudos estilizados locais para Blue Lock e clubes históricos, sem depender de conexões externas. Não são logotipos oficiais.
- **Melhor XI:** a cada rodada concluída, os atletas são escolhidos por setor adequado e aparecem com nota real (0–10), não com a pontuação interna da seleção.
- **Design:** cartões, campo e retratos refinados para Android.
- **Offline:** todas as 87 fotos e novos scripts ficam armazenados na versão 10.5.0.

Não desinstale o aplicativo nem limpe seus dados. Para atualizar o código nativo, o APK precisa manter a assinatura do APK instalado.

---

# Blue Lock NEO 10.4.0 — Escalações sem sobreposição

- **Seleção do Campeonato em campo**: o Melhor XI dinâmico agora aparece numa formação 4-3-3 completa, com fotos, posições e notas individuais sobre o gramado. A lista antiga continua acessível num painel recolhível.
- **Ubers 3-5-2**: três zagueiros, alas, meio-campistas e atacantes posicionados com separação real; nomes e fotos não ficam empilhados.
- **Outras escalações**: Bastard, Barcha, Manshine, PXG, clubes históricos e formações alternativas usam posições adaptadas aos slots, evitando sobreposições no Android.
- **Sem alteração de carreira**: somente a apresentação da escalação mudou. Os jogadores permanecem nos times, com o mesmo OVR, fotos, resultados e saves.
- **Offline**: script de posições e CSS adicionados ao cache da versão 10.4.0; seleção dinâmica continua mudando após cada rodada concluída.

Abra **Jogar → Atualizar** e veja **Liga → Time do Campeonato** ou **Jogadores → Escalações**.
Não desinstale o APK nem limpe os dados, para não perder as fotos e os saves.

---

# Blue Lock NEO 10.3.0 — Futebol, estatísticas e Copas Eliminatórias

## Conteúdo novo

- **Seleção do Campeonato**: já existe desde v9.9; muda quando uma rodada termina, com os melhores por posição e dados de partidas reais.
- **10.1 — Campo**: goleiros com ajuste reativo de posicionamento limitado pela velocidade; zagueiros podem apoiar nos minutos finais em desvantagem; pontas com chance maior de cruzar quando há companheiro na área; rivalidades baseadas em duelos reais; sinais cinematográficos opcionais e desativáveis.
- **10.2 — Recordes**: Raio-X de jogador com gols, assistências, chutes, passes, desarmes, interceptações, defesas, notas e histórico de jogos. Mapa de finalizações usa somente coordenadas reais salvas; sem posição gravada, exibe aviso em vez de inventar um mapa.
- **10.2 — Hall da Fama**: campeões de temporadas totalmente concluídas são registrados em um histórico local separado.
- **10.3 — Copas Eliminatórias**: formatos com 2, 4 ou 8 times (8 = 2 grupos de 4 + semifinal + final), semifinais com opção de ida e volta, desempate por pênaltis quando necessário. Placar e estatísticas vêm do motor do jogo, sem substituir a Liga NEO. Até 6 novas copas salvas separadamente.
- **Segurança**: não redefinir IndexedDB, fotos, campeonatos ou personagens; módulos extras ficam em arquivos separados e entram na atualização offline.

**Como receber:** use o botão Atualizar no aplicativo para instalar o pacote web 10.3.0. A versão binária Android 9.9.4 continua com a mesma assinatura; não desinstale o APK para forçar atualização. A instalação por cima exige assinatura compatível. Exporte um backup antes de alterações importantes.

---

# Blue Lock NEO 10.0.1 — evolução tática e correção da galeria

## v10.0.1 — O que mudou
- **Android / galeria:** a importação pelo navegador tenta abrir a imagem via Blob URL quando FileReader falha. Retratos dos clubes históricos passam a ser convertidos para JPEG real, copiado para IndexedDB, em vez de armazenar um arquivo temporário do provedor Android.
- **Galeria compacta:** botões menores na versão móvel, opções existentes preservadas.
- **Partidas:** cada clube original pode usar planos automáticos fiéis à sua identidade (Bastard: construção; PXG: transição; Manshine: velocidade; Barcha: posse/drible; Ubers: bloco defensivo). Os controles manuais não são substituídos.
- **Raio-X ao vivo:** finalizações, defesas, chutes na área, cruzamentos e duelos exibidos somente quando o motor registra os lances.
- **Prêmios parciais:** artilharia, assistências, goleiros, defensores e melhor média calculados apenas das partidas de liga já salvas.
- **Recordes:** arquivo de jogos concluídos com gols e lances que constam das súmulas; não inventa replays em vídeo nem altera resultados.
- **Offline:** módulo 10.0 incluído no cache. Versão de conteúdo 10.0.1, **núcleo Android ainda 9.9.4**.

### Atenção ao atualizar o APK
O seletor *nativo* de imagens da v9.9.4 precisa de APK Android recompilado. O APK atualmente publicado no GitHub Releases é de **teste (assinatura debug)**; ele não pode substituir com segurança um APK de assinatura diferente. Nunca desinstale o app nem limpe os dados para tentar corrigir imagens: isso pode apagar o IndexedDB e as temporadas. Faça backup das fotos e dos saves antes de experimentar qualquer instalação. A atualização **do site** pode ser recebida pelo botão Atualizar sem trocar o APK, mas o leitor nativo só fica disponível em um APK compatível com a assinatura já instalada.

---

# Blue Lock NEO 9.9.4 — Importação de retratos pelo Android

## 📷 v9.9.4 — Correção da importação no APK Android

O app Android usa agora um **seletor de imagens nativo**: ao tocar em **Trocar imagem**, o sistema abre o arquivo pelo ContentResolver, reduz a imagem para um retrato JPEG e envia o resultado diretamente ao armazenamento local de retratos do jogo. Isso evita falhas do FileReader em algumas galerias Android.

- Funciona na galeria Blue Lock e nos jogadores dos quatro clubes históricos.
- Preserva retratos e saves em IndexedDB; nenhum dado é enviado para servidores.
- A versão web continua com o seletor normal do navegador.
- Requer **APK 9.9.4 (versionCode 105)** para ativar o novo recurso nativo; apenas tocar em **Atualizar** dentro de um APK antigo não adiciona o seletor nativo.
- Para preservar dados, instale um APK com a mesma assinatura da versão atual **por cima**, nunca desinstale antes de fazer backup.


## ✅ v9.9.3 — Pesquisa de fotos e comportamento da Galeria

- **Pinterest dos clubes históricos:** a pesquisa usa nome do jogador + clube + ano + futebol; não inclui mais “Blue Lock manga panel” para Manchester United 2008, Flamengo 2019, Sport Recife 2015 e Mirassol 2025.
- **Pinterest dos jogadores Blue Lock:** continua usando o título e a referência ao mangá.
- **Galeria:** clicar em um retrato, nome ou card **não abre mais a ficha gigante de estatísticas**. As opções normais de imagem continuam: Trocar, Original, Premium, Mangá, Restaurar etc.
- **Ranking e Jogadores:** fichas detalhadas permanecem acessíveis nesses locais.
- **Pesquisa compacta:** mantém resultados por nome e equipe, abrindo o card de imagem ao selecionar.
- Atualização web offline v9.9.3; Android versionCode 104. Sem alterar temporadas ou fotos salvas.


## ✅ v9.9.2 — Pesquisa e importação de imagens corrigidas

- **Busca da galeria:** durante a pesquisa mostra apenas **nome do jogador e equipe**, em lista compacta. Toque no resultado para abrir o painel completo daquele jogador.
- **Novos elencos:** o buscador de Manchester United 2008, Flamengo 2019, Sport 2015 e Mirassol 2025 também mostra somente nome e equipe enquanto digita.
- **Android:** tenta decodificar a imagem diretamente com `createImageBitmap`; se não funcionar, usa `FileReader` e um segundo leitor (`arrayBuffer`). Caso o arquivo seja inacessível, mostra uma orientação específica para copiar a imagem para Downloads/Galeria.
- **Corrigir imagens:** mostra confirmação depois de reparar referências e não deixa alerta antigo de leitura na tela; não apaga retratos privados nem temporadas.
- **Atualização web offline:** cache v9.9.2; Android versionCode 103. Para quem já tem o APK assinado v9.9.1, use o botão **Atualizar** dentro do jogo para receber o site novo sem desinstalar.



## 📱 Atualização do Android sem apagar dados

**[⬇️ Baixar APK v9.9.1 assinado — Kaiser, atualiza sem desinstalar](https://github.com/a94330028-cell/Blue-lock-neo/releases/download/v9.9.1/Blue-Lock-NEO-v9.9.1-KAISER-ASSINADO.apk)**

Esse APK é assinado com o mesmo certificado estável das versões v9.0–v9.5, inclui o ícone do Kaiser e pode ser instalado **por cima** de uma versão anterior assinada com a mesma chave. Faça backup por segurança e **não desinstale** nem limpe os dados. Caso o Android recuse a atualização por conflito de assinatura, pare e confira a assinatura da instalação atual. SHA-256: `cf9bf4dadd53850847ca320cdd5985aaece4be21693d7a6198a2c6e0ea3f2884`.

## 🖼️ v9.9.1 — Novo ícone oficial do aplicativo

- Ícones do site instalável (192 e 512 px) substituídos pela arte do **Kaiser NEO**, com fundo azul-neon.
- Favicon do navegador atualizado e manifesto com nomes novos para evitar o cache do ícone anterior.
- Recursos `mipmap` do Android alterados (mdpi até xxxhdpi). Para mudar o ícone na tela inicial do Android nativo, é preciso **instalar um APK recompilado** com a mesma assinatura do app atual; a atualização web não altera o ícone nativo.
- Sem alterações nos saves, nas imagens de jogadores ou no motor do jogo.


## 🏅 v9.9.0 — time da rodada mutável (sem criação de equipes)

- **Você cria apenas um jogador**, escolhe um time já existente e pode substituir um titular, sem opção para usuários criarem times próprios.
- **Seleção do Campeonato dinâmica:** o melhor XI é recalculado pela **última rodada inteiramente concluída** (gols, passes, notas, defesas, interceptações e desarmes reais). Muda quando a rodada seguinte termina, com suporte para Liga NEO e copas personalizadas.
- A seleção automática pode ser escolhida como adversária em amistosos; não modifica os cinco clubes originais nem substitui o campeonato salvo.
- **Galeria principal ampliada:** inclui titulares e reservas de Manchester United 2008, Flamengo 2019, Sport Recife 2015 e Mirassol 2025, com filtros por equipe. O importador continua salvando fotos individuais, sem inventar retratos.
- **Inteligência e movimentos:** apoio de meio-campistas na área quando o time perde, pontas atacando o segundo poste, centroavantes recuando sob marcação e passes mais seguros quando há pressão.
- **Animações sincronizadas com lances reais:** impacto visual breve em chutes, defesas e duelos (desativado em reduzir movimento), sem mexer em placares ou inventar momentos.
- Android **9.9.0** (versionCode 101), atualização web offline e testes CI.

[Ver changelog v9.9.0](CHANGELOG-v9.9.0.md).

## Novo na v9.8.1

- APK Android com assinatura estável e atualização preservando saves.
- Transmissão com efeitos curtos baseados nos lances verdadeiros: gols, defesas, cortes e chances.
- Campeonatos personalizados com opção **Rever destaques** (placar, gols, assistências e defesas registrados).
- Retrato do Kaiser substituído pela imagem fornecida pelo autor; fotos dos outros novos jogadores podem ser enviadas manualmente no criador.
- 4 clubes históricos, personagens personalizados, rankings e fichas completas mantidos.

[Notas completas](CHANGELOG-v9.8.1.md).

## 🆕 v9.7.0: seu personagem e quatro clubes históricos

- **Manchester United 2008, Flamengo 2019, Sport Recife 2015 e Mirassol 2025** adicionados ao motor de amistosos e campeonatos, com 11 titulares, reservas, posições e overalls fictícios. A Liga Neo Egoísta original de cinco equipes permanece intacta.
- **Criador de jogador** em Mais: escolha nome, equipe, posição, número, pé dominante, estilo e OVR inicial de 60 a 85. O novo jogador entra em uma vaga real do time selecionado; o titular deslocado vira reserva.
- **Campeonatos personalizados:** escolha 2–9 equipes (inclusive misturando Blue Lock e times históricos), partida única ou ida e volta; tabela, J/V/E/D, GP/GC, pontos e campeão; os confrontos utilizam o motor do jogo e não alteram a temporada NEL.
- **Fotos uma a uma:** nova área “📸 Novos elencos” em Jogadores. O usuário importa fotos JPG, PNG ou WebP individualmente; **não há fotos genéricas inventadas** para os clubes históricos. Armazenamento de imagens em IndexedDB com backups existentes.
- **Kaiser:** retrato enviado pelo usuário adicionado aos arquivos do aplicativo. Fotos personalizadas já escolhidas pelo usuário continuam prioritárias.
- **Fichas clicáveis** com nomes, fotos, passes, desarmes, interceptações, finalizações, gols, assistências, defesas, habilidades e histórico. Estatísticas antigas ausentes não são inventadas.
- **Android 9.7.0 / versionCode 98**; APK estável requer o mesmo certificado utilizado nas versões anteriores; nunca publique a chave privada no GitHub.
- **Testes:** `node tests/v970.test.cjs`, além da bateria de compatibilidade dos módulos e compilação do APK.

[Changelog da v9.7](CHANGELOG-v9.7.0.md)


## Novo na v9.5.0
- **Preços reajustados:** atletas comuns ficam abaixo de ¥ 400 milhões, em vez de passar de ¥ 1 bilhão. O jogo recalcula as ofertas a partir dos dados existentes, sem apagar saves.
- **Um único ranking de mercado**, com o filtro por posições. O pódio e o ranking antigos deixam de aparecer como listas duplicadas.
- **🏆 MVP atual + Top 5 da temporada** dentro do mesmo painel, calculados exclusivamente pelas atuações registradas: gols, assistências, criação, desarmes, defesas e regularidade. **O preço não entra na escolha do MVP.**
- **Momentos memoráveis preservados em um painel recolhido**, para não ocupar a página inteira.
- **Android 9.5.0**, versionCode 97. Compatível com a assinatura estável das versões v9.0 a v9.4, caso os APKs anteriores tenham sido instalados com o mesmo certificado.
- Conteúdo offline, 87 retratos e dados da temporada preservados.

Veja [CHANGELOG-v9.5.0.md](CHANGELOG-v9.5.0.md).


## Atualização v9.4.0

- Interface limpa: sem placar duplicado, análises e câmera recolhidas, apenas quatro recordes visíveis até escolher Ver todos.
- Ranking: goleiros, zagueiros, laterais, volantes, meias centrais, meias ofensivos, pontas, atacantes, artilheiros, assistentes, defesa, passadores e mercado.
- Cards mostram jogador, clube, posição, OVR e preço; top 6 por padrão, opção top 15.
- Preços maiores por OVR/posição, com valorização extra de ações reais de goleiros, defensores e atacantes.
- Defesas: estatísticas individuais e recuperação de jogos antigos somente quando os dados foram registrados no histórico.
- Master Strikers atuam **até 45 minutos** por entrada, com possibilidade de segunda participação mais curta.
- Android v9.4.0 / versionCode 96. Os saves e os 87 retratos permanecem.

Leia [CHANGELOG-v9.4.0.md](CHANGELOG-v9.4.0.md).


## ⭐ v9.3.0 — escala profissional, mestres e defesa competitiva

- **Jogadores normais: até 90 OVR.** Kaiser, Rin, Aiku e Lorenzo: 90; Isagi e Barou: 89; Reo e Bachira: 88.
- **Mestres: 96–99 OVR.** Noel Noa e Julian Loki: 99; Chris Prince, Lavinho e Marc Snuffy: 98.
- Ações individuais de desarme, interceptação, bloqueio, disputa aérea, duelo e passe-chave contam para notas e **valores de mercado**, inclusive zagueiros, laterais e volantes.
- Mestres têm **janelas de aproximadamente 10–12 minutos de jogo**, e podem entrar **até duas vezes por partida**, conforme tática e oportunidades de parada (não há garantia de gol).
- UI mais compacta, com análises sob demanda e ranking específico de contribuições defensivas.
- Os saves existentes permanecem; a v9.3.0 exige o APK v9.3.0 para atualizar seu código Android. **Não publique chaves privadas no GitHub.**

A atualização está em [CHANGELOG-v9.3.0.md](CHANGELOG-v9.3.0.md).

## ✅ v9.1.2 — Números/Arsenal substituídos na barra inferior Android

A barra de navegação **do aplicativo Android** agora contém exatamente: **🎮 Jogar | 🏆 Liga | 📜 Recordes | 👑 Ranking | 👥 Jogadores | ⚙️ Mais**. A tela antiga de Números/Estatísticas, o Arsenal e a Galeria continuam em **Mais**, com suas funções preservadas. A compilação usa `versionCode 93` e desativa o cache de recursos do WebView para não mostrar a navegação antiga. Veja [CHANGELOG-v9.1.2.md](CHANGELOG-v9.1.2.md).

## 🔄 Atualizador GitHub Pages — v9.1.1

**Esta etapa está publicada e a compilação Android passou no GitHub Actions.** A partir do APK **9.1.1** (`versionCode 92`), o aplicativo consulta diretamente o GitHub Pages:

- Site: https://a94330028-cell.github.io/Blue-lock-neo/
- Manifesto de updates: https://a94330028-cell.github.io/Blue-lock-neo/updates/latest.json
- Código-fonte: `app/src/main/java/com/neoegoist/simulator/MainActivity.java`
- Gerador de pacotes: `tools/gerar_atualizacao.py`

O APK 9.1.1 está assinado com a mesma chave privada estável usada nos APKs 9.0/9.1 anteriores. A chave não foi colocada neste repositório. **O APK gerado automaticamente pelo GitHub Actions, sem os quatro Secrets BL_*, é uma versão de TESTE; não atualiza o APK com assinatura estável.** Para a atualização inicial da instalação 9.0/9.1, utilize o APK 9.1.1 de assinatura estável fornecido separadamente pelo mantenedor. A partir dele, futuras atualizações somente do conteúdo web poderão chegar pelo botão "Atualizar" quando um número maior for publicado no GitHub Pages.

Publicar no GitHub Pages **não atualiza o APK 9.1**, que ainda aponta para a Netlify. A mudança de servidor exige a instalação única da versão 9.1.1. Mantenha um backup de partidas, saves e retratos antes de atualizar.

Simulador de futebol 2D para Web e APK Android offline, baseado na Liga Neo Egoísta. Projeto de fã não oficial.

## Versão

**v9.1.0 (Android versionCode 91)**. Base do APK v8.9 com 87 retratos preservados, evolução da interface v9.0, registro técnico de chutes e duelos, central de desafios, premiações e jornal do campeonato. As funções pré-existentes permanecem no jogo.

## Começar

- **Site/PWA:** hospede o conteúdo da pasta `web/`. Para testar localmente, use um servidor HTTP estático nessa pasta.
- **APK Android:** este projeto usa Gradle, AGP e Java 17. Abra no Android Studio ou execute a Action `Gerar APK Blue Lock NEO (atualizável)`.
- **GitHub:** siga [README-v9.1-GITHUB.md](README-v9.1-GITHUB.md), incluindo publicação do atualizador e configuração da assinatura estável via Secrets.
- **Testes:** `node tests/neo-v91.test.js`.
- **Mudanças:** consulte [CHANGELOG-v9.1.md](CHANGELOG-v9.1.md).

A versão web offline empacotada no APK preserva os personagens, o catálogo de habilidades e os retratos originais. Retratos importados pelo usuário ficam no armazenamento privado do app; faça backup antes de reinstalar.

## Atualizações

O pacote `web/updates/blue-lock-web-9.1.0.zip` é servido junto com `web/updates/latest.json` quando o site é publicado. O aplicativo oferece atualizar o conteúdo web pela conexão configurada; sem publicação online, o APK ainda funciona offline com seu conteúdo embutido. Para atualizar o binário APK sem desinstalar, **a chave de assinatura precisa ser a mesma da instalação anterior**.

## Publicação GitHub — v9.1

- Código-fonte completo, 87 retratos e testes estão na branch `main`.
- GitHub Actions compila o APK de teste na rotina `Gerar APK Blue Lock NEO (atualizável)`.
- O fluxo `Publicar Blue Lock NEO e atualizações` publicou o conteúdo web pelo GitHub Pages.
- APKs de teste do GitHub Actions são assinados com chave de debug: **não atualizam instalações com a assinatura estável da v9.0/v9.1**.
- Para obter APKs de produção atualizáveis via GitHub Actions, configurar os secrets `BL_KEYSTORE_BASE64`, `BL_SIGNING_STORE_PASSWORD`, `BL_SIGNING_KEY_ALIAS` e `BL_SIGNING_KEY_PASSWORD`. Não enviar a chave privada ao repositório.
- **Atualização dentro do aplicativo:** a versão Android atual consulta `https://blue-lock-neo-simulator.netlify.app/updates/latest.json`. Publicar no GitHub Pages não atualiza esse endpoint da Netlify automaticamente. O ZIP web também precisa ser implantado na Netlify para que o botão interno de atualização encontre a nova versão.

## Estado de qualidade

Os testes automatizados verificam a coerência entre gols/placar, finalizações/xG, duelos e dados históricos. Os fluxos Android e navegador visual não foram executados em aparelho real nesta entrega; teste antes de disponibilizar a outras pessoas.
