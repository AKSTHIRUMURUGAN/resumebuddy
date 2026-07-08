const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const path = require("path");

try {
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.js");
  console.log("workerSrc set successfully to:", pdfjs.GlobalWorkerOptions.workerSrc);
} catch (err) {
  console.error("Failed to resolve worker:", err);
}
