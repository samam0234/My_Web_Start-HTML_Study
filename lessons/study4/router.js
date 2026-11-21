function route() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?'); // fragment를 화면 경로로 사용한다.
  const params = new URLSearchParams(query); // 검색 문자열을 안전하게 해독한다.
  const match = path.match(/^\/posts\/([1-9]\d*)$/); // 동적 id 구간을 추출한다.
  const title = path === '/' ? '홈' : match ? `글 ${match[1]} · 검색어 ${params.get('q') || ''}` : '404: 페이지 없음';
  document.getElementById('page').textContent = title; // 경로마다 표시를 바꾼다.
}
window.addEventListener('hashchange', route); // 뒤로 가기/앞으로 가기도 감지한다.
route(); // 첫 주소도 처리한다.
