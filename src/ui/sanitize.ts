// Untrusted text (model output, tool results, file contents) can contain
// terminal escape sequences that recolor, move the cursor, clear the screen
// or set the window title. Strip them before rendering.

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the purpose
const OSC = /\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)?/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the purpose
const CSI = /(?:\x1b\[|\x9b)[0-?]*[ -/]*[@-~]/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the purpose
const ESC = /\x1b[@-_]?/g;
// C0 controls except tab and newline, DEL, and C1 controls
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the purpose
const CONTROL = /[\x00-\x08\x0b-\x1f\x7f-\x9f]/g;

export function stripControlChars(text: string): string {
  return text
    .replace(OSC, "")
    .replace(CSI, "")
    .replace(ESC, "")
    .replace(CONTROL, "");
}
