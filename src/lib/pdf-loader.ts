import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { env } from "./config";

export async function getChunkedDocsFromPDF() {
  try {
    const loader = new PDFLoader(env.PDF_PATH);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);

    // Add unique IDs to each chunk
    const chunkedDocsWithId = chunkedDocs.map((doc, index) => ({
      ...doc,
      id: `chunk_${index + 1}`,
    }));

    return chunkedDocsWithId;
  } catch (e) {
    console.error(e);
    throw new Error("PDF docs chunking failed!");
  }
}
