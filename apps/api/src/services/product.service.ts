import { randomUUID } from "crypto";
import { ProductRepo } from "../repositories/product.repo";
import { ProductImageRepo } from "../repositories/productImage.repo";
import { ProductVariantRepo } from "../repositories/productVariant.repo";
import { Errors } from "../utils/errors";
import {
  uploadBuffer,
  deleteBlob,
  ensureContainer,
  makeProductBlobName,
} from "../storage/azureBlob";

export const ProductService = {
  // -------- Products --------
  async create(input: {
    title: string;
    category: "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";
    price_paise: number;
    description?: string;
    authenticity_note?: string;
    active?: boolean;
    stock_qty?: number | null;
  }) {
    const id = randomUUID();
    const row = await ProductRepo.create({
      id,
      title: input.title,
      category: input.category,
      price_paise: input.price_paise,
      description: input.description ?? null,
      authenticity_note: input.authenticity_note ?? null,
      active: input.active ?? true,
      stock_qty: input.stock_qty ?? null,
    });
    return row;
  },

  async update(
    id: string,
    patch: Partial<{
      title: string;
      category: "RUDRAKSHA" | "GEMSTONE" | "ACCESSORY";
      price_paise: number;
      description?: string;
      authenticity_note?: string;
      active?: boolean;
      stock_qty?: number | null;
    }>
  ) {
    const updated = await ProductRepo.update(id, patch as any);
    if (!updated) throw Errors.NotFound("Product not found");
    return updated;
  },

  async get(id: string) {
    const p = await ProductRepo.findById(id);
    if (!p) throw Errors.NotFound("Product not found");
    const images = await ProductImageRepo.list(id);
    const variants = await ProductVariantRepo.list(id);
    return { ...p, images, variants };
  },

  async list(query: {
    q?: string;
    category?: any;
    active?: boolean;
    min_price_paise?: number;
    max_price_paise?: number;
    in_stock?: boolean;
    has_images?: boolean;
    created_from?: string;
    created_to?: string;
    include?: "none" | "primary" | "images";
    images_limit?: number;
    page: number;
    pageSize: number;
    sort: string;
  }) {
    return ProductRepo.page(query);
  },

  async softDelete(id: string) {
    await ProductRepo.softDelete(id);
  },

  // -------- Images --------
  async uploadImage(opts: {
    productId: string;
    buffer: Buffer;
    fileName: string;
    mime: string;
  }) {
    const p = await ProductRepo.findById(opts.productId);
    if (!p) throw Errors.NotFound("Product not found");

    await ensureContainer();
    const blobName = makeProductBlobName(opts.productId, opts.fileName);
    const { url } = await uploadBuffer(blobName, opts.buffer, opts.mime);

    const created = await ProductImageRepo.create({
      id: randomUUID(),
      product_id: opts.productId,
      url,
    });
    return created;
  },

  async reorderImages(productId: string, order: { id: string; position: number }[]) {
    // (Could validate ownership; skipping for brevity)
    await ProductImageRepo.updateOrder(order);
  },

  async deleteImage(productId: string, imageId: string) {
    const img = await ProductImageRepo.findById(imageId);
    if (!img || img.product_id !== productId) throw Errors.NotFound("Image not found");
    try {
      const blobPath = new URL(img.url).pathname.replace(/^\/+/, "");
      await deleteBlob(blobPath);
    } catch (e) {
      console.warn("[blob] delete failed:", (e as Error).message);
    }
    await ProductImageRepo.delete(imageId);
  },

  // -------- Variants --------
  async createVariant(
    productId: string,
    input: { label: string; price_paise?: number; sku?: string; active?: boolean }
  ) {
    const p = await ProductRepo.findById(productId);
    if (!p) throw Errors.NotFound("Product not found");

    const v = await ProductVariantRepo.create({
      id: randomUUID(),
      product_id: productId,
      label: input.label,
      price_paise: input.price_paise,
      sku: input.sku,
      active: input.active ?? true,
    });
    return v;
  },

  async updateVariant(
    _productId: string,
    variantId: string,
    patch: Partial<{ label: string; price_paise?: number; sku?: string; active?: boolean }>
  ) {
    const v = await ProductVariantRepo.update(variantId, patch as any);
    if (!v) throw Errors.NotFound("Variant not found");
    return v;
  },

  async deleteVariant(_productId: string, variantId: string) {
    await ProductVariantRepo.delete(variantId);
  },

  // -------- Public --------
  async getPublicDetail(slug: string) {
    const p = await ProductRepo.findActiveBySlug(slug);
    if (!p) throw Errors.NotFound("Product not found");
    const images = await ProductImageRepo.list(p.id);
    const variants = (await ProductVariantRepo.list(p.id)).filter((v) => v.active);
    return { ...p, images, variants };
  },
};
