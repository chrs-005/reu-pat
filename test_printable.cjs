const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const glyphs = html.match(/^const GLYPH_PNGS=.*;$/m)?.[0];
const start = html.indexOf('const XML_NS={};');
const end = html.indexOf("$('generatePrintableBtn').onclick=", start);
assert(glyphs && start >= 0 && end > start, 'printable generator and symbols exist');

const places = ['Hangar 7e', 'Cherokee', 'Ping pong', 'Grafiti', 'Chapelle', 'Lougha', 'CE1', 'CP'];
const perPage = Number(process.argv[3] || 8);
assert([4, 6, 8].includes(perPage));
const cards = Array.from({ length: perPage * 2 }, (_, index) => ({
  kind: index % 3 === 1 ? 'envelope' : 'initial',
  person: ['Georges Ibrahim', 'Jean Paul Safa', 'Paul Obeid', 'Oliver Sleiman'][index % 4],
  location: places[index % places.length],
  hiddenAt: places[(index + 2) % places.length],
  symbol: index % 4 + 1
}));

const generator = html.slice(start, end).replace('const cards=buildPrintableCards();', 'const cards=sampleCards;');
const output = process.argv[2] || `sample_${perPage}_cards.docx`;
const { result, xml } = vm.runInNewContext(
  glyphs + '\n' + generator + `\n({result:createPrintableDocx(${perPage}),xml:printableDocumentXml(sampleCards,${perPage})})`,
  { sampleCards: cards, TextEncoder, Uint8Array, atob }
);
assert.equal(result.cards.length, perPage * 2);
assert.equal(result.count, perPage);
assert.equal((xml.match(/<w:tbl>/g) || []).length, 4);
assert.equal((xml.match(/<w:br w:type="page"\/>/g) || []).length, 3);
assert.equal((xml.match(/<w:i\/>/g) || []).length, cards.length);
assert(!xml.includes('HINT LEADING TO'));
assert(!xml.includes('Replace with your riddle'));
assert(!xml.includes('<w:pBdr>') && !xml.includes('<w:shd'));
const tables = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g);
for (let sheet = 0; sheet < 2; sheet++) {
  const fronts = tables[sheet * 2].match(/<w:tc>[\s\S]*?<\/w:tc>/g);
  const backs = tables[sheet * 2 + 1].match(/<w:tc>[\s\S]*?<\/w:tc>/g);
  for (let position = 0; position < perPage; position++) {
    const card = cards[sheet * perPage + position];
    assert(fronts[position].includes(`<w:t xml:space="preserve">${card.location}</w:t>`));
    const mirrored = position ^ 1;
    assert(backs[mirrored].includes(`r:embed="rIdSymbol${card.symbol}"`));
    const label = card.kind === 'initial' ? card.person : `Hidden at: ${card.hiddenAt}`;
    assert(backs[mirrored].includes(`<w:t xml:space="preserve">${label}</w:t>`));
  }
}
fs.writeFileSync(output, Buffer.from(result.bytes));
console.log(`Wrote ${output}: ${result.cards.length} cards, ${result.count} per A4`);
