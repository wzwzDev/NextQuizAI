// Security: All credentials must be explicitly set via environment variables.
// No hardcoded defaults allowed in production.

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export function getOwnerEmail() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail && process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing OWNER_EMAIL environment variable. This is required in production."
    );
  }
  return normalizeEmail(ownerEmail ?? "");
}

export function isOwnerEmail(email?: string | null) {
  return normalizeEmail(email) === getOwnerEmail();
}

export function getAdminCredentialsConfig() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminLoginEmail = process.env.ADMIN_LOGIN_EMAIL;
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME;

  if (!adminUsername && process.env.NODE_ENV === "production") {
    throw new Error("Missing ADMIN_USERNAME environment variable.");
  }
  if (!adminPassword && process.env.NODE_ENV === "production") {
    throw new Error("Missing ADMIN_PASSWORD environment variable.");
  }
  if (!adminLoginEmail && process.env.NODE_ENV === "production") {
    throw new Error("Missing ADMIN_LOGIN_EMAIL environment variable.");
  }

  return {
    username: (adminUsername ?? "").trim(),
    password: adminPassword ?? "",
    loginEmail: normalizeEmail(adminLoginEmail ?? ""),
    displayName: (adminDisplayName ?? "Admin Account").trim(),
  };
}
