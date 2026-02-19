import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import sharp from "sharp";

interface CachedObject {
  data: Buffer;
  contentType: string;
  cachedAt: number;
}

const IMAGE_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 200;
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

function getCachedObject(cacheKey: string): CachedObject | null {
  const entry = imageCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > IMAGE_CACHE_TTL_MS) {
    imageCache.delete(cacheKey);
    return null;
  }
  return entry;
}

function setCachedObject(cacheKey: string, data: Buffer, contentType: string) {
  if (data.length > MAX_ENTRY_SIZE_BYTES) return;
  if (imageCache.size >= MAX_CACHE_SIZE) {
    evictExpiredEntries();
    if (imageCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
  }
  imageCache.set(cacheKey, { data, contentType, cachedAt: Date.now() });
}

const ALLOWED_WIDTHS = [48, 64, 96, 128, 200, 400];

function getAllowedWidth(requested: number): number | null {
  const clamped = Math.min(Math.max(requested, 32), 800);
  let closest = ALLOWED_WIDTHS[0];
  for (const w of ALLOWED_WIDTHS) {
    if (w >= clamped) {
      closest = w;
      break;
    }
    closest = w;
  }
  return closest;
}

async function resizeImage(data: Buffer, width: number, originalContentType: string, preferWebP: boolean): Promise<{ data: Buffer; contentType: string }> {
  const pipeline = sharp(data).resize(width, undefined, { fit: "inside", withoutEnlargement: true });

  if (preferWebP) {
    const hasAlpha = originalContentType === "image/png" || originalContentType === "image/svg+xml";
    const resized = await pipeline.webp({ quality: 80, alphaQuality: hasAlpha ? 100 : undefined }).toBuffer();
    return { data: resized, contentType: "image/webp" };
  }

  if (originalContentType === "image/png" || originalContentType === "image/svg+xml") {
    const resized = await pipeline.png({ quality: 80 }).toBuffer();
    return { data: resized, contentType: "image/png" };
  }

  const resized = await pipeline.jpeg({ quality: 80 }).toBuffer();
  return { data: resized, contentType: "image/jpeg" };
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
      const requestedWidth = req.query.w ? parseInt(req.query.w as string, 10) : null;
      const thumbWidth = requestedWidth && !isNaN(requestedWidth) ? getAllowedWidth(requestedWidth) : null;
      const acceptsWebP = (req.headers.accept || "").includes("image/webp");

      const cacheKey = thumbWidth ? `${objectPath}?w=${thumbWidth}${acceptsWebP ? "&f=webp" : ""}` : objectPath;

      const cached = getCachedObject(cacheKey);
      if (cached) {
        res.set({
          "Content-Type": cached.contentType,
          "Content-Length": String(cached.data.length),
          "Cache-Control": "public, max-age=86400",
          "X-Cache": "HIT",
        });
        return res.send(cached.data);
      }

      const fullCached = thumbWidth ? getCachedObject(objectPath) : null;
      let fullData: Buffer;
      let originalContentType: string;

      if (fullCached) {
        fullData = fullCached.data;
        originalContentType = fullCached.contentType;
      } else {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        const [metadata] = await objectFile.getMetadata();
        originalContentType = (metadata.contentType as string) || "application/octet-stream";

        const chunks: Buffer[] = [];
        fullData = await new Promise<Buffer>((resolve, reject) => {
          const stream = objectFile.createReadStream();
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

        setCachedObject(objectPath, fullData, originalContentType);
      }

      if (thumbWidth && originalContentType.startsWith("image/")) {
        try {
          const { data: resizedData, contentType: resizedType } = await resizeImage(fullData, thumbWidth, originalContentType, acceptsWebP);
          setCachedObject(cacheKey, resizedData, resizedType);

          res.set({
            "Content-Type": resizedType,
            "Content-Length": String(resizedData.length),
            "Cache-Control": "public, max-age=86400",
            "X-Cache": "MISS",
          });
          return res.send(resizedData);
        } catch (resizeErr) {
          console.error("Resize error, serving original:", resizeErr);
        }
      }

      res.set({
        "Content-Type": originalContentType,
        "Content-Length": String(fullData.length),
        "Cache-Control": "public, max-age=86400",
        "X-Cache": "MISS",
      });
      res.send(fullData);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
