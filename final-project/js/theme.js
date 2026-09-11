const STORAGE_KEY = "final-project-theme";

export function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    toggle.textContent = "☀️";
  }

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(STORAGE_KEY, "light");
      toggle.textContent = "🌙";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(STORAGE_KEY, "dark");
      toggle.textContent = "☀️";
    }
  });
}
