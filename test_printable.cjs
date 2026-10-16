const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const glyphs = html.match(/^const GLYPH_PNGS=.*;$/m)?.[0];
const hints = html.match(/^const HINT_PNGS=.*;$/m)?.[0];
const placesCode = html.match(/^const PLACES=.*;$/m)?.[0];
const start = html.indexOf('const XML_NS={};');
const end = html.indexOf("$('generatePrintableBtn').onclick=", start);
assert(glyphs && hints && placesCode && start >= 0 && end > start, 'printable generator and images exist');

const places = ['Ping pong', 'CP', 'Hangar 7e', 'Chapelle', 'Dekken', 'Grafiti', 'Salle de ballet', 'Lougha', 'CE1', 'Cherokee'];
const filenames = ['ping pong.png', 'CP.png', '7e.png', 'chapelle.png', 'dekken.png', 'graffiti.png', 'salle de ballet.png', 'lougha.png', 'CE1.png', 'cherokee.png'];
const perPage = 8;
const cards = Array.from({ length: perPage * 2 }, (_, index) => ({
  kind: index % 3 === 1 ? 'envelope' : 'initial',
  person: ['Georges Ibrahim', 'Jean Paul Safa', 'Paul Obeid', 'Oliver Sleiman'][index % 4],
  location: places[index % places.length],
  hiddenAt: places[(index + 2) % places.length],
  symbol: index % 4 + 1
}));

const generator = html.slice(start, end).replace('const cards=buildPrintableCards(round1Only);', 'const cards=sampleCards;');
const output = process.argv[2] || `sample_${perPage}_cards.docx`;
const { result, xml, embeddedHints, embeddedPlaces } = vm.runInNewContext(
  glyphs + '\n' + hints + '\n' + placesCode + '\n' + generator + '\n({result:createPrintableDocx(false),xml:printableDocumentXml(sampleCards,8),embeddedHints:HINT_PNGS,embeddedPlaces:PLACES})',
  { sampleCards: cards, TextEncoder, Uint8Array, atob }
);
assert.equal(result.cards.length, perPage * 2);
assert.equal(result.count, perPage);
assert.deepEqual(Array.from(embeddedPlaces), places);
for (let i = 0; i < places.length; i++) {
  assert.deepEqual(Buffer.from(embeddedHints[i].data, 'base64'), fs.readFileSync(`hints/${filenames[i]}`));
}
assert.equal((xml.match(/<w:tbl>/g) || []).length, 4);
assert.equal((xml.match(/<w:br w:type="page"\/>/g) || []).length, 3);
assert.equal((xml.match(/r:embed="rIdHint\d+"/g) || []).length, cards.length);
assert(!xml.includes('HINT LEADING TO'));
assert(!xml.includes('Replace with your riddle'));
assert(!xml.includes('<w:pBdr>') && !xml.includes('<w:shd'));
const tables = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g);
for (let sheet = 0; sheet < 2; sheet++) {
  const fronts = tables[sheet * 2].match(/<w:tc>[\s\S]*?<\/w:tc>/g);
  const backs = tables[sheet * 2 + 1].match(/<w:tc>[\s\S]*?<\/w:tc>/g);
  for (let position = 0; position < perPage; position++) {
    const card = cards[sheet * perPage + position];
    assert(fronts[position].includes(`r:embed="rIdHint${places.indexOf(card.location) + 1}"`));
    const mirrored = position ^ 1;
    assert(backs[mirrored].includes(`r:embed="rIdSymbol${card.symbol}"`));
    const label = card.kind === 'initial' ? card.person : `Hidden at: ${card.hiddenAt}`;
    assert(backs[mirrored].includes(`<w:t xml:space="preserve">${label}</w:t>`));
  }
}
const cardBuilder = html.slice(html.indexOf('function buildPrintableCards('), html.indexOf('function crc32Init('));
const sampleTeam = { name: 'Panda', meetings: { 8: { location: 'CP', symbol: 1 }, 12: { location: 'CE1', symbol: 2 }, 14: { location: 'Cherokee', symbol: 3 } } };
const scopeContext = {
  data: { teams: [sampleTeam] },
  derive: () => ({ units: [['Person A', 'Person B'], ['Person C']], first: [8, 8], liveMeetings: [8, 12, 14], nextMeeting: id => ({ 8: 12, 12: 14, 14: null })[id] }),
  glyphNumber: meeting => meeting.symbol
};
const scope = vm.runInNewContext(cardBuilder + '\n({all:buildPrintableCards(false),round1:buildPrintableCards(true)})', scopeContext);
assert.equal(scope.round1.length, 3);
assert(scope.round1.every(card => card.kind === 'initial' && card.person));
assert.equal(scope.all.length, 5);
fs.writeFileSync(output, Buffer.from(result.bytes));
console.log(`Wrote ${output}: ${result.cards.length} cards, ${result.count} per A4`);
