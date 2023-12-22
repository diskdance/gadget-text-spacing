import '../assets/index.css';
import { WRAPPER_CLASS, addSpaceToString, adjustSpacing, getLeafElements } from './spacing';

function run(element: HTMLElement) {
  const leaves = getLeafElements(element);
  for (const leaf of leaves) {
    adjustSpacing(leaf);
  }
}

const mutationObserver = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type !== 'childList') {
      continue;
    }

    const nodes = [...record.addedNodes];

    // Exclude mutations caused by adjustSpacing() to prevent infinite loops
    // Typically they will contain nodes with class WRAPPER_CLASS
    if (
      nodes.some(
        (node) =>
          node instanceof HTMLElement && node.classList.contains(WRAPPER_CLASS),
      )
    ) {
      continue;
    }

    for (const node of nodes) {
      if (node instanceof HTMLElement) {
        run(node);
      } else if (node instanceof Text) {
        const { parentElement } = node;
        if (parentElement !== null) {
          run(parentElement);
        }
      }
    }
  }
});

function main() {
  document.title = addSpaceToString(document.title);
  // Watch for added nodes
  mutationObserver.observe(document.body, { subtree: true, childList: true });
  run(document.body);
}

$(main);
