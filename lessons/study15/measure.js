// 여러 번 측정하여 한 번의 우연한 지연을 줄인다.
const samples = [];
for (let index = 0; index < 20; index++) {
  const start = performance.now();
  const response = await fetch(`${process.env.MEASURE_URL || 'http://localhost:3000'}/api/posts?limit=10`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await response.arrayBuffer(); // 본문 수신까지 포함한다.
  samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
console.log(JSON.stringify({ requests: samples.length, medianMs: samples[9], p95Ms: samples[18] }));
