import { env } from './config';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import * as fs from 'fs'; // Import Node.js filesystem module

const pineconeClient = new Pinecone({
  apiKey: env.PINECONE_API_KEY
});

export async function embedAndStoreDocs(
  client: Pinecone,
  docs: Document<Record<string, any>>[]
) {
  try {
    const embeddings = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY
    });

    // Ensure each document's content is a string
    const sanitizedDocs = docs.map(doc => ({
      ...doc,
      content: typeof doc.content === 'string' ? doc.content : String(doc.content)
    }));

    // Embed and upsert documents in batches
    const batchSize = 100; // Set your preferred batch size
    for (let i = 0; i < sanitizedDocs.length; i += batchSize) {
      const batchDocs = sanitizedDocs.slice(i, i + batchSize);

      // Embed the documents
      const vectors = await embeddings.embedDocuments(batchDocs.map(doc => doc.content));

      // Prepare the upsert data for this batch
      const upsertData = batchDocs.map((doc, index) => ({
        id: doc.id,
        values: vectors[index]
      }));

      // Upsert the vectors into Pinecone (ensure upsertData is an array)
      await client.Index(env.PINECONE_INDEX_NAME).upsert(upsertData);

      console.log(`Batch ${i / batchSize + 1} of ${Math.ceil(sanitizedDocs.length / batchSize)} processed.`);
    }

    console.log('All documents successfully upserted into Pinecone');
  } catch (error) {
    console.log('Error:', error);

    // Write error message to a text file
    const errorMessage = `Error: ${error.message}\nStack trace:\n${error.stack}`;
    const filePath = 'error-log.txt';
    fs.writeFileSync(filePath, errorMessage);

    throw new Error('Failed to load your docs!'); // Rethrow the error
  }
}

export async function getVectorStore(client: Pinecone) {
  try {
    const embeddings = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY
    });
    const index = client.Index(env.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: 'content'
    });

    return vectorStore;
  } catch (error) {
    console.log('Error:', error);
    throw new Error('Something went wrong while getting vector store!');
  }
}
