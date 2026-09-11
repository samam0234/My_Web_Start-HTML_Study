import { initTheme } from "./theme.js";
import { initTodo } from "./todo.js";

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const messageEl = document.getElementById("form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();

    if (!name || !email) {
      messageEl.textContent = "이름과 이메일을 입력해주세요.";
      messageEl.className = "form-message error";
      return;
    }

    messageEl.textContent = `${name}님, 메시지가 접수되었습니다 (데모용, 실제 전송 없음).`;
    messageEl.className = "form-message success";
    form.reset();
  });
}

initTheme();
initTodo();
initContactForm();
