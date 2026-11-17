# ⚽ BLUE LOCK NEO 2.0 — PLANO DE DESENVOLVIMENTO

> **Status: iniciado em branch separada `neo-2.0`**. A versão de produção `main`
> continua usando os saves/atualizações atuais até a aprovação de testes.

## Por que criar a 2.0?

A 1.8.0 acumulou dezenas de notas de conteúdo 10.6.x dentro do mesmo patch.
O HTML gerado contém grandes scripts inline e o Android ainda recebe **ZIP completo**
a cada atualização, mesmo quando só um arquivo mudou. Isso dificulta acompanhar
lançamentos, debugar mudanças e reduzir o tamanho das transferências.

**Não confundir:** reorganizar as notas do patch diminui o texto exibido no app,
mas **não diminui automaticamente o tamanho do download**. São dois problemas diferentes.

## Fase 1 — Fundação e compatibilidade (em desenvolvimento)

- [x] Separar o desenvolvimento em `neo-2.0`, sem publicar alterações beta em `main`.
- [x] Abrir o novo patch público `2.0.0`; manter a série 1.x no histórico.
- [x] Renderizar os patches anteriores sob um arquivo recolhido e carregado sob demanda.
- [x] Limitar o patch atual a oito itens e 1.400 caracteres, com CI.
- [x] Adicionar relatório dos maiores arquivos para identificar desperdício.
- [ ] Concluir todos os testes e a validação de integração com Android.
- [ ] Aprovar a primeira publicação 2.0 na branch estável.

## Fase 2 — Motor e arquivos menores

- [ ] Tornar `web/engine.js`, `web/app.js` e `web/systems/*` fontes únicas,
      sem repetir o mesmo código dentro de um `index.html` gigante.
- [ ] Extrair a apresentação e os estilos para módulos independentes,
      preservando a ordem dos scripts e a execução offline do WebView.
- [ ] Validar a equivalência de partidas para as mesmas sementes,
      estatísticas e saves antes/depois da modularização.
- [ ] Evitar reempacotar imagens e scripts que não mudaram.
- [ ] Medir tamanho bruto, ZIP e carregamento em PC e celulares.

## Fase 3 — Atualizações leves e seguras

- [ ] Implementar manifesto de arquivos com SHA-256, versão de base e conteúdo.
- [ ] Preparar pacote *incremental* quando o cliente tiver a versão de base exata.
- [ ] Manter **ZIP completo como fallback** para todo APK antigo.
- [ ] Validar cada arquivo e o pacote antes de substituir a versão ativa.
- [ ] Se faltar um arquivo, houver conflito ou falha de rede: manter o conteúdo anterior.
- [ ] Testar atualização do mesmo APK sem desinstalar e sem apagar IndexedDB/localStorage.

**Nunca anunciar patch incremental como disponível antes de o instalador Android saber
validar e aplicar esse tipo de pacote.**

## Fase 4 — Blue Lock NEO 2.0 de verdade

- [ ] Ajustar IA e decisões táticas, melhorando variedade e leitura de jogo.
- [x] Preservar as 754 habilidades existentes e adicionar **2.520 técnicas** novas, geradas em módulo separado, com raridades, posições, custo, recarga e seleção contextual.
- [x] Ligar novas habilidades ao motor existente (ativação, bônus e cooldown) e à galeria do Arsenal, com 5 artes SVG compactas disponíveis offline.
- [ ] Validar equilíbrio em campeonatos completos, variabilidade de ativação e desempenho real no Android antes do lançamento público.
- [ ] Tornar habilidades mais perceptíveis sem garantir gols artificialmente.
- [ ] Melhorar campo, replays, narração e responsividade da tela.
- [ ] Unificar Rankings, Mercado, Campeonatos, Elencos e Perfis.
- [ ] Proteger os dados de Mestres, titulares, reservas e transferências.
- [ ] Revisar as ideias 19–55 do [roadmap original](ROADMAP-55.md), sem considerá-las prontas sem testes.

## Contratos de compatibilidade

1. Permanecem os identificadores da liga, o endereço interno do WebView,
   chaves de localStorage/IndexedDB, retratos personalizados e históricos.
2. Nenhum teste gera gols, valores de mercado ou prêmios falsos para validar a tela.
3. Não remover personagens, equipes, imagens ou sistemas apenas por ocuparem espaço.
4. A assinatura Android e o `applicationId` precisam ser mantidos em atualizações.
5. Publicar apenas com testes de regressão, mobile/PC e APK aprovados.
6. O changelog anterior continua acessível: a 2.0 começa um patch novo, não apaga a história.

## Política de versões

- **Versão pública:** `2.0.0` na branch de desenvolvimento; lançamento após aceite.
- **Build de conteúdo Android:** sequência `10.6.22`, superior a `10.6.21`.
- **Código nativo:** `versionCode 118`, após o 117, sem mudar o pacote instalado.
- **Patch:** escrever *apenas as mudanças da versão atual*.
- **Histórico:** versões antigas recolhidas, nunca acrescentadas ao patch corrente.

Os itens marcados [x] referem-se somente às mudanças iniciais desta branch.
