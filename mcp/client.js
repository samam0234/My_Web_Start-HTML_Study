import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const client = new Client({ name: 'study-client', version: '1.0.0' });
const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./server.js', import.meta.url))] });
try {
  await client.connect(transport); // initialize와 capabilities 교환은 SDK가 처리한다.
  console.log(JSON.stringify(await client.listTools(), null, 2));
  console.log(JSON.stringify(await client.callTool({ name: 'search_posts', arguments: { q: '', limit: 5 } }), null, 2));
} finally { await client.close(); }
