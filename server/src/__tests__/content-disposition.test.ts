import { describe, expect, it } from "vitest";
import { formatContentDisposition } from "../lib/content-disposition.js";

describe("formatContentDisposition", () => {
  it("emits both filename and filename* for ASCII names", () => {
    expect(formatContentDisposition("inline", "logo.png")).toBe(
      `inline; filename="logo.png"; filename*=UTF-8''logo.png`,
    );
  });

  it("replaces non-ASCII chars in filename= and percent-encodes filename*", () => {
    const header = formatContentDisposition(
      "inline",
      "Capture d’écran 2026-04-23 à 10.54.35.png",
    );
    expect(header).toMatch(/^inline; filename="[\x20-\x7e]+"; filename\*=UTF-8''/);
    expect(header).toContain("%E2%80%99");
    expect(header).toContain("%C3%A9");
    expect(header).toContain("%C3%A0");
  });

  it("produces a header that Node accepts (no ERR_INVALID_CHAR)", async () => {
    const { createServer } = await import("node:http");
    const server = createServer((_req, res) => {
      res.setHeader(
        "Content-Disposition",
        formatContentDisposition("inline", "Capture d’écran à midi.png"),
      );
      res.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/filename\*=UTF-8''/);
    server.close();
  });

  it("strips embedded quotes and backslashes", () => {
    const header = formatContentDisposition("attachment", 'weird"name\\.txt');
    expect(header).toBe(
      `attachment; filename="weirdname.txt"; filename*=UTF-8''weirdname.txt`,
    );
  });

  it("falls back to a default when the filename is empty or null", () => {
    expect(formatContentDisposition("inline", null)).toBe(
      `inline; filename="file"; filename*=UTF-8''file`,
    );
    expect(formatContentDisposition("inline", "")).toBe(
      `inline; filename="file"; filename*=UTF-8''file`,
    );
  });

  it("strips CR/LF to prevent header injection", () => {
    const header = formatContentDisposition(
      "attachment",
      "evil.txt\r\nX-Injected: yes",
    );
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
  });
});
