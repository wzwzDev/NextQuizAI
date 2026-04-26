jest.mock("@/server/core/auth", () => ({
  getAuthSession: jest.fn(),
}));

jest.mock("@/server/services/userService", () => ({
  markUserOfflineByEmail: jest.fn(),
}));

import { POST } from "@/app/api/sign-out/route";
import { getAuthSession } from "@/server/core/auth";
import { markUserOfflineByEmail } from "@/server/services/userService";

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedMarkUserOfflineByEmail = markUserOfflineByEmail as jest.MockedFunction<
  typeof markUserOfflineByEmail
>;

describe("POST /api/sign-out error branches", () => {
  const buildRequest = () =>
    new Request("http://localhost/api/sign-out", {
      method: "POST",
    });

  beforeEach(() => {
    mockedGetAuthSession.mockReset();
    mockedMarkUserOfflineByEmail.mockReset();
  });

  it("returns 404 when the user record is missing", async () => {
    mockedGetAuthSession.mockRejectedValueOnce({ code: "P2025" });

    const response = await POST(buildRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: "Usuario no encontrado para cerrar sesión.",
    });
    expect(mockedMarkUserOfflineByEmail).not.toHaveBeenCalled();
  });

  it("returns 503 when the database is unavailable", async () => {
    mockedGetAuthSession.mockRejectedValueOnce({ code: "ECONNREFUSED" });

    const response = await POST(buildRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: "No se pudo conectar con la base de datos.",
    });
    expect(mockedMarkUserOfflineByEmail).not.toHaveBeenCalled();
  });

  it("returns 500 for unexpected failures", async () => {
    mockedGetAuthSession.mockRejectedValueOnce(new Error("unexpected failure"));

    const response = await POST(buildRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "Error inesperado al cerrar sesión.",
    });
    expect(mockedMarkUserOfflineByEmail).not.toHaveBeenCalled();
  });
});
