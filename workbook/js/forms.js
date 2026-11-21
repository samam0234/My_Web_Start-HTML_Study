// 폼 제어를 한곳에 모으고 실패해도 finally에서 버튼을 복구한다.
export function bindForm(form, action, onError) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.busy === 'true' || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const buttonValue = event.submitter?.value;
    form.dataset.busy = 'true';
    const buttons = [...form.querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    try { await action(data, buttonValue); }
    catch (error) { onError(error); }
    finally { form.dataset.busy = 'false'; buttons.forEach(button => { button.disabled = false; }); }
  });
}
