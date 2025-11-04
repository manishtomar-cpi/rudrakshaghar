// apps/api/src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { loginLimiter, refreshLimiter } from "../middlewares/rateLimiters";
import { authJwt } from "../middlewares/authJwt";

const r = Router();

r.post("/register", AuthController.register);
r.post("/login", loginLimiter, AuthController.login);
r.post("/refresh", refreshLimiter, AuthController.refresh);
r.get("/me", authJwt, AuthController.me);
r.post("/logout", AuthController.logout);
r.post("/logout-all", authJwt, AuthController.logoutAll);

export default r;
