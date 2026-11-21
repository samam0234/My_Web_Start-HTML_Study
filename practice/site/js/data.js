export async function renderSkills() {
  const list = document.getElementById("skills-list");
  if (!list) return;

  try {
    const response = await fetch("data/skills.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const skills = await response.json();
    if (!Array.isArray(skills)) throw new Error("관심 기술 목록 형식이 올바르지 않습니다.");

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
