'use strict';

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const chapters = [
  ['our-school.html', 'about'],
  ['academics.html', 'academics'],
  ['school-life.html', 'school-life'],
  ['news.html', 'news'],
  ['contact.html', 'contact'],
];

function renderVisitorHome(root) {
  const source = readFileSync(resolve(root, 'index.html'), 'utf8');
  const content = chapters.map(([file, id]) => {
    const page = readFileSync(resolve(root, file), 'utf8');
    const main = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
    if (!main || !main.includes('class="section page-heading"')) {
      throw Error('Visitor chapter is missing its introduction in ' + file);
    }
    const section = main
      .replace(/<a class="visitor-back"[^>]*>[\s\S]*?<\/a>/, '')
      .replace('<h1>', '<h2 id="' + id + '-heading">')
      .replace('</h1>', '</h2>');
    return '<article class="visitor-chapter" id="' + id + '" aria-labelledby="' + id + '-heading">\n' + section + '\n</article>';
  }).join('\n');

  if (source.split('<!-- visitor-chapters -->').length !== 2) throw Error('Homepage needs one visitor chapter marker');
  const anchors = new Map(chapters);
  return source.replace('<!-- visitor-chapters -->', () => content)
    .replace(/href="([a-z-]+\.html)(#[a-z-]+)?"/g, (link, page, fragment) => {
      if (page === 'index.html' && fragment) return 'href="' + fragment + '"';
      if (!anchors.has(page)) return link;
      return 'href="' + (fragment || '#' + anchors.get(page)) + '"';
    });
}

module.exports = { renderVisitorHome };

