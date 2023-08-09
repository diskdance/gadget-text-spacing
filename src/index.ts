import '../assets/index.css';
import { adjustKerning, getLeafElements } from './kerning';

function run($jq: JQuery) {
  $jq.each((_, element) => {
    const leaves = getLeafElements(element);
    leaves.forEach((leave) => {
      adjustKerning(leave);
    });
  });
}

function main() {
  // Use .mw-page-title-main instead of #firstHeading for Vector 2022 sticky header
  run($('.mw-page-title-main'));
  // For Vector 2022 sticky TOC
  run($('.skin-vector-2022 #vector-toc'));
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
