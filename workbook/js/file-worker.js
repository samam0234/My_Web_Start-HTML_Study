// 큰 파일의 검사/해독을 메인 UI 스레드에서 분리한다.
self.onmessage = async ({ data: file }) => {
  try {
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 60000) throw new Error('TXT·MD 60KB 이하만 허용합니다.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (!text.trim() || text.length > 20000) throw new Error('문서는 1~20000자여야 합니다.');
    self.postMessage({ filename: file.name, text });
  } catch (error) { self.postMessage({ error: error.message }); }
};
