import { Directive } from "./index"
import {
  normalizeClass,
  normalizeStyle,
  isString,
  isArray,
  hyphenate,
  camelize,
} from "@vue/shared"
import { getElementMetadata } from "../metadata"

const forceAttrRE = /^(spellcheck|draggable|form|list|type)$/

export const bind: Directive<Element> = ({
  el,
  get,
  effect,
  arg,
  modifiers,
}) => {
  let prevValue: any

  // Record static class in metadata instead of on element
  if (arg === "class") {
    const metadata = getElementMetadata(el)
    metadata.originalClass = el.className
  }

  effect(() => {
    let value = get();
    if (arg) {
      if (modifiers?.camel) {
        arg = camelize(arg);
      }
      setProp(el, arg, value, prevValue, modifiers?.camel);
    } else {
      for (const key in value) {
        setProp(el, key, value[key], prevValue?.[key]);
      }
      for (const key in prevValue) {
        if (!value || !(key in value)) {
          setProp(el, key, null);
        }
      }
    }
    prevValue = value;
  });
};

const setProp = (
  el: Element & { _class?: string },
  key: string,
  value: any,
  prevValue?: any,
  isCamel?: boolean,
) => {
  if (key === "class") {
    handleClass(el, value);
  } else if (key === "style") {
    handleStyle(el as HTMLElement, value, prevValue);
  } else if (shouldSetProperty(el, key, isCamel)) {
    setElementProperty(el, key, value);
  } else {
    setElementAttribute(el, key, value);
  }
};

const handleClass = (el: Element, value: any) => {
  const metadata = getElementMetadata(el)
  const originalClass = metadata.originalClass
  const newClass = normalizeClass(originalClass ? [originalClass, value] : value)
  el.setAttribute("class", newClass)
}

const handleStyle = (el: HTMLElement, value: any, prevValue?: any) => {
  value = normalizeStyle(value);
  if (!value) {
    el.removeAttribute("style");
  } else if (isString(value)) {
    if (value !== prevValue) el.style.cssText = value;
  } else {
    for (const key in value) {
      setStyle(el.style, key, value[key]);
    }
    if (prevValue && !isString(prevValue)) {
      for (const key in prevValue) {
        if (value[key] == null) {
          setStyle(el.style, key, "");
        }
      }
    }
  }
};

const shouldSetProperty = (el: Element, key: string, isCamel?: boolean) =>
  !(el instanceof SVGElement) &&
  (key in el || isCamel) &&
  !forceAttrRE.test(key);

// Properties that should be set as attributes for consistency
const DOM_ATTR_PROPS = new Set(['id', 'title', 'lang', 'dir'])

const setElementProperty = (el: Element, key: string, value: any) => {
  if (DOM_ATTR_PROPS.has(key)) {
    if (value == null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }
  } else {
    (el as any)[key] = value
    if (key === 'value') {
      (el as any)._value = value
    }
  }
}

const setElementAttribute = (el: Element, key: string, value: any) => {
  if (key === "true-value") {
    (el as any)._trueValue = value;
  } else if (key === "false-value") {
    (el as any)._falseValue = value;
  } else if (value != null) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};

const importantRE = /\s*!important$/;

// Use modern CSS custom properties API
const setStyle = (style: CSSStyleDeclaration, name: string, val: string | string[]) => {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v))
  } else if (name.startsWith('--')) {
    style.setProperty(name, val)
  } else if (importantRE.test(val)) {
    // !important
    style.setProperty(
      hyphenate(name),
      val.replace(importantRE, ''),
      'important',
    )
  } else {
    style[name as any] = val
  }
}
