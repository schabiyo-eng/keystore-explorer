/** OS clipboard for sign oracles (`clipboardContains`). Not the cut/copy buffer. */

let clipboard = "";
let lastJwt = "";

export function getOsClipboard(): string {
  return clipboard;
}

export function setOsClipboard(text: string): void {
  clipboard = text;
}

export function clearOsClipboard(): void {
  clipboard = "";
}

export function getLastJwt(): string {
  return lastJwt;
}

export function setLastJwt(text: string): void {
  lastJwt = text;
}

export function resetSignState(): void {
  clipboard = "";
  lastJwt = "";
}
