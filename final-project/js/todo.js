const STORAGE_KEY = "final-project-todos";

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function initTodo() {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyMsg = document.getElementById("todo-empty");
  if (!form || !list) return;

  let todos = loadTodos();

  function render() {
    list.innerHTML = "";
    emptyMsg.classList.toggle("is-hidden", todos.length > 0);

    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " is-done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => {
        todo.done = checkbox.checked;
        saveTodos(todos);
        render();
      });

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "todo-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", "삭제");
      deleteBtn.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos(todos);
        render();
      });

      li.append(checkbox, span, deleteBtn);
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({ id: Date.now(), text, done: false });
    saveTodos(todos);
    input.value = "";
    render();
  });

  render();
}
