import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkAttr, listen } from '../src/utils'
import {
  getElementMetadata,
  setElementMetadata,
  clearElementMetadata
} from '../src/metadata'

describe('utils', () => {
  let el: HTMLElement

  beforeEach(() => {
    el = document.createElement('div')
  })

  describe('checkAttr', () => {
    it('should return attribute value and remove it', () => {
      el.setAttribute('test-attr', 'test-value')
      const value = checkAttr(el, 'test-attr')

      expect(value).toBe('test-value')
      expect(el.hasAttribute('test-attr')).toBe(false)
    })

    it('should return null if attribute does not exist', () => {
      const spy = vi.spyOn(el, 'removeAttribute')
      const value = checkAttr(el, 'non-existent')
      expect(value).toBeNull()
      expect(spy).not.toHaveBeenCalled()
    })

    it('should return null if attribute value is null', () => {
      el.setAttribute('test-attr', 'null')
      const value = checkAttr(el, 'test-attr')
      expect(value).toBe('null')
    })
  })

  describe('listen', () => {
    it('should add event listener to element', () => {
      const handler = vi.fn()
      listen(el, 'click', handler)

      el.click()
      expect(handler).toHaveBeenCalled()
    })

    it('should pass options to addEventListener', () => {
      const handler = vi.fn()
      const options = { once: true }
      const spy = vi.spyOn(el, 'addEventListener')

      listen(el, 'click', handler, options)

      expect(spy).toHaveBeenCalledWith('click', handler, options)
    })
  })

  describe('metadata', () => {
    it('should set and clear element metadata', () => {
      setElementMetadata(el, 'originalDisplay', 'block')
      expect(getElementMetadata(el).originalDisplay).toBe('block')

      clearElementMetadata(el)
      expect(getElementMetadata(el).originalDisplay).toBeUndefined()
    })
  })
})