const DEFAULT_OWNER_EMAIL = "waelwzwz@gmail.com";
const DEFAULT_ADMIN_LOGIN_EMAIL = "admin@nextquizai.local";
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin";

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export function getOwnerEmail() {
  return normalizeEmail(process.env.OWNER_EMAIL ?? DEFAULT_OWNER_EMAIL);
}

export function isOwnerEmail(email?: string | null) {
  return normalizeEmail(email) === getOwnerEmail();
}

export function getAdminCredentialsConfig() {
  return {
    username: (process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME).trim(),
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
    loginEmail: normalizeEmail(
      process.env.ADMIN_LOGIN_EMAIL ?? DEFAULT_ADMIN_LOGIN_EMAIL,
    ),
    displayName: (process.env.ADMIN_DISPLAY_NAME ?? "Admin Account").trim(),
  };
}
