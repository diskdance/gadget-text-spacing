function isInlineHTMLElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement
    && window.getComputedStyle(node).display.includes('inline');
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none'
    && !['hidden', 'collapse'].includes(style.visibility)
    && parseFloat(style.opacity) > 0;
}

function getNodeText(node: HTMLElement | Text): string {
  return node instanceof HTMLElement ? node.innerText : node.data;
}

/**
 * Split a string before an array of indexes.
 *
 * For example,
 * ```
 * splitAtIndexes('123456789', [3, 5, 7]);
 * ```
 * results in
 * ```
 * ['123', '45', '67', '89']
 * ```
 *
 * Note that empty string are included:
 * ```
 * splitAtIndexes('123456789', [0, 9]);
 * ```
 * results in
 * ```
 * ['', '123456789', '']
 * ```
 *
 * Indexes that are negative or greater than the length of the string are ignored.
 *
 * @param str string to split
 * @param indexes indexes
 * @returns splitted string fragments
 */
function splitAtIndexes(str: string, indexes: number[]): string[] {
  const result = [];
  const normalizedIndexes = [
    // Remove duplications and sort in ascending order
    ...new Set(
      indexes
        .sort((a, b) => a - b)
        .filter((i) => i >= 0 && i <= str.length)
    ),
    str.length,
  ];

  for (let i = 0; i < normalizedIndexes.length; i++) {
    const slice = str.slice(normalizedIndexes[i - 1], normalizedIndexes[i]);
    result.push(slice);
  }

  return result;
}

export {
  isInlineHTMLElement,
  isTextNode,
  isVisible,
  getNodeText,
  splitAtIndexes,
};
