import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "../src/scheduler";
import { reactive } from "@vue/reactivity";
import { createApp } from "../src/app";
import { builtInDirectives } from "../src/directives";
import { onCompositionEnd, updateTextValue, handleCheckboxChange, handleTextInput, updateCheckboxValue, handleRadioChange } from "../src/directives/model";
import { createContext, createScopedContext } from "../src/context";

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

  describe("v-model", () => {
    it("should bind input value", () => {
      container.innerHTML = '<input v-model="message">';

      const app = createApp({ message: "test" });
      app.mount(container);

      const input = container.querySelector("input");
      expect(input?.value).toBe("test");
    });

    it("should update data when input changes", () => {
      container.innerHTML = '<input v-model="message">';

      const data = reactive({ message: "initial" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input");
      input!.value = "updated";
      input?.dispatchEvent(new Event("input"));

      expect(data.message).toBe("updated");
    });

    it("should work with checkbox with array", async () => {
      container.innerHTML = `
        <input type="checkbox" value="a" v-model="checked">
        <input type="checkbox" value="b" v-model="checked">
      `;

      const data = reactive({ checked: ["a"] });
      const app = createApp(data);
      app.mount(container);

      const a = container.querySelector('input[value="a"]') as HTMLInputElement;
      const b = container.querySelector('input[value="b"]') as HTMLInputElement;

      expect(a.checked).toBe(true);
      expect(b.checked).toBe(false);

      b.click();
      await nextTick();
      expect(data.checked).toEqual(["a", "b"]);

      a.click();
      await nextTick();
      expect(data.checked).toEqual(["b"]);
    });

    it("should work with radio buttons", async () => {
      container.innerHTML = `
        <input type="radio" value="a" v-model="picked">
        <input type="radio" value="b" v-model="picked">
      `;

      const data = reactive({ picked: "a" });
      const app = createApp(data);
      app.mount(container);

      const a = container.querySelector('input[value="a"]') as HTMLInputElement;
      const b = container.querySelector('input[value="b"]') as HTMLInputElement;

      expect(a.checked).toBe(true);
      expect(b.checked).toBe(false);

      b.click();
      await nextTick();
      expect(data.picked).toBe("b");
    });

    it("should work with .lazy modifier", async () => {
      container.innerHTML = '<input v-model.lazy="message">';

      const data = reactive({ message: "initial" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input")!;
      input.value = "updated";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.message).toBe("initial");

      input.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.message).toBe("updated");
    });

    it("should work with textarea", () => {
      container.innerHTML = '<textarea v-model="message"></textarea>';

      const app = createApp({ message: "test" });
      app.mount(container);

      const textarea = container.querySelector("textarea");
      expect(textarea?.value).toBe("test");
    });

    it("should work with select", () => {
      container.innerHTML = `
    <select v-model="selected">
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    </select>
    `;

      const app = createApp({ selected: "option2" });
      app.mount(container);

      const select = container.querySelector("select");
      expect(select?.value).toBe("option2");
    });

    it("should work with multiple select", async () => {
      container.innerHTML = `
        <select v-model="selected" multiple>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      `;

      const data = reactive({ selected: ["option1", "option3"] });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.options[0].selected).toBe(true);
      expect(select.options[1].selected).toBe(false);
      expect(select.options[2].selected).toBe(true);

      // Change selection
      select.options[1].selected = true;
      select.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.selected).toEqual(["option1", "option2", "option3"]);
    });

    it("should handle select with non-matching value", () => {
      container.innerHTML = `
        <select v-model="selected">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
      `;

      const app = createApp({ selected: "option3" });
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.selectedIndex).toBe(-1);
    });

    it("should handle multiple select with non-array value", () => {
      container.innerHTML = `
        <select v-model="selected" multiple>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
      `;

      const app = createApp({ selected: "notarray" });
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.options[0].selected).toBe(false);
      expect(select.options[1].selected).toBe(false);
    });

    it("should work with select with number modifier", async () => {
      container.innerHTML = `
        <select v-model.number="selected">
          <option value="1">One</option>
          <option value="2">Two</option>
        </select>
      `;

      const data = reactive({ selected: 2 });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.value).toBe("2");

      select.value = "1";
      select.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.selected).toBe(1);
    });

    it("should work with single checkbox", async () => {
      container.innerHTML = '<input type="checkbox" v-model="checked">';

      const data = reactive({ checked: true });
      const app = createApp(data);
      app.mount(container);

      const checkbox = container.querySelector("input") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      checkbox.click();
      await nextTick();
      expect(data.checked).toBe(false);
    });

    it("should work with number input", async () => {
      container.innerHTML = '<input type="number" v-model="value">';

      const data = reactive({ value: 42 });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("42");

      input.value = "123";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe(123);
    });

    it("should work with trim modifier", async () => {
      container.innerHTML = '<input v-model.trim="value">';

      const data = reactive({ value: "test" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      input.value = "  trimmed  ";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe("trimmed");

      input.dispatchEvent(new Event("change"));
      await nextTick();
      expect(input.value).toBe("trimmed");
    });

    it("should handle composition events", async () => {
      container.innerHTML = '<input v-model="value">';

      const data = reactive({ value: "test" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;

      // Simulate composition start
      input.dispatchEvent(new Event("compositionstart"));
      expect((input as any).composing).toBe(true);

      // Change input value during composition - should be ignored
      input.value = "composed";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe("test"); // should not update during composition

      // Composition end should trigger update
      input.dispatchEvent(new Event("compositionend"));
      expect((input as any).composing).toBe(false);
      expect(data.value).toBe("composed"); // should update after composition end

      // Test multiple composition cycles
      input.dispatchEvent(new Event("compositionstart"));
      input.value = "second";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe("composed"); // still should not update

      input.dispatchEvent(new Event("compositionend"));
      expect(data.value).toBe("second"); // should update to new value
    });

    it("should handle composition end when composing", () => {
      const input = document.createElement('input');
      (input as any).composing = true;

      const mockDispatch = vi.spyOn(input, 'dispatchEvent');
      const event = new Event('compositionend');
      Object.defineProperty(event, 'target', { value: input });

      onCompositionEnd(event);

      expect((input as any).composing).toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'input' })
      );
    });

    it("should not trigger input when not composing", () => {
      const input = document.createElement('input');
      (input as any).composing = false;

      const mockDispatch = vi.spyOn(input, 'dispatchEvent');
      const event = new Event('compositionend');
      Object.defineProperty(event, 'target', { value: input });

      onCompositionEnd(event);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should skip update when composing", () => {
      const input = document.createElement('input');
      (input as any).composing = true;
      input.value = 'old';

      updateTextValue(input, () => 'new', (val) => val);

      expect(input.value).toBe('old'); // should not update
    });

    it("should update text value when not composing", () => {
      const input = document.createElement('input');
      (input as any).composing = false;
      input.value = 'old';

      updateTextValue(input, () => 'new', (val) => val);

      expect(input.value).toBe('new');
    });

    it("should handle lazy modifier with number input type edge case", async () => {
      container.innerHTML = '<input type="number" v-model.lazy="value">';

      const data = reactive({ value: 0 });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;

      // Input event should not update immediately with lazy modifier
      input.value = "123";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe(0);

      // Change event should update
      input.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.value).toBe(123);
    });

    it("should handle checkbox with custom true/false values and non-array model", async () => {
      container.innerHTML = '<input type="checkbox" :true-value="yes" :false-value="no" v-model="checked">';

      const data = reactive({ yes: "yes-value", no: "no-value", checked: "yes-value" });
      const app = createApp(data);
      app.mount(container);

      const checkbox = container.querySelector("input") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      // Uncheck it
      checkbox.click();
      await nextTick();
      expect(data.checked).toBe("no-value");

      // Check it again
      checkbox.click();
      await nextTick();
      expect(data.checked).toBe("yes-value");
    });

    it("should skip update when active element and values match", () => {
      const input = document.createElement('input');
      (input as any).composing = false;
      input.value = 'same';
      input.focus();

      updateTextValue(input, () => 'same', (val) => val);

      expect(input.value).toBe('same'); // should not change
    });

    it("should handle checkbox change for array add", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.value = 'test';

      const modelValue = ['existing'];
      const assign = vi.fn();

      handleCheckboxChange(checkbox, () => modelValue, assign);

      expect(assign).toHaveBeenCalledWith(['existing', 'test']);
    });

    it("should handle checkbox change for array remove", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      checkbox.value = 'test';

      const modelValue = ['existing', 'test'];
      const assign = vi.fn();

      handleCheckboxChange(checkbox, () => modelValue, assign);

      expect(assign).toHaveBeenCalledWith(['existing']);
    });

    it("should handle checkbox change for single value", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;

      const assign = vi.fn();

      handleCheckboxChange(checkbox, () => false, assign);

      expect(assign).toHaveBeenCalledWith(true);
    });

    it("should handle text input when not composing", () => {
      const input = document.createElement('input');
      input.value = 'test value';
      (input as any).composing = false;

      const assign = vi.fn();

      handleTextInput(input, assign);

      expect(assign).toHaveBeenCalledWith('test value');
    });

    it("should skip text input when composing", () => {
      const input = document.createElement('input');
      input.value = 'test value';
      (input as any).composing = true;

      const assign = vi.fn();

      handleTextInput(input, assign);

      expect(assign).not.toHaveBeenCalled();
    });

    it("should update checkbox value for array", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = 'test';

      updateCheckboxValue(checkbox, () => ['test'], undefined);

      expect(checkbox.checked).toBe(true);
    });

    it("should update checkbox value for single when changed", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      updateCheckboxValue(checkbox, () => true, false);

      expect(checkbox.checked).toBe(true);
    });

    it("should handle radio change", () => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.value = 'test';

      const assign = vi.fn();

      handleRadioChange(radio, assign);

      expect(assign).toHaveBeenCalledWith('test');
    });

    it("should handle active element check", async () => {
      container.innerHTML = '<input v-model="value">';

      const data = reactive({ value: "test" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      input.focus();
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe("test");

      // Change input value manually (simulating user typing)
      input.value = "modified";
      // When data changes to same resolved value as current input, should not update input
      data.value = "modified"; // same as current input value
      await nextTick();
      expect(input.value).toBe("modified"); // should not change
    });

    it("should work with select with multiple attribute", async () => {
      container.innerHTML = `
        <select v-model="selected" multiple>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      `;

      const data = reactive({ selected: ["option1", "option3"] });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select")!;
      expect(select.selectedOptions[0].value).toBe("option1");
      expect(select.selectedOptions[1].value).toBe("option3");

      select.options[1].selected = true;
      select.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.selected.sort()).toEqual(
        ["option1", "option2", "option3"].sort(),
      );
    });


    it("should handle checkbox with array values", () => {
      container.innerHTML = `
        <input type="checkbox" v-model="selected" value="option1" />
        <input type="checkbox" v-model="selected" value="option2" />
        <input type="checkbox" v-model="selected" value="option3" />
      `;

      const app = createApp({ selected: ["option1", "option3"] });
      app.mount(container);

      const checkboxes = container.querySelectorAll("input[type='checkbox']");
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
      expect((checkboxes[2] as HTMLInputElement).checked).toBe(true);

      // Uncheck first option
      (checkboxes[0] as HTMLInputElement).checked = false;
      checkboxes[0].dispatchEvent(new Event("change"));
      expect(app.scope.selected).toEqual(["option3"]);

      // Check second option
      (checkboxes[1] as HTMLInputElement).checked = true;
      checkboxes[1].dispatchEvent(new Event("change"));
      expect(app.scope.selected).toEqual(["option3", "option2"]);
    });

    it("should handle radio buttons", () => {
      container.innerHTML = `
        <input type="radio" v-model="selected" value="option1" />
        <input type="radio" v-model="selected" value="option2" />
        <input type="radio" v-model="selected" value="option3" />
      `;

      const app = createApp({ selected: "option2" });
      app.mount(container);

      const radios = container.querySelectorAll("input[type='radio']");
      expect((radios[0] as HTMLInputElement).checked).toBe(false);
      expect((radios[1] as HTMLInputElement).checked).toBe(true);
      expect((radios[2] as HTMLInputElement).checked).toBe(false);

      // Select first option
      (radios[0] as HTMLInputElement).checked = true;
      radios[0].dispatchEvent(new Event("change"));
      expect(app.scope.selected).toBe("option1");
    });

    it("should handle lazy modifier", async () => {
      container.innerHTML = '<input v-model.lazy="message" />';

      const app = createApp({ message: "" });
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      input.value = "test";

      // Should not update on input event
      input.dispatchEvent(new Event("input"));
      expect(app.scope.message).toBe("");

      // Should update on change event
      input.dispatchEvent(new Event("change"));
      expect(app.scope.message).toBe("test");
    });

    it("should handle number modifier", () => {
      container.innerHTML = '<input v-model.number="count" />';

      const app = createApp({ count: 0 });
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      input.value = "42";
      input.dispatchEvent(new Event("input"));
      expect(app.scope.count).toBe(42);
      expect(typeof app.scope.count).toBe("number");

      input.value = "not a number";
      input.dispatchEvent(new Event("input"));
      expect(app.scope.count).toBe("not a number");
      expect(typeof app.scope.count).toBe("string");
    });

    it("should handle trim modifier", () => {
      container.innerHTML = '<input v-model.trim="message" />';

      const app = createApp({ message: "" });
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      input.value = "  test  ";
      input.dispatchEvent(new Event("input"));
      expect(app.scope.message).toBe("test");
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

  describe("v-for", () => {
    it("should render list items", () => {
      container.innerHTML = `
        <div v-for="item in items" :key="item.id">
          {{ item.name }}
        </div>
      `;

      const app = createApp({
        items: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" }
        ]
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("Item 1");
      expect(divs[1].textContent?.trim()).toBe("Item 2");
    });

    it("should handle object iteration", () => {
      container.innerHTML = `
        <div v-for="(value, key) in obj" :key="key">
          {{ key }}: {{ value }}
        </div>
      `;

      const app = createApp({
        obj: { a: 1, b: 2 }
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("a: 1");
      expect(divs[1].textContent?.trim()).toBe("b: 2");
    });

    it("should handle array with index", () => {
      container.innerHTML = `
        <div v-for="(item, index) in items" :key="index">
          {{ index }}: {{ item }}
        </div>
      `;

      const app = createApp({
        items: ["a", "b"]
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("0: a");
      expect(divs[1].textContent?.trim()).toBe("1: b");
    });

    it("should handle object iteration with index", () => {
      container.innerHTML = `
        <div v-for="(value, key, index) in obj" :key="key">
          {{ index }}: {{ key }}: {{ value }}
        </div>
      `;

      const app = createApp({
        obj: { a: 1, b: 2 }
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("0: a: 1");
      expect(divs[1].textContent?.trim()).toBe("1: b: 2");
    });

    it("should handle nested object iteration", () => {
      container.innerHTML = `
        <div v-for="(value, key) in obj" :key="key">
          <span v-for="(nestedValue, nestedKey) in value" :key="nestedKey">
            {{ nestedKey }}: {{ nestedValue }}
          </span>
        </div>
      `;

      const app = createApp({
        obj: {
          group1: { a: 1, b: 2 },
          group2: { c: 3, d: 4 }
        }
      });
      app.mount(container);

      const spans = container.querySelectorAll("span");
      expect(spans.length).toBe(4);
      expect(spans[0].textContent?.trim()).toBe("a: 1");
      expect(spans[1].textContent?.trim()).toBe("b: 2");
      expect(spans[2].textContent?.trim()).toBe("c: 3");
      expect(spans[3].textContent?.trim()).toBe("d: 4");
    });

    it("should handle dynamic list updates", async () => {
      container.innerHTML = `
        <div v-for="item in items" :key="item">
          {{ item }}
        </div>
      `;

      const app = createApp({
        items: ["a", "b"]
      });
      app.mount(container);

      let divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);

      // Add new item
      app.scope.items.push("c");
      await nextTick();
      divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[2].textContent?.trim()).toBe("c");

      // Remove item
      app.scope.items.pop();
      await nextTick();
      divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
    });

    it("should handle empty array", () => {
      container.innerHTML = `
        <div v-for="item in items" :key="item">
          {{ item }}
        </div>
      `;

      const app = createApp({
        items: []
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(0);
    });

    it("should handle null/undefined array", () => {
      container.innerHTML = `
    <div v-for="item in items" :key="item">
    {{ item }}
    </div>
    `;

      const app = createApp({
        items: null
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(0);

      // Set to undefined
      app.scope.items = undefined;
      expect(divs.length).toBe(0);
    });

    it("should handle array destructuring", () => {
      container.innerHTML = `
        <div v-for="[a, b], index in items" :key="index">
          {{ a }}, {{ b }}
        </div>
      `;

      const app = createApp({
        items: [[1, 2], [3, 4]]
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("1, 2");
      expect(divs[1].textContent?.trim()).toBe("3, 4");
    });

    it("should handle object destructuring", () => {
      container.innerHTML = `
        <div v-for="{name, age} in items" :key="name">
          {{ name }}: {{ age }}
        </div>
      `;

      const app = createApp({
        items: [
          { name: "John", age: 25 },
          { name: "Jane", age: 30 }
        ]
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("John: 25");
      expect(divs[1].textContent?.trim()).toBe("Jane: 30");
    });

    it("should handle v-for block reuse when keys change completely", async () => {
      container.innerHTML = `
        <div v-for="item in items" :key="item.id">
          {{ item.name }}
        </div>
      `;

      const data = reactive({
        items: [{ id: 1, name: "First" }, { id: 2, name: "Second" }]
      });
      const app = createApp(data);
      app.mount(container);

      let divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("First");

      // Replace with completely new items (new keys, should create new blocks)
      data.items = [{ id: 3, name: "Third" }, { id: 4, name: "Fourth" }];
      await nextTick();

      divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("Third");
      expect(divs[1].textContent?.trim()).toBe("Fourth");
    });

    it("should handle v-for as last element in container", () => {
      container.innerHTML = `<div v-for="item in items">{{ item }}</div>`;

      const app = createApp({
        items: ["A", "B", "C"]
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[0].textContent).toBe("A");
      expect(divs[1].textContent).toBe("B");
      expect(divs[2].textContent).toBe("C");
    });

    it("should handle complex reordering", async () => {
      container.innerHTML = `
    <div v-for="item in items" :key="item.id">
    {{ item.value }}
    </div>
    `;

      const data = reactive({
        items: [
          { id: 1, value: 'A' },
          { id: 2, value: 'B' },
          { id: 3, value: 'C' },
          { id: 4, value: 'D' }
        ]
      });
      const app = createApp(data);
      app.mount(container);

      let divs = container.querySelectorAll("div");
      expect(divs.length).toBe(4);
      expect(divs[0].textContent?.trim()).toBe("A");
      expect(divs[1].textContent?.trim()).toBe("B");
      expect(divs[2].textContent?.trim()).toBe("C");
      expect(divs[3].textContent?.trim()).toBe("D");

      // Complex reordering: D, B, A, C - this should trigger various move conditions
      data.items = [
        { id: 4, value: 'D' },
        { id: 2, value: 'B' },
        { id: 1, value: 'A' },
        { id: 3, value: 'C' }
      ];
      await nextTick();

      divs = container.querySelectorAll("div");
      expect(divs.length).toBe(4);
      expect(divs[0].textContent?.trim()).toBe("D");
      expect(divs[1].textContent?.trim()).toBe("B");
      expect(divs[2].textContent?.trim()).toBe("A");
      expect(divs[3].textContent?.trim()).toBe("C");
    });

    it("should handle adding items in the middle", async () => {
      container.innerHTML = `
        <div v-for="item in items" :key="item.id">
          {{ item.value }}
        </div>
      `;

      const data = reactive({
        items: [
          { id: 1, value: 'A' },
          { id: 3, value: 'C' }
        ]
      });
      const app = createApp(data);
      app.mount(container);

      let divs = container.querySelectorAll("div");
      expect(divs.length).toBe(2);
      expect(divs[0].textContent?.trim()).toBe("A");
      expect(divs[1].textContent?.trim()).toBe("C");

      // Add item in the middle
      data.items.splice(1, 0, { id: 2, value: 'B' });
      await nextTick();

      divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[0].textContent?.trim()).toBe("A");
      expect(divs[1].textContent?.trim()).toBe("B");
      expect(divs[2].textContent?.trim()).toBe("C");
    });





  });

  describe("v-for integration tests", () => {
    it("should handle complex list reordering efficiently", async () => {
      container.innerHTML = `
        <ul>
          <li v-for="item in items" :key="item.id" :data-id="item.id">
            {{ item.name }}
          </li>
        </ul>
      `;

      const data = reactive({
        items: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' },
          { id: 3, name: 'Third' },
          { id: 4, name: 'Fourth' }
        ]
      });
      const app = createApp(data);
      app.mount(container);

      let items = container.querySelectorAll("li");
      expect(items.length).toBe(4);
      expect(items[0].textContent?.trim()).toBe("First");
      expect(items[1].textContent?.trim()).toBe("Second");
      expect(items[2].textContent?.trim()).toBe("Third");
      expect(items[3].textContent?.trim()).toBe("Fourth");

      // Complex reordering: move items around, add new, and remove existing
      data.items = [
        { id: 4, name: 'Fourth Updated' }, // moved to front and updated
        { id: 2, name: 'Second' },        // stays in middle
        { id: 5, name: 'New Fifth' },     // new item added
        { id: 1, name: 'First Moved' }    // moved to end and updated
        // id: 3 (Third) is removed
      ];
      await nextTick();

      items = container.querySelectorAll("li");
      expect(items.length).toBe(4);
      expect(items[0].textContent?.trim()).toBe("Fourth Updated");
      expect(items[1].textContent?.trim()).toBe("Second");
      expect(items[2].textContent?.trim()).toBe("New Fifth");
      expect(items[3].textContent?.trim()).toBe("First Moved");

      // Verify data-id attributes are maintained correctly
      expect(items[0].getAttribute('data-id')).toBe('4');
      expect(items[1].getAttribute('data-id')).toBe('2');
      expect(items[2].getAttribute('data-id')).toBe('5');
      expect(items[3].getAttribute('data-id')).toBe('1');
    });

    it("should handle mixed reordering with insertions and removals", async () => {
      container.innerHTML = `
        <div>
          <div v-for="user in users" :key="user.id" class="user-card">
            <span class="name">{{ user.name }}</span>
            <span class="email">{{ user.email }}</span>
          </div>
        </div>
      `;

      const data = reactive({
        users: [
          { id: 'a1', name: 'Alice', email: 'alice@example.com' },
          { id: 'b2', name: 'Bob', email: 'bob@example.com' }
        ]
      });
      const app = createApp(data);
      app.mount(container);

      let users = container.querySelectorAll(".user-card");
      expect(users.length).toBe(2);

      // Update: add new user, update existing, remove one
      data.users = [
        { id: 'c3', name: 'Charlie', email: 'charlie@example.com' }, // new
        { id: 'a1', name: 'Alice Smith', email: 'alice.smith@example.com' }, // updated
        // b2 (Bob) is removed
        { id: 'd4', name: 'Diana', email: 'diana@example.com' } // new
      ];
      await nextTick();

      users = container.querySelectorAll(".user-card");
      expect(users.length).toBe(3);

      const names = Array.from(users).map(el =>
        el.querySelector('.name')?.textContent?.trim()
      );
      const emails = Array.from(users).map(el =>
        el.querySelector('.email')?.textContent?.trim()
      );

      expect(names).toEqual(['Charlie', 'Alice Smith', 'Diana']);
      expect(emails).toEqual(['charlie@example.com', 'alice.smith@example.com', 'diana@example.com']);
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
