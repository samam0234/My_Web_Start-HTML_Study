const form = document.getElementById('form');
const output = document.getElementById('result');
let pending = false; // 클릭과 Enter가 겹쳐도 중복 요청을 막는다.
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || !form.reportValidity()) return;
  const title = new FormData(form).get('title').trim();
  if (!title) { output.textContent = '공백만 입력할 수 없습니다.'; return; }
  pending = true; form.querySelector('button').disabled = true;
  try {
    const response = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    const body = await response.json();
    output.textContent = response.status === 200 ? body.data.message : [400, 422].includes(response.status) ? body.error.message : '예상하지 못한 응답입니다.';
  } catch { output.textContent = '네트워크 연결을 확인하세요.'; }
  finally { pending = false; form.querySelector('button').disabled = false; }
});
