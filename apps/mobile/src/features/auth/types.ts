export type Role = 'OWNER' | 'CUSTOMER';

export type User = {
  id: string;
  role: Role;
  name: string | null;
  email: string;
  phone: string;
};

export type MeResponse = {
  userId: string;
  role: Role;
  user?: User;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};
