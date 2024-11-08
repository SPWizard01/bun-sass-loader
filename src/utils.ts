/**
 * Add a style tag to the document
 * @param code
 */
export function insertStyleElement(code: string, selector?: string) {
  if (!window?.document) {
    return;
  }

  const style = window.document.createElement("style");
  style.innerHTML = code;
  if (selector) {
    const result = window.document.querySelector(selector)
    style.setAttribute("data-bun-selector", selector);
    if (result) {
      result.appendChild(style);
      return;
    }
  }
  window.document.head.appendChild(style);
}
