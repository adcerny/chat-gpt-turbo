(() => {
  const MESSAGE_SELECTOR = [
    'div[data-message-id]',
    'article[data-message-id]',
    'div[data-testid^="conversation-turn"]',
    'li[data-testid^="conversation-turn"]'
  ].join(',');

  const DOM_TRIM_ATTRIBUTE = 'data-dom-trimmed';
  const RENDER_LIMIT = 12;
  const STYLE_ID = 'dom-trimmer-style';

  let scheduled = false;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .dom-trimmer-node { background: var(--gray-50, #f5f5f5); border-radius: 12px; margin: 0.5rem 0; padding: 0.75rem; }
      .dom-trimmer-node details { cursor: pointer; }
      .dom-trimmer-node summary { font-weight: 600; color: #444; }
      .dom-trimmer-node pre { white-space: pre-wrap; margin: 0.5rem 0 0; font: inherit; color: #111; }
      .dom-trimmer-indicator { position: fixed; top: 12px; right: 12px; z-index: 9999; background: #111827; color: #f9fafb; padding: 10px 14px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-size: 12px; line-height: 1.4; max-width: 240px; }
      .dom-trimmer-indicator strong { display: block; font-size: 13px; margin-bottom: 4px; }
    `;

    document.head.appendChild(style);
  }

  function createIndicator() {
    let indicator = document.querySelector('.dom-trimmer-indicator');
    if (indicator) return indicator;

    indicator = document.createElement('div');
    indicator.className = 'dom-trimmer-indicator';
    indicator.innerHTML = `
      <strong>DOM Trimmer active</strong>
      Collapsing older messages to keep memory usage lower.
    `;

    document.body.appendChild(indicator);
    return indicator;
  }

  function updateIndicator(total, collapsed) {
    const indicator = createIndicator();
    indicator.innerHTML = `
      <strong>DOM Trimmer active</strong>
      ${collapsed} of ${total} messages collapsed to text-only view. Keeping the latest ${RENDER_LIMIT} expanded.
    `;
  }

  function simplifyNode(node, index) {
    if (node.getAttribute(DOM_TRIM_ATTRIBUTE)) return true;

    const text = node.innerText.trim();
    const summaryText = text.split('\n').find(Boolean) || 'Collapsed message';

    const placeholder = document.createElement('div');
    placeholder.classList.add('dom-trimmer-node');
    placeholder.setAttribute(DOM_TRIM_ATTRIBUTE, 'true');

    const details = document.createElement('details');
    details.open = false;

    const summary = document.createElement('summary');
    summary.textContent = `Collapsed message #${index + 1}: ${summaryText.slice(0, 120)}`;
    details.appendChild(summary);

    const pre = document.createElement('pre');
    pre.textContent = text || '[Empty message content]';
    details.appendChild(pre);

    placeholder.appendChild(details);

    // Replace the original node entirely so the heavy subtree can be garbage-collected.
    node.replaceWith(placeholder);
    return true;
  }

  function trimMessages() {
    const nodes = Array.from(document.querySelectorAll(MESSAGE_SELECTOR));
    if (!nodes.length) return;

    const total = nodes.length;
    let collapsed = 0;

    nodes.forEach((node, idx) => {
      const shouldCollapse = idx < total - RENDER_LIMIT;
      if (shouldCollapse) {
        if (simplifyNode(node, idx)) collapsed += 1;
      }
    });

    updateIndicator(total, collapsed);
  }

  function scheduleTrim() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      trimMessages();
    });
  }

  function init() {
    ensureStyles();
    scheduleTrim();

    const isComposerMutation = (mutation) => {
      const target = mutation.target;
      if (!target) return false;
      return Boolean(
        target.closest?.('textarea, form textarea, [data-testid="textbox"], [contenteditable="true"]')
      );
    };

    const observer = new MutationObserver((mutations) => {
      // Ignore mutations confined to the input/composer to avoid keystroke lag.
      const onlyComposer = mutations.every(isComposerMutation);
      if (onlyComposer) return;
      scheduleTrim();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
