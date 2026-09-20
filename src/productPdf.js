const LABELS = {
  brand: ['브랜드명', 'brand'], productName: ['제품명', 'product name'],
  category: ['제품 유형', 'product type'], netContents: ['용량', 'net contents'],
  origin: ['원산지', 'country of origin'], ingredients: ['주요 성분', 'ingredients'],
  benefits: ['주요 특징', 'benefits'], texture: ['제형 및 사용감', 'texture'],
  audience: ['주요 고객', 'target customer'], directions: ['사용 방법', 'directions'],
  warnings: ['주의 사항', 'warnings'], brandTone: ['브랜드 톤', 'brand tone'],
  primaryKeyword: ['핵심 키워드', 'primary keyword'], keywords: ['추가 키워드', 'keywords'],
  evidence: ['효능 표현의 근거', '효능 근거', 'evidence'],
};

export function inferProductFacts(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return Object.fromEntries(Object.entries(LABELS).flatMap(([key, labels]) => {
    const line = lines.find((value) => labels.some((label) => value.toLowerCase().startsWith(label.toLowerCase())));
    const value = line?.replace(/^[^:：]+[:：]\s*/, '').trim();
    return value && value !== line ? [[key, value]] : [];
  }));
}

export async function extractPdfText(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => `${item.str}${item.hasEOL ? '\n' : ' '}`).join('').trim());
  }
  return pages.join('\n');
}
