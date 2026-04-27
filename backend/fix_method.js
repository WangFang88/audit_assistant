const fs = require('fs');
let content = fs.readFileSync('src/modules/documents/documents.service.ts', 'utf8');

const newMethod = `  private buildChunksFromRawText(document: DocumentRecord, rawText: string): DocumentChunkRecord[] {
    const normalizedText = rawText.replace(/\\r/g, '').trim();

    // \u6309\u7ae0\u3001\u8282\u3001\u6761\u8fb9\u754c\u5207\u5206
    const rawSegments = normalizedText
      .split(/(?=\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u5343\\d]+[\u7ae0\u8282\u6761\u6b3e])/)
      .map((s) => s.replace(/[ \\t]+/g, ' ').trim())
      .filter((s) => s.length >= 10);

    // \u8d85\u8fc7 500 \u5b57\u518d\u6309\u53e5\u5b50\u7ec6\u5206
    const segments: string[] = [];
    for (const seg of rawSegments) {
      if (seg.length <= 500) {
        segments.push(seg);
      } else {
        const subSegs = seg.split(/(?<=[\\u3002\\uff1b\\uff01\\uff1f])\\s*/).filter((s) => s.length >= 10);
        let current = '';
        for (const sub of subSegs) {
          if ((current + sub).length > 500 && current.length > 0) {
            segments.push(current.trim());
            current = sub;
          } else {
            current += sub;
          }
        }
        if (current.trim().length >= 10) segments.push(current.trim());
      }
    }

    if (segments.length === 0) return [];

    const titleKeywords = document.title
      .replace(/[()\\uff08\\uff09_.\\/-]+/g, ' ')
      .split(/[\\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2);

    let currentChapter = '';

    return segments.map((segment, index) => {
      const chapterMatch = segment.match(/^\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u5343\\d]+\u7ae0[^\\n\\uff0c\\u3002\\uff1b]*/);
      if (chapterMatch) currentChapter = chapterMatch[0];
      const articleMatch = segment.match(/^\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u5343\\d]+\u6761/);
      const sentenceKeywords = Array.from(
        new Set(
          segment
            .replace(/[\\uff0c\\u3002\\uff1b\\uff1a\\u3001\\u201c\\u201d\\u2018\\u2019\\uff08\\uff09()\\u3010\\u3011\\[\\]\\-]/g, ' ')
            .split(/[\\s]+/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 2)
            .slice(0, 10),
        ),
      );

      return {
        id: this.buildImportedChunkId(document.id, index),
        documentId: document.id,
        groupId: document.groupId,
        libraryType: document.libraryType,
        title: document.title,
        chapterTitle: currentChapter || ('\u7b2c' + (index + 1) + '\u6bb5'),
        articleRef: articleMatch?.[0] ?? ('\u7b2c' + (index + 1) + '\u6761'),
        pageLabel: '\u7b2c ' + (index + 1) + ' \u6bb5',
        content: segment,
        keywords: Array.from(new Set([...titleKeywords, ...sentenceKeywords])),
        indexStatus: 'ready',
      };
    });
  }`;

// Replace the method
const methodRegex = /  private buildChunksFromRawText\(document: DocumentRecord, rawText: string\): DocumentChunkRecord\[\] \{[\s\S]*?\n  \}/;
content = content.replace(methodRegex, newMethod);
fs.writeFileSync('src/modules/documents/documents.service.ts', content, 'utf8');
console.log('done');
