// apps/api/src/services/addresses.service.ts
import { randomUUID } from "crypto";
import { AddressesRepo } from "../repositories/addresses.repo";
import { AppError } from "../utils/errors";

export const AddressesService = {
  async list(userId: string) {
    return AddressesRepo.list(userId);
  },

  async create(userId: string, input: {
    label?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
    makeDefault?: boolean;
  }) {
    if (input.makeDefault) {
      await AddressesRepo.clearDefault(userId);
    }
    const a = await AddressesRepo.create({
      id: randomUUID(),
      user_id: userId,
      label: input.label ?? null,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      country: input.country,
      is_default: !!input.makeDefault,
    });
    return a;
  },

  async update(userId: string, addressId: string, input: {
    label?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    makeDefault?: boolean;
  }) {
    if (input.makeDefault === true) {
      await AddressesRepo.clearDefault(userId);
    }
    const updated = await AddressesRepo.update(addressId, userId, {
      label: input.label ?? null,
      line1: input.line1 ?? null,
      line2: input.line2 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      country: input.country ?? null,
      is_default: input.makeDefault ?? null,
    });
    if (!updated) throw AppError.notFound("Address not found");
    return updated;
  },

  async remove(userId: string, addressId: string) {
    const ok = await AddressesRepo.delete(addressId, userId);
    if (!ok) throw AppError.notFound("Address not found");
  },

  async setDefault(userId: string, addressId: string) {
    const exists = await AddressesRepo.findById(addressId);
    if (!exists || exists.user_id !== userId) throw AppError.notFound("Address not found");
    await AddressesRepo.clearDefault(userId);
    const updated = await AddressesRepo.setDefault(addressId, userId);
    if (!updated) throw AppError.notFound("Address not found");
    return updated;
  },
};
