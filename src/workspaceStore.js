const STORAGE_KEY = 'comply.ai.beauty-studio.v1';

const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

export function createWorkspaceStore(storage = globalThis.localStorage) {
  const read = () => {
    try { return JSON.parse(storage.getItem(STORAGE_KEY) || '{"schemaVersion":1,"workspaces":[]}'); }
    catch { return { schemaVersion: 1, workspaces: [] }; }
  };
  const write = (payload) => { storage.setItem(STORAGE_KEY, JSON.stringify(payload)); return payload; };
  const list = () => clone(read().workspaces || []);
  const save = (workspace) => {
    const payload = read();
    const id = workspace.id || makeId();
    const index = payload.workspaces.findIndex((item) => item.id === id);
    const snapshots = index >= 0 ? payload.workspaces[index].snapshots || [] : workspace.snapshots || [];
    const next = { ...clone(workspace), id, snapshots, updatedAt: new Date().toISOString() };
    if (index >= 0) payload.workspaces[index] = next; else payload.workspaces.push(next);
    write(payload);
    return clone(next);
  };
  const duplicate = (id) => {
    const source = list().find((item) => item.id === id);
    if (!source) throw new Error('복제할 작업을 찾지 못했습니다.');
    return save({ ...source, id: makeId(), name: `${source.name} 사본`, snapshots: [] });
  };
  const remove = (id) => { const payload = read(); payload.workspaces = payload.workspaces.filter((item) => item.id !== id); write(payload); return list(); };
  const snapshot = (id) => {
    const payload = read();
    const target = payload.workspaces.find((item) => item.id === id);
    if (!target) throw new Error('스냅샷을 만들 작업을 찾지 못했습니다.');
    const snap = { id: makeId(), createdAt: new Date().toISOString(), state: { ...clone(target), snapshots: [] } };
    target.snapshots = [...(target.snapshots || []), snap];
    write(payload);
    return clone(snap);
  };
  const restore = (id, snapshotId) => {
    const payload = read();
    const index = payload.workspaces.findIndex((item) => item.id === id);
    const target = payload.workspaces[index];
    const snap = target?.snapshots?.find((item) => item.id === snapshotId);
    if (!snap) throw new Error('복원할 버전을 찾지 못했습니다.');
    payload.workspaces[index] = { ...clone(snap.state), id, snapshots: target.snapshots, updatedAt: new Date().toISOString() };
    write(payload);
    return clone(payload.workspaces[index]);
  };
  const exportJson = () => JSON.stringify(read(), null, 2);
  const importJson = (raw) => {
    let payload;
    try { payload = JSON.parse(raw); } catch { throw new Error('백업 파일을 읽을 수 없습니다.'); }
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.workspaces)) throw new Error('지원하지 않는 백업 형식입니다.');
    write({ schemaVersion: 1, workspaces: payload.workspaces.map((item) => ({ ...item, id: item.id || makeId() })) });
    return list();
  };
  return { list, save, duplicate, remove, snapshot, restore, exportJson, importJson };
}
