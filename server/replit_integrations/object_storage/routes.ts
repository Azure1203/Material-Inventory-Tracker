import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

interface CachedObject {
  data: Buffer;
  contentType: string;
  cachedAt: number;
}

const IMAGE_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const MAX_ENTRY_SIZE_BYTES = 5 * 1024 * 1024;
const imageCache = new Map<string, CachedObject>();

function evictExpiredEntries() {
  const now = Date.now();
  const keys = Array.from(imageCache.keys());
  for (const key of keys) {
    const entry = imageCache.get(key);
    if (entry && now - entry.cachedAt > IMAGE_CACHE_TTL_MS) {
      imageCache.delete(key);
    }
  }
}

function getCachedObject(path: string): CachedObject | null {
  const entry = imageCache.get(path);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > IMAGE_CACHE_TTL_MS) {
    imageCache.delete(path);
    return null;
  }
  return entry;
}

function setCachedObject(path: string, data: Buffer, contentType: string) {
  if (data.length > MAX_ENTRY_SIZE_BYTES) return;
  if (imageCache.size >= MAX_CACHE_SIZE) {
    evictExpiredEntries();
    if (imageCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
  }
  imageCache.set(path, { data, contentType, cachedAt: Date.now() });
}

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectPath = req.path;

      const cached = getCachedObject(objectPath);
      if (cached) {
        res.set({
          "Content-Type": cached.contentType,
          "Content-Length": String(cached.data.length),
          "Cache-Control": "public, max-age=86400",
          "X-Cache": "HIT",
        });
        return res.send(cached.data);
      }

      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      const [metadata] = await objectFile.getMetadata();
      const contentType = (metadata.contentType as string) || "application/octet-stream";

      const chunks: Buffer[] = [];
      const stream = objectFile.createReadStream();

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        const data = Buffer.concat(chunks);
        setCachedObject(objectPath, data, contentType);

        res.set({
          "Content-Type": contentType,
          "Content-Length": String(data.length),
          "Cache-Control": "public, max-age=86400",
          "X-Cache": "MISS",
        });
        res.send(data);
      });

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
