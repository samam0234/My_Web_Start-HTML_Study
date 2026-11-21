import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const base = process.env.MCP_API_BASE || 'http://localhost:3000'; // 서버 운영자가 정한 주소만 사용한다.
const server = new McpServer({ name: 'vanilla-board', version: '1.0.0' });
server.registerTool('search_posts', { description: '공개 게시판에서 제목·본문을 검색한다. 읽기 전용.', inputSchema: { q: z.string().max(200), limit: z.number().int().min(1).max(10).default(5) } }, async ({ q, limit }) => {
  const query = new URLSearchParams({ q, limit: String(limit) });
  const response = await fetch(`${base}/api/posts?${query}`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return { isError: true, content: [{ type: 'text', text: '게시판 연결 실패' }] };
  return { content: [{ type: 'text', text: JSON.stringify(await response.json()) }] };
});
// stdout은 MCP JSON-RPC 전용이다. 진단 로그는 console.error를 사용한다.
await server.connect(new StdioServerTransport());
