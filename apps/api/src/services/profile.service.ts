// apps/api/src/services/profile.service.ts
import { UserRepo } from "../repositories/user.repo";
import { AppError } from "../utils/errors";

export const ProfileService = {
  async getProfile(userId: string) {
    const u = await UserRepo.findById(userId);
    if (!u) throw AppError.notFound("User not found");
    return {
      id: u.id,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  },

  async updateProfile(userId: string, input: { name?: string; phone?: string }) {
    const u = await UserRepo.findById(userId);
    if (!u) throw AppError.notFound("User not found");
    const updated = await UserRepo.updateProfile(userId, {
      name: input.name ?? u.name,
      phone: input.phone ?? u.phone,
    });
    return {
      id: updated.id,
      role: updated.role,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },
};
