import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "../src/scheduler";
import { reactive } from "@vue/reactivity";
import { createApp } from "../src/app";
import {
  onCompositionEnd,
  updateTextValue,
  handleCheckboxChange,
  handleTextInput,
  updateCheckboxValue,
  handleRadioChange,
} from "../src/directives/model";

describe("model directive", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
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

    it("should skip updating value property when focused and resolved value equals new value", () => {
      const input = document.createElement('input');
      container.appendChild(input);
      input.value = '123';
      input.focus();
      expect(document.activeElement).toBe(input);

      const valueSetter = vi.spyOn(input, 'value', 'set');
      updateTextValue(input, () => 123, (val) => Number(val));
      expect(valueSetter).not.toHaveBeenCalled();

      input.blur();
      expect(document.activeElement).not.toBe(input);
      updateTextValue(input, () => 456, (val) => Number(val));
      expect(valueSetter).toHaveBeenCalledWith(456);
      valueSetter.mockRestore();
    });

    it("should update value property when focused but resolved value does not equal new value", () => {
      const input = document.createElement('input');
      container.appendChild(input);
      input.value = '123';
      input.focus();
      expect(document.activeElement).toBe(input);

      const valueSetter = vi.spyOn(input, 'value', 'set');
      updateTextValue(input, () => 999, (val) => Number(val));
      expect(valueSetter).toHaveBeenCalledWith(999);
      expect(input.value).toBe('999');
      valueSetter.mockRestore();
    });

    it("should not add duplicate to array when checkbox is already checked and found", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.value = 'a';

      const assign = vi.fn();
      handleCheckboxChange(checkbox, () => ['a'], assign);
      expect(assign).not.toHaveBeenCalled();
    });

    it("should not splice array when checkbox is unchecked and not found", () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      checkbox.value = 'b';

      const assign = vi.fn();
      handleCheckboxChange(checkbox, () => ['a'], assign);
      expect(assign).not.toHaveBeenCalled();
    });

    it("should cast range input to number by default", async () => {
      container.innerHTML = '<input type="range" v-model="value" min="0" max="100">';
      const data = reactive({ value: 20 });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("20");

      input.value = "75";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      expect(data.value).toBe(75);
      expect(typeof data.value).toBe("number");
    });

    it("should unselect all options in multiple select when value is not array", async () => {
      container.innerHTML = `
        <select v-model="selected" multiple>
          <option value="a">A</option>
          <option value="b">B</option>
        </select>
      `;
      const data = reactive<{ selected: any }>({ selected: ["a"] });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.options[0].selected).toBe(true);

      data.selected = null;
      await nextTick();
      expect(select.options[0].selected).toBe(false);
      expect(select.options[1].selected).toBe(false);
    });

    it("should reset selectedIndex to -1 when select has no matching value", async () => {
      container.innerHTML = `
        <select v-model="selected">
          <option value="a">A</option>
          <option value="b">B</option>
        </select>
      `;
      const data = reactive({ selected: "b" });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.selectedIndex).toBe(1);

      data.selected = "c";
      await nextTick();
      expect(select.selectedIndex).toBe(-1);

      const setterSpy = vi.spyOn(select, "selectedIndex", "set");
      data.selected = "d";
      await nextTick();
      expect(select.selectedIndex).toBe(-1);
      expect(setterSpy).not.toHaveBeenCalled();
      setterSpy.mockRestore();
    });

    it("should support object values via _value in select", async () => {
      container.innerHTML = `
        <select v-model="selected">
          <option :value="optA">A</option>
          <option :value="optB">B</option>
        </select>
      `;
      const optA = { id: 1 };
      const optB = { id: 2 };
      const data = reactive({ optA, optB, selected: optA });
      const app = createApp(data);
      app.mount(container);

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select.selectedIndex).toBe(0);

      select.selectedIndex = 1;
      select.dispatchEvent(new Event("change"));
      await nextTick();
      expect(data.selected).toStrictEqual(optB);
    });

    it("should support object values via _value in radio buttons", async () => {
      container.innerHTML = `
        <input type="radio" :value="optA" v-model="picked">
        <input type="radio" :value="optB" v-model="picked">
      `;
      const optA = { id: 1 };
      const optB = { id: 2 };
      const data = reactive({ optA, optB, picked: optA });
      const app = createApp(data);
      app.mount(container);

      const radios = container.querySelectorAll("input");
      expect(radios[0].checked).toBe(true);
      expect(radios[1].checked).toBe(false);

      radios[1].click();
      await nextTick();
      expect(data.picked).toStrictEqual(optB);
    });

    it("should not reassign checked property when radio model value is unchanged", async () => {
      container.innerHTML = '<input type="radio" value="a" v-model="picked">';
      const data = reactive({ picked: "a", other: 0 });
      const app = createApp({
        get picked() {
          return data.other ? data.picked : data.picked;
        },
        set picked(val) {
          data.picked = val;
        },
        data,
      });
      app.mount(container);
      const radio = container.querySelector("input") as HTMLInputElement;

      const checkedSetter = vi.spyOn(radio, "checked", "set");
      data.other++;
      await nextTick();

      expect(checkedSetter).not.toHaveBeenCalled();
      checkedSetter.mockRestore();
    });

    it("should not reassign checked property when checkbox model value is unchanged", async () => {
      container.innerHTML = '<input type="checkbox" v-model="checked">';
      const data = reactive({ checked: true, other: 0 });
      const app = createApp({
        get checked() {
          return data.other ? data.checked : data.checked;
        },
        set checked(val) {
          data.checked = val;
        },
        data,
      });
      app.mount(container);
      const checkbox = container.querySelector("input") as HTMLInputElement;

      const checkedSetter = vi.spyOn(checkbox, "checked", "set");
      data.other++;
      await nextTick();

      expect(checkedSetter).not.toHaveBeenCalled();
      checkedSetter.mockRestore();
    });

    it("should dispatch bubbling and cancelable input event on compositionend", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      let eventBubbled = false;
      let eventCancelable = false;

      container.addEventListener("input", (e) => {
        eventBubbled = e.bubbles;
        eventCancelable = e.cancelable;
      });

      (input as any).composing = true;
      const endEvent = new Event("compositionend");
      Object.defineProperty(endEvent, "target", { value: input });
      onCompositionEnd(endEvent);

      expect(eventBubbled).toBe(true);
      expect(eventCancelable).toBe(true);
    });

    it("should not reassign selectedIndex when already matching option index", () => {
      const select = document.createElement("select");
      select.innerHTML = `<option value="a">A</option><option value="b">B</option>`;
      container.appendChild(select);
      select.setAttribute("v-model", "selected");

      const setterSpy = vi.spyOn(select, "selectedIndex", "set");
      const app = createApp({ selected: "a" });
      app.mount(container);

      expect(select.selectedIndex).toBe(0);
      expect(setterSpy).not.toHaveBeenCalled();
      setterSpy.mockRestore();
    });

    it("should trim el.value on change event with trim modifier", () => {
      container.innerHTML = `<input type="text" v-model.trim="text">`;
      const data = reactive({ text: "initial" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input")!;
      input.value = "   spaces   ";
      input.dispatchEvent(new Event("change"));

      expect(input.value).toBe("spaces");
    });

    it("should keep text input value as string without number modifier", async () => {
      container.innerHTML = `<input type="text" v-model="text">`;
      const data = reactive({ text: "" });
      const app = createApp(data);
      app.mount(container);

      const input = container.querySelector("input")!;
      input.value = "0123";
      input.dispatchEvent(new Event("input"));
      await nextTick();

      expect(data.text).toBe("0123");
      expect(typeof data.text).toBe("string");
    });

    it("should update el.value when input is not active element even if resolveValue matches newVal", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      input.value = "01";

      expect(document.activeElement).not.toBe(input);
      updateTextValue(input, () => 1, (v) => Number(v));

      expect(input.value).toBe("1");
    });

    it("should not set el.value if curVal equals newVal in updateTextValue", () => {
      const input = document.createElement("input");
      input.value = "hello";
      const setterSpy = vi.spyOn(input, "value", "set");

      updateTextValue(input, () => "hello", (v) => v);

      expect(setterSpy).not.toHaveBeenCalled();
      setterSpy.mockRestore();
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

});
