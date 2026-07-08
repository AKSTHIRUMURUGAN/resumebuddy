import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function parsePdf(fileBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(fileBuffer);
    return data.text || "";
  } catch (error) {
    console.error("Error parsing PDF document:", error);
    throw new Error("Failed to parse PDF document");
  }
}

export async function parseDocx(fileBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value || "";
  } catch (error) {
    console.error("Error parsing DOCX document:", error);
    throw new Error("Failed to parse DOCX document");
  }
}

export async function parseDocument(fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    return parsePdf(fileBuffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType.includes("docx") ||
    mimeType.includes("msword")
  ) {
    return parseDocx(fileBuffer);
  } else if (mimeType.startsWith("text/")) {
    return fileBuffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported document type: ${mimeType}`);
  }
}
