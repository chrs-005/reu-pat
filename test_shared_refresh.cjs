const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('async function refreshShared(){');
const end = html.indexOf('\nfunction derive(', start);
assert(start >= 0 && end > start, 'refreshShared exists');
const code = html.slice(start, end);

async function check(overrides = {}) {
  const calls = [];
  const context = {
    sharedReady: true, sharedRefreshing: false, sharedConflict: false,
    sharedSaving: false, sharedDirty: false, sharedRevision: 1,
    sharedRemote: null, sharedTimer: null, dragSourceSlot: null,
    sharedRequest: async () => [{ revision: 2, state: { teams: [] } }],
    valid: () => true,
    useSharedVersion: preserveView => calls.push(['load', preserveView]),
    setSyncStatus: message => calls.push(['status', message]),
    showSyncChoice: () => calls.push(['choice']),
    clearTimeout: () => calls.push(['clear']),
    console,
    ...overrides
  };
  await vm.runInNewContext(code + '\nrefreshShared()', context);
  return { context, calls };
}

(async () => {
  let result = await check();
  assert.equal(result.context.sharedRevision, 2);
  assert.deepEqual(result.calls[0], ['load', true]);
  assert.equal(result.context.sharedRefreshing, false);

  result = await check({ sharedRevision: 2 });
  assert.equal(result.calls.length, 0, 'unchanged revision leaves page alone');

  result = await check({ sharedDirty: true });
  assert.equal(result.context.sharedConflict, true);
  assert.equal(result.calls.some(call => call[0] === 'load'), false);
  assert.equal(result.calls.some(call => call[0] === 'choice'), true);

  result = await check({ sharedSaving: true, sharedRequest: () => { throw Error('unexpected request'); } });
  assert.equal(result.calls.length, 0, 'in-flight save is not interrupted');

  result = await check({ dragSourceSlot: '0:0', sharedRequest: () => { throw Error('unexpected request'); } });
  assert.equal(result.calls.length, 0, 'a drag is not interrupted');

  console.log('Shared refresh checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
