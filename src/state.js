// The shift in progress. Phase 1 keeps it in memory; Phase 2 saves it with storage.js so
// progress survives a reload.

let state = null;

export function startDay(day) {
  state = { day, callIndex: 0, results: [] };
  return state;
}

export const current = () => state;

export function recordResult(callerId, graded) {
  state.results.push({ callerId, ...graded });
}

export function advance() {
  state.callIndex += 1;
}

export function summary() {
  const r = state.results;
  return {
    handled: r.length,
    correct: r.filter((x) => x.outcome === 'correct').length,
    escalated: r.filter((x) => x.outcome === 'escalated').length,
    breaches: r.filter((x) => x.breach).length,
    wrongfulDenials: r.filter((x) => x.wrongfulDenial).length,
  };
}
