import { createCard } from './card.js'; // 확장자를 포함한 상대경로로 가져온다.
const posts = [{ id: 1, title: '모듈 첫 글' }, { id: 2, title: '함수로 나누기' }];
const selected = id => { document.getElementById('selected').textContent = `선택: ${id}`; };
document.getElementById('list').append(...posts.map(post => createCard(post, selected)));
