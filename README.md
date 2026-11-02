# Manual do Tchekhov Editor

## 1. Introdução

O Tchekhov Editor é um editor de texto rico que funciona 100% no navegador, sem servidor e sem internet, e analisa o que você escreve em tempo real para ajudar na produção editorial e no SEO em português.

Ele foi feito para redatores, editores, blogueiros, profissionais de SEO e estudantes que escrevem textos para a web e precisam medir tamanho, legibilidade, estrutura de títulos e otimização para buscadores enquanto escrevem.


![TchekhovApp](./TchekhovApp.png)


### Princípios do projeto

- **Offline primeiro:** depois do primeiro carregamento, o Service Worker guarda todos os arquivos e o app abre sem conexão.
- **Privacidade por padrão:** nenhum texto é enviado a servidores. Tudo é processado e guardado no próprio navegador (localStorage).
- **Sem dependências:** HTML, CSS e JavaScript puros, sem bibliotecas externas, sem build e sem CDN.
- **Feito para o português:** stopwords, intenção de busca e o índice de legibilidade Flesch (adaptação de Martins et al.) são calibrados para o idioma.

### O que o app faz

| Módulo | Função |
| --- | --- |
| Editor rich text | Formatação estilo Google Docs, com títulos semânticos H1–H4, listas, cores e alinhamento |
| Estatísticas | Palavras, caracteres, frases, parágrafos, linhas, tempo de leitura e de locução, top 5 palavras |
| SEO | Palavra-chave foco, Meta Title, Meta Description, score de 0 a 100%, checklist e preview do Google |
| Semântica | Intenção de busca, legibilidade Flesch e auditoria da hierarquia de títulos e parágrafos |
| Importar e exportar | Markdown (.md) e backup completo (.json) |
| Persistência | Autosalvamento contínuo no navegador |
| Temas | Modo escuro e claro, com memória da escolha |

## 2. Instalação e primeiros passos

O app é um conjunto de cinco arquivos estáticos que precisam ficar na mesma pasta e ser servidos por HTTP ou HTTPS para o modo offline funcionar.

### Os cinco arquivos

| Arquivo | Papel |
| --- | --- |
| index.html | Estrutura da interface (header, ações, toolbar, editor, sidebar) |
| style.css | Estilos, variáveis de cor e temas claro e escuro |
| script.js | Toda a lógica: editor, estatísticas, SEO, semântica, conversores e persistência |
| manifest.json | Configuração do PWA (nome, cores, ícone, escopo) |
| sw.js | Service Worker que guarda os arquivos em cache para uso offline |

### Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os cinco arquivos para a raiz.
2. Abra Settings, depois Pages.
3. Em Source, escolha a branch principal e a pasta raiz, e salve.
4. Aguarde alguns minutos e acesse o endereço indicado, no formato `usuario.github.io/repositorio`.

### Testar no computador

Abrir o `index.html` com duplo clique funciona para escrever e analisar, mas **não ativa o modo offline nem a instalação**, porque o Service Worker só registra em `http` e `https`. Para testar tudo, rode um servidor local na pasta dos arquivos:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

### Instalar como aplicativo

- **Chrome, Edge e navegadores Chromium (computador):** clique no ícone de instalação na barra de endereço.
- **Android (Chrome):** menu de três pontos, depois Instalar aplicativo ou Adicionar à tela inicial.
- **iPhone e iPad (Safari):** botão Compartilhar, depois Adicionar à Tela de Início.

O app instalado abre em janela própria, sem barra do navegador, e usa a cor de tema roxa `#a855f7`.

### Primeiro uso

1. Clique na área do editor e comece a escrever. A cada pausa, as estatísticas e as análises se atualizam.
2. Use o seletor de estilo para marcar um título H1 e depois subtítulos H2 e H3.
3. No painel de SEO, digite a palavra-chave foco, o Meta Title e a Meta Description.
4. Acompanhe o score e o checklist e ajuste o texto até chegar ao nível desejado.
5. Exporte em Markdown ou JSON quando terminar.

## 3. Visão geral da interface

A tela é um painel com o editor à esquerda e três cartões de análise na barra lateral à direita; no celular, a barra lateral passa para baixo do editor.

| Área | O que contém |
| --- | --- |
| Cabeçalho | Logotipo Tchekhov, indicador de estado do salvamento e botão de tema |
| Ações rápidas | Importar .md, importar .json, exportar .md, exportar .json, copiar texto, salvar rascunho, limpar |
| Barra de formatação | Estilo de parágrafo, tamanho, desfazer e refazer, negrito, itálico, sublinhado, tachado, cores, listas, alinhamentos e limpar formatação |
| Editor | Área de escrita fluida, com tipografia serifada e placeholder quando vazio |
| Cartão Estatísticas | Contagens, tempos e as cinco palavras mais frequentes |
| Cartão SEO | Campos de palavra-chave, título e descrição, score, checklist e preview do Google |
| Cartão Semântica | Intenção de busca, Flesch e auditoria de títulos e parágrafos |

### Indicador de salvamento

O texto no canto superior direito mostra o estado do rascunho:

- **Editando…** aparece enquanto você digita.
- **Salvo às HH:MM:SS** confirma que o autosalvamento terminou.
- **Rascunho restaurado** aparece ao abrir o app e recuperar o texto anterior.
- **Falha ao salvar** indica que o navegador recusou a gravação (veja a seção 11).

### Tema claro e escuro

O botão redondo no cabeçalho alterna entre os temas. O ícone de lua indica o modo escuro ativo e o de sol, o modo claro.

- **Modo escuro:** fundo preto profundo (`#09090b`), superfícies em `#141417`, texto claro e detalhes em roxo claro (`#a855f7`).
- **Modo claro:** fundo `#f8fafc`, superfícies brancas, texto preto e destaques em roxo.
- **Memória:** a escolha manual fica guardada no navegador. Sem escolha manual, o app segue o tema do sistema operacional e acompanha mudanças dele.

### Layout responsivo

Abaixo de 1000 pixels de largura, a barra lateral desce para baixo do editor e a barra de formatação ocupa a largura toda. Abaixo de 560 pixels, os botões de ação se distribuem em duas colunas. Ao imprimir, só o texto do editor aparece.

## 4. Editor rich text

O editor usa o recurso nativo de edição do navegador (`contenteditable` com `document.execCommand`), por isso a formatação se aplica ao texto selecionado ou ao ponto onde o cursor está.

### Barra de formatação

| Controle | Efeito |
| --- | --- |
| Estilo | Converte o parágrafo atual em Parágrafo (P), Título 1 (H1), Título 2 (H2), Título 3 (H3) ou Título 4 (H4). Também reflete o estilo do trecho onde o cursor está |
| Tamanho | Aplica um dos seis tamanhos de fonte, de Pequeno a Enorme |
| Desfazer e refazer | Percorre o histórico de edições da sessão |
| Negrito, itálico, sublinhado, tachado | Alternam o estilo no trecho selecionado. Os botões ficam destacados quando o estilo está ativo no cursor |
| Cor da fonte | Abre o seletor de cores e pinta o texto selecionado |
| Cor de destaque | Aplica cor de fundo ao texto selecionado, como um marca-texto |
| Lista com marcadores e lista numerada | Transformam os parágrafos selecionados em lista |
| Alinhamentos | Esquerda, centro, direita e justificado |
| Limpar formatação | Remove negrito, cores e tamanhos do trecho selecionado |

### Títulos semânticos

Os estilos H1 a H4 geram as tags HTML reais `<h1>` a `<h4>`, e não apenas texto grande. É isso que a análise de SEO e a auditoria de estrutura leem. Use um único H1 por texto e organize os subtítulos em ordem hierárquica.

### Atalhos de teclado

| Atalho | Ação |
| --- | --- |
| Ctrl+B ou Cmd+B | Negrito |
| Ctrl+I ou Cmd+I | Itálico |
| Ctrl+U ou Cmd+U | Sublinhado |
| Ctrl+Z e Ctrl+Y | Desfazer e refazer |
| Ctrl+S ou Cmd+S | Salvar rascunho (substitui o diálogo de salvar do navegador) |

### Colar texto

O texto colado entra sempre como **texto simples**. Parágrafos separados por linha em branco viram parágrafos (`<p>`) e quebras simples viram quebras de linha. Isso evita trazer HTML sujo do Word, de sites ou de e-mails, mas também descarta a formatação do material de origem. Reaplique títulos e negritos depois de colar.

### Comportamento do editor vazio

O editor sempre mantém ao menos um parágrafo. Se você apagar tudo, o app recria um parágrafo vazio e devolve o cursor a ele, e o texto de orientação volta a aparecer.

## 5. Ações rápidas

Sete botões acima da barra de formatação cuidam de entrada, saída e manutenção do texto.

| Botão | O que faz | Observações |
| --- | --- | --- |
| Importar .md | Lê um arquivo Markdown e **substitui** o conteúdo do editor | Se o arquivo tiver cabeçalho YAML (front-matter), preenche também os campos de SEO |
| Importar .json | Restaura um backup exportado pelo Tchekhov, com texto e campos de SEO | O HTML é sanitizado antes de entrar no editor |
| Exportar .md | Baixa o texto em Markdown | Inclui front-matter com título, descrição e palavra-chave se algum campo de SEO estiver preenchido |
| Exportar .json | Baixa um backup completo | Guarda HTML, Markdown e SEO. É o formato mais fiel para voltar ao app |
| Copiar texto | Copia o texto puro, sem formatação, para a área de transferência | Mostra aviso se o editor estiver vazio |
| Salvar rascunho | Grava agora no navegador | Também acionado por Ctrl+S |
| Limpar | Apaga o texto, os três campos de SEO e o rascunho salvo | Pede confirmação. **Não há como desfazer** |

### Cuidado com a importação

Importar um arquivo troca todo o conteúdo atual. O app salva o resultado importado como novo rascunho, então o texto anterior só pode ser recuperado se você tiver exportado um backup antes. Exporte um .json antes de importar qualquer coisa sobre um trabalho em andamento.

### Nome dos arquivos exportados

Os arquivos seguem o padrão `tchekhov-AAAAMMDD-HHMM.md` para Markdown e `tchekhov-backup-AAAAMMDD-HHMM.json` para o backup, com a data e a hora locais do momento da exportação.

## 6. Painel de estatísticas

O cartão Estatísticas se atualiza cerca de 150 milissegundos depois da última tecla e mostra oito métricas mais as cinco palavras mais frequentes.

### Como cada métrica é calculada

| Métrica | Definição |
| --- | --- |
| Palavras | Sequências de letras ou números, incluindo as com hífen ou apóstrofo (por exemplo, guarda-chuva). Funciona com acentos |
| Caracteres | Total de caracteres do texto, contando espaços e tratando as quebras de parágrafo como um espaço |
| Sem espaços | Total de caracteres sem nenhum espaço em branco |
| Frases | Trechos terminados em ponto, exclamação, interrogação ou reticências, seguidos de espaço ou fim de bloco. Todo bloco com texto conta ao menos uma frase, então títulos e itens de lista sem pontuação contam como frase |
| Parágrafos | Blocos de texto com conteúdo: parágrafos, títulos, itens de lista e citações |
| Linhas | Linhas não vazias do texto, como o navegador as exibe |
| Leitura | Palavras divididas por 200 por minuto |
| Locução | Palavras divididas por 130 por minuto, o ritmo de uma fala clara em vídeo ou áudio |

Pontos decimais (como 3.5) não encerram frases, pois o ponto precisa ser seguido de espaço.

### Top 5 palavras frequentes

A lista mostra as cinco palavras mais repetidas, em ordem decrescente de ocorrências, com desempate alfabético. Ficam de fora:

- palavras com menos de três letras;
- números puros;
- **stopwords** do português, ou seja, palavras funcionais sem valor temático, como artigos, preposições, pronomes, conjunções e formas comuns de ser, estar, ter e haver.

A lista serve para checar se o tema do texto aparece nas palavras mais usadas e para flagrar repetições excessivas. Se a lista estiver vazia, o texto é curto demais ou só tem stopwords.

## 7. Suíte de SEO

O cartão SEO compara o texto com a palavra-chave foco e com os metadados da página, no estilo dos plugins Yoast e SEOPress, e resume tudo em um score de 0 a 100%.

### Os três campos

- **Palavra-chave foco:** o termo ou a expressão pela qual você quer ser encontrado, por exemplo "receita de bolo de cenoura". A comparação ignora acentos e maiúsculas.
- **Meta Title:** o título que aparece no resultado do Google. Um contador mostra os caracteres de 60 e fica verde entre 30 e 60 e vermelho fora dessa faixa.
- **Meta Description:** o resumo abaixo do título. O contador mostra os caracteres de 160 e fica verde entre 120 e 160.

Os três campos são salvos junto com o texto.

### Checklist e pesos

Cada item recebe o status **ok** (verde, vale 100% do peso), **atenção** (amarelo, vale 50%) ou **falha** (vermelho, vale 0). O score é a soma ponderada dividida pelo peso total de 18.

| Verificação | Peso | Verde | Amarelo |
| --- | --- | --- | --- |
| Palavra-chave foco definida | 2 | Campo preenchido | Não se aplica |
| Palavra-chave no Meta Title | 2 | Presente | Não se aplica |
| Palavra-chave na Meta Description | 1,5 | Presente | Não se aplica |
| Palavra-chave no H1 | 2 | Presente em algum H1 | Não se aplica |
| Palavra-chave em subtítulo | 1 | Presente em ao menos um H2, H3 ou H4 | Não se aplica |
| Palavra-chave no primeiro parágrafo | 2 | Presente no primeiro bloco que não é título | Não se aplica |
| Densidade da palavra-chave | 2 | De 0,5% a 2,5% | De 0,2% a 0,5% ou de 2,5% a 3,5% |
| Comprimento do Meta Title | 1,5 | De 30 a 60 caracteres | De 20 a 29 ou de 61 a 70 |
| Comprimento da Meta Description | 1,5 | De 120 a 160 caracteres | De 80 a 119 ou de 161 a 180 |
| Tamanho do texto | 1,5 | 300 palavras ou mais | De 150 a 299 palavras |
| Quantidade de H1 | 1 | Exatamente um | Mais de um |

Sem palavra-chave foco, todos os itens que dependem dela ficam vermelhos e o score permanece baixo. Defina a palavra-chave primeiro.

### Faixas do score

| Score | Cor | Mensagem |
| --- | --- | --- |
| Abaixo de 40% | Vermelho | Precisa de melhorias |
| De 40% a 69% | Amarelo | Bom, mas dá para melhorar |
| 70% ou mais | Verde | Excelente otimização |

### Densidade da palavra-chave

A densidade é o número de vezes que a expressão aparece, multiplicado pelo número de palavras da expressão, dividido pelo total de palavras do texto. A busca respeita limites de palavra: "bolo" não conta dentro de "bolor".

### Preview no Google

O cartão exibe uma simulação do resultado de busca com três linhas:

- **URL fictícia:** `seusite.com.br`, seguida de um slug gerado da palavra-chave ou do título.
- **Título:** o Meta Title, cortado em 60 caracteres. Se o campo estiver vazio, usa o primeiro H1.
- **Descrição:** a Meta Description, cortada em 160 caracteres. Se estiver vazia, usa o primeiro parágrafo.

O preview serve só para visualizar o tamanho e o corte do texto. O Google pode reescrever título e descrição por conta própria.

### O que o score não mede

O score é uma referência editorial baseada em regras fixas. Ele não mede autoridade do site, links externos, velocidade, imagens ou concorrência, e uma pontuação de 100% não garante posição no Google.

## 8. Análise semântica

O cartão Semântica responde a três perguntas: que tipo de busca o texto atende, quão fácil ele é de ler e se a estrutura de títulos e parágrafos está bem montada.

### Intenção de busca

O app procura no texto um vocabulário típico de cada intenção e mostra a dominante, com a distribuição percentual em quatro barras.

| Intenção | O que o leitor quer | Sinais procurados (exemplos) |
| --- | --- | --- |
| Informacional | Aprender ou entender | como, o que é, por que, guia, tutorial, dicas, passo a passo, significado |
| Transacional | Comprar ou contratar | comprar, preço, desconto, cupom, frete, assinar, baixar, grátis, orçamento |
| Comercial | Comparar antes de decidir | melhor, comparativo, versus, review, análise, ranking, vale a pena, alternativas |
| Navegacional | Chegar a um site ou página | login, entrar, site oficial, contato, endereço, telefone, minha conta |

Cada ocorrência no corpo do texto vale 1 ponto. Ocorrências na palavra-chave, no Meta Title, na Meta Description e nos títulos H1 a H4 valem 3 pontos. Sem nenhum sinal, o campo mostra um traço.

O método é uma heurística de vocabulário, não entende contexto. Palavras muito comuns, como "como" e "quando", puxam textos genéricos para Informacional. Use o resultado como indício e confirme com o objetivo real da página.

### Legibilidade Flesch adaptada ao português

O índice usa a adaptação de Martins e colegas da fórmula de Flesch, que combina o tamanho médio das frases com o tamanho médio das palavras em sílabas.

```latex
IF = 248{,}835 - 1{,}015 \cdot \frac{\text{palavras}}{\text{frases}} - 84{,}6 \cdot \frac{\text{sílabas}}{\text{palavras}}
```

O resultado fica limitado entre 0 e 100.

| Índice | Classificação | Nível aproximado |
| --- | --- | --- |
| 75 a 100 | Muito fácil | Até o 5º ano |
| 50 a 74 | Fácil | Ensino fundamental e médio |
| 25 a 49 | Difícil | Nível superior |
| 0 a 24 | Muito difícil | Acadêmico e técnico |

A contagem de sílabas é aproximada. O app conta grupos de vogais, separa duas vogais fortes seguidas (como em "coelho" e "teatro") e conta ao menos uma sílaba por palavra. Palavras com hiato envolvendo i e u, como "história", saem com uma sílaba a menos. O erro é pequeno em textos longos, mas torna o valor impreciso em textos de poucas linhas.

Para textos web, buscar entre 50 e 75 costuma equilibrar clareza e profundidade. Valores baixos pedem frases mais curtas e palavras mais simples.

### Auditoria de estrutura

A auditoria lê a ordem dos títulos e o tamanho dos blocos e mostra uma lista com semáforo.

| Verificação | Resultado |
| --- | --- |
| Presença de títulos | Falha se o texto não tiver nenhum título H1 a H6 |
| H1 único | Verde com um H1, amarelo com mais de um, vermelho sem H1 |
| Hierarquia sem saltos | Amarelo se um título pular nível, por exemplo de H2 direto para H4, e informa onde |
| Tamanho das seções | Amarelo se a parte entre dois títulos passar de 300 palavras |
| Subtítulos em texto longo | Amarelo se o texto passar de 300 palavras e não tiver nenhum H2, H3 ou H4 |
| Parágrafos longos | Amarelo se algum parágrafo passar de 150 palavras. Mostra também a média de palavras por parágrafo |

Abaixo da lista, uma **árvore de títulos** recua cada título conforme o nível (H1, H2, H3...), e permite ver o esqueleto do texto de relance.

## 9. Formatos de arquivo e conversão

O app lê e grava dois formatos: Markdown para levar o texto a outras ferramentas e JSON para backup fiel. Os conversores são próprios, escritos no app, e cobrem a parte comum do Markdown.

### Qual formato usar

| Necessidade | Formato | Motivo |
| --- | --- | --- |
| Backup para voltar ao Tchekhov sem perdas | .json | Guarda o HTML original, com cores, tamanhos e alinhamentos |
| Publicar em blog, CMS, GitHub ou outro editor | .md | Texto limpo e portátil, com os dados de SEO no cabeçalho |
| Mover um texto entre dispositivos | .json | Mantém tudo, inclusive os campos de SEO |

### Arquivo Markdown

Se qualquer campo de SEO estiver preenchido, a exportação começa com um bloco YAML entre linhas de três hifens, seguido do texto:

```markdown
---
title: "Receita de bolo de cenoura fofinho"
description: "Aprenda a fazer um bolo de cenoura macio..."
keyword: "bolo de cenoura"
---

# Receita de bolo de cenoura

Texto do artigo...
```

Na importação, o app só reconhece o bloco como cabeçalho se **todas** as linhas forem do tipo `chave: valor`. Assim, um arquivo que começa com uma linha horizontal (`---`) não é lido por engano como cabeçalho. Chaves aceitas: `title`, `description` e `keyword`.

### O que o Markdown cobre

| Elemento | Escrita | Exportação | Importação |
| --- | --- | --- | --- |
| Títulos | `#` a `######` | Sim | Sim |
| Negrito | `**texto**` | Sim | Sim, também com `__texto__` |
| Itálico | `*texto*` | Sim | Sim, também com `_texto_` |
| Tachado | `~~texto~~` | Sim | Sim |
| Código em linha e em bloco | crases simples e triplas | Sim | Sim |
| Links | `[texto](endereço)` | Sim | Sim, só para http, https, mailto e endereços relativos |
| Listas | `-`, `*`, `+` e `1.` | Sim, com aninhamento | Sim, com aninhamento por recuo |
| Citações | `>` | Sim | Sim, inclusive com conteúdo formatado |
| Linha horizontal | `---` | Sim | Sim |
| Quebra de linha | dois espaços no fim da linha | Sim | Sim |

Os caracteres com significado no Markdown (barra invertida, asterisco, sublinhado, crase, colchetes e til) são protegidos com barra invertida na exportação e restaurados na importação.

### O que se perde ou não é suportado

- **Na exportação para .md:** sublinhado, cor da fonte, cor de destaque, tamanho de fonte e alinhamento. O Markdown não tem esses recursos, então só o texto e a estrutura seguem.
- **Não suportado na importação:** tabelas, imagens, listas de tarefas com caixas, títulos sublinhados com `===` e HTML escrito dentro do Markdown. Esse HTML é tratado como texto e exibido literalmente, o que é proposital por segurança.
- **Contagem de parágrafos e de frases:** pode variar após ir e voltar por Markdown, porque a conversão normaliza espaços e quebras de linha.

### Arquivo JSON de backup

O backup é um objeto com esta estrutura:

```json
{
  "app": "Tchekhov",
  "version": 1,
  "exportedAt": "2026-11-01T22:00:00.000Z",
  "html": "<h1>Título</h1><p>Texto...</p>",
  "markdown": "# Título\n\nTexto...\n",
  "seo": { "keyword": "", "title": "", "description": "" }
}
```

Na importação, o app usa o campo `html` (depois de limpá-lo). Se ele não existir, usa o campo `markdown`. Sem nenhum dos dois, o arquivo é recusado com o aviso "Formato de backup não reconhecido". Arquivos que não são JSON válido são recusados com o aviso "Arquivo JSON inválido".

## 10. Persistência, privacidade e segurança

Seu texto nunca sai do navegador: o app não tem servidor, não faz requisições com o seu conteúdo e não usa cookies, rastreadores nem bibliotecas de terceiros.

### O que é guardado e onde

| Dado | Local | Chave |
| --- | --- | --- |
| Texto (HTML), palavra-chave, Meta Title, Meta Description e hora do último salvamento | localStorage do navegador | `tchekhov:draft` |
| Tema escolhido (claro ou escuro) | localStorage do navegador | `tchekhov:theme` |
| Os cinco arquivos do app | Cache do Service Worker | `tchekhov-v1` |

### Quando o rascunho é salvo

- cerca de 0,8 segundo depois da última alteração (autosalvamento);
- ao clicar em Salvar rascunho ou pressionar Ctrl+S;
- quando você troca de aba ou minimiza o navegador;
- após importar um arquivo.

Ao abrir o app, o último rascunho é restaurado automaticamente.

### Limites da persistência

- **Fica preso a um navegador e a um endereço.** O rascunho do `localhost` não aparece no endereço do GitHub Pages, e o de um navegador não aparece em outro nem em outro aparelho. Não há sincronização.
- **Pode ser apagado.** Limpar dados do site, usar janela anônima, ativar bloqueio de armazenamento ou deixar o navegador liberar espaço podem eliminar o rascunho.
- **Tem tamanho máximo.** O localStorage costuma oferecer cerca de 5 MB por site. Textos muito longos ou com muita formatação podem estourá-lo e gerar o aviso de falha ao salvar.
- **Há só um rascunho.** Cada salvamento sobrescreve o anterior. Para manter versões, exporte um .json com data no nome.

A regra prática: **o localStorage é um rascunho, não um arquivo**. Exporte um backup ao final de cada sessão importante.

### Privacidade

- Nenhum texto, estatística ou campo de SEO é transmitido pela internet.
- Não há contas, login, anúncios, cookies ou analytics.
- As únicas requisições de rede são o carregamento dos próprios arquivos do app, e depois disso o cache dispensa até essas.
- A análise de SEO e de intenção roda localmente e **não consulta o Google**: ela não sabe sua posição, volume de busca nem concorrência.

Em computador compartilhado, o rascunho fica visível a quem usar o mesmo navegador e perfil. Termine a sessão com o botão Limpar ou use uma janela anônima.

### Medidas de segurança no código

| Risco | Proteção |
| --- | --- |
| Script injetado em texto colado | A colagem é sempre convertida em texto simples e escapada antes de entrar no editor |
| Script em backup .json | O HTML importado passa por um sanitizador que remove script, style, iframe, object, embed, link, meta, base, form, campos de formulário, svg e math, apaga atributos que começam com `on` e bloqueia endereços `javascript:`, `data:` e `vbscript:` em href e src |
| HTML ou script dentro de um .md | O Markdown importado tem todo o HTML escapado e vira texto literal |
| Links perigosos em .md | Só são aceitos http, https, mailto e endereços relativos. Os demais viram texto sem link |
| Texto do usuário exibido na barra lateral | Os painéis usam sempre `textContent`, nunca inserção de HTML |
| Rascunho adulterado no localStorage | O rascunho também passa pelo sanitizador ao ser restaurado |
| Apagar sem querer | O botão Limpar exige confirmação |

### Recomendações adicionais

- Importe arquivos .json e .md somente de fontes em que você confia. O sanitizador é próprio e enxuto, não uma biblioteca especializada.
- Se for hospedar em um domínio seu, considere adicionar uma Content-Security-Policy restritiva (por exemplo, `default-src 'self'; img-src 'self' data:`) e teste o app depois, pois o ícone do manifesto usa um endereço `data:`.
- Sirva o app sempre por HTTPS. O Service Worker e a área de transferência moderna exigem contexto seguro (HTTPS ou localhost).

## 11. Erros comuns e solução de problemas

A maior parte dos problemas vem de três causas: abrir o app fora de HTTP ou HTTPS, cache antigo do Service Worker e dados do navegador apagados.

### Mensagens do aplicativo

| Mensagem | Significado | O que fazer |
| --- | --- | --- |
| Nada para copiar | O editor está vazio | Escreva algo e tente de novo |
| Falha ao salvar | O navegador recusou a gravação no localStorage | Veja o problema "Rascunho não salva" abaixo e exporte um backup |
| Não foi possível salvar (armazenamento cheio?) | Mesma causa, após clicar em Salvar rascunho | Exporte um .json e libere espaço |
| Arquivo JSON inválido | O arquivo escolhido não é um JSON bem formado | Reexporte o backup ou corrija o arquivo |
| Formato de backup não reconhecido | O JSON é válido, mas não tem os campos `html` nem `markdown` | Use um backup gerado pelo Tchekhov |

### Problemas e soluções

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| O modo offline não funciona | Arquivo aberto por duplo clique (`file://`), ou primeiro acesso feito sem conexão | Sirva por HTTP ou HTTPS, abra o app uma vez com internet e recarregue |
| O app não oferece instalação | Falta de HTTPS, manifesto ou Service Worker ativo; no iPhone não existe botão automático | Publique em HTTPS. No Safari, use Compartilhar, depois Adicionar à Tela de Início |
| Mudei os arquivos, mas o app continua antigo | O Service Worker responde primeiro pelo cache | Altere o nome em `const CACHE` no `sw.js` (por exemplo, para `tchekhov-v2`) e publique. Para forçar agora, abra as ferramentas do navegador, aba Application, e use Unregister e Clear site data |
| O rascunho sumiu | Dados do site apagados, janela anônima, outro navegador ou outro endereço | Importe o último backup. Para evitar, exporte .json regularmente |
| O rascunho não salva | Armazenamento cheio ou bloqueado (anônimo, política da empresa, cookies bloqueados) | Saia do modo anônimo, libere espaço e permita dados do site. Mantenha um backup exportado |
| Os botões de formatação não surtem efeito | Não há texto selecionado, ou o foco saiu do editor | Selecione o trecho e clique de novo. Para títulos e listas, basta o cursor estar no parágrafo |
| Mudar a cor da fonte pinta a seleção errada | A seleção foi perdida ao abrir o seletor de cor | Selecione o trecho de novo e escolha a cor |
| O score de SEO está baixo e não sei por quê | Palavra-chave foco vazia, que zera vários itens | Preencha o campo e siga o checklist |
| A densidade da palavra-chave mostra 0% | A expressão exata não aparece no texto (flexões, plural ou ordem diferente) | Use a expressão como escreveria no texto, ou uma palavra-chave mais curta |
| A contagem de palavras difere do Word ou do Google Docs | Cada programa tem regras próprias para hífen, números e símbolos | Use o app como referência interna e mantenha o mesmo critério ao comparar |
| O índice Flesch mostra um traço | O texto está vazio | Escreva algumas frases |
| A intenção de busca mostra um traço | Nenhum termo característico foi encontrado | Normal em textos sem vocabulário típico. Use a palavra-chave e os títulos para sinalizar a intenção |
| Copiar texto não funciona | O navegador bloqueou a área de transferência em contexto inseguro | Use HTTPS ou localhost. O app tenta um método alternativo, mas alguns navegadores o recusam |
| O arquivo .md importado ficou com símbolos soltos | O arquivo usa tabelas, imagens ou HTML, que não são suportados | Converta esses trechos para texto, ou use o backup .json |
| A formatação sumiu depois de colar | A colagem sempre entra como texto simples, por segurança | Reaplique títulos, negritos e listas depois de colar |
| O tema volta ao padrão ao reabrir | O navegador bloqueia o localStorage | Libere o armazenamento do site. Sem escolha salva, o app segue o tema do sistema |
| Ctrl+S abre a janela de salvar do navegador | O foco está fora da página, por exemplo na barra de endereço | Clique dentro do app e tente de novo |

### Quando tudo falha

1. Exporte um backup .json, se ainda conseguir clicar no botão.
2. Recarregue a página com Ctrl+Shift+R (Cmd+Shift+R no Mac).
3. Se persistir, nas ferramentas do navegador abra a aba Application e use Unregister no Service Worker. Evite Clear site data se ainda não tiver backup, pois isso apaga o rascunho.
4. Teste em outro navegador para descartar uma extensão ou uma política local.

## 12. Limitações, boas práticas, personalização e glossário

O Tchekhov é um editor focado e leve, e algumas escolhas de projeto limitam o que ele faz hoje.

### Limitações conhecidas

- **Sem inserção de links, imagens e tabelas** pela barra de formatação. Links só entram via importação de Markdown.
- **Um documento por vez e um único rascunho.** Não há abas, pastas, histórico de versões nem sincronização entre aparelhos.
- **Sem colaboração.** O app é individual e local.
- **Ortografia fica por conta do navegador.** O editor ativa o corretor do navegador em português do Brasil, mas não tem dicionário próprio.
- **Uma palavra-chave por texto.** A busca é pela expressão exata, sem considerar sinônimos, plural ou flexão verbal.
- **Análise por regras.** O score, a intenção de busca e o Flesch são heurísticas locais, sem acesso a dados reais de busca.
- **Comando de edição legado.** O editor usa `document.execCommand`, que os navegadores consideram obsoleto, embora ainda funcione em todos os principais. Pequenas diferenças de comportamento entre Chrome, Firefox e Safari são esperadas.
- **Ícone provisório.** O ícone do PWA é um SVG simples embutido. Alguns navegadores móveis podem exigir ícones PNG de 192 e 512 pixels para a instalação.

### Fluxo de trabalho recomendado

1. Defina a palavra-chave foco antes de escrever.
2. Abra o texto com um H1 que contenha a palavra-chave e organize o corpo em H2 e H3.
3. Cite a palavra-chave no primeiro parágrafo e em ao menos um subtítulo, sem repeti-la de forma forçada.
4. Escreva o Meta Title e a Meta Description e observe os contadores.
5. Revise o checklist de SEO e a auditoria de estrutura, e corrija os itens vermelhos e amarelos.
6. Confira o Flesch e divida frases e parágrafos longos se o texto estiver difícil demais.
7. Exporte o .md para publicar e um .json como backup.

### Metas usadas pelo app

| Indicador | Faixa considerada ideal |
| --- | --- |
| Palavras no texto | 300 ou mais |
| Densidade da palavra-chave | 0,5% a 2,5% |
| Meta Title | 30 a 60 caracteres |
| Meta Description | 120 a 160 caracteres |
| Títulos H1 | Exatamente um |
| Parágrafo | Até 150 palavras |
| Seção entre títulos | Até 300 palavras |
| Flesch | A partir de 50, e de 75 para leitura muito fácil |

Essas faixas são referências comuns de mercado e podem ser ajustadas ao seu caso. Texto técnico ou jurídico, por exemplo, tende a ter Flesch mais baixo sem que isso seja um defeito.

### Onde personalizar o código

| Quero mudar | Arquivo e local |
| --- | --- |
| Cores e temas | `style.css`, variáveis em `:root` e em `[data-theme=light]` |
| Nome, cor do tema e ícone do PWA | `manifest.json` |
| Versão do cache offline | `sw.js`, constante `CACHE` |
| Velocidade de leitura e de locução | `script.js`, função `renderStats` (valores 200 e 130) |
| Lista de stopwords | `script.js`, constante `STOP` |
| Limites e pesos do SEO | `script.js`, função `renderSeo` (chamadas de `rate` e pesos de cada item) |
| Vocabulário de intenção de busca | `script.js`, constante `INTENTS` |
| Tempo do autosalvamento | `script.js`, constante `dSave` (800 milissegundos) |

Sempre que alterar qualquer arquivo já publicado, mude também a constante `CACHE` do `sw.js`, para que os usuários recebam a versão nova.

### Glossário

| Termo | Significado |
| --- | --- |
| PWA | Aplicativo web progressivo: um site que pode ser instalado e funcionar offline |
| Service Worker | Script que roda em segundo plano, intercepta pedidos de arquivos e responde pelo cache |
| Cache first | Estratégia que usa o arquivo guardado primeiro e só vai à rede se ele não existir |
| localStorage | Pequeno armazenamento do navegador, ligado ao endereço do site, que guarda texto sem prazo de validade |
| contenteditable | Atributo HTML que transforma uma área da página em campo editável |
| Rich text | Texto com formatação, como negrito, títulos e cores |
| Markdown | Formato de texto simples que marca títulos, listas e ênfase com símbolos |
| Front-matter | Bloco de metadados no início de um arquivo Markdown, aqui em formato YAML |
| Sanitização | Limpeza de HTML para remover códigos e atributos perigosos |
| Stopword | Palavra funcional muito comum, como "de", "que" e "para", ignorada em contagens de tema |
| Palavra-chave foco | Termo principal pelo qual a página deve ser encontrada |
| Meta Title | Título da página mostrado nos resultados de busca |
| Meta Description | Resumo da página mostrado abaixo do título nos resultados |
| Snippet | O resultado de busca completo: título, endereço e descrição |
| Densidade | Percentual do texto ocupado pela palavra-chave |
| Hn | Conjunto de tags de título, de H1 (principal) a H6 (menos importante) |
| Slug | Trecho final do endereço de uma página, normalmente derivado do título |
| Intenção de busca | O objetivo de quem pesquisa: aprender, comprar, comparar ou chegar a um site |
| Índice Flesch | Medida de facilidade de leitura, baseada no tamanho das frases e das palavras |
| SEO | Otimização para mecanismos de busca |
