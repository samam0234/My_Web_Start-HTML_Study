// 토큰은 영구 저장소에 쓰지 않아 새로고침하면 로그인이 풀린다.
let token = '';
export const setToken = value => { token = value; };
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (options.raw && response.ok) return response;
  const value = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(value.error?.message || '요청 실패');
    Object.assign(error, { status: response.status, fields: value.error?.fields || {} });
    throw error;
  }
  return value;
}
export const json = (method, value) => ({ method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
