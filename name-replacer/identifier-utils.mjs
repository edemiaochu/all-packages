/**
 * ── 标识符提取工具（search-ec / search-sensitive 共用）──
 *
 * 标识符正则不允许数字开头，数字 / 十六进制字面量会被从第一个字母处截断：
 *
 *   0x56EC000   →  x56EC000     （前导 0 丢失，EC 又被当成缩写 token 提取）
 *   #56EC000    →  EC000        （CSS 颜色）
 *   \xEC        →  xEC          （转义序列）
 *
 * 这些命中不是标识符，参与替换只会改坏常量 / 颜色值，必须在提取阶段跳过。
 */

const IDENTIFIER_RE = /[A-Za-z_$][\w$]*/g;

// CSS 颜色只可能是 3/4/6/8 位十六进制（#fff / #ffff / #ffffff / #ffffffff）
const HEX_COLOR_LENGTHS = new Set([3, 4, 6, 8]);

/**
 * 判断匹配位置是否属于字面量片段（数字 / 十六进制 / 转义），而不是真正的标识符。
 * @param {string} text 完整文本
 * @param {number} index 匹配起始下标
 * @returns {boolean}
 */
export function isLiteralFragment(text, index) {
  const prev = index > 0 ? text[index - 1] : '';

  // 0x56EC000 / 0b1010 / 0o777 / 123abc / #56EC000：前一个字符是数字
  if (/\d/.test(prev)) return true;

  // CSS/SCSS 颜色 #EC0000（#ECClass 这种非全十六进制的仍按标识符处理）
  if (prev === '#') {
    let end = index;
    while (end < text.length && /[0-9A-Fa-f]/.test(text[end])) end++;
    if (HEX_COLOR_LENGTHS.has(end - index)) return true;
  }

  // 转义序列 \xEC / \u56EC 的十六进制部分（"C:\\ECClass" 这类路径不受影响）
  if (prev === '\\' && (text[index] === 'x' || text[index] === 'u')) return true;

  return false;
}

/**
 * 从文本中提取标识符，跳过数字 / 十六进制 / 转义字面量片段。
 * @param {string} text
 * @returns {string[]}
 */
export function extractIdentifiers(text) {
  const out = [];
  for (const m of text.matchAll(IDENTIFIER_RE)) {
    if (isLiteralFragment(text, m.index)) continue;
    out.push(m[0]);
  }
  return out;
}
