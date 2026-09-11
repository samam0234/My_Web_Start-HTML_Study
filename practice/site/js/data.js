export async function renderSkills() {
  const list = document.getElementById("skills-list");
  if (!list) return;

  try {
    const response = await fetch("data/skills.json");
    const skills = await response.json();

    list.innerHTML = "";
    skills.forEach((skill) => {
      const li = document.createElement("li");
      li.textContent = `${skill.name} · ${skill.level}`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = "<li>목록을 불러오지 못했습니다.</li>";
    console.error(error);
  }
}
