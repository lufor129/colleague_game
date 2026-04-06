import { describe, expect, it } from 'vitest'
import { getSceneState } from './sceneConfig.js'

describe('getSceneState', () => {
  it('returns arrival NPCs and player spawn', () => {
    const state = getSceneState('arrival')

    expect(state.playerSpawn).toEqual({ x: 200, y: 350 })
    expect(state.npcs.map(npc => npc.charId)).toEqual(['robby'])
    expect(state.promptOptions).toHaveLength(3)
  })

  it('returns waiting room state with chen meizhu only', () => {
    const state = getSceneState('family_meeting')

    expect(state.room).toBe('waiting_room')
    expect(state.npcs.map(npc => npc.charId)).toEqual(['chen_meizhu'])
    expect(state.npcs[0].charName).toBe('陳美珠')
    expect(state.promptOptions[0]).toEqual({
      id: 'ask_father_personality',
      label: '請她談父親是什麼樣的人',
      text: '我想知道，妳爸爸是什麼樣的人？'
    })
  })

  it('returns corridor state with robby and dana for first patient', () => {
    const state = getSceneState('first_patient')

    expect(state.room).toBe('er_corridor')
    expect(state.npcs.map(npc => npc.charId)).toEqual(['robby', 'dana'])
  })
})
