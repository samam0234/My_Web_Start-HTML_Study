const skills = ['HTML', 'CSS', 'JavaScript']; // 배열은 순서 있는 목록이다.
const learner = { name: '학습자', count: skills.length }; // 객체는 이름 있는 값을 묶는다.
function greet(name) { return `${name}님, ${learner.count}가지 기술을 배웁니다.`; } // 템플릿 리터럴이다.
const output = document.getElementById('greeting'); // HTML 요소를 DOM 객체로 찾는다.
output.textContent = greet(learner.name); // 문자열을 안전하게 화면에 표시한다.
document.getElementById('hello-form').addEventListener('submit', event => {
  event.preventDefault(); // 기본 폼 탐색을 막는다.
  const name = new FormData(event.currentTarget).get('name').trim(); // 이름으로 입력값을 읽는다.
  output.textContent = greet(name); // 함수 결과를 다시 화면에 반영한다.
});
