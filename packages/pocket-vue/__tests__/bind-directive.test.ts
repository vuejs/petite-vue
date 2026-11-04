import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { nextTick } from "../src/scheduler";
import { reactive } from "@vue/reactivity";
import { createApp } from "../src/app";
import { getElementMetadata } from "../src/metadata";

describe("bind directive", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("v-bind", () => {
    it("should bind attribute", () => {
      container.innerHTML = '<div v-bind:id="dynamicId"></div>';
      const app = createApp({ dynamicId: "test-id" });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("id")).toBe("test-id");
    });

    it("should update attribute when data changes", async () => {
      container.innerHTML = '<div v-bind:id="dynamicId"></div>';
      const data = reactive({ dynamicId: "initial" });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("id")).toBe("initial");
      data.dynamicId = "updated";
      await nextTick();
      const updatedDiv = container.querySelector("div");
      expect(updatedDiv?.getAttribute("id")).toBe("updated");
    });

    it("should handle shorthand syntax", () => {
      container.innerHTML = '<div :id="dynamicId"></div>';
      const app = createApp({ dynamicId: "test-id" });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("id")).toBe("test-id");
    });

    it("should bind a full object of attributes", async () => {
      container.innerHTML = '<div v-bind="attrs"></div>';
      const attrs = reactive({ id: "test-id", "data-foo": "bar" } as Record<string, string | undefined>);
      const app = createApp({ attrs });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("id")).toBe("test-id");
      expect(div?.getAttribute("data-foo")).toBe("bar");

      attrs.id = "new-id";
      attrs["data-foo"] = undefined;
      await nextTick();
      expect(div?.getAttribute("id")).toBe("new-id");
      expect(div?.hasAttribute("data-foo")).toBe(false);
    });

    it("should handle .camel modifier", () => {
      container.innerHTML = '<div :foo-bar.camel="id"></div>';
      const app = createApp({ id: "test" });
      app.mount(container);
      const div = container.querySelector("div");
      // @ts-ignore
      expect(div.fooBar).toBe("test");
    });

    it("should bind style as string", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: "color: red" });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.style.color).toBe("red");

      data.style = "color: blue";
      await nextTick();
      expect(div?.style.color).toBe("blue");
    });

    it("should bind style as object", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: { color: "red", fontSize: "12px" } as Record<string, string> });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.style.color).toBe("red");
      expect(div?.style.fontSize).toBe("12px");

      data.style = { color: "blue" };
      await nextTick();
      expect(div?.style.color).toBe("blue");
      expect(div?.style.fontSize).toBe("");
    });

    it("should bind style with !important", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: { color: "red !important" } });
      createApp(data).mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.getPropertyValue("color")).toBe("red");
      expect(div.style.getPropertyPriority("color")).toBe("important");
    });

    it("should bind style with CSS variables", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: { "--color": "red" } });
      createApp(data).mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.getPropertyValue("--color")).toBe("red");
    });

    it("should remove style attribute when style becomes falsy", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: "color: red" });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.hasAttribute("style")).toBe(true);

      data.style = "";
      await nextTick();
      expect(div.hasAttribute("style")).toBe(false);
    });

    it("should handle style with array values", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ style: { color: ["red", "blue"] } });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;
      // With array values, the last one should win
      expect(div.style.color).toBe("blue");
    });

    it("should remove attribute if value is null or undefined", async () => {
      container.innerHTML = '<div :id="id"></div>';
      const data = reactive({ id: "test-id" as string | undefined });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("id")).toBe("test-id");

      data.id = "test-id";
      await nextTick();
      expect(div?.getAttribute("id")).toBe("test-id");

      data.id = undefined;
      await nextTick();
      expect(div?.hasAttribute("id")).toBe(false);
    });

    it("should bind true-value and false-value for checkboxes", async () => {
      container.innerHTML =
        '<input type="checkbox" :true-value="a" :false-value="b" v-model="checked">';
      const data = reactive({ a: "yes", b: "no", checked: "yes" });
      const app = createApp(data);
      app.mount(container);
      const input = container.querySelector("input")!;
      expect(input.checked).toBe(true);

      input.click();
      await nextTick();
      expect(data.checked).toBe("no");

      data.checked = "yes";
      await nextTick();
      expect(input.checked).toBe(true);
    });

    it("should merge with existing class", async () => {
      container.innerHTML = '<div class="static" :class="dynamic"></div>';
      const data = reactive({ dynamic: "dynamic" });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.className).toBe("static dynamic");

      data.dynamic = "updated";
      await nextTick();
      expect(div?.className).toBe("static updated");
    });

    it("should bind value for input", async () => {
      container.innerHTML = '<input :value="message">';
      const data = reactive({ message: "hello" });
      const app = createApp(data);
      app.mount(container);
      const input = container.querySelector("input")!;
      expect(input.value).toBe("hello");

      data.message = "world";
      await nextTick();
      expect(input.value).toBe("world");
    });

    it("should handle transition from string style to object style without mutating string keys", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive<{ style: any }>({ style: "color: red" });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.color).toBe("red");

      data.style = { fontSize: "14px" };
      await nextTick();
      expect(div.style.fontSize).toBe("14px");
    });

    it("should remove properties that were removed in next style object", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive<{ style: any }>({ style: { color: "red", fontSize: "14px" } });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("14px");

      data.style = { fontSize: "14px" };
      await nextTick();
      expect(div.style.color).toBe("");
      expect(div.style.fontSize).toBe("14px");
    });

    it("should handle !important without leading whitespace and preserve normal style priority", () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({
        style: {
          color: "red!important",
          fontSize: "16px",
        },
      });
      createApp(data).mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.getPropertyValue("color")).toBe("red");
      expect(div.style.getPropertyPriority("color")).toBe("important");
      expect(div.style.getPropertyValue("font-size")).toBe("16px");
      expect(div.style.getPropertyPriority("font-size")).toBe("");
    });

    it("should not reassign cssText when string style value is unchanged", async () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({ color: "green", trigger: 0 });
      const app = createApp({
        get style() {
          return "color: " + data.color + (data.trigger ? "" : "");
        },
        data,
      });
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.color).toBe("green");

      const cssTextSpy = vi.spyOn(CSSStyleDeclaration.prototype, "cssText", "set");
      data.trigger++;
      await nextTick();

      expect(cssTextSpy).not.toHaveBeenCalled();
      cssTextSpy.mockRestore();
    });

    it("should not match !important when not at the end of the value", () => {
      container.innerHTML = '<div :style="style"></div>';
      const data = reactive({
        style: {
          content: '"!important note"',
        },
      });
      createApp(data).mount(container);
      const div = container.querySelector("div")!;
      expect(div.style.getPropertyPriority("content")).toBe("");
    });

    it("should handle null class binding without static class", () => {
      container.innerHTML = '<div :class="cls"></div>';
      const app = createApp({ cls: null });
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.getAttribute("class")).toBe("");
    });

    it("should remove title, lang, and dir attributes when set to null", async () => {
      container.innerHTML = '<div :title="title" :lang="lang" :dir="dir"></div>';
      const data = reactive<{ title: string | null; lang: string | null; dir: string | null }>({
        title: "Hello",
        lang: "en",
        dir: "ltr",
      });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;
      expect(div.getAttribute("title")).toBe("Hello");
      expect(div.getAttribute("lang")).toBe("en");
      expect(div.getAttribute("dir")).toBe("ltr");

      data.title = null;
      data.lang = null;
      data.dir = null;
      await nextTick();

      expect(div.hasAttribute("title")).toBe(false);
      expect(div.hasAttribute("lang")).toBe(false);
      expect(div.hasAttribute("dir")).toBe(false);
    });

    it("should not store originalClass in metadata when binding non-class attributes", () => {
      container.innerHTML = '<div class="static-only" :id="id"></div>';
      const app = createApp({ id: "my-id" });
      app.mount(container);
      const div = container.querySelector("div")!;
      const metadata = getElementMetadata(div);
      expect(metadata.originalClass).toBeUndefined();
    });

    it("should assign raw _value when binding :value and not for other properties", async () => {
      container.innerHTML = '<input :value="val" :disabled="dis">';
      const complex = { id: 42 };
      const data = reactive<{ val: any; dis: boolean }>({ val: complex, dis: true });
      const app = createApp(data);
      app.mount(container);
      const input = container.querySelector("input")!;
      expect((input as any)._value).toStrictEqual(complex);
      expect((input as any)._value.id).toBe(42);
      expect((input as any)._disabled).toBeUndefined();

      const nextVal = { id: 99 };
      data.val = nextVal;
      await nextTick();
      expect((input as any)._value).toStrictEqual(nextVal);
      expect((input as any)._value.id).toBe(99);
    });

    it("should set attributes on SVG elements", () => {
      container.innerHTML = '<svg :width="w" :height="h"></svg>';
      const app = createApp({ w: "100", h: "50" });
      app.mount(container);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("width")).toBe("100");
      expect(svg.getAttribute("height")).toBe("50");
    });

    it("should force exact attributes to setAttribute and allow prefixed/suffixed properties", () => {
      container.innerHTML = `
        <form :enctype="enc">
          <button :form-action.camel="action" :form="formId">Submit</button>
        </form>
      `;
      const formEl = container.querySelector("form")!;
      const btnEl = container.querySelector("button")!;
      const formSetAttr = vi.spyOn(formEl, "setAttribute");
      const btnSetAttr = vi.spyOn(btnEl, "setAttribute");

      const app = createApp({
        enc: "multipart/form-data",
        action: "/submit",
        formId: "main-form",
      });
      app.mount(container);

      expect(formEl.enctype).toBe("multipart/form-data");
      expect(btnEl.getAttribute("form")).toBe("main-form");
      expect(btnEl.formAction).toContain("/submit");

      expect(formSetAttr).not.toHaveBeenCalledWith("enctype", expect.anything());
      expect(btnSetAttr).not.toHaveBeenCalledWith("formAction", expect.anything());
      expect(btnSetAttr).toHaveBeenCalledWith("form", "main-form");

      formSetAttr.mockRestore();
      btnSetAttr.mockRestore();
    });

    it("should handle object binding with key removal", async () => {
      container.innerHTML = '<div v-bind="attrs"></div>';
      const data = reactive({
        attrs: {
          id: "test",
          "data-foo": "bar",
          "data-baz": "qux"
        } as Record<string, string | undefined>
      });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;

      expect(div.getAttribute("id")).toBe("test");
      expect(div.getAttribute("data-foo")).toBe("bar");
      expect(div.getAttribute("data-baz")).toBe("qux");

      // Remove some keys from the object
      data.attrs = { id: "new-id" };
      await nextTick();

      expect(div.getAttribute("id")).toBe("new-id");
      expect(div.hasAttribute("data-foo")).toBe(false);
      expect(div.hasAttribute("data-baz")).toBe(false);
    });

    it("should handle object binding with all keys removed", async () => {
      container.innerHTML = '<div v-bind="attrs"></div>';
      const data = reactive({
        attrs: { "data-test": "value" } as Record<string, string | undefined>
      });
      const app = createApp(data);
      app.mount(container);
      const div = container.querySelector("div")!;

      expect(div.getAttribute("data-test")).toBe("value");

      // Remove all keys
      data.attrs = {};
      await nextTick();

      expect(div.hasAttribute("data-test")).toBe(false);
    });
  });

});
