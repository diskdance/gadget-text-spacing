import queueDomMutation from './queue';
import { getNodeText, isInlineHTMLElement, isVisible, splitAtIndexes } from './util';

const REGEX_RANGE_CHINESE = '(?:[\\u2E80-\\u2E99\\u2E9B-\\u2EF3\\u2F00-\\u2FD5\\u3005\\u3007\\u3021-\\u3029\\u3038-\\u303B\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFA6D\\uFA70-\\uFAD9]|\\uD81B[\\uDFE2\\uDFE3\\uDFF0\\uDFF1]|[\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872\\uD874-\\uD879\\uD880-\\uD883][\\uDC00-\\uDFFF]|\\uD869[\\uDC00-\\uDEDF\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF38\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1\\uDEB0-\\uDFFF]|\\uD87A[\\uDC00-\\uDFE0]|\\uD87E[\\uDC00-\\uDE1D]|\\uD884[\\uDC00-\\uDF4A])';
const REGEX_RANGE_NON_CHINESE = '[A-Za-z0-9~$%^&*-+\\=|!;,.?±]';
const REGEX_STR_INTER_SCRIPT = `(?:(${REGEX_RANGE_CHINESE})(?=${REGEX_RANGE_NON_CHINESE})|(${REGEX_RANGE_NON_CHINESE})(?=${REGEX_RANGE_CHINESE}))`;

const THIN_SPACE = '\u2009';

const SELECTOR_ALLOWED = [
  'a', 'abbr', 'article', 'aside', 'b',
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
];

// FIXME: Use :is() in the future once it has better browser compatibility
const SELECTOR = SELECTOR_ALLOWED
  .map((allowed) => `${allowed}:not(${SELECTOR_BLOCKED
    .map((blocked) => `${blocked} *`) // Not a descendant of blocked elements
    .join(',')})`)
  .join(',');

function getLeafElements(parent: HTMLElement): HTMLElement[] {
  // Normalize at first so there is no adjacent text nodes
  parent.normalize();

  const candidates = parent.querySelectorAll(SELECTOR) as NodeListOf<HTMLElement>;
  const result: HTMLElement[] = [];

  if (parent.matches(SELECTOR)) {
    result.push(parent);
  }

  for (const candidate of candidates) {
    if (!isVisible(candidate)) {
      continue;
    }

    for (const childNode of candidate.childNodes) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        result.push(candidate);
        break;
      }
    }
  }

  return result;
}

function getNextVisibleSibling(node: Node): HTMLElement | Text | null {
  const candidate = node.nextSibling;

  if (candidate === null) {
    const parent = node.parentElement;
    if (parent === null) {
      // Parent is Document, so no visible sibling
      return null;
    }
    // Bubble up to its parent and get its sibling
    return getNextVisibleSibling(parent);
  }

  if (!(candidate instanceof HTMLElement || candidate instanceof Text)) {
    // Comments, SVGs, etc.: get its sibling as result
    return getNextVisibleSibling(candidate);
  }

  if (candidate instanceof HTMLElement) {
    if (!isVisible(candidate)) {
      // Invisible: recursively get this element's next sibling
      return getNextVisibleSibling(candidate);
    }

    if (!isInlineHTMLElement(candidate)) {
      // Next sibling is not inline, ignore it
      return null;
    }
  }

  if (candidate instanceof Text && candidate.data.trim() === '') {
    // Skip empty Text nodes (e.g. line breaks)
    return getNextVisibleSibling(candidate);
  }

  return candidate;
}

function createSpacingWrapper(str: string): [string, HTMLSpanElement] {
  const span = document.createElement('span');
  span.className = 'gadget-space';
  span.innerText = str.slice(-1);
  return [str.slice(0, -1), span];
}

function adjustSpacing(element: HTMLElement): void {
  // Freeze NodeList in advance
  const childNodes = [...element.childNodes];
  const textKerningPosMap = new Map<Text, number[]>();

  for (const child of childNodes) {
    if (child instanceof Text) {
      const nextSibling = getNextVisibleSibling(child);

      let testString = getNodeText(child);
      if (nextSibling !== null) {
        // Append first character to detect script intersection
        testString += getNodeText(nextSibling)[0];
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

      textKerningPosMap.set(child, indexes);
    }
  }

  // Schedule DOM mutation to prevent forced reflow
  queueDomMutation(element, () => {
    for (const [node, indexes] of textKerningPosMap) {
      const text = node.data;
      const fragments = splitAtIndexes(text, indexes);

      const replacement = fragments
        .slice(0, -1)
        .map((fragment) => createSpacingWrapper(fragment))
        .flat();
      replacement.push(fragments.slice(-1)[0]);

      node.replaceWith(...replacement);
    }
  });
}

function addSpaceToString(str: string): string {
  const regex = new RegExp(REGEX_STR_INTER_SCRIPT, 'g');
  return str.replace(regex, `$1$2${THIN_SPACE}`);
}

export { getLeafElements, adjustSpacing, addSpaceToString };
