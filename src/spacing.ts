import queueDomMutation from './queue';
import { getNodeText, isInlineHTMLElement, isTextNode, isVisible, splitAtIndexes } from './util';

const REGEX_RANGE_CHINESE = '(?:[\\u2E80-\\u2E99\\u2E9B-\\u2EF3\\u2F00-\\u2FD5\\u3005\\u3007\\u3021-\\u3029\\u3038-\\u303B\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFA6D\\uFA70-\\uFAD9]|\\uD81B[\\uDFE2\\uDFE3\\uDFF0\\uDFF1]|[\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872\\uD874-\\uD879\\uD880-\\uD883][\\uDC00-\\uDFFF]|\\uD869[\\uDC00-\\uDEDF\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF38\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1\\uDEB0-\\uDFFF]|\\uD87A[\\uDC00-\\uDFE0]|\\uD87E[\\uDC00-\\uDE1D]|\\uD884[\\uDC00-\\uDF4A])';
const REGEX_RANGE_NON_CHINESE = '[A-Za-z0-9~$%^&*-+\\=|!;,.?±]';
const REGEX_STR_INTER_SCRIPT = `(?:(${REGEX_RANGE_CHINESE})(?=${REGEX_RANGE_NON_CHINESE})|(${REGEX_RANGE_NON_CHINESE})(?=${REGEX_RANGE_CHINESE}))`;

const THIN_SPACE = '\u2009';

const WRAPPER_CLASS = 'gadget-space';

const SELECTOR_ALLOWED = [
  'a', 'abbr', 'article', 'aside', 'b', 'bdi',
  'blockquote', 'button', 'caption', 'center', 'cite',
  'data', 'dd', 'del', 'details', 'dfn',
  'div', 'dt', 'em', 'figcaption', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5',
  'header', 'i', 'ins', 'label', 'legend',
  'li', 'main', 'mark', 'option', 'p',
  'q', 'ruby', 's', 'section', 'small',
  'span', 'strong', 'sub', 'summary', 'sup',
  'td', 'th', 'time', 'u',
];
const SELECTOR_BLOCKED = [
  'code', 'kbd', 'pre', 'rp', 'rt',
  'samp', 'textarea', 'var',
  // Elements with this class are excluded
  '.gadget-nospace',
  // Editable elements
  '[contenteditable="true"]',
  // ACE editor content
  '.ace_editor',
  // Visual Editor (and 2017 Wikitext Editor) content
  '.ve-ui-surface',
];

// FIXME: Use :is() in the future once it has better browser compatibility
const SELECTOR = SELECTOR_ALLOWED
  .map((allowed) => `${allowed}:not(${SELECTOR_BLOCKED
    .flatMap((blocked) =>
      // Not include itself if it is a tag selector
      blocked[0].match(/[a-z]/i) ? `${blocked} *` : [blocked, `${blocked} *`]
    )
    .join()})`)
  .join();

function getLeafElements(parent: HTMLElement): HTMLElement[] {
  const candidates = parent.querySelectorAll(SELECTOR) as NodeListOf<HTMLElement>;
  const result: HTMLElement[] = [];

  if (parent.matches(SELECTOR)) {
    result.push(parent);
  }

  for (const candidate of candidates) {
    for (const childNode of candidate.childNodes) {
      if (isTextNode(childNode)) {
        result.push(candidate);
        break;
      }
    }
  }

  return result;
}

function getNextVisibleSibling(node: Node): HTMLElement | Text | null {
  let currentNode = node;

  // Use loops rather than recursion for better performance
  while (true) {
    const candidate = currentNode.nextSibling;

    if (candidate === null) {
      const parent = currentNode.parentElement;
      if (parent === null) {
        // Parent is Document, so no visible sibling
        return null;
      }
      // Bubble up to its parent and get its sibling
      currentNode = parent;
      continue;
    }

    if (!(candidate instanceof HTMLElement || candidate instanceof Text)) {
      // Comments, SVGs, etc.: get its sibling as result
      currentNode = candidate;
      continue;
    }

    if (candidate instanceof HTMLElement) {
      if (!isVisible(candidate)) {
        // Invisible: recursively get this element's next sibling
        currentNode = candidate;
        continue;
      }

      if (!isInlineHTMLElement(candidate)) {
        // Next sibling is not inline (at next line), so no siblings
        return null;
      }
    }

    if (candidate instanceof Text && candidate.data.trim() === '') {
      // Skip empty Text nodes (e.g. line breaks)
      currentNode = candidate;
      continue;
    }

    return candidate;
  }
}

function createSpacingWrapper(str: string): [string, HTMLSpanElement] {
  const span = document.createElement('span');
  span.className = WRAPPER_CLASS;
  span.innerText = str.slice(-1);
  return [str.slice(0, -1), span];
}

function adjustSpacing(element: HTMLElement): void {
  // Freeze NodeList in advance
  const childNodes = [...element.childNodes];
  const textSpacingPosMap = new Map<Text, number[]>();

  for (const child of childNodes) {
    if (child instanceof Text) {
      const nextSibling = getNextVisibleSibling(child);

      let testString = getNodeText(child);
      if (nextSibling !== null) {
        // Append first character to detect script intersection
        testString += getNodeText(nextSibling)[0] ?? '';
      }

      const indexes: number[] = [];
      // Global regexps are stateful so do initialization in each loop
      const regexTextNodeData = new RegExp(REGEX_STR_INTER_SCRIPT, 'g');

      while (true) {
        const match = regexTextNodeData.exec(testString);
        if (match === null) {
          break;
        }
        indexes.push(match.index + 1); // +1 to match script boundary
      }

      if (indexes.length === 0) {
        // Optimization: skip further steps
        // Also prevent unnecessary mutation, which will be detected by MutationObserver,
        // resulting in infinite loops
        continue;
      }

      textSpacingPosMap.set(child, indexes);
    }
  }

  // Schedule DOM mutation to prevent forced reflows
  queueDomMutation(element, () => {
    for (const [node, indexes] of textSpacingPosMap) {
      const text = node.data;
      const fragments = splitAtIndexes(text, indexes);

      const replacement = fragments
        .slice(0, -1)
        .flatMap((fragment) => createSpacingWrapper(fragment));
      replacement.push(fragments.slice(-1)[0]);

      node.replaceWith(...replacement);
    }
  });
}

function addSpaceToString(str: string): string {
  const regex = new RegExp(REGEX_STR_INTER_SCRIPT, 'g');
  return str.replace(regex, `$1$2${THIN_SPACE}`);
}

export { getLeafElements, adjustSpacing, addSpaceToString, WRAPPER_CLASS };
