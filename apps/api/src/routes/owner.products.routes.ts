import { Router } from "express";
import { OwnerProductController } from "../controllers/owner.product.controller";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { uploadSingleImage } from "../middlewares/upload";

const r = Router();

// OWNER-only
r.use(authJwt, requireRole("OWNER"));

r.post("/products", OwnerProductController.create);
r.get("/products", OwnerProductController.list);
r.get("/products/:id", OwnerProductController.get);
r.put("/products/:id", OwnerProductController.update);
r.delete("/products/:id", OwnerProductController.remove);

// images
r.post("/products/:id/images", uploadSingleImage, OwnerProductController.uploadImage);
r.put("/products/:id/images/order", OwnerProductController.reorderImages);
r.delete("/products/:id/images/:imageId", OwnerProductController.deleteImage);

// variants
r.get("/products/:id/variants", OwnerProductController.get); // included inside product get; optional separate list if needed
r.post("/products/:id/variants", OwnerProductController.createVariant);
r.put("/products/:id/variants/:variantId", OwnerProductController.updateVariant);
r.delete("/products/:id/variants/:variantId", OwnerProductController.deleteVariant);

export default r;
