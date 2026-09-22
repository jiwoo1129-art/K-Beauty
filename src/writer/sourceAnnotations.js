const numberedStatuses = new Set(['VIOLATION', 'NEEDS_EVIDENCE']);

export function buildSourceAnnotations(rawSource = '', segments = []) {
  let cursor = 0;
  let issueNumber = 0;
  const ranges = [];

  for (const segment of segments) {
    const text = String(segment.source_text || '');
    const number = numberedStatuses.has(segment.status) ? ++issueNumber : null;
    if (!text) continue;
    const start = rawSource.indexOf(text, cursor);
    if (start < 0) continue;
    cursor = start + text.length;
    ranges.push({ start, end: cursor, text, status: segment.status || 'NOT_APPLICABLE', number, segment });
  }

  return ranges;
}

