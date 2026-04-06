import { describe, expect, it } from 'vitest'
import {
  appendLoadingTurn,
  appendPlayerTurn,
  appendSystemAction,
  canReleaseMovement,
  normalizeDialogueHistory,
  replaceLoadingTurn,
  shouldStopDialogueKeyPropagation
} from './DialogueBox.js'

describe('shouldStopDialogueKeyPropagation', () => {
  it('stops keys that should stay inside the text input', () => {
    expect(shouldStopDialogueKeyPropagation(' ')).toBe(true)
    expect(shouldStopDialogueKeyPropagation('Enter')).toBe(true)
    expect(shouldStopDialogueKeyPropagation('ArrowLeft')).toBe(true)
    expect(shouldStopDialogueKeyPropagation('w')).toBe(true)
  })

  it('ignores unrelated modifier keys', () => {
    expect(shouldStopDialogueKeyPropagation('Shift')).toBe(false)
    expect(shouldStopDialogueKeyPropagation('Alt')).toBe(false)
  })
})

describe('normalizeDialogueHistory', () => {
  it('formats player and npc turns for the transcript panel', () => {
    expect(normalizeDialogueHistory([
      { speakerId: 'xiaoqian', content: '你好' },
      { speakerId: 'robby', content: '先去看病歷。' }
    ], 'Robby')).toEqual([
      { role: 'player', label: '你', content: '你好' },
      { role: 'npc', label: 'Robby', content: '先去看病歷。' }
    ])
  })
})

describe('chat timeline helpers', () => {
  it('appends player and loading turns in message order', () => {
    const withPlayer = appendPlayerTurn([], '先自我介紹')
    const withLoading = appendLoadingTurn(withPlayer, 'Robby')

    expect(withLoading).toEqual([
      { role: 'player', label: '你', content: '先自我介紹' },
      { role: 'npc', label: 'Robby', content: '⋯', isLoading: true }
    ])
  })

  it('replaces the latest loading turn with the final npc reply', () => {
    const updated = replaceLoadingTurn([
      { role: 'player', label: '你', content: '你好' },
      { role: 'npc', label: 'Robby', content: '⋯', isLoading: true }
    ], 'Robby', '先去看病歷。')

    expect(updated).toEqual([
      { role: 'player', label: '你', content: '你好' },
      { role: 'npc', label: 'Robby', content: '先去看病歷。', isLoading: false }
    ])
  })

  it('appends system actions for scene progression hints', () => {
    expect(appendSystemAction([], '已切換到下一幕')).toEqual([
      { role: 'system', label: '系統', content: '已切換到下一幕' }
    ])
  })
})

describe('canReleaseMovement', () => {
  it('lets the player move when the sidebar is open but the input is not focused', () => {
    expect(canReleaseMovement(true, false)).toBe(true)
  })

  it('keeps movement locked while typing in the input', () => {
    expect(canReleaseMovement(true, true)).toBe(false)
  })
})
