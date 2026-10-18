import mammoth from 'mammoth';
import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: false });
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface ImportedDocument {
  text: string;
  html: string | null;
}

function markdownToText(source: string): string {
  const rendered = new DOMParser().parseFromString(markdown.render(source), 'text/html');
  const blockTags = new Set(['BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OL', 'P', 'PRE', 'TABLE', 'TD', 'TH', 'TR', 'UL']);
  let text = '';

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
      return;
    }
    if (!(node instanceof Element)) return;

    const tag = node.tagName;
    if (tag === 'BR') {
      text += '\n';
      return;
    }
    if (tag === 'IMG') {
      text += node.getAttribute('alt') ?? '';
      return;
    }

    const isBlock = blockTags.has(tag);
    if (isBlock && text && !text.endsWith('\n\n')) text += '\n\n';
    node.childNodes.forEach(visit);
    if (isBlock && text && !text.endsWith('\n\n')) text += '\n\n';
  };

  rendered.body.childNodes.forEach(visit);
  return text.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export async function readDocumentFile(file: File): Promise<ImportedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt' || (!extension && file.type === 'text/plain')) {
    return { text: await file.text(), html: null };
  }

  if (extension === 'md' || extension === 'markdown' || (!extension && file.type === 'text/markdown')) {
    const source = await file.text();
    return {
      text: markdownToText(source),
      html: markdown.render(source),
    };
  }

  if (extension === 'docx' || (!extension && file.type === DOCX_MIME)) {
    const arrayBuffer = await file.arrayBuffer();
    const [htmlResult, textResult] = await Promise.all([
      mammoth.convertToHtml({ arrayBuffer }),
      mammoth.extractRawText({ arrayBuffer }),
    ]);
    return { text: textResult.value, html: htmlResult.value };
  }

  throw new Error('Choose a PDF, Markdown, TXT, or DOCX document.');
}
