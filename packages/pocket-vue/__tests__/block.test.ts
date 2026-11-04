import { describe, it, expect, beforeEach, vi } from "vitest";
import { Block, setBlockWalker } from "../src/block";
import { createContext } from "../src/context";
import { walk } from "../src/walk";
import { stop, reactive } from "@vue/reactivity";
import { nextTick } from "../src/scheduler";

describe("Block", () => {
  let container: HTMLElement;
  let ctx: any;

  beforeEach(() => {
    container = document.createElement("div");
    ctx = createContext();
    ctx.scope.$refs = Object.create(null);
  });

  it("should create block with element", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);

    // Block clones the template, so we check if it's the same type
    expect(block.el).toBeTruthy();
    expect(block.el.nodeName).toBe(el.nodeName);
    // Block creates a child context, so check inheritance
    expect(block.parentCtx).toBe(ctx);
    expect(block.ctx.dirs).toBe(ctx.dirs);
  });

  it("should handle block insertion", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);
    const parent = document.createElement("div");

    block.insert(parent);

    // The block inserts a cloned element, not the original
    expect(parent.children.length).toBe(1);
    expect(parent.children[0].nodeName).toBe("DIV");
  });

  it("should handle block removal", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);
    const parent = document.createElement("div");

    block.insert(parent);
    expect(parent.children.length).toBe(1);
    expect(ctx.blocks).toContain(block);

    block.remove();
    expect(parent.children.length).toBe(0);
    expect(ctx.blocks).not.toContain(block);
  });

  

  it("should handle block cleanup", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);
    const parent = document.createElement("div");

    block.insert(parent);

    const cleanupSpy = vi.fn();
    block.ctx.cleanups.push(cleanupSpy);

    block.remove();

    expect(cleanupSpy).toHaveBeenCalled();
  });

  it("should handle multiple blocks", () => {
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const block1 = new Block(el1, ctx);
    const block2 = new Block(el2, ctx);

    // Block clones templates, so we check node names
    expect(block1.el.nodeName).toBe(el1.nodeName);
    expect(block2.el.nodeName).toBe(el2.nodeName);
    // Block creates child contexts, so check inheritance
    expect(block1.parentCtx).toBe(ctx);
    expect(block2.parentCtx).toBe(ctx);
    expect(block1.ctx.dirs).toBe(ctx.dirs);
    expect(block2.ctx.dirs).toBe(ctx.dirs);
  });

  it("should handle block with children", () => {
    const el = document.createElement("div");
    const child = document.createElement("span");
    el.appendChild(child);

    const block = new Block(el, ctx);

    // The block clones the template, so children should be preserved
    const blockEl = block.el as Element;
    expect(blockEl.children.length).toBe(1);
    expect(blockEl.children[0].nodeName).toBe("SPAN");
  });

  it("should create block with template element", () => {
    const template = document.createElement("template");
    template.innerHTML = "<div></div>";
    const block = new Block(template, ctx);

    expect(block.isFragment).toBe(true);
    // In browser, DocumentFragment nodeName is '#document-fragment'
    expect(block.el.nodeName).toBe("#document-fragment");
  });

  it("should create root block", () => {
  const el = document.createElement("div");
  const block = new Block(el, ctx, true);

  expect(block.parentCtx).toBeUndefined();
  expect(block.ctx).toBe(ctx);
  });

  it("should handle root block removal", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx, true);
    const parent = document.createElement("div");

    block.insert(parent);
    expect(parent.children.length).toBe(1);

    // Removing a root block should not try to remove from parentCtx.blocks
    block.remove();
    expect(parent.children.length).toBe(0);
  });

  it("should move block", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);
    const parent1 = document.createElement("div");
    const parent2 = document.createElement("div");

    block.insert(parent1);
    expect(parent1.children.length).toBe(1);
    expect(parent2.children.length).toBe(0);

    block.insert(parent2);
    expect(parent1.children.length).toBe(0);
    expect(parent2.children.length).toBe(1);
  });

  it("should teardown block", async () => {
    const el = document.createElement("div");
    const child = document.createElement("div");
    child.setAttribute("v-effect", "() => {}");
    const block = new Block(el, ctx);
    const childBlock = new Block(child, block.ctx);

    // Wait for nextTick to ensure the effect is created
    await nextTick();

    // Check if effects array has any effects before teardown
    expect(childBlock.ctx.effects.length).toBeGreaterThan(0);

    const cleanupSpy = vi.fn();
    childBlock.ctx.cleanups.push(cleanupSpy);

    block.teardown();

    // After teardown, cleanups should be called
    expect(cleanupSpy).toHaveBeenCalled();
    
    // Context arrays should be cleared
    expect(block.ctx.blocks.length).toBe(0);
    expect(block.ctx.effects.length).toBe(0);
    expect(block.ctx.cleanups.length).toBe(0);
    
    // Child block context arrays should also be cleared (via recursive teardown)
    expect(childBlock.ctx.blocks.length).toBe(0);
    expect(childBlock.ctx.effects.length).toBe(0);
    expect(childBlock.ctx.cleanups.length).toBe(0);
  });

  it("should handle fragment insertion with existing start/end markers", () => {
    const template = document.createElement("template");
    template.innerHTML = "<div>Fragment content</div>";
    const block = new Block(template, ctx);
    const parent = document.createElement("div");

    // First insertion
    block.insert(parent);
    expect(parent.children.length).toBe(1);
    expect(block.start?.data).toBe("");
    expect(block.end?.data).toBe("");

    // Add trailing element to test break at end marker
    const trailing = document.createElement("span");
    trailing.textContent = "trailing";
    parent.appendChild(trailing);

    // Second insertion (moving)
    const parent2 = document.createElement("div");
    block.insert(parent2);
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBe(trailing);
    expect(parent2.children.length).toBe(1);
    expect(block.start?.parentNode).toBe(parent2);
    expect(block.end?.parentNode).toBe(parent2);
  });

  it("should handle fragment removal with start/end markers", () => {
    const template = document.createElement("template");
    template.innerHTML = "<div>Fragment content</div>";
    const block = new Block(template, ctx);
    const parent = document.createElement("div");

    block.insert(parent);
    expect(parent.children.length).toBe(1);

    const trailing = document.createElement("span");
    trailing.textContent = "trailing";
    parent.appendChild(trailing);

    block.remove();
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBe(trailing);
  });

  it("should stop reactive effects when torn down", async () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);
    const state = reactive({ count: 0 });
    const fn = vi.fn(() => state.count);
    block.ctx.effect(fn);

    expect(fn).toHaveBeenCalledTimes(1);
    state.count++;
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(2);

    block.teardown();
    state.count++;
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should handle and warn about errors during teardown in DEV", () => {
    const el = document.createElement("div");
    const block = new Block(el, ctx);

    const child = new Block(document.createElement("div"), block.ctx);
    vi.spyOn(child, "teardown").mockImplementation(() => {
      throw new Error("child teardown fail");
    });

    const badEffect = (() => {}) as any;
    badEffect.effect = {
      stop: () => {
        throw new Error("effect stop fail");
      }
    };
    block.ctx.effects.push(badEffect);

    block.ctx.cleanups.push(() => {
      throw new Error("cleanup fail");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    block.teardown();

    expect(warnSpy).toHaveBeenCalledWith(
      "Error tearing down child block:",
      expect.any(Error)
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "Error stopping effect:",
      expect.any(Error)
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "Error in cleanup callback:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it("should suppress warnings during teardown when DEV is false", () => {
    const originalDev = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const el = document.createElement("div");
      const block = new Block(el, ctx);

      const child = new Block(document.createElement("div"), block.ctx);
      vi.spyOn(child, "teardown").mockImplementation(() => {
        throw new Error("child teardown fail");
      });

      const badEffect = (() => {}) as any;
      badEffect.effect = {
        stop: () => {
          throw new Error("effect stop fail");
        }
      };
      block.ctx.effects.push(badEffect);

      block.ctx.cleanups.push(() => {
        throw new Error("cleanup fail");
      });

      block.teardown();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      (import.meta.env as any).DEV = originalDev;
      warnSpy.mockRestore();
    }
  });

  it("should handle fragment insertion with anchor", () => {
    const template = document.createElement("template");
    template.innerHTML = "<div>Fragment content</div>";
    const block = new Block(template, ctx);
    const parent = document.createElement("div");
    const anchor = document.createElement("span");
    parent.appendChild(anchor);

    block.insert(parent, anchor);
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].textContent).toBe("Fragment content");
    expect(parent.children[1]).toBe(anchor);
  });

  it("should handle regular element insertion with anchor", () => {
    const el = document.createElement("div");
    el.textContent = "Regular content";
    const block = new Block(el, ctx);
    const parent = document.createElement("div");
    const anchor = document.createElement("span");
    parent.appendChild(anchor);

    block.insert(parent, anchor);
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].textContent).toBe("Regular content");
    expect(parent.children[1]).toBe(anchor);
  });

  it("should safely instantiate Block when walker is not set", () => {
    const el = document.createElement("div");
    setBlockWalker(undefined as any);
    try {
      expect(() => new Block(el, ctx)).not.toThrow();
    } finally {
      setBlockWalker(walk);
    }
  });
});
