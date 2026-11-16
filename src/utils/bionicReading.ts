/**
 * Bionic Reading — DOM Text-Node Swapper
 * Delegates pure word segmentation to @assistivereader/core.
 */

import { segmentBionicText } from '@assistivereader/core';

const BIONIC_ATTR = 'data-bionic-original';

export function applyBionicReading(container: HTMLElement): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre') {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest('[data-bionic-processed]')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const originalText = textNode.textContent;
    if (!originalText) continue;

    const span = document.createElement('span');
    span.setAttribute('data-bionic-processed', 'true');
    span.setAttribute(BIONIC_ATTR, originalText);

    const tokens = segmentBionicText(originalText);
    const fragment = document.createDocumentFragment();

    for (const tok of tokens) {
      if (tok.isWhitespace || !tok.bold) {
        fragment.appendChild(document.createTextNode(tok.raw));
        continue;
      }

      if (tok.leadingPunctuation) {
        fragment.appendChild(document.createTextNode(tok.leadingPunctuation));
      }

      const bold = document.createElement('b');
      bold.style.fontWeight = '800';
      bold.textContent = tok.bold;
      fragment.appendChild(bold);

      if (tok.normal) {
        fragment.appendChild(document.createTextNode(tok.normal));
      }
      if (tok.trailingPunctuation) {
        fragment.appendChild(document.createTextNode(tok.trailingPunctuation));
      }
    }

    span.appendChild(fragment);
    textNode.parentNode?.replaceChild(span, textNode);
  }
}

export function removeBionicReading(container: HTMLElement): void {
  const processed = container.querySelectorAll('[data-bionic-processed]');
  processed.forEach((el) => {
    const original = el.getAttribute(BIONIC_ATTR);
    if (original !== null) {
      const textNode = document.createTextNode(original);
      el.parentNode?.replaceChild(textNode, el);
    }
  });
}
