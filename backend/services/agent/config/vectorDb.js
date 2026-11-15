import crypto from "crypto";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import dotenv from "dotenv";
dotenv.config();

// Global cache for in-memory collections (keyed by SHA-256 doc hash)
const memoryCollectionCache = new Map();

/**
 * Computes deterministic SHA-256 fingerprint for uploaded document buffer
 */
export const computeDocHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 32);
};

/**
 * Resilient In-Memory Vector Store fallback if Qdrant Cloud is unreachable / suspended
 */
export class ResilientMemoryVectorStore {
  constructor(embeddingsInstance) {
    this.embeddings = embeddingsInstance || embeddings;
    this.documents = [];
    this.vectors = [];
  }

  static async fromDocuments(docs, embeddingsInstance) {
    const store = new ResilientMemoryVectorStore(embeddingsInstance);
    await store.addDocuments(docs);
    return store;
  }

  async addDocuments(docs) {
    if (!docs || docs.length === 0) return;
    const texts = docs.map((d) => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    this.documents.push(...docs);
    this.vectors.push(...vectors);
  }

  static cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  async similaritySearch(query, k = 10) {
    if (this.documents.length === 0) return [];
    const queryVector = await this.embeddings.embedQuery(query);
    const scored = this.documents.map((doc, idx) => ({
      doc,
      score: ResilientMemoryVectorStore.cosineSimilarity(queryVector, this.vectors[idx]),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s) => s.doc);
  }
}

/**
 * Reciprocal Rank Fusion (RRF) Re-ranking
 * Merges dense semantic similarity rank and BM25/lexical keyword rank
 */
export const hybridRerank = (candidateDocs, query, topK = 4) => {
  if (!candidateDocs || candidateDocs.length === 0) return [];
  if (candidateDocs.length <= topK) return candidateDocs;

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // 1. Lexical Scoring (Keyword frequency & match density)
  const lexicalScored = candidateDocs.map((doc, originalIdx) => {
    const text = (doc.pageContent || "").toLowerCase();
    let matchCount = 0;
    let exactPhraseBonus = 0;

    if (text.includes(query.toLowerCase())) {
      exactPhraseBonus = 5;
    }

    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${term}\\b`, "g");
      const matches = text.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
    }

    return {
      doc,
      originalIdx,
      lexicalScore: matchCount + exactPhraseBonus,
    };
  });

  // Sort by lexical score to get lexical rank
  const sortedByLexical = [...lexicalScored].sort((a, b) => b.lexicalScore - a.lexicalScore);
  const lexicalRankMap = new Map();
  sortedByLexical.forEach((item, rank) => {
    lexicalRankMap.set(item.originalIdx, rank + 1);
  });

  // 2. RRF Formula: Score = 1/(60 + denseRank) + 1/(60 + lexicalRank)
  const RRF_CONSTANT = 60;
  const fusedScored = candidateDocs.map((doc, denseRankIdx) => {
    const denseRank = denseRankIdx + 1;
    const lexicalRank = lexicalRankMap.get(denseRankIdx) || candidateDocs.length;
    const rrfScore = 1 / (RRF_CONSTANT + denseRank) + 1 / (RRF_CONSTANT + lexicalRank);

    return {
      doc,
      rrfScore,
    };
  });

  // Sort descending by combined RRF score
  fusedScored.sort((a, b) => b.rrfScore - a.rrfScore);

  return fusedScored.slice(0, topK).map((item) => item.doc);
};

/**
 * Production Vector Store Resolver:
 * - Document fingerprint caching
 * - Qdrant Cloud persistent collection with resilient fallback
 */
export const getOrInitVectorStore = async (docs, collectionName) => {
  // 1. Check in-memory collection cache first (Instant 0ms lookup)
  if (memoryCollectionCache.has(collectionName)) {
    return {
      store: memoryCollectionCache.get(collectionName),
      cached: true,
      provider: "memory-cache",
    };
  }

  // 2. Attempt Qdrant Cloud with timeout guard
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  if (qdrantUrl) {
    try {
      const tempStore = new QdrantVectorStore(embeddings, {
        url: qdrantUrl,
        apiKey: qdrantApiKey,
        collectionName,
      });

      // Quick check if collection already exists
      const existsResult = await Promise.race([
        tempStore.client.collectionExists(collectionName),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Qdrant timeout")), 2500)),
      ]);

      const collectionExists = existsResult?.exists ?? existsResult;

      if (collectionExists) {
        const store = await QdrantVectorStore.fromExistingCollection(embeddings, {
          url: qdrantUrl,
          apiKey: qdrantApiKey,
          collectionName,
        });
        return { store, cached: true, provider: "qdrant" };
      }

      // If docs are provided, index into Qdrant
      if (docs && docs.length > 0) {
        const store = await Promise.race([
          QdrantVectorStore.fromDocuments(docs, embeddings, {
            url: qdrantUrl,
            apiKey: qdrantApiKey,
            collectionName,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Qdrant index timeout")), 5000)),
        ]);
        return { store, cached: false, provider: "qdrant" };
      }
    } catch (qdrantErr) {
      console.warn(`[VectorDB] Qdrant Cloud unavailable (${qdrantErr.message}). Engaging resilient In-Memory fallback.`);
    }
  }

  // 3. Resilient In-Memory Fallback
  if (!docs || docs.length === 0) {
    throw new Error("No documents available to index and Qdrant cache was not found.");
  }

  const memStore = await ResilientMemoryVectorStore.fromDocuments(docs, embeddings);
  memoryCollectionCache.set(collectionName, memStore);
  return { store: memStore, cached: false, provider: "resilient-memory" };
};

// Backwards compatibility export
export const vectorStore = async (docs, collectionName) => {
  const { store } = await getOrInitVectorStore(docs, collectionName);
  return store;
};
