const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const roster = html.match(/^const PREFILLED=(.*);$/m);
assert(roster, 'built-in roster exists');
const teams = JSON.parse(roster[1]).teams;
const lookup = html.match(/^const FULL_NAMES=(.*);$/m);
assert(lookup, 'legacy name lookup exists');
const aliases = JSON.parse(lookup[1]);
const expected = [
  ['Leopard', 1, 'Georges Abboud'],
  ['Faucon', 3, 'Marc Abi Nassif'],
  ['Bison', 6, 'Kevin Hanna'],
  ['Requin', 2, 'Kevin Nehme']
];
const namesIn = (team, unit) => team.units[unit].names.split('\n');
const allNames = teams.flatMap(team => team.units.flatMap(unit => unit.names.split('\n')));
assert.equal(new Set(allNames).size, allNames.length, 'each participant occurs once');
aliases.forEach((teamAliases, index) => {
  const rosterNames = new Set(teams[index].units.flatMap(unit => unit.names.split('\n')));
  for (const fullName of Object.values(teamAliases)) {
    assert(rosterNames.has(fullName), `${fullName} alias belongs to ${teams[index].name}`);
  }
});
for (const [teamName, unit, name] of expected) {
  const team = teams.find(team => team.name === teamName);
  assert(team, `${teamName} exists`);
  assert(namesIn(team, unit).includes(name), `${name} starts in ${teamName} unit ${unit + 1}`);
  for (const groupSize of [2, 4, 8]) {
    const first = Math.floor(unit / groupSize) * groupSize;
    const progression = Array.from({ length: groupSize }, (_, offset) => namesIn(team, first + offset)).flat();
    assert(progression.includes(name), `${name} appears in the ${groupSize}-unit progression group`);
  }
}
console.log('Roster swap and tree progression checks passed');
