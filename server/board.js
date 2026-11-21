import { fail } from './errors.js';
const authorView = user => ({ id: user.id, nickname: user.nickname });

// 요청 처리와 저장소를 나누어 같은 규칙을 네 가지 DB에 적용한다.
export function createBoard(repo) {
  const mustGet = async (kind, id) => {
    const row = await repo.get(kind, id);
    if (!row) fail(404, 'NOT_FOUND', '자료가 없습니다.');
    return row;
  };
  const own = (row, user) => { if (row.authorId !== user.id) fail(403, 'FORBIDDEN', '작성자만 변경할 수 있습니다.'); };
  const present = async post => {
    const { authorId, ...data } = post;
    return { ...data, author: authorView(await mustGet('users', authorId)), commentCount: (await repo.list('comments')).filter(c => c.postId === post.id).length };
  };
  return {
    async list(query) {
      const page = Math.max(1, Number.parseInt(query.get('page') || '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(query.get('limit') || '10', 10) || 10));
      const q = (query.get('q') || '').slice(0, 200);
      const sort = query.get('sort') || '-createdAt';
      if (!['createdAt', '-createdAt', '-commentCount'].includes(sort)) fail(400, 'BAD_REQUEST', '지원하지 않는 정렬입니다.');
      const posts = await Promise.all((await repo.list('posts')).filter(p => `${p.title} ${p.body}`.toLowerCase().includes(q.toLowerCase())).map(present));
      posts.sort((a, b) => sort === '-commentCount' ? b.commentCount - a.commentCount || b.id - a.id : sort === 'createdAt' ? a.createdAt.localeCompare(b.createdAt) || a.id - b.id : b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      return { data: posts.slice((page - 1) * limit, page * limit), meta: { page, limit, total: posts.length, totalPages: Math.ceil(posts.length / limit), q } };
    },
    get: async id => present(await mustGet('posts', id)),
    async create(value, user) {
      const now = new Date().toISOString();
      return present(await repo.create('posts', { ...value, authorId: user.id, createdAt: now, updatedAt: now }));
    },
    async patch(id, value, user) {
      const post = await mustGet('posts', id);
      own(post, user);
      return present(await repo.put('posts', id, { ...post, ...value, updatedAt: new Date().toISOString() }));
    },
    async delete(id, user) {
      own(await mustGet('posts', id), user);
      for (const row of await repo.list('comments')) if (row.postId === id) await repo.delete('comments', row.id);
      await repo.delete('posts', id);
    },
    async comments(id) {
      await mustGet('posts', id);
      return Promise.all((await repo.list('comments')).filter(c => c.postId === id).map(async ({ authorId, ...c }) => ({ ...c, author: authorView(await mustGet('users', authorId)) })));
    },
    async comment(id, value, user) {
      await mustGet('posts', id);
      const row = await repo.create('comments', { ...value, postId: id, authorId: user.id, createdAt: new Date().toISOString() });
      const { authorId, ...data } = row;
      return { ...data, author: authorView(user) };
    },
    async deleteComment(id, user) {
      own(await mustGet('comments', id), user);
      await repo.delete('comments', id);
    },
  };
}
