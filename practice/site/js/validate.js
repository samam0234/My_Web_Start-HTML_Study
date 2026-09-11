export function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const messageEl = document.getElementById("form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      messageEl.textContent = "모든 칸을 채워주세요.";
      messageEl.className = "form-message error";
      return;
    }

    messageEl.textContent = `${name}님, 감사합니다! (실제로 전송되지는 않았어요)`;
    messageEl.className = "form-message success";
    form.reset();
  });
}
