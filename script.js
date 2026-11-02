'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const ed = $('#editor');
const KEY = 'tchekhov:draft', TKEY = 'tchekhov:theme';
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const setT = (id, v) => { $('#' + id).textContent = v; };
let tt;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); };

/* ---------- Tema ---------- */
const mq = matchMedia('(prefers-color-scheme: light)');
function applyTheme(t) { document.documentElement.dataset.theme = t; $('#themeBtn').textContent = t === 'dark' ? '🌙' : '☀️'; }
applyTheme(LS.get(TKEY) || (mq.matches ? 'light' : 'dark'));
$('#themeBtn').onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  LS.set(TKEY, t); applyTheme(t);
};
if (mq.addEventListener) mq.addEventListener('change', e => { if (!LS.get(TKEY)) applyTheme(e.matches ? 'light' : 'dark'); });

/* ---------- Editor Rich Text ---------- */
let saved = null;
document.addEventListener('selectionchange', () => {
  const s = getSelection();
  if (s.rangeCount && ed.contains(s.anchorNode)) { saved = s.getRangeAt(0).cloneRange(); syncToolbar(); }
});
function restore() {
  ed.focus();
  if (saved) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); }
}
function exec(c, v) { restore(); document.execCommand(c, false, v); onInput(); }
function color(cmd, v) {
  restore();
  document.execCommand('styleWithCSS', false, true);
  if (cmd === 'backColor') { if (!document.execCommand('hiliteColor', false, v)) document.execCommand('backColor', false, v); }
  else document.execCommand(cmd, false, v);
  document.execCommand('styleWithCSS', false, false);
  onInput();
}
$$('#toolbar [data-cmd]').forEach(b => {
  b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('click', () => exec(b.dataset.cmd));
});
$('#blockSel').onchange = e => { const v = e.target.value; if (v) exec('formatBlock', '<' + v + '>'); };
$('#sizeSel').onchange = e => { const v = e.target.value; if (v) exec('fontSize', v); e.target.value = ''; };
$('#foreColor').oninput = e => color('foreColor', e.target.value);
$('#backColor').oninput = e => color('backColor', e.target.value);

function syncToolbar() {
  $$('#toolbar [data-cmd]').forEach(b => {
    let on = false;
    try { on = document.queryCommandState(b.dataset.cmd); } catch {}
    b.classList.toggle('on', on && !/^(undo|redo|removeFormat)$/.test(b.dataset.cmd));
  });
  let v = '';
  try { v = String(document.queryCommandValue('formatBlock')).toLowerCase().replace(/[<>]/g, ''); } catch {}
  $('#blockSel').value = /^(p|h[1-4])$/.test(v) ? v : '';
}

function caret(n, start) {
  const r = document.createRange();
  if (start) { r.setStart(n, 0); r.collapse(true); } else { r.selectNodeContents(n); r.collapse(false); }
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
function ensureStruct() {
  const h = ed.innerHTML.trim();
  if (!h || h === '<br>') { ed.innerHTML = '<p><br></p>'; return true; }
  return false;
}
function fix() {
  if (ensureStruct()) { caret(ed.firstChild, true); return; }
  const f = ed.firstChild;
  if (f && f.nodeType === 3) {
    const p = document.createElement('p');
    ed.insertBefore(p, f); p.appendChild(f); caret(p);
  }
}

ed.addEventListener('paste', e => {
  e.preventDefault();
  const t = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\r/g, '');
  if (!t) return;
  document.execCommand('insertHTML', false, t.split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join(''));
});
ed.addEventListener('focus', () => { if (ensureStruct()) caret(ed.firstChild, true); });
ed.addEventListener('input', () => onInput());
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(true); }
});

/* ---------- Análise textual ---------- */
const WRE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const BLOCK = 'p,div,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td';
const STOP = new Set(`a o as os um uma uns umas de do da dos das em no na nos nas por para pra com sem sob sobre entre até ate ao aos à às e ou mas porém porem que se como quando onde quem qual quais cujo cuja não nao sim já ja mais menos muito muita muitos muitas pouco pouca ainda também tambem só so então entao assim isso isto aquilo esse essa esses essas este esta estes estas aquele aquela aqueles aquelas meu minha meus minhas teu tua seu sua seus suas nosso nossa nossos nossas dele dela deles delas ele ela eles elas eu tu você voce vocês voces nós me te lhe lhes mim ti si é são sao era eram foi foram ser sido sendo seja sejam fui fosse fossem será serão sera serao está estão estao estava estavam estive estar estou tem têm tinha tinham teve ter tido tendo tenho temos há ha havia houve haver fazer faz fez feito fazendo pode podem podia poder ir vai vão vao vamos depois antes durante cada todo toda todos todas outro outra outros outras mesmo mesma mesmos mesmas tanto tanta tantos tantas tal tais qualquer quaisquer algum alguma alguns algumas nenhum nenhuma nada tudo algo aqui ali lá la aí ai porque pois contra desde segundo conforme após apos perante via coisa coisas vez vezes bem apenas sempre nunca`.split(/\s+/));

function analyze() {
  const text = ed.innerText.replace(/ /g, ' ');
  const words = text.match(WRE) || [];
  const mk = (tag, t) => { t = t.replace(/ /g, ' ').trim(); return { tag, text: t, n: (t.match(WRE) || []).length }; };
  let leaf = [...ed.querySelectorAll(BLOCK)].filter(e => !e.querySelector(BLOCK) && e.textContent.trim()).map(e => mk(e.tagName.toLowerCase(), e.textContent));
  if (!leaf.length && text.trim()) leaf = text.split(/\n+/).filter(l => l.trim()).map(l => mk('p', l));
  let sentences = 0;
  for (const b of leaf) sentences += Math.max(1, b.text.split(/[.!?…]+(?:\s+|$)/).filter(x => /[\p{L}\p{N}]/u.test(x)).length);
  return {
    text, words, leaf, sentences,
    lines: text.split('\n').filter(l => l.trim()).length,
    chars: text.replace(/\n+/g, ' ').trim().length,
    charsNo: text.replace(/\s/g, '').length
  };
}
const fmtT = s => { s = Math.round(s); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60 ? s % 60 + ' s' : ''); };

function renderStats(A) {
  const w = A.words.length;
  setT('sWords', w); setT('sChars', A.chars); setT('sCharsNo', A.charsNo);
  setT('sSent', A.sentences); setT('sPara', A.leaf.length); setT('sLines', A.lines);
  setT('sRead', fmtT(w / 200 * 60)); setT('sSpeak', fmtT(w / 130 * 60));
  const f = new Map();
  for (const x of A.words) {
    const k = x.toLowerCase();
    if (k.length < 3 || /^\d+$/.test(k) || STOP.has(k) || STOP.has(norm(k))) continue;
    f.set(k, (f.get(k) || 0) + 1);
  }
  const top = [...f].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt')).slice(0, 5);
  $('#topWords').replaceChildren(...(top.length ? top : [['—', '']]).map(([k, c]) => {
    const li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('b');
    s.textContent = k; b.textContent = c; li.append(s, b); return li;
  }));
}

/* ---------- SEO ---------- */
const VAL = { ok: 1, warn: .5, bad: 0 };
const rate = (n, ok, warn) => n >= ok[0] && n <= ok[1] ? 'ok' : n >= warn[0] && n <= warn[1] ? 'warn' : 'bad';
function fillChecks(ul, arr) {
  ul.replaceChildren(...arr.map(c => { const li = document.createElement('li'); li.className = c.st === 'bad' ? '' : c.st; li.textContent = c.txt; return li; }));
}
function renderSeo(A) {
  const kw = $('#kw').value.trim(), title = $('#mTitle').value.trim(), desc = $('#mDesc').value.trim();
  const nk = norm(kw), has = s => !!nk && norm(s).includes(nk);
  const h1s = [...ed.querySelectorAll('h1')].map(e => e.textContent);
  const subs = [...ed.querySelectorAll('h2,h3,h4')].map(e => e.textContent);
  const first = A.leaf.find(b => !/^h\d$/.test(b.tag));
  let dens = 0;
  if (nk && A.words.length) {
    const re = new RegExp('(^|[^\\p{L}\\p{N}])' + nk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '(?=$|[^\\p{L}\\p{N}])', 'gu');
    dens = (norm(A.text).match(re) || []).length * nk.split(/\s+/).length / A.words.length * 100;
  }
  const noKw = 'Defina a palavra-chave foco';
  const B = (w, st, ok, no) => ({ w, st, txt: st === 'ok' ? ok : no });
  const kwSt = c => !nk ? 'bad' : c ? 'ok' : 'bad';
  const nw = A.words.length, tl = title.length, dl = desc.length;
  const checks = [
    B(2, nk ? 'ok' : 'bad', 'Palavra-chave foco definida', noKw),
    B(2, kwSt(has(title)), 'Palavra-chave no Meta Title', nk ? 'Inclua a palavra-chave no Meta Title' : noKw),
    B(1.5, kwSt(has(desc)), 'Palavra-chave na Meta Description', nk ? 'Inclua a palavra-chave na Meta Description' : noKw),
    B(2, kwSt(h1s.some(has)), 'Palavra-chave no título H1', nk ? 'Inclua a palavra-chave no H1' : noKw),
    B(1, kwSt(subs.some(has)), 'Palavra-chave em subtítulo (H2–H4)', nk ? 'Use a palavra-chave em ao menos um H2–H4' : noKw),
    B(2, kwSt(first && has(first.text)), 'Palavra-chave no primeiro parágrafo', nk ? 'Inclua a palavra-chave no primeiro parágrafo' : noKw)
  ];
  const ds = !nk ? 'bad' : rate(dens, [.5, 2.5], [.2, 3.5]);
  checks.push({ w: 2, st: ds, txt: !nk ? noKw : 'Densidade da palavra-chave: ' + dens.toFixed(2).replace('.', ',') + '% ' + (ds === 'ok' ? '(ideal 0,5–2,5%)' : dens < .5 ? '(baixa; ideal 0,5–2,5%)' : '(alta; ideal 0,5–2,5%)') });
  const ts = tl ? rate(tl, [30, 60], [20, 70]) : 'bad';
  checks.push({ w: 1.5, st: ts, txt: !tl ? 'Preencha o Meta Title (30–60 caracteres)' : 'Meta Title com ' + tl + ' caracteres ' + (ts === 'ok' ? '✔' : '(ideal 30–60)') });
  const ss = dl ? rate(dl, [120, 160], [80, 180]) : 'bad';
  checks.push({ w: 1.5, st: ss, txt: !dl ? 'Preencha a Meta Description (120–160 caracteres)' : 'Meta Description com ' + dl + ' caracteres ' + (ss === 'ok' ? '✔' : '(ideal 120–160)') });
  const ls = rate(nw, [300, 1e9], [150, 299]);
  checks.push({ w: 1.5, st: ls, txt: ls === 'ok' ? 'Texto com ' + nw + ' palavras (mín. 300)' : 'Texto com ' + nw + ' palavras (recomendado: 300+)' });
  const hs = h1s.length === 1 ? 'ok' : h1s.length ? 'warn' : 'bad';
  checks.push({ w: 1, st: hs, txt: hs === 'ok' ? 'Um único H1' : h1s.length ? h1s.length + ' títulos H1 (use apenas um)' : 'Adicione um título H1' });

  const tw = checks.reduce((a, c) => a + c.w, 0);
  const score = Math.round(checks.reduce((a, c) => a + c.w * VAL[c.st], 0) / tw * 100);
  const col = score < 40 ? 'var(--er)' : score < 70 ? 'var(--wa)' : 'var(--ok)';
  setT('scoreVal', score + '%'); $('#scoreVal').style.color = col;
  $('#scoreBar').style.width = score + '%'; $('#scoreBar').style.background = col;
  setT('scoreLabel', score < 40 ? 'Precisa de melhorias' : score < 70 ? 'Bom, mas dá para melhorar' : 'Excelente otimização');
  fillChecks($('#checks'), checks);

  const tc = $('#titleCount'), dc = $('#descCount');
  tc.textContent = tl + '/60'; tc.className = tl >= 30 && tl <= 60 ? 'good' : tl ? 'bad' : '';
  dc.textContent = dl + '/160'; dc.className = dl >= 120 && dl <= 160 ? 'good' : dl ? 'bad' : '';

  const cut = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
  const slug = norm(kw || title || 'sua-pagina').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  setT('snipUrl', 'https://seusite.com.br › ' + (slug || 'sua-pagina'));
  setT('snipTitle', cut(title || h1s[0] || 'Título da sua página', 60));
  setT('snipDesc', cut(desc || (first ? first.text : '') || 'A meta description aparecerá aqui. Escreva um resumo atraente de 120 a 160 caracteres.', 160));
  return { kw, title, desc, h1s, subs };
}

/* ---------- Semântica ---------- */
const INTENTS = [
  ['Informacional', 'como,o que e,o que sao,por que,porque,quando,onde,guia,tutorial,dicas,passo a passo,entenda,significado,definicao,exemplos,aprenda,saiba,funciona,importancia,diferenca,historia,causas,sintomas,beneficios,curiosidades'],
  ['Transacional', 'comprar,compre,preco,precos,desconto,oferta,ofertas,cupom,promocao,loja,frete,assinar,assine,contratar,contrate,baixar,download,gratis,pedido,carrinho,barato,orcamento,agende,reservar,adquira'],
  ['Comercial', 'melhor,melhores,comparativo,comparacao,versus,vs,review,analise,avaliacao,top,vale a pena,alternativa,alternativas,ranking,opiniao,resenha,custo beneficio,recomendado,recomendacao,qual escolher'],
  ['Navegacional', 'login,entrar,acessar,site oficial,pagina oficial,contato,endereco,telefone,painel,portal,minha conta,area do cliente,webmail,fale conosco,atendimento']
].map(([n, t]) => [n, t.split(',').map(x => new RegExp('(^|[^a-z0-9])' + x.replace(/ /g, '\\s+') + '(?=$|[^a-z0-9])', 'g'))]);
const countRe = (txt, res) => res.reduce((a, r) => a + (txt.match(r) || []).length, 0);

function syllables(w) {
  w = w.toLowerCase(); let n = 0;
  for (const g of w.match(/[aeiouáàâãäéèêíìóòôõöúùûü]+/g) || []) {
    n++;
    for (let i = 1; i < g.length; i++) if (/[aeoáéóâêô]/.test(g[i - 1]) && /[aeoáéóâêô]/.test(g[i])) n++;
  }
  return Math.max(1, n);
}

function renderSem(A, S) {
  const body = norm(A.text), boost = norm([S.kw, S.title, S.desc, ...S.h1s, ...S.subs].join(' '));
  const sc = INTENTS.map(([n, r]) => [n, countRe(body, r) + 3 * countRe(boost, r)]);
  const tot = sc.reduce((a, x) => a + x[1], 0);
  const best = sc.reduce((a, x) => x[1] > a[1] ? x : a);
  setT('intent', tot ? best[0] : '—');
  $('#intentBars').replaceChildren(...sc.map(([n, v]) => {
    const p = tot ? Math.round(v / tot * 100) : 0, d = document.createElement('div'), a = document.createElement('span'), b = document.createElement('div'), i = document.createElement('i'), c = document.createElement('span');
    d.className = 'ib'; b.className = 'bar'; a.textContent = n; c.textContent = p + '%'; i.style.width = p + '%'; b.append(i); d.append(a, b, c); return d;
  }));

  const nw = A.words.length;
  if (nw) {
    const syl = A.words.reduce((a, w) => a + syllables(w), 0);
    const f = Math.max(0, Math.min(100, 248.835 - 1.015 * (nw / Math.max(1, A.sentences)) - 84.6 * (syl / nw)));
    setT('flesch', f.toFixed(1).replace('.', ','));
    setT('fleschLabel', f >= 75 ? 'Muito fácil (leitura rápida, até 5º ano)' : f >= 50 ? 'Fácil (ensino fundamental/médio)' : f >= 25 ? 'Difícil (nível superior)' : 'Muito difícil (acadêmico/técnico)');
  } else { setT('flesch', '—'); setT('fleschLabel', ''); }

  const H = [], secs = []; let cur = null;
  for (const b of A.leaf) {
    const m = b.tag.match(/^h([1-6])$/);
    if (m) { H.push({ l: +m[1], t: b.text }); cur = { t: b.text, n: 0 }; secs.push(cur); }
    else if (cur) cur.n += b.n;
  }
  const au = [];
  if (nw) {
    if (!H.length) au.push({ st: 'bad', txt: 'Nenhum título (Hn) encontrado: estruture o texto com H1–H4' });
    else {
      const h1 = H.filter(h => h.l === 1).length;
      au.push({ st: h1 === 1 ? 'ok' : h1 ? 'warn' : 'bad', txt: h1 === 1 ? 'Um único H1' : h1 ? h1 + ' títulos H1 (use apenas um)' : 'Falta um título H1' });
      const k = H.findIndex((h, i) => i && h.l > H[i - 1].l + 1);
      au.push(k < 0 ? { st: 'ok', txt: 'Hierarquia sem saltos de nível' } : { st: 'warn', txt: 'Salto de H' + H[k - 1].l + ' para H' + H[k].l + ' ("' + H[k].t.slice(0, 28) + '")' });
      const lg = secs.reduce((a, s) => s.n > a.n ? s : a, { n: 0, t: '' });
      au.push(lg.n > 300 ? { st: 'warn', txt: 'Seção "' + lg.t.slice(0, 28) + '" com ' + lg.n + ' palavras: divida com subtítulos' } : { st: 'ok', txt: 'Seções com tamanho equilibrado' });
    }
    if (nw > 300 && !H.some(h => h.l >= 2 && h.l <= 4)) au.push({ st: 'warn', txt: 'Texto longo sem subtítulos H2–H4' });
    const pl = A.leaf.filter(b => /^(p|div|blockquote)$/.test(b.tag)).map(b => b.n);
    if (pl.length) {
      const avg = Math.round(pl.reduce((a, b) => a + b, 0) / pl.length), lo = pl.filter(n => n > 150).length;
      au.push(lo ? { st: 'warn', txt: lo + ' parágrafo(s) com mais de 150 palavras (média ' + avg + ')' } : { st: 'ok', txt: 'Parágrafos curtos (média de ' + avg + ' palavras)' });
    }
  }
  fillChecks($('#hnAudit'), au);
  $('#hnTree').replaceChildren(...H.map(h => {
    const d = document.createElement('div'), s = document.createElement('span');
    s.textContent = 'H' + h.l; d.style.paddingLeft = (h.l - 1) * 12 + 'px'; d.append(s, h.t); return d;
  }));
}

function update() {
  const A = analyze();
  renderStats(A);
  const S = renderSeo(A);
  renderSem(A, S);
  ed.classList.toggle('is-empty', !A.text.trim() && !ed.querySelector('li,img,hr'));
}

/* ---------- Persistência ---------- */
function save(manual) {
  const ok = LS.set(KEY, JSON.stringify({ html: ed.innerHTML, kw: $('#kw').value, title: $('#mTitle').value, desc: $('#mDesc').value, ts: Date.now() }));
  setT('saveState', ok ? 'Salvo às ' + new Date().toLocaleTimeString('pt-BR') : 'Falha ao salvar');
  if (manual) toast(ok ? 'Rascunho salvo ✔' : 'Não foi possível salvar (armazenamento cheio?)');
}
const dUpdate = debounce(update, 150), dSave = debounce(() => save(), 800);
function onInput() { fix(); dUpdate(); setT('saveState', 'Editando…'); dSave(); }
['kw', 'mTitle', 'mDesc'].forEach(id => $('#' + id).addEventListener('input', () => { dUpdate(); setT('saveState', 'Editando…'); dSave(); }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

/* ---------- Conversores HTML <-> Markdown ---------- */
function sanitize(h) {
  const d = new DOMParser().parseFromString(h, 'text/html');
  d.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form,input,button,textarea,select,svg,math').forEach(e => e.remove());
  d.body.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
    const n = a.name.toLowerCase();
    if (n.startsWith('on') || ((n === 'href' || n === 'src' || n === 'xlink:href') && /^\s*(javascript|data|vbscript):/i.test(a.value))) e.removeAttribute(a.name);
  }));
  return d.body.innerHTML;
}

function htmlToMarkdown(root) {
  const BL = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|HR|TABLE)$/;
  const wrap = (s, m) => { const x = s.match(/^(\s*)([\s\S]*?)(\s*)$/); return x[2] ? x[1] + m + x[2] + m + x[3] : s; };
  const kids = n => [...n.childNodes].map(walk).join('');
  function list(el, ord, d) {
    let i = 1, o = '';
    for (const li of el.children) {
      if (li.tagName !== 'LI') continue;
      let t = '', nest = '';
      for (const c of li.childNodes) {
        if (c.nodeType === 1 && /^(UL|OL)$/.test(c.tagName)) nest += '\n' + list(c, c.tagName === 'OL', d + 1).replace(/\n$/, '');
        else t += walk(c);
      }
      o += '  '.repeat(d) + (ord ? (i++) + '. ' : '- ') + t.replace(/\s*\n\s*/g, ' ').trim() + nest + '\n';
    }
    return o;
  }
  function walk(n) {
    if (n.nodeType === 3) return n.nodeValue.replace(/[ \t\r\n ]+/g, ' ').replace(/([\\*_`\[\]~])/g, '\\$1');
    if (n.nodeType !== 1) return '';
    const t = n.tagName;
    switch (t) {
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6': return '\n\n' + '#'.repeat(+t[1]) + ' ' + kids(n).trim() + '\n\n';
      case 'P': return '\n\n' + kids(n).trim() + '\n\n';
      case 'DIV': return [...n.children].some(c => BL.test(c.tagName)) ? '\n\n' + kids(n) + '\n\n' : '\n\n' + kids(n).trim() + '\n\n';
      case 'BR': return '  \n';
      case 'B': case 'STRONG': return wrap(kids(n), '**');
      case 'I': case 'EM': return wrap(kids(n), '*');
      case 'S': case 'STRIKE': case 'DEL': return wrap(kids(n), '~~');
      case 'CODE': return n.parentNode.tagName === 'PRE' ? n.textContent : wrap(n.textContent, '`');
      case 'PRE': return '\n\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n';
      case 'A': { const h = n.getAttribute('href') || '', i = kids(n); return h ? '[' + i + '](' + h + ')' : i; }
      case 'UL': case 'OL': return '\n\n' + list(n, t === 'OL', 0) + '\n';
      case 'BLOCKQUOTE': return '\n\n' + kids(n).trim().split('\n').map(l => '> ' + l).join('\n') + '\n\n';
      case 'HR': return '\n\n---\n\n';
      case 'SCRIPT': case 'STYLE': return '';
      default: return kids(n);
    }
  }
  return walk(root).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function inline(s) {
  const st = [], P = h => '\u0000' + (st.push(h) - 1) + '\u0000';
  s = s.replace(/\\([\\`*_\[\]~#>])/g, (m, c) => P(esc(c)));
  s = s.replace(/`([^`]+)`/g, (m, c) => P('<code>' + esc(c) + '</code>'));
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    u = u.replace(/&amp;/g, '&');
    const ok = /^(https?:|mailto:)/i.test(u) || !/^[a-z][a-z0-9+.\-]*:/i.test(u);
    return ok ? '<a href="' + esc(u) + '">' + t + '</a>' : t;
  });
  s = s.replace(/\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(\S(?:[\s\S]*?\S)?)__/g, '<strong>$1</strong>')
    .replace(/\*(\S(?:[^*]*?\S)?)\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_(\S(?:[^_]*?\S)?)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(\S(?:[\s\S]*?\S)?)~~/g, '<s>$1</s>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => st[i]);
}

const LI_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
function buildList(items) {
  let h = ''; const st = [];
  for (const it of items) {
    const tag = it.o ? 'ol' : 'ul';
    while (st.length && it.d < st[st.length - 1].d) h += '</li></' + st.pop().tag + '>';
    const top = st[st.length - 1];
    if (top && top.d === it.d) {
      if (top.tag === tag) h += '</li><li>';
      else { h += '</li></' + st.pop().tag + '><' + tag + '><li>'; st.push({ d: it.d, tag }); }
    } else { h += '<' + tag + '><li>'; st.push({ d: it.d, tag }); }
    h += inline(it.t);
  }
  while (st.length) h += '</li></' + st.pop().tag + '>';
  return h;
}

function markdownToHtml(md) {
  const L = md.replace(/\r\n?/g, '\n').split('\n');
  let out = '', para = [], i = 0;
  const flush = () => {
    if (!para.length) return;
    let h = '';
    para.forEach((l, k) => { h += inline(l.trim()) + (k < para.length - 1 ? (/ {2,}$/.test(l) ? '<br>' : ' ') : ''); });
    out += '<p>' + h + '</p>'; para = [];
  };
  while (i < L.length) {
    const l = L[i]; let m;
    if (/^\s*```/.test(l)) {
      flush(); const b = []; i++;
      while (i < L.length && !/^\s*```/.test(L[i])) b.push(L[i++]);
      i++; out += '<pre><code>' + esc(b.join('\n')) + '</code></pre>'; continue;
    }
    if (!l.trim()) { flush(); i++; continue; }
    m = l.match(/^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/);
    if (m) { flush(); out += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; i++; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l)) { flush(); out += '<hr>'; i++; continue; }
    if (/^\s{0,3}>/.test(l)) {
      flush(); const b = [];
      while (i < L.length && /^\s{0,3}>/.test(L[i])) b.push(L[i++].replace(/^\s{0,3}>\s?/, ''));
      out += '<blockquote>' + markdownToHtml(b.join('\n')) + '</blockquote>'; continue;
    }
    if (LI_RE.test(l)) {
      flush(); const items = [];
      while (i < L.length && (m = L[i].match(LI_RE))) { items.push({ d: m[1].replace(/\t/g, '  ').length, o: /\d/.test(m[2]), t: m[3] }); i++; }
      out += buildList(items); continue;
    }
    para.push(l); i++;
  }
  flush();
  return out;
}

/* ---------- Importar / Exportar / Ações ---------- */
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); };
function dl(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
function loaded(msg) { ensureStruct(); update(); save(); toast(msg); }

$('#btnExportMd').onclick = () => {
  const kw = $('#kw').value.trim(), t = $('#mTitle').value.trim(), d = $('#mDesc').value.trim();
  const fm = kw || t || d ? '---\ntitle: ' + JSON.stringify(t) + '\ndescription: ' + JSON.stringify(d) + '\nkeyword: ' + JSON.stringify(kw) + '\n---\n\n' : '';
  dl('tchekhov-' + stamp() + '.md', fm + htmlToMarkdown(ed), 'text/markdown;charset=utf-8');
  toast('Markdown exportado ✔');
};
$('#btnExportJson').onclick = () => {
  const o = { app: 'Tchekhov', version: 1, exportedAt: new Date().toISOString(), html: ed.innerHTML, markdown: htmlToMarkdown(ed), seo: { keyword: $('#kw').value, title: $('#mTitle').value, description: $('#mDesc').value } };
  dl('tchekhov-backup-' + stamp() + '.json', JSON.stringify(o, null, 2), 'application/json;charset=utf-8');
  toast('Backup JSON exportado ✔');
};
$('#btnImportMd').onclick = () => $('#fileMd').click();
$('#btnImportJson').onclick = () => $('#fileJson').click();

$('#fileMd').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let t = (await f.text()).replace(/\r\n?/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---\n*/);
  if (m && m[1].split('\n').every(l => !l.trim() || /^[A-Za-z_-]+\s*:/.test(l))) {
    t = t.slice(m[0].length);
    m[1].split('\n').forEach(l => {
      const k = l.slice(0, l.indexOf(':')).trim(); let v = l.slice(l.indexOf(':') + 1).trim();
      try { v = JSON.parse(v); } catch {}
      v = String(v);
      if (k === 'title') $('#mTitle').value = v; else if (k === 'description') $('#mDesc').value = v; else if (k === 'keyword') $('#kw').value = v;
    });
  }
  ed.innerHTML = markdownToHtml(t) || '<p><br></p>';
  loaded('Markdown importado ✔');
};
$('#fileJson').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let o;
  try { o = JSON.parse(await f.text()); } catch { return toast('Arquivo JSON inválido'); }
  const html = o && typeof o.html === 'string' ? sanitize(o.html) : o && typeof o.markdown === 'string' ? markdownToHtml(o.markdown) : null;
  if (html === null) return toast('Formato de backup não reconhecido');
  ed.innerHTML = html || '<p><br></p>';
  const s = o.seo || {};
  $('#kw').value = String(s.keyword || ''); $('#mTitle').value = String(s.title || ''); $('#mDesc').value = String(s.description || '');
  loaded('Backup importado ✔');
};

$('#btnCopy').onclick = async () => {
  const t = ed.innerText.replace(/ /g, ' ').trim();
  if (!t) return toast('Nada para copiar');
  try { await navigator.clipboard.writeText(t); }
  catch { const a = document.createElement('textarea'); a.value = t; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast('Texto copiado ✔');
};
$('#btnSave').onclick = () => save(true);
$('#btnClear').onclick = () => {
  if (!confirm('Limpar todo o texto e os campos de SEO? Esta ação não pode ser desfeita.')) return;
  ed.innerHTML = '<p><br></p>';
  ['kw', 'mTitle', 'mDesc'].forEach(id => { $('#' + id).value = ''; });
  LS.del(KEY); update(); setT('saveState', '—'); ed.focus(); toast('Editor limpo');
};

/* ---------- Inicialização ---------- */
try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
const draft = LS.get(KEY);
if (draft) {
  try {
    const o = JSON.parse(draft);
    ed.innerHTML = sanitize(o.html || '');
    $('#kw').value = o.kw || ''; $('#mTitle').value = o.title || ''; $('#mDesc').value = o.desc || '';
    setT('saveState', 'Rascunho restaurado');
  } catch {}
}
ensureStruct();
update();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
