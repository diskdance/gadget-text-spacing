function isInlineHTMLElement(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && window.getComputedStyle(node).display === 'inline';
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export { isInlineHTMLElement, isTextNode };
