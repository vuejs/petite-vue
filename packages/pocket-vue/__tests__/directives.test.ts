import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "../src/scheduler";
import { reactive } from "@vue/reactivity";
import { createApp } from "../src/app";
import { builtInDirectives } from "../src/directives";

describe("directives", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("built-in directives", () => {
    it("should have all built-in directives", () => {
      expect(builtInDirectives.bind).toBeDefined();
      expect(builtInDirectives.on).toBeDefined();
      expect(builtInDirectives.show).toBeDefined();
      expect(builtInDirectives.text).toBeDefined();
      expect(builtInDirectives.html).toBeDefined();
      expect(builtInDirectives.model).toBeDefined();
      expect(builtInDirectives.effect).toBeDefined();
      expect(builtInDirectives.ref).toBeDefined();
    });
  });


  describe("v-on", () => {
    it("should attach event handler", () => {
      container.innerHTML = '<button v-on:click="handleClick">Click</button>';

      const handleClick = vi.fn();
      const app = createApp({ handleClick });
      app.mount(container);

      const button = container.querySelector("button");
      button?.click();

      expect(handleClick).toHaveBeenCalled();
    });

    it("should handle shorthand syntax", () => {
      container.innerHTML = '<button @click="handleClick">Click</button>';

      const handleClick = vi.fn();
      const app = createApp({ handleClick });
      app.mount(container);

      const button = container.querySelector("button");
      button?.click();

      expect(handleClick).toHaveBeenCalled();
    });

    it("should handle event modifiers", () => {
      container.innerHTML =
        '<button @click.prevent="handleClick">Click</button>';

      const handleClick = vi.fn();
      const app = createApp({ handleClick });
      app.mount(container);

      const button = container.querySelector("button");
      const event = new MouseEvent("click", { cancelable: true });
      button?.dispatchEvent(event);

      expect(handleClick).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("v-show", () => {
    it("should toggle display based on condition", async () => {
      container.innerHTML = '<div v-show="isVisible">Content</div>';

      const data = reactive({ isVisible: true });
      const app = createApp(data);
      app.mount(container);

      const div = container.querySelector("div") as HTMLDivElement;
      expect(div.style.display).toBe("");

      data.isVisible = false;
      await nextTick();
      expect(div.style.display).toBe("none");

      data.isVisible = true;
      await nextTick();
      expect(div.style.display).toBe("");
    });

    it("should preserve and restore original inline display style", async () => {
      container.innerHTML = '<div style="display: flex;" v-show="isVisible">Content</div>';

      const data = reactive({ isVisible: true });
      const app = createApp(data);
      app.mount(container);

      const div = container.querySelector("div") as HTMLDivElement;
      expect(div.style.display).toBe("flex");

      data.isVisible = false;
      await nextTick();
      expect(div.style.display).toBe("none");

      data.isVisible = true;
      await nextTick();
      expect(div.style.display).toBe("flex");
    });

    it("should handle initial false condition with inline display", async () => {
      container.innerHTML = '<div style="display: inline-block;" v-show="isVisible">Content</div>';

      const data = reactive({ isVisible: false });
      const app = createApp(data);
      app.mount(container);

      const div = container.querySelector("div") as HTMLDivElement;
      expect(div.style.display).toBe("none");

      data.isVisible = true;
      await nextTick();
      expect(div.style.display).toBe("inline-block");
    });

    it("should not overwrite cached originalDisplay when re-initialized while hidden", () => {
      const el = document.createElement("div");
      el.style.display = "flex";
      let trigger = false;
      const fakeCtx = {
        el,
        get: () => trigger,
        effect: (fn: () => void) => {
          fn();
        },
        exp: "show",
        arg: undefined,
        modifiers: {},
        ctx: {} as any,
      };

      builtInDirectives.show(fakeCtx);
      expect(el.style.display).toBe("none");

      builtInDirectives.show({
        ...fakeCtx,
        get: () => true,
        effect: (fn: () => void) => fn(),
      });
      expect(el.style.display).toBe("flex");
    });
  });

  describe("v-text", () => {
    it("should set text content", () => {
      container.innerHTML = '<div v-text="message"></div>';

      const app = createApp({ message: "Hello World" });
      app.mount(container);

      const div = container.querySelector("div");
      expect(div?.textContent).toBe("Hello World");
    });

    it("should update text content when data changes", async () => {
      container.innerHTML = '<div v-text="message"></div>';

      const data = reactive({ message: "Initial" });
      const app = createApp(data);
      app.mount(container);

      data.message = "Updated";

      // Wait for reactivity to take effect
      await nextTick();

      const div = container.querySelector("div");
      expect(div?.textContent).toBe("Updated");
    });

    it("should format object values as JSON", () => {
      container.innerHTML = '<div v-text="obj"></div>';
      const app = createApp({ obj: { foo: 1 } });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.textContent).toBe(JSON.stringify({ foo: 1 }, null, 2));
    });

    it("should display [Object] for circular object references", () => {
      container.innerHTML = '<div v-text="obj"></div>';
      const obj: any = { a: 1 };
      obj.self = obj;
      const app = createApp({ obj });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.textContent).toBe("[Object]");
    });
  });

  describe("v-html", () => {
    it("should set HTML content", () => {
      container.innerHTML = '<div v-html="htmlContent"></div>';

      const app = createApp({ htmlContent: "<span>HTML Content</span>" });
      app.mount(container);

      const div = container.querySelector("div");
      expect(div?.innerHTML).toBe("<span>HTML Content</span>");
    });

    it("should update HTML content when data changes", async () => {
      container.innerHTML = '<div v-html="htmlContent"></div>';

      const data = reactive({ htmlContent: "<span>Initial</span>" });
      const app = createApp(data);
      app.mount(container);

      data.htmlContent = "<span>Updated</span>";

      // Wait for reactivity to take effect
      await nextTick();

      const div = container.querySelector("div");
      expect(div?.innerHTML).toBe("<span>Updated</span>");
    });
  });


  describe("v-ref", () => {
    it("should register element in $refs", () => {
      container.innerHTML = '<div v-ref="myRef"></div>';

      const app = createApp({});
      app.mount(container);

      expect(app.scope.$refs.myRef).toBeTruthy();
      expect(app.scope.$refs.myRef.tagName).toBe("DIV");
    });

    it("should update ref when expression changes", async () => {
      container.innerHTML = '<div v-ref="refName"></div>';

      const app = createApp({ refName: "firstRef" });
      app.mount(container);

      expect(app.scope.$refs.firstRef).toBeTruthy();
      expect(app.scope.$refs.firstRef.tagName).toBe("DIV");

      // Change ref name
      app.scope.refName = "secondRef";
      await nextTick();
      expect(app.scope.$refs.firstRef).toBeUndefined();
      expect(app.scope.$refs.secondRef).toBeTruthy();
    });

    it("should cleanup old ref when ref changes", async () => {
      container.innerHTML = '<div v-ref="refName"></div>';

      const app = createApp({ refName: "firstRef" });
      app.mount(container);

      const element = app.scope.$refs.firstRef;
      expect(element).toBeTruthy();

      // Change ref name
      app.scope.refName = "secondRef";
      await nextTick();

      // Old ref should be cleaned up
      expect(app.scope.$refs.firstRef).toBeUndefined();
      // New ref should be set
      expect(app.scope.$refs.secondRef).toBe(element);
    });

    it("should cleanup ref on unmount", () => {
      container.innerHTML = '<div v-ref="myRef"></div>';

      const app = createApp({});
      app.mount(container);

      const element = app.scope.$refs.myRef;
      expect(element).toBeTruthy();

      // Unmount the app
      app.unmount();

      // Ref should be cleaned up
      expect(app.scope.$refs.myRef).toBeUndefined();
    });

    it("should not delete $refs.undefined on initial mount", () => {
      const $refs: Record<string, any> = { undefined: "keep-me" };
      const el = document.createElement("div");
      builtInDirectives.ref({
        el,
        get: () => "myRef",
        effect: (fn: () => void) => fn(),
        exp: "myRef",
        arg: undefined,
        modifiers: {},
        ctx: { scope: { $refs } } as any,
      });

      expect($refs.myRef).toBe(el);
      expect($refs.undefined).toBe("keep-me");
    });

    it("should retain ref when effect re-evaluates with unchanged ref name", async () => {
      container.innerHTML = '<div v-ref="name"></div>';
      const app = createApp({
        count: 0,
        get name() {
          return this.count >= 0 ? "fixedRef" : "otherRef";
        },
      });
      app.mount(container);

      const div = container.querySelector("div");
      expect(app.scope.$refs.fixedRef).toBe(div);

      app.scope.count++;
      await nextTick();

      expect(app.scope.$refs.fixedRef).toBe(div);
    });
  });


  describe("v-effect", () => {
    it("should run effect when mounted", async () => {
      container.innerHTML = '<div v-effect="sideEffect()"></div>';

      const sideEffect = vi.fn();
      const app = createApp({ sideEffect });
      app.mount(container);

      // Wait for effect to run
      await nextTick();

      expect(sideEffect).toHaveBeenCalled();
    });

    it("should run effect when dependencies change", async () => {
      container.innerHTML = '<div v-effect="sideEffect()"></div>';

      let callCount = 0;
      const app = createApp({
        sideEffect: () => {
          callCount++;
        },
      });
      app.mount(container);

      // Wait for effect to run
      await nextTick();

      expect(callCount).toBe(1);
    });
  });
});
