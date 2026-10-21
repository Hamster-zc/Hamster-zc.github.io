const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dateText = date => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const postUrl = post => `#/post/${encodeURIComponent(post.slug)}`;
let posts = [];
let category = '全部';
let subcategory = '全部';
let query = '';
const categoryText = post => [post.category, post.subcategory].filter(Boolean).join(' / ');

function inline(source) {
  return esc(source)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdown(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let list = '', code = false, codeLines = [], fence = '';
  const closeList = () => { if (list) { out.push(`</${list}>`); list = ''; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeFence = line.match(/^(`{3,}|~{3,})/);
    if ((!code && codeFence) || (code && line.startsWith(fence))) {
      closeList();
      if (code) { out.push(`<pre><code>${esc(codeLines.join('\n'))}</code></pre>`); codeLines = []; }
      else fence = codeFence[1];
      code = !code;
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    if (!line.trim()) { closeList(); continue; }
    if (line.trim() === '$$') {
      closeList();
      const mathLines = [];
      while (++i < lines.length && lines[i].trim() !== '$$') mathLines.push(lines[i]);
      out.push(`<div class="math-display">$$\n${esc(mathLines.join('\n'))}\n$$</div>`);
      continue;
    }
    if (/^\|.*\|$/.test(line.trim()) && /^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) {
      closeList();
      const cells = row => row.trim().slice(1, -1).split('|').map(cell => cell.trim());
      out.push(`<div class="table-scroll"><table><thead><tr>${cells(line).map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>`);
      i++;
      while (i + 1 < lines.length && /^\|.*\|$/.test(lines[i + 1].trim())) {
        out.push(`<tr>${cells(lines[++i]).map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`);
      }
      out.push('</tbody></table></div>');
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { closeList(); const level = Math.min(heading[1].length + 1, 6); out.push(`<h${level}>${inline(heading[2])}</h${level}>`); continue; }
    const item = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (item) {
      const type = /^\d+\./.test(line) ? 'ol' : 'ul';
      if (list !== type) { closeList(); out.push(`<${type}>`); list = type; }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    closeList();
    if (/^>\s?/.test(line)) out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
    else if (/^---+$/.test(line.trim())) out.push('<hr>');
    else out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (code) out.push(`<pre><code>${esc(codeLines.join('\n'))}</code></pre>`);
  return out.join('\n');
}

function card(post, index) {
  const colors = ['peach', 'lavender', 'mint', 'sand'];
  return `<a class="post-card" href="${postUrl(post)}">
    <div class="card-art ${colors[index % colors.length]}"><span>${String(index + 1).padStart(2, '0')}</span><i aria-hidden="true">${['✳', '✦', '✼', '❋'][index % 4]}</i></div>
    <div class="card-content"><div class="card-meta"><span>${esc(categoryText(post))}</span><span class="meta-dot"></span><time datetime="${esc(post.date)}">${dateText(post.date)}</time></div>
    <h3>${esc(post.title)}</h3><p>${esc(post.summary)}</p><span class="read-more">阅读全文 <span aria-hidden="true">↗</span></span></div>
  </a>`;
}

function home() {
  const recent = posts.slice(0, 3);
  app.innerHTML = `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> A LITTLE SPACE FOR WORDS</div><h1>把日子<br><em>写成文字<span>。</span></em></h1><p>一个收集灵感与思考的小角落。<br>关于学习、阅读，还有那些值得记住的平凡时刻。</p><a class="primary-button" href="#/archive">探索文章 <span aria-hidden="true">↗</span></a><div class="hero-footnote">慢慢记录，自由生长 <span>✺</span></div></div><div class="hero-visual" aria-hidden="true"><div class="visual-circle circle-one"></div><div class="visual-circle circle-two"></div><div class="visual-asterisk">✳</div><div class="visual-caption">Collect moments,<br>connect thoughts.</div><div class="visual-index">VOL. 001 / ${new Date().getFullYear()}</div></div></section>
  <section class="section latest"><div class="section-heading"><div><span class="section-kicker">01 / LATEST STORIES</span><h2>最近更新<span class="heading-dot">.</span></h2><p>新鲜的想法，正在这里慢慢长出来。</p></div><a class="text-link" href="#/archive">查看全部文章 <span aria-hidden="true">↗</span></a></div><div class="card-grid">${recent.map(card).join('')}</div></section>
  <section class="bottom-note"><span>✳</span><div><h2>保持好奇，保持记录。</h2><p>每一篇文字，都是生活留下的小小回声。</p></div><a href="#/about">关于这个博客 <span aria-hidden="true">↗</span></a></section>`;
}

function archive() {
  const categories = ['全部', ...new Set(posts.map(post => post.category))];
  const subcategories = category === '全部' ? [] : [...new Set(posts.filter(post => post.category === category).map(post => post.subcategory).filter(Boolean))];
  app.innerHTML = `<section class="inner-heading"><span class="section-kicker">02 / ALL STORIES</span><h1>文章归档<span class="heading-dot">.</span></h1><p>按主题翻阅，或搜索你感兴趣的内容。</p></section><section class="archive-tools"><div class="category-tabs" role="group" aria-label="一级分类">${categories.map(item => `<button type="button" data-category="${esc(item)}" class="${category === item ? 'active' : ''}">${esc(item)}</button>`).join('')}</div><label class="search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索文章或关键词..." value="${esc(query)}" aria-label="搜索文章"></label></section>${subcategories.length ? `<div class="subcategory-tabs" role="group" aria-label="二级分类"><span>细分主题</span>${['全部', ...subcategories].map(item => `<button type="button" data-subcategory="${esc(item)}" class="${subcategory === item ? 'active' : ''}">${esc(item)}</button>`).join('')}</div>` : ''}<section><div class="archive-count" id="archive-count"></div><div class="archive-list" id="archive-list"></div></section>`;
  app.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; subcategory = '全部'; archive(); }));
  app.querySelectorAll('[data-subcategory]').forEach(button => button.addEventListener('click', () => { subcategory = button.dataset.subcategory; archive(); }));
  app.querySelector('#search').addEventListener('input', event => { query = event.target.value; renderArchiveList(); });
  renderArchiveList();
}

function renderArchiveList() {
  const term = query.trim().toLocaleLowerCase();
  const matching = posts.filter(post => (category === '全部' || post.category === category) && (subcategory === '全部' || post.subcategory === subcategory) && (!term || [post.title, post.summary, post.category, post.subcategory, ...post.tags].join(' ').toLocaleLowerCase().includes(term)));
  app.querySelector('#archive-count').textContent = `共 ${matching.length} 篇文章`;
  app.querySelector('#archive-list').innerHTML = matching.length ? matching.map(post => `<a class="archive-row" href="${postUrl(post)}"><time datetime="${esc(post.date)}">${dateText(post.date)}</time><div><span class="row-category">${esc(categoryText(post))}</span><h2>${esc(post.title)}</h2><p>${esc(post.summary)}</p></div><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('') : '<div class="empty-state">暂时没有找到相关文章。换个关键词试试吧。</div>';
}

function article(slug) {
  const post = posts.find(item => item.slug === slug);
  if (!post) { notFound(); return; }
  const related = posts.filter(item => item.slug !== slug && item.category === post.category).slice(0, 2);
  app.innerHTML = `<article class="article"><a class="back-link" href="#/archive">← 返回文章归档</a><header class="article-header"><div class="card-meta"><span>${esc(categoryText(post))}</span><span class="meta-dot"></span><time datetime="${esc(post.date)}">${dateText(post.date)}</time></div><h1>${esc(post.title)}</h1><p>${esc(post.summary)}</p></header><div class="article-divider"><span>✳</span></div><div class="article-body">${markdown(post.body)}</div><div class="article-end"><span>写于 ${dateText(post.date)}</span><div>${post.tags.map(tag => `<span class="tag"># ${esc(tag)}</span>`).join('')}</div></div></article><section class="related"><div class="section-heading"><div><span class="section-kicker">KEEP READING</span><h2>继续阅读<span class="heading-dot">.</span></h2></div><a class="text-link" href="#/archive">全部文章 ↗</a></div><div class="related-list">${related.length ? related.map(item => `<a href="${postUrl(item)}"><span>${esc(categoryText(item))}</span><strong>${esc(item.title)}</strong><span aria-hidden="true">↗</span></a>`).join('') : '<p>更多文章正在路上。</p>'}</div></section>`;
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([app.querySelector('.article-body')]);
}

function about() {
  app.innerHTML = `<section class="about-page"><div class="about-copy"><span class="section-kicker">03 / ABOUT THIS SPACE</span><h1>你好，这里是<br><em>拾光笔记<span class="heading-dot">.</span></em></h1><p>这是一个用来存放学习笔记和随笔的小站。好奇的问题、读过的句子，以及日常里不想忘记的片刻，都可以在这里慢慢留下。</p><p>内容会随着时间生长。希望每次翻看，都能发现一点新的联系。</p><a class="primary-button" href="#/archive">读读文章 <span aria-hidden="true">↗</span></a></div><div class="about-art" aria-hidden="true"><span class="about-star">✳</span><span class="about-note">STAY CURIOUS<br>KEEP WRITING</span></div></section>`;
}

function notFound() { app.innerHTML = '<section class="not-found"><span>✳</span><h1>这一页走丢了</h1><p>或许可以从首页重新开始。</p><a class="primary-button" href="#/">回到首页 ↗</a></section>'; }

function route() {
  const hash = decodeURIComponent(location.hash || '#/');
  const path = hash.slice(1);
  document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('current', link.getAttribute('href') === `#${path}`));
  if (path === '/' || path === '') home();
  else if (path === '/archive') archive();
  else if (path === '/about') about();
  else if (path.startsWith('/post/')) article(path.slice(6));
  else notFound();
  window.scrollTo(0, 0);
}

document.querySelector('#year').textContent = `© ${new Date().getFullYear()}`;
try {
  const response = await fetch('generated/posts.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('无法读取文章数据');
  posts = await response.json();
  route();
  window.addEventListener('hashchange', route);
} catch (error) {
  app.innerHTML = `<section class="not-found"><h1>文章暂时无法加载</h1><p>${esc(error.message)}。请先运行 npm run build，再通过本地服务器预览。</p></section>`;
}
