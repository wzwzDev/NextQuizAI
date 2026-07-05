import { POST } from "@/app/api/(admin)/quizzes/upload/route";
import { getAuthSession } from "@/server/core/auth";
import { NextRequest } from "next/server";

jest.mock("@/server/core/auth");

const mockGetAuthSession = getAuthSession as jest.MockedFunction<
  typeof getAuthSession
>;

describe("POST /api/(admin)/quizzes/upload", () => {
  const mockAdminSession = {
    user: {
      id: "admin-1",
      email: "admin@example.com",
      isAdmin: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should reject request with 401 when user is not authenticated", async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("admin");
    });

    it("should reject request with 401 when user is not admin", async () => {
      mockGetAuthSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@example.com",
          isAdmin: false,
        },
      });

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("File validation", () => {
    it("should return 400 when no file is provided", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("No file provided");
    });
  });

  describe("File type validation", () => {
    it("should accept PDF files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.type).toBe("application/pdf");
    });

    it("should accept JSON files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["{}"], "test.json", { type: "application/json" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.type).toBe("application/json");
    });

    it("should accept TXT files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["text"], "test.txt", { type: "text/plain" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.type).toBe("text/plain");
    });

    it("should accept XLS files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.xls", { type: "application/vnd.ms-excel" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.type).toBe("application/vnd.ms-excel");
    });

    it("should accept XLSX files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });

    it("should reject unsupported file types", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["executable"], "virus.exe", { type: "application/x-msdownload" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid file type");
    });

    it("should reject image files", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["image"], "image.jpg", { type: "image/jpeg" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid file type");
    });
  });

  describe("File size validation", () => {
    it("should accept files under 10MB", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const content = "x".repeat(1024 * 1024); // 1MB
      const formData = new FormData();
      formData.append("file", new File([content], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should reject files over 10MB", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      // Create a file larger than 10MB
      const content = "x".repeat(11 * 1024 * 1024); // 11MB
      const largeFile = new File([content], "large.pdf", { type: "application/pdf" });
      
      // Mock the file size since we can't create truly large files in tests
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024, writable: false });

      const formData = new FormData();
      formData.append("file", largeFile);

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(413);
      const body = await response.json();
      expect(body.error).toContain("File too large");
    });
  });

  describe("Success response", () => {
    it("should return file metadata on successful upload", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      const file = new File(["pdf content"], "document.pdf", { type: "application/pdf" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body).toHaveProperty("fileId");
      expect(body).toHaveProperty("fileName");
      expect(body).toHaveProperty("size");
      expect(body).toHaveProperty("type");
      expect(body).toHaveProperty("uploadedAt");
      expect(body.fileName).toBe("document.pdf");
      expect(body.type).toBe("application/pdf");
    });

    it("should generate unique fileId for each upload", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      // First upload
      const formData1 = new FormData();
      formData1.append("file", new File(["content1"], "file1.pdf", { type: "application/pdf" }));

      const request1 = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData1,
      });

      const response1 = await POST(request1);
      const body1 = await response1.json();

      // Second upload
      const formData2 = new FormData();
      formData2.append("file", new File(["content2"], "file2.pdf", { type: "application/pdf" }));

      const request2 = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData2,
      });

      const response2 = await POST(request2);
      const body2 = await response2.json();

      expect(body1.fileId).not.toBe(body2.fileId);
    });

    it("should preserve original file name", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const fileName = "my-quiz-questions.pdf";
      const formData = new FormData();
      formData.append("file", new File(["content"], fileName, { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.fileName).toBe(fileName);
    });

    it("should set uploadedAt timestamp", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const beforeRequest = new Date();
      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const body = await response.json();
      const afterRequest = new Date();

      const uploadedAt = new Date(body.uploadedAt);
      expect(uploadedAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(uploadedAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });
  });

  describe("Error handling", () => {
    it("should return 500 for unexpected errors", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", new File(["content"], "test.pdf", { type: "application/pdf" }));

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/upload", {
        method: "POST",
        body: formData,
      });

      // Mock an error in request processing
      // originalFormDataMethod is mocked, no need to store
      (request.formData as jest.Mock) = jest.fn().mockRejectedValueOnce(new Error("FormData error"));

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("Failed to upload file");
    });
  });
});
