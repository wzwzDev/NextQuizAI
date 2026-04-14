describe("/api/auth/[...nextauth] Route Handler", () => {
  it("exports handler functions", async () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return;
    }

    const route = await import("@/app/api/auth/[...nextauth]/route");
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
    expect(route.GET).toBe(route.POST);
  });
});