import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("index.ts", () => {
  let originalCurrentScript: HTMLOrSVGScriptElement | null;

  beforeEach(() => {
    // Store original currentScript
    originalCurrentScript = document.currentScript;
  });

  afterEach(() => {
    // Restore original currentScript if it was set
    if (originalCurrentScript !== null) {
      Object.defineProperty(document, "currentScript", {
        value: originalCurrentScript,
        writable: true,
        configurable: true
      });
    }
  });

  it("should export createApp", async () => {
    const { createApp } = await import("../src/index");
    expect(createApp).toBeDefined();
  });

  it("should export nextTick", async () => {
    const { nextTick } = await import("../src/index");
    expect(nextTick).toBeDefined();
  });

  it("should export reactive", async () => {
    const { reactive } = await import("../src/index");
    expect(reactive).toBeDefined();
  });

  it("should export watchEffect", async () => {
    const indexExports = await import("../src/index");
    // Test that effect is re-exported as watchEffect
    expect(indexExports.watchEffect).toBeDefined();
  });

  it("should not auto-mount when script has no init attribute", async () => {
  // Create a script element without init attribute
  const script = document.createElement("script");
  script.textContent = ""; // Empty script to simulate currentScript

  // Mock currentScript to be our script without init attribute
  Object.defineProperty(document, "currentScript", {
  value: script,
  writable: true,
  configurable: true
  });

  // Spy on console.warn to check if mount warning is logged
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Import index module
    const { autoMount } = await import("../src/index");

    // Call autoMount
    autoMount();

    // Verify no warning was logged (since mount shouldn't be called)
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // Restore the spy
    consoleWarnSpy.mockRestore();
  });

  it("should auto-mount when script has init attribute", async () => {
  // Create a script element with init attribute
  const script = document.createElement("script");
  script.setAttribute("init", "");
  script.textContent = ""; // Empty script to simulate currentScript

  // Mock currentScript to be our script with init attribute
  Object.defineProperty(document, "currentScript", {
  value: script,
  writable: true,
  configurable: true
  });

  // Spy on console.warn to check if mount warning is logged
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Import index module
  const { autoMount } = await import("../src/index");

    // Call autoMount
    autoMount();

    // Verify warning was logged (since mount is called and logs a warning in dev mode)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Mounting on documentElement')
    );

  // Restore the spy
    consoleWarnSpy.mockRestore();
  });

  it("should auto-mount on module load when script has init attribute", async () => {
    const script = document.createElement("script");
    script.setAttribute("init", "");
    Object.defineProperty(document, "currentScript", {
      value: script,
      writable: true,
      configurable: true
    });

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await import(/* @vite-ignore */ `../src/index?bust=${Date.now()}`);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Mounting on documentElement")
    );
    consoleWarnSpy.mockRestore();
  });
});