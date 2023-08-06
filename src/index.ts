import scheduleDomMutation from './mutation';
import { isInlineHTMLElement, isTextNode } from './util';

const REGEX_RANGE_CHINESE = '(?:[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFA6D\uFA70-\uFAD9]|\uD81B[\uDFE2\uDFE3\uDFF0\uDFF1]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])';
const REGEX_RANGE_NON_CHINESE = '[A-Za-z0-9~$%^&*-+\\=|!;,.?±]';

const REGEX_SRC_INTER_SCRIPT = `(?:(${REGEX_RANGE_NON_CHINESE})(${REGEX_RANGE_CHINESE})|(${REGEX_RANGE_CHINESE})(${REGEX_RANGE_NON_CHINESE}))`;

const STYLESHEET = `
.gadget-autospace{
  user-select: none;
  -webkit-user-select: none;
  margin-right: 0.125em;
}`;

const SELECTOR_OBSERVABLE = [
  'p', 'b', 'i', 's', 'a',
  'u', 'h1', 'h2', 'h3',
  'h4', 'h5', 'div', 'span',
  'td', 'th', 'small', 'li',
].join(',');
const SELECTOR_IGNORE = ['pre', 'code', ':not(:lang(zh))'].join(',');

function createSpaceElement(): HTMLSpanElement {
  const result = document.createElement('span');
  result.className = 'gadget-autospace';
  result.textContent = '';
  return result;
}

function addSpaceInTextNode(observee: Element, textNode: Text) {
  const text = textNode.data;
  const indexes: number[] = [];

  const regex = new RegExp(REGEX_SRC_INTER_SCRIPT, 'g');
  while (true) {
    const match = regex.exec(text);
    if (match === null) {
      break;
    }
    regex.lastIndex = match.index + 1; // For overlapping results
    indexes.unshift(match.index); // Insert at beginning to avoid unexpected index changes
  }

  indexes.forEach((index) => {
    scheduleDomMutation(observee, () => {
      const newNode = textNode.splitText(index + 1);
      newNode.before(createSpaceElement());
    });
  });
}


function addSpaceBetweenNodes(
  observee: HTMLElement,
  sibling: HTMLElement | Text,
  isBefore: boolean,
): void {
  const before = isBefore ? sibling : observee;
  const after = isBefore ? observee : sibling;
  const beforeText = before instanceof HTMLElement ? before.innerText : before.data;
  const afterText = after instanceof HTMLElement ? after.innerText : after.data;
  if (beforeText === '' || afterText === '') {
    return;
  }

  const testString = beforeText.slice(-1) + afterText[0];
  if (new RegExp(`^${REGEX_SRC_INTER_SCRIPT}$`).test(testString)) {
    scheduleDomMutation(observee, () => {
      // Get its sibling again because it can be changed due to addSpaceInTextNode
      if (isBefore) {
        observee.previousSibling?.after(createSpaceElement());
      } else {
        observee.nextSibling?.before(createSpaceElement());
      }
    });
  }
}

/**
 * Add space to all leaf or leaf-containing descendant elements of the parent element.
 *
 * Leaf elements are those who:
 * 1. Have only one child and are not the only child of its parent; or
 * 2. Have any text node as its child
 *
 * For instance, in
 * ```html
 * <span id="1"><span id="2">维基百科</span></span><span id="3">Wikipedia维基百科<span>
 * <span id="4"><span id="5">维基百科</span><span id="6">Wikipedia</span></span>
 * ```
 * `#1`, `#3`, `#5`, `#6` are considered leaf elements. (`#2` is not!)
 *
 * @param $container container element
 */
function addSpaceToElements($container: JQuery) {
  const element = $container[0];
  // Use spread syntax to freeze NodeList
  const ignoredElements = [...element.querySelectorAll(SELECTOR_IGNORE)] as HTMLElement[];
  const observableElements = [...element.querySelectorAll(SELECTOR_OBSERVABLE), element]
    .filter(
      // Filter out elements which are descendants of ignored elements
      (i) => ignoredElements.every((j) => !j.contains(i)),
    ) as HTMLElement[];

  const leafElements = observableElements.filter((i) =>
    (i.childNodes.length === 1 && i.parentNode?.childNodes.length !== 1)
    || [...i.childNodes].some((j) => j.nodeType === Node.TEXT_NODE)
  );
  leafElements.forEach((leafElement) => {
    // leafElement.setAttribute('style', 'border:1px solid #000');

    [...leafElement.childNodes].forEach((childNode) => {
      if (childNode instanceof Text) {
        addSpaceInTextNode(leafElement, childNode);
      }
    });

    const before = leafElement.previousSibling;
    const after = leafElement.nextSibling;

    if (before !== null && (isInlineHTMLElement(before) || isTextNode(before))) {
      addSpaceBetweenNodes(leafElement, before, true);
    }
    if (after !== null && (isInlineHTMLElement(after) || isTextNode(after))) {
      addSpaceBetweenNodes(leafElement, after, false);
    }
  });
}

function addSpaceToTitle() {
  // U+2009 stands for thin space
  document.title = document.title.replace(new RegExp(REGEX_SRC_INTER_SCRIPT, 'g'), '$1$3\u2009$2$4');
}

function main() {
  addSpaceToTitle();
  mw.util.addCSS(STYLESHEET);

  addSpaceToElements($('#firstHeading'));
  ['wikipage.content', 'wikipage.categories'].forEach((i) => {
    mw.hook(i).add(addSpaceToElements);
  });
}

// Only runs on article pages
if (
  mw.config.get('wgPageContentModel') === 'wikitext'
  && mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').special
) {
  $(main);
}
