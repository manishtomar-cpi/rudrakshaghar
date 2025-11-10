// src/features/auth/session.ts
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setSessionAccessToken = (t: string | null) => {
  accessToken = t;
};

export const resetSession = () => {
  accessToken = null;
};
