// apps/api/src/routes/customer.addresses.routes.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRole";
import { CustomerAddressesController } from "../controllers/customer.addresses.controller";

const r = Router();
r.use(authJwt, requireRole("CUSTOMER"));
r.get("/me/addresses", CustomerAddressesController.list);
r.post("/me/addresses", CustomerAddressesController.create);
r.patch("/me/addresses/:id", CustomerAddressesController.update);
r.delete("/me/addresses/:id", CustomerAddressesController.remove);
r.patch("/me/addresses/:id/default", CustomerAddressesController.setDefault);

export default r;
