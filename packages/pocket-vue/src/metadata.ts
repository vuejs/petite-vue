/**
 * Element metadata storage using WeakMap for automatic memory management
 */

/**
 * Metadata structure for storing element-related information
 * This allows us to store additional data without polluting the DOM
 */
interface ElementMetadata {
    /** Original display value for v-show directive */
    originalDisplay?: string

    /** Event listeners attached to this element */
    eventListeners?: Map<string, EventListener[]>

    /** Custom properties stored on this element */
    customProperties?: Map<string, any>

    /** Original class value for bind directive */
    originalClass?: string
}

/**
 * WeakMap for storing element metadata
 * Using WeakMap ensures automatic garbage collection when elements are removed
 * This prevents memory leaks in long-running applications
 */
const elementMetadata = new WeakMap<Element, ElementMetadata>()

/**
 * Get metadata for an element, creating it if needed
 */
export function getElementMetadata(el: Element): ElementMetadata {
    let metadata = elementMetadata.get(el)
    if (!metadata) {
        metadata = {}
        elementMetadata.set(el, metadata)
    }
    return metadata
}

/**
 * Set a specific metadata property for an element
 */
export function setElementMetadata<K extends keyof ElementMetadata>(
    el: Element,
    key: K,
    value: ElementMetadata[K]
): void {
    const metadata = getElementMetadata(el)
    metadata[key] = value
}

/**
 * Clear metadata for an element
 */
export function clearElementMetadata(el: Element): void {
    elementMetadata.delete(el)
}
