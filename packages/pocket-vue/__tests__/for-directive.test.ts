import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "../src/scheduler";
import { reactive } from "@vue/reactivity";
import { createApp } from "../src/app";
import { _for } from "../src/directives/for";
import { createContext } from "../src/context";
import { builtInDirectives } from "../src/directives";

describe("for directive", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
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
      container.innerHTML = '<div v-for="item in items" :key="item">{{ item }}</div>';

      const app = createApp({
        items: []
      });
      app.mount(container);

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(0);
      expect(container.textContent).toBe("");
      expect(container.childNodes.length).toBe(1);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].textContent).toBe("");
    });

    it("should preserve DOM node identity and reuse blocks when reordering keyed items", async () => {
      container.innerHTML = '<div v-for="item in items" :key="item.id">{{ item.text }}</div>';
      const app = createApp({
        items: [
          { id: 1, text: "A" },
          { id: 2, text: "B" },
          { id: 3, text: "C" },
        ],
      });
      app.mount(container);

      const initialDivs = Array.from(container.querySelectorAll("div"));
      expect(initialDivs.length).toBe(3);

      // Reorder items: [C, A, B]
      app.scope.items = [
        { id: 3, text: "C-updated" },
        { id: 1, text: "A-updated" },
        { id: 2, text: "B-updated" },
      ];
      await nextTick();

      const updatedDivs = Array.from(container.querySelectorAll("div"));
      expect(updatedDivs.length).toBe(3);
      expect(updatedDivs[0]).toBe(initialDivs[2]);
      expect(updatedDivs[1]).toBe(initialDivs[0]);
      expect(updatedDivs[2]).toBe(initialDivs[1]);
      expect(updatedDivs[0].textContent?.trim()).toBe("C-updated");
      expect(updatedDivs[1].textContent?.trim()).toBe("A-updated");
      expect(updatedDivs[2].textContent?.trim()).toBe("B-updated");

      // Verify that reused blocks maintain active reactivity
      app.scope.items[0].text = "C-further-updated";
      await nextTick();
      expect(container.querySelectorAll("div")[0].textContent?.trim()).toBe("C-further-updated");
    });

    it("should handle updates to unkeyed list", async () => {
      container.innerHTML = '<div v-for="item in items">{{ item }}</div>';
      const app = createApp({
        items: ["apple", "banana"],
      });
      app.mount(container);

      const initialDiv = container.querySelector("div");
      expect(container.querySelectorAll("div").length).toBe(2);

      app.scope.items = ["orange"];
      await nextTick();

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(1);
      expect(divs[0]).toBe(initialDiv);
      expect(divs[0].textContent?.trim()).toBe("orange");
    });

    it("should evaluate static key as string literal and reuse block", async () => {
      container.innerHTML = '<div v-for="item in items" key="my-key">{{ item }}</div>';
      const app = createApp({ items: ["a"] });
      app.mount(container);
      const initialDiv = container.querySelector("div");

      app.scope.items = ["b"];
      await nextTick();
      const updatedDiv = container.querySelector("div");
      expect(updatedDiv).toBe(initialDiv);
      expect(updatedDiv?.textContent?.trim()).toBe("b");
    });

    it("should not iterate over string primitives as objects", () => {
      container.innerHTML = '<div v-for="item in text">{{ item }}</div>';
      const app = createApp({ text: "hello" });
      app.mount(container);
      expect(container.querySelectorAll("div").length).toBe(0);
    });

    it("should handle static key attribute and remove it from element", () => {
      container.innerHTML = '<div v-for="item in items" key="item-key">{{ item }}</div>';
      const app = createApp({ items: ["one"] });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.textContent?.trim()).toBe("one");
      expect(div?.hasAttribute("key")).toBe(false);
    });

    it("should not call removeAttribute when element has no key attribute", () => {
      const el = document.createElement("div");
      const parent = document.createElement("div");
      parent.appendChild(el);
      const removeSpy = vi.spyOn(el, "removeAttribute");
      builtInDirectives.bind = vi.fn();
      const testCtx = createContext();
      testCtx.scope.items = [];
      _for(el, "item in items", testCtx);
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it("should not invoke DOM insert when items are in correct position", async () => {
      container.innerHTML = '<div v-for="item in items" :key="item.id">{{ item.text }}</div>';
      const app = createApp({
        items: [
          { id: 1, text: "A" },
          { id: 2, text: "B" },
        ],
      });
      app.mount(container);

      const insertSpy = vi.spyOn(container, "insertBefore");
      app.scope.items[0].text = "A2";
      app.scope.items[1].text = "B2";
      await nextTick();

      expect(insertSpy).not.toHaveBeenCalled();
      insertSpy.mockRestore();
    });

    it("should handle v-bind:key syntax and remove it from element", () => {
      container.innerHTML = '<div v-for="item in items" v-bind:key="item">{{ item }}</div>';
      const app = createApp({ items: ["alpha"] });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.textContent?.trim()).toBe("alpha");
      expect(div?.hasAttribute("v-bind:key")).toBe(false);
      expect(app.rootBlocks[0].ctx.blocks[0].key).toBe("alpha");
    });

    it("should provide numeric index for array iteration", () => {
      container.innerHTML = '<div v-for="(item, idx) in items" :data-type="typeof idx">{{ idx + 1 }}: {{ item }}</div>';
      const app = createApp({ items: ["test"] });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.getAttribute("data-type")).toBe("number");
      expect(div?.textContent?.trim()).toBe("1: test");
    });

    it("should handle whitespace in v-for expressions", () => {
      container.innerHTML = '<div v-for="  (  item  ,  idx  )   in   items  ">{{ idx }}-{{ item }}</div>';
      const app = createApp({ items: ["val"] });
      app.mount(container);
      const div = container.querySelector("div");
      expect(div?.textContent?.trim()).toBe("0-val");
    });

    it("should not reuse block when key evaluates to null", async () => {
      container.innerHTML = '<div v-for="item in items" :key="item.id">{{ item.text }}</div>';
      const data = reactive({
        items: [{ id: null as any, text: "first" }]
      });
      createApp(data).mount(container);
      const firstEl = container.firstElementChild;
      data.items = [{ id: null as any, text: "second" }];
      await nextTick();
      const secondEl = container.firstElementChild;
      expect(secondEl).not.toBe(firstEl);
    });

    it("should not re-insert blocks when already in correct position", async () => {
      container.innerHTML = '<div v-for="item in items" :key="item.id">{{ item.text }}</div>';
      const data = reactive({
        items: [
          { id: 1, text: "a" },
          { id: 2, text: "b" }
        ]
      });
      createApp(data).mount(container);
      await nextTick();
      const insertSpy = vi.spyOn(container, "insertBefore");
      data.items = [
        { id: 1, text: "a-new" },
        { id: 2, text: "b" }
      ];
      await nextTick();
      expect(insertSpy).not.toHaveBeenCalled();
      insertSpy.mockRestore();
    });

    it("should handle parenthesized single identifier with spaces", () => {
      container.innerHTML = '<div v-for="( item ) in items">{{ item }}</div>';
      const app = createApp({ items: ["trimmed"] });
      app.mount(container);
      expect(container.textContent?.trim()).toBe("trimmed");
    });

    it("should not log warning for invalid v-for when DEV is false", () => {
      const origDev = import.meta.env.DEV;
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        (import.meta.env as any).DEV = false;
        container.innerHTML = '<div v-for="invalid_expression"></div>';
        createApp({}).mount(container);
        expect(spy).not.toHaveBeenCalled();
      } finally {
        (import.meta.env as any).DEV = origDev;
        spy.mockRestore();
      }
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

});
