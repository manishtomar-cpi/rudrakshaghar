import { BlobServiceClient } from "@azure/storage-blob";
import path from "path";
import { env } from "../config/env";

const blobService = BlobServiceClient.fromConnectionString(
  env.AZURE_STORAGE_CONNECTION_STRING
);
const container = blobService.getContainerClient(env.AZURE_BLOB_CONTAINER);

function toCdnUrlOrSelf(url: string) {
  if (env.AZURE_CDN_URL) {
    const u = new URL(url);
    return `${env.AZURE_CDN_URL}${u.pathname}`;
  }
  return url;
}

export async function ensureContainer() {
  await container.createIfNotExists({ access: "blob" }); // public read (MVP); tighten later if needed
}

export async function uploadBuffer(
  blobName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; blobName: string }> {
  const block = container.getBlockBlobClient(blobName);
  await block.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
  return { url: toCdnUrlOrSelf(block.url), blobName };
}

export async function deleteBlob(blobName: string): Promise<void> {
  const block = container.getBlockBlobClient(blobName);
  await block.deleteIfExists();
}

export function makeProductBlobName(productId: string, fileName: string) {
  const base = fileName.replace(/\s+/g, "-").toLowerCase();
  const ext = path.extname(base) || ".jpg";
  const stem = path.basename(base, ext);
  const uid = Math.random().toString(36).slice(2, 10);
  return `products/${productId}/${stem}-${uid}${ext}`;
}
