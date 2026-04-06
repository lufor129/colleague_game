import { describe, expect, it } from 'vitest'
import { getDialogueLayoutMode } from './DialogueBox.js'

describe('getDialogueLayoutMode', () => {
  it('uses split layout on desktop widths', () => {
    expect(getDialogueLayoutMode(1280)).toBe('split')
  })

  it('falls back to stacked layout on narrow screens', () => {
    expect(getDialogueLayoutMode(900)).toBe('stacked')
  })
})
