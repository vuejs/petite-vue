import { describe, it, expect, beforeEach, vi } from "vitest";
import { on } from "../src/directives/on";
import { createContext } from "../src/context";
import { evaluate } from "../src/eval";
import { effect as rawEffect } from "@vue/reactivity";
import { nextTick } from "../src/scheduler";

describe("on directive", () => {
  let container: HTMLElement;
  let ctx: any;

  beforeEach(() => {
    container = document.createElement("div");
    ctx = createContext();
    ctx.scope.$refs = Object.create(null);
  });

  it("should handle simple path expressions", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: undefined,
      ctx
    });

    el.click();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle member path, bracket access, and numeric indexing in simple paths", () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const fn3 = vi.fn();
    const fn4 = vi.fn();
    const fn5 = vi.fn();
    const fn10 = vi.fn();

    ctx.scope.obj = { nested: { fn: fn1 } };
    ctx.scope.dict = { 'single-quote': fn2, doubleQuote: fn3 };
    ctx.scope.list = [fn4];
    ctx.scope.list[10] = fn10;
    ctx.scope.dynamicKey = 'doubleQuote';

    const el1 = document.createElement("button");
    on({
      el: el1,
      get: (exp = "obj.nested.fn") => evaluate(ctx.scope, exp, el1),
      effect: rawEffect,
      exp: "obj.nested.fn",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el1.click();
    expect(fn1).toHaveBeenCalledWith(expect.any(MouseEvent));

    const el2 = document.createElement("button");
    on({
      el: el2,
      get: (exp = "dict['single-quote']") => evaluate(ctx.scope, exp, el2),
      effect: rawEffect,
      exp: "dict['single-quote']",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el2.click();
    expect(fn2).toHaveBeenCalledWith(expect.any(MouseEvent));

    const el3 = document.createElement("button");
    on({
      el: el3,
      get: (exp = 'dict["doubleQuote"]') => evaluate(ctx.scope, exp, el3),
      effect: rawEffect,
      exp: 'dict["doubleQuote"]',
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el3.click();
    expect(fn3).toHaveBeenCalledWith(expect.any(MouseEvent));

    const el4 = document.createElement("button");
    on({
      el: el4,
      get: (exp = "list[0]") => evaluate(ctx.scope, exp, el4),
      effect: rawEffect,
      exp: "list[0]",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el4.click();
    expect(fn4).toHaveBeenCalledWith(expect.any(MouseEvent));

    const el4b = document.createElement("button");
    on({
      el: el4b,
      get: (exp = "list[10]") => evaluate(ctx.scope, exp, el4b),
      effect: rawEffect,
      exp: "list[10]",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el4b.click();
    expect(fn10).toHaveBeenCalledWith(expect.any(MouseEvent));

    const el5 = document.createElement("button");
    on({
      el: el5,
      get: (exp = "dict[dynamicKey]") => evaluate(ctx.scope, exp, el5),
      effect: rawEffect,
      exp: "dict[dynamicKey]",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el5.click();
    expect(fn5).not.toHaveBeenCalled();
    expect(fn3).toHaveBeenCalledTimes(2);
  });

  it("should evaluate multi-statement expressions as block bodies and not simple paths", () => {
    const el = document.createElement("button");
    let a = 0;
    let b = 0;
    ctx.scope.incA = () => { a++; };
    ctx.scope.incB = () => { b++; };

    on({
      el,
      get: (exp) => evaluate(ctx.scope, exp!, el),
      effect: rawEffect,
      exp: "incA(); incB()",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    el.click();
    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  it("should not treat expressions with prefix operators as simple paths", () => {
    const el = document.createElement("button");
    ctx.scope.done = false;

    on({
      el,
      get: (exp) => evaluate(ctx.scope, exp!, el),
      effect: rawEffect,
      exp: "!done",
      arg: "click",
      modifiers: undefined,
      ctx,
    });

    expect(() => el.click()).not.toThrow();
  });

  it("should handle complex expressions", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp) => {
        if (exp === "($event => { handler($event) })") {
          return (e: Event) => handler(e);
        }
        return ctx.scope[exp || "handler"];
      },
      effect: rawEffect,
      exp: "handler($event)",
      arg: "click",
      modifiers: undefined,
      ctx
    });

    el.click();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle vue:mounted lifecycle", async () => {
    const el = document.createElement("div");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "vue:mounted",
      modifiers: undefined,
      ctx
    });

    // Handler should be called on nextTick
    await nextTick();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle vue:unmounted lifecycle", () => {
    const el = document.createElement("div");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    const cleanup = on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "vue:unmounted",
      modifiers: undefined,
      ctx
    });

    expect(typeof cleanup).toBe("function");
    if (cleanup) cleanup();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle stop modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;
    const stopPropagation = vi.fn();

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { stop: true },
      ctx
    });

    const event = new Event("click");
    event.stopPropagation = stopPropagation;
    el.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle prevent modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;
    const preventDefault = vi.fn();

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { prevent: true },
      ctx
    });

    const event = new Event("click");
    event.preventDefault = preventDefault;
    el.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it("should handle self modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { self: true },
      ctx
    });

    // Create a child element and click it
    const child = document.createElement("span");
    el.appendChild(child);
    
    const event = new Event("click");
    Object.defineProperty(event, "target", { value: child });
    Object.defineProperty(event, "currentTarget", { value: el });
    
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    // Click the element itself
    const selfEvent = new Event("click");
    Object.defineProperty(selfEvent, "target", { value: el });
    Object.defineProperty(selfEvent, "currentTarget", { value: el });
    el.dispatchEvent(selfEvent);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle ctrl modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { ctrl: true },
      ctx
    });

    const event = new MouseEvent("click", { ctrlKey: false });
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const eventWithCtrl = new MouseEvent("click", { ctrlKey: true });
    el.dispatchEvent(eventWithCtrl);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle shift modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { shift: true },
      ctx
    });

    const event = new MouseEvent("click", { shiftKey: false });
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const eventWithShift = new MouseEvent("click", { shiftKey: true });
    el.dispatchEvent(eventWithShift);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle alt modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { alt: true },
      ctx
    });

    const event = new MouseEvent("click", { altKey: false });
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const eventWithAlt = new MouseEvent("click", { altKey: true });
    el.dispatchEvent(eventWithAlt);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle meta modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { meta: true },
      ctx
    });

    const event = new MouseEvent("click", { metaKey: false });
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const eventWithMeta = new MouseEvent("click", { metaKey: true });
    el.dispatchEvent(eventWithMeta);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle left mouse button modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { left: true },
      ctx
    });

    const event = new MouseEvent("click", { button: 1 }); // Right button
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const leftClickEvent = new MouseEvent("click", { button: 0 }); // Left button
    el.dispatchEvent(leftClickEvent);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle middle mouse button modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { middle: true },
      ctx
    });

    const event = new MouseEvent("mouseup", { button: 0 }); // Left button on mouseup should be blocked
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const nonButtonEvent = new Event("mouseup"); // Event without 'button' property passes through
    el.dispatchEvent(nonButtonEvent);
    expect(handler).toHaveBeenCalledTimes(1);

    const middleClickEvent = new MouseEvent("mouseup", { button: 1 }); // Middle button
    el.dispatchEvent(middleClickEvent);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("should handle right mouse button modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { right: true },
      ctx
    });

    const event = new MouseEvent("contextmenu", { button: 0 }); // Left button on contextmenu should be blocked
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    const nonButtonEvent = new Event("contextmenu"); // Event without 'button' property passes through
    el.dispatchEvent(nonButtonEvent);
    expect(handler).toHaveBeenCalledTimes(1);

    const rightClickEvent = new MouseEvent("contextmenu", { button: 2 }); // Right button
    el.dispatchEvent(rightClickEvent);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("should handle exact modifier with all system keys", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { exact: true },
      ctx
    });

    el.dispatchEvent(new MouseEvent("click", { ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();

    el.dispatchEvent(new MouseEvent("click", { shiftKey: true }));
    expect(handler).not.toHaveBeenCalled();

    el.dispatchEvent(new MouseEvent("click", { altKey: true }));
    expect(handler).not.toHaveBeenCalled();

    el.dispatchEvent(new MouseEvent("click", { metaKey: true }));
    expect(handler).not.toHaveBeenCalled();

    el.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should allow specified system modifier with exact", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { ctrl: true, exact: true },
      ctx
    });

    // Ctrl alone should trigger
    el.dispatchEvent(new MouseEvent("click", { ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Ctrl + Alt should not trigger
    el.dispatchEvent(new MouseEvent("click", { ctrlKey: true, altKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Ctrl + Shift should not trigger
    el.dispatchEvent(new MouseEvent("click", { ctrlKey: true, shiftKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should handle exact modifier", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { exact: true },
      ctx
    });

    // Event with extra modifiers should not trigger
    const eventWithExtra = new MouseEvent("click", { ctrlKey: true, shiftKey: true });
    el.dispatchEvent(eventWithExtra);
    expect(handler).not.toHaveBeenCalled();

    // Event without modifiers should trigger
    const eventWithoutModifiers = new MouseEvent("click");
    el.dispatchEvent(eventWithoutModifiers);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle key modifiers", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "keydown",
      modifiers: { enter: true },
      ctx
    });

    const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
    el.dispatchEvent(enterEvent);
    expect(handler).toHaveBeenCalled();

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    el.dispatchEvent(escapeEvent);
    expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it("should handle right click modifier mapping", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { right: true },
      ctx
    });

    // Should map to contextmenu event
    const event = new Event("contextmenu");
    el.dispatchEvent(event);
    expect(handler).toHaveBeenCalled();
  });

  it("should handle middle click modifier mapping", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: () => handler,
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: { middle: true },
      ctx
    });

    // Should map to mouseup event
    const event = new Event("mouseup");
    el.dispatchEvent(event);
    expect(handler).toHaveBeenCalled();
  });

  it("should return early when no arg provided", () => {
    const el = document.createElement("div");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    on({
      el,
      get: () => {},
      effect: rawEffect,
      exp: "handler",
      arg: undefined,
      modifiers: undefined,
      ctx
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "v-on=\"obj\" syntax is not supported in pocket-vue."
    );
    consoleSpy.mockRestore();
  });

  it("should warn about deprecated mounted/unmounted hooks", () => {
    const el = document.createElement("div");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    on({
      el,
      get: () => {},
      effect: rawEffect,
      exp: "handler",
      arg: "mounted",
      modifiers: undefined,
      ctx
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "mounted and unmounted hooks now need to be prefixed with vue: " +
      "- use @vue:mounted=\"handler\" instead."
    );

    on({
      el,
      get: () => {},
      effect: rawEffect,
      exp: "handler",
      arg: "unmounted",
      modifiers: undefined,
      ctx
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "mounted and unmounted hooks now need to be prefixed with vue: " +
      "- use @vue:unmounted=\"handler\" instead."
    );

    consoleSpy.mockRestore();
    });

  it('should warn when v-on has no event type in DEV', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalDEV = (globalThis as any).import?.meta?.env?.DEV;
    ;(globalThis as any).import = { meta: { env: { DEV: true } } };

    const el = document.createElement('div');
    const ctx = createContext();

    on({
      el,
      get: () => () => {},
      effect: rawEffect,
      exp: 'handler',
      arg: undefined, // no event type
      modifiers: undefined,
      ctx
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'v-on="obj" syntax is not supported in pocket-vue.'
    );

    consoleSpy.mockRestore();
    if (originalDEV !== undefined) {
      ;(globalThis as any).import.meta.env.DEV = originalDEV;
    } else {
      delete (globalThis as any).import;
    }
  });

  it("should not remap event type when right or middle modifier is used on non-click event", () => {
    const el = document.createElement("button");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "keydown",
      modifiers: { right: true },
      ctx
    });

    // Should remain keydown, not remapped to contextmenu
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Right" }));
    expect(handler).toHaveBeenCalled();
  });

  it("should not log deprecation warning for normal event types in DEV", () => {
    const consoleSpy = vi.spyOn(console, "error");
    const el = document.createElement("button");
    on({
      el,
      get: () => () => {},
      effect: rawEffect,
      exp: "handler",
      arg: "click",
      modifiers: undefined,
      ctx,
    });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should not log error when DEV is false for missing arg or deprecated hooks", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalDEV = import.meta.env.DEV;
    try {
      import.meta.env.DEV = false;
      const el = document.createElement("div");

      on({
        el,
        get: () => () => {},
        effect: rawEffect,
        exp: "handler",
        arg: undefined,
        modifiers: undefined,
        ctx,
      });

      on({
        el,
        get: () => () => {},
        effect: rawEffect,
        exp: "handler",
        arg: "mounted",
        modifiers: undefined,
        ctx,
      });

      on({
        el,
        get: () => () => {},
        effect: rawEffect,
        exp: "handler",
        arg: "unmounted",
        modifiers: undefined,
        ctx,
      });

      expect(consoleSpy).not.toHaveBeenCalled();
    } finally {
      import.meta.env.DEV = originalDEV;
      consoleSpy.mockRestore();
    }
  });

  it("should handle keyboard event without modifiers", () => {
    const el = document.createElement("input");
    const handler = vi.fn();
    ctx.scope.handler = handler;

    on({
      el,
      get: (exp = "handler") => evaluate(ctx.scope, exp, el),
      effect: rawEffect,
      exp: "handler",
      arg: "keydown",
      modifiers: undefined,
      ctx,
    });

    const event = new KeyboardEvent("keydown", { key: "a" });
    el.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(event);
  });
});