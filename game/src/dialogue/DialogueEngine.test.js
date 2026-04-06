import { describe, expect, it } from 'vitest'
import {
  canManuallyAdvanceScene,
  DialogueEngine,
  extractSceneCompletion,
  getDialogueApiUrl,
  getDialogueModel,
  extractTextReply,
  getSuggestedPromptOptions
} from './DialogueEngine.js'

describe('extractSceneCompletion', () => {
  it('removes the completion marker and returns the next scene id', () => {
    const result = extractSceneCompletion('先去等候室找家屬。[SCENE_COMPLETE]', 'family_meeting')

    expect(result).toEqual({
      reply: '先去等候室找家屬。',
      completed: true,
      nextSceneId: 'family_meeting'
    })
  })

  it('leaves normal dialogue untouched when no marker is present', () => {
    const result = extractSceneCompletion('我先跟你確認一下死亡時間。', 'family_meeting')

    expect(result).toEqual({
      reply: '我先跟你確認一下死亡時間。',
      completed: false,
      nextSceneId: null
    })
  })
})

describe('extractTextReply', () => {
  it('extracts the first text block from MiniMax content blocks', () => {
    const result = extractTextReply({
      content: [
        { type: 'thinking', thinking: '...' },
        { type: 'text', text: '先這樣。' }
      ]
    })

    expect(result).toBe('先這樣。')
  })

  it('throws a readable error when no text block exists', () => {
    expect(() => extractTextReply({ content: [{ type: 'thinking', thinking: '...' }] }))
      .toThrow('Dialogue API error: response did not include text content')
  })
})

describe('getDialogueApiUrl', () => {
  it('uses the local MiniMax anthropic-compatible proxy path', () => {
    expect(getDialogueApiUrl()).toBe('/api/minimax/anthropic/v1/messages')
  })
})

describe('getDialogueModel', () => {
  it('uses MiniMax M2.7 by default', () => {
    expect(getDialogueModel()).toBe('MiniMax-M2.7')
  })
})

describe('getSuggestedPromptOptions', () => {
  it('rewrites scene prompts in xiaoqian medium-style voice', () => {
    const options = getSuggestedPromptOptions(
      [
        { id: 'intro_self', label: '先自我介紹', text: 'intro_self' },
        { id: 'ask_case', label: '直接問今天的案子', text: 'ask_case' }
      ],
      [{ speakerId: 'xiaoqian', content: '你好，我是小茜。' }]
    )

    expect(options[0].id).toBe('intro_self')
    expect(options[0].text).toContain('小茜')
    expect(options[1]).toEqual({
      id: 'ask_case',
      label: '直接問今天的案子',
      text: '今天這案子是怎樣？我先跟哪一段比較不母湯？'
    })
    expect(options).toHaveLength(3)
  })
})

describe('canManuallyAdvanceScene', () => {
  it('allows manual scene advance after one completed exchange', () => {
    expect(
      canManuallyAdvanceScene(
        [{ speakerId: 'xiaoqian', content: '你好' }, { speakerId: 'robby', content: '我在。' }],
        'first_patient'
      )
    ).toBe(true)
  })

  it('does not allow manual scene advance before any npc reply', () => {
    expect(
      canManuallyAdvanceScene(
        [{ speakerId: 'xiaoqian', content: '你好' }],
        'first_patient'
      )
    ).toBe(false)
  })
})

describe('DialogueEngine history management', () => {
  it('retains only the latest 10 turns of dialogue', () => {
    const engine = new DialogueEngine('test-key')

    for (let index = 0; index < 12; index += 1) {
      engine.recordExchange('xiaoqian', `player-${index}`)
      engine.recordExchange('robby', `npc-${index}`)
    }

    expect(engine.history).toHaveLength(20)
    expect(engine.history[0]).toEqual({ speakerId: 'xiaoqian', content: 'player-2' })
    expect(engine.history[19]).toEqual({ speakerId: 'robby', content: 'npc-11' })
  })
})

describe('DialogueEngine provider integration', () => {
  it('calls the MiniMax anthropic-compatible endpoint and model', async () => {
    const engine = new DialogueEngine('minimax-key')
    engine.setScene({ context: '測試場景', goal: '測試目標', next_scene: null })

    const fetchCalls = []
    globalThis.fetch = async (url, options) => {
      fetchCalls.push({ url, options })
      return {
        ok: true,
        async json() {
          return {
            content: [{ type: 'text', text: '收到。' }]
          }
        }
      }
    }

    const reply = await engine.generateResponse('robby', 'xiaoqian', '你好')

    expect(reply).toBe('收到。')
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0].url).toBe('/api/minimax/anthropic/v1/messages')
    expect(fetchCalls[0].options.headers['x-api-key']).toBe('minimax-key')
    expect(JSON.parse(fetchCalls[0].options.body).model).toBe('MiniMax-M2.7')
  })

  it('accepts a response whose first block is not text', async () => {
    const engine = new DialogueEngine('minimax-key')
    engine.setScene({ context: '測試場景', goal: '測試目標', next_scene: null })

    globalThis.fetch = async () => ({
      ok: true,
      async json() {
        return {
          content: [
            { type: 'thinking', thinking: '...' },
            { type: 'text', text: '我在。' }
          ]
        }
      }
    })

    await expect(engine.generateResponse('robby', 'xiaoqian', '你好')).resolves.toBe('我在。')
  })

  it('surfaces provider errors with a provider-neutral label', async () => {
    const engine = new DialogueEngine('minimax-key')
    engine.setScene({ context: '測試場景', goal: '測試目標', next_scene: null })

    globalThis.fetch = async () => ({
      ok: false,
      async json() {
        return { error: { message: 'bad request' } }
      }
    })

    await expect(
      engine.generateResponse('robby', 'xiaoqian', '你好')
    ).rejects.toThrow('Dialogue API error: bad request')
  })
})
