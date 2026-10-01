// 代码面板的着色：一个很小的、够用的 TypeScript 分词器。纯函数，按行返回 [{ text, kind }]。
const KEYWORDS = new Set(
  'import from export const let return if else class extends function yield type static readonly new declare as async await for of in typeof'.split(' '),
);
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;

export function tokenizeLine(line) {
  const out = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = m;
    const kind = comment ? 'comment' : string ? 'string' : number ? 'number' : word && KEYWORDS.has(word) ? 'keyword' : word && /^[A-Z]/.test(word) ? 'type' : 'plain';
    const last = out.at(-1);
    if (last && last.kind === kind && kind === 'plain') last.text += text;
    else out.push({ text, kind });
  }
  return out;
}

export const linesOf = code => code.replace(/\s+$/, '').split('\n');

// 这一拍要高亮的行：包含任一锚点字符串的行。
export const highlighted = (lines, anchors) => new Set(lines.flatMap((l, i) => (anchors.some(a => l.includes(a)) ? [i] : [])));
