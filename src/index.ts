import '../assets/index.css';
import { addSpaceToString, adjustSpacing, getLeafElements } from './spacing';

function run($jq: JQuery) {
  $jq.each((_, element) => {
    const leaves = getLeafElements(element);
    leaves.forEach((leaf) => {
      adjustSpacing(leaf);
    });
  });
}

const SELECTOR = [
  '.mw-body-header', '#vector-sticky-header',
  '.skin-vector-2022 #vector-toc', '.mw-footer-container',
  '.mw-portlet',
].join(',');

function main() {
  document.title = addSpaceToString(document.title);
  run($(SELECTOR));
  ['wikipage.content', 'wikipage.categories'].forEach((i) => {
    mw.hook(i).add(run);
  });
}

// Only runs on article pages
if (
  mw.config.get('wgPageContentModel') === 'wikitext'
  && mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').special
) {
  $(main);
}
