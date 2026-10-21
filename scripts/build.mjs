import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(root, 'posts');
const outputDir = path.join(root, 'generated');

function parsePost(source, filename) {
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: 缺少 YAML 风格的文章信息`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index > 0) meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  for (const field of ['title', 'date', 'category', 'summary']) {
    if (!meta[field]) throw new Error(`${filename}: 缺少 ${field}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(Date.parse(`${meta.date}T00:00:00Z`))) {
    throw new Error(`${filename}: date 必须是 YYYY-MM-DD`);
  }
  return {
    slug: path.basename(filename, '.md'),
    title: meta.title,
    date: meta.date,
    category: meta.category,
    summary: meta.summary,
    tags: (meta.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
    body: match[2].trim()
  };
}

const files = (await readdir(postsDir)).filter(file => file.endsWith('.md'));
const posts = await Promise.all(files.map(async file => parsePost(await readFile(path.join(postsDir, file), 'utf8'), file)));
posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh'));
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'posts.json'), JSON.stringify(posts, null, 2) + '\n');
console.log(`已生成 ${posts.length} 篇文章`);
