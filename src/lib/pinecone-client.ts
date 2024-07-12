import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./config";
import { delay } from "./utils";

let pineconeClientInstance: Pinecone | null = null;

// Create index function
async function createIndex(pc: Pinecone, indexName: string) {
  try {
    await pc.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
        cloud: 'aws',
        region: 'us-east-1'
        }
      }
});
    console.log(
      `Waiting for ${env.INDEX_INIT_TIMEOUT} seconds for index initialization to complete...`
    );
    await delay(env.INDEX_INIT_TIMEOUT);
    console.log("Index created!!");
  } catch (error) {
    console.error("Error: ", error);
    throw new Error("Index creation failed");
  }
}

// Initialize Pinecone client and index
async function initPineconeClient() {
  try {
    const pineconeClient = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
    });
    const indexName = env.PINECONE_INDEX_NAME;
    const existingIndexes = await pineconeClient.listIndexes();
    
    // Check if existingIndexes and existingIndexes.indexes are defined
    if (existingIndexes && existingIndexes.indexes) {
      const indexExists = existingIndexes.indexes.some(index => index.name === indexName);
    
      if (!indexExists) {
        await createIndex(pineconeClient, indexName);
      } else {
        console.log("Your index already exists. Nice!!");
      }
    } else {
      // Handle case where existingIndexes or its indexes property is undefined
      console.log("Unable to fetch existing indexes. Check your Pinecone setup.");
      throw new Error("Failed to fetch existing indexes");
    }
    
    return pineconeClient;    
    
  } catch (error) {
    console.error("Error: ", error);
    throw new Error("Failed to initialize Pinecone client");
  }
}

// Function to get Pinecone client instance
export async function getPineconeClient() {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }

  return pineconeClientInstance;
}
