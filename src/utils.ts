/**
 * Add a style tag to the document
 * @param code
 */
export function insertStyleElement(code: string) {
  if (!window?.document) {
    return;
  }

  const style = document.createElement('style');
  style.innerHTML = code;
  window.document.head.appendChild(style);
}
