export function createCard(post, onSelect) { // 객체와 콜백을 인자로 받는다.
  const item = document.createElement('li'); // 목록 한 항목을 만든다.
  const button = document.createElement('button'); // 키보드로도 조작할 수 있는 버튼이다.
  button.textContent = post.title; // 외부 문자열을 HTML로 해석하지 않는다.
  button.addEventListener('click', () => onSelect(post.id)); // 부모가 준 콜백으로 선택 정보를 돌려준다.
  item.append(button); // 부모 DOM에 자식을 연결한다.
  return item; // 진입점이 실제 삽입 위치를 결정한다.
}
