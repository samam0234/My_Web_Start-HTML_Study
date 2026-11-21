const key = 'study3-count'; // origin별 저장 키다.
let count = 0; // 메모리에서 변하는 상태다.
try { const saved = JSON.parse(localStorage.getItem(key)); if (Number.isSafeInteger(saved) && saved >= 0) count = saved; }
catch { document.getElementById('error').textContent = '저장값이 손상되어 0부터 시작합니다.'; }
const render = () => { document.getElementById('count').textContent = String(count); }; // 수동 바인딩이다.
document.getElementById('add').addEventListener('click', () => {
  count += 1; // 먼저 상태를 바꾼다.
  try { localStorage.setItem(key, JSON.stringify(count)); } // 문자열로 저장한다.
  catch { document.getElementById('error').textContent = '저장이 차단되었습니다. 현재 탭에서만 유지됩니다.'; }
  render(); // 바뀐 상태로 화면을 그린다.
});
render(); // 초기 표시다.
