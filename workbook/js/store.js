// 상태 변경을 구독하는 14줄짜리 작은 저장소다.
export function createStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener(structuredClone(state));
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
