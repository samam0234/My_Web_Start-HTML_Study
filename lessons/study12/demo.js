import { atom } from 'nanostores';
import JustValidate from 'just-validate';

// npm 라이브러리의 bare import는 esbuild로 브라우저용 한 파일로 묶는다.
const submitted = atom(0);
const status = document.getElementById('demo-status');
const stop = submitted.subscribe(count => { document.getElementById('demo-count').textContent = `서버 검사 성공 ${count}회`; });
const validator = new JustValidate('#demo-form', { lockForm: true, focusInvalidField: true, validateBeforeSubmitting: true });
validator.addField('#demo-title', [{ rule: 'required', errorMessage: '제목을 입력하세요.' }, { rule: 'maxLength', value: 200, errorMessage: '200자 이하로 입력하세요.' }]);
let busy = false;
validator.onSuccess(async event => {
  event?.preventDefault();
  if (busy) return;
  busy = true;
  const button = document.querySelector('#demo-form button');
  button.disabled = true;
  try {
    const title = document.getElementById('demo-title').value.trim();
    const response = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error.message);
    status.textContent = value.data.message;
    submitted.set(submitted.get() + 1);
  } catch (error) { status.textContent = error.message; }
  finally { busy = false; button.disabled = false; }
});
window.addEventListener('pagehide', () => { stop(); validator.destroy(); }, { once: true });
