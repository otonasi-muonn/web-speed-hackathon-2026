import { promises as fs } from "fs";
import path from "path";

import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";
import sharp from "sharp";

import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const STATIC_MAX_AGE_SECONDS = 86400;

const HASH_ASSET_RE = /\.[0-9a-f]{8,}\.(js|css|woff2?)$/i;

const _imageCache = new Map<string, Buffer>();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// Accept: image/webp を含むリクエスト（<img>タグ）のみ WebP+リサイズして返す
// fetchBinaryCached は fetch() で Accept: */* を送るため image/webp を含まず → JPEG で通過
// → piexifjs の EXIF 読み取りは常にオリジナル JPEG を受け取る（競合なし）
staticRouter.use(async (req, res, next) => {
  if (req.method !== "GET") return next();
  if (!req.path.startsWith("/images/") && !req.path.startsWith("/movies/")) return next();
  const acceptsWebP = (req.headers["accept"] ?? "").includes("image/webp");
  if (!acceptsWebP) return next();

  const cacheKey = req.path;
  const cached = _imageCache.get(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.end(cached);
  }

  // UPLOAD_PATH 優先、なければ PUBLIC_PATH を検索（プロフィール画像対応）
  const relativePath = req.path.slice(1);
  const uploadFilePath = path.resolve(UPLOAD_PATH, relativePath);
  const publicFilePath = path.resolve(PUBLIC_PATH, relativePath);

  // ディレクトリトラバーサル防止
  if (!uploadFilePath.startsWith(UPLOAD_PATH) && !publicFilePath.startsWith(PUBLIC_PATH)) {
    return next();
  }

  let filePath: string | null = null;
  try {
    await fs.access(uploadFilePath);
    filePath = uploadFilePath;
  } catch {
    try {
      await fs.access(publicFilePath);
      filePath = publicFilePath;
    } catch {
      // どちらにも存在しない
    }
  }

  if (filePath === null) return next();

  try {
    const buffer = await sharp(filePath)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    _imageCache.set(cacheKey, buffer);
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.end(buffer);
  } catch {
    return next(); // 変換失敗 → serve-static にフォールバック
  }
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
    maxAge: STATIC_MAX_AGE_SECONDS * 1000,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", `public, max-age=${STATIC_MAX_AGE_SECONDS}, must-revalidate`);
    },
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
    maxAge: STATIC_MAX_AGE_SECONDS * 1000,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (HASH_ASSET_RE.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", `public, max-age=${STATIC_MAX_AGE_SECONDS}, must-revalidate`);
      }
    },
  }),
);
