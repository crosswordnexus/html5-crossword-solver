/**
 * @file export.js
 * @description Handles exporting crossword puzzles to PDF (printing) or downloading as .ipuz files.
 */

export async function printPuzzle(e) {
  // fill JSXW
  this.fillJsXw();
  try {
    const doc = await this.jsxw.toPDF();
    doc.autoPrint();
    // open in a new tab and trigger print dialog
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  } catch (err) {
    console.error("PDF generation failed:", err);
  }
}

export function saveAsIpuz(e) {
  console.log(e);
  const json = window.ipuz; // this should be a JSON *string*

  // Create a Blob from the text
  const blob = new Blob([json], { type: "application/json" });

  // Create a temporary <a> element
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  // Try to sanitize the title for a filename
  let filename1 = this.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  if (!filename1) {
    // if this didn't work, revert to just "puzzle"
    filename1 = 'puzzle';
  }
  const filename = filename1 + '.ipuz';
  a.download = filename; // filename for the dialog

  // Trigger a click
  a.click();

  // Cleanup
  URL.revokeObjectURL(url);
}
