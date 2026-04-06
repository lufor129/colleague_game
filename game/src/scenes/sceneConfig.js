const NPC_LIBRARY = {
  robby: { charId: 'robby', charName: 'Robby', color: 0x4a7c59 },
  dana: { charId: 'dana', charName: 'Dana', color: 0x7a5c8a },
  chen_meizhu: { charId: 'chen_meizhu', charName: '陳美珠', color: 0x8c6f5a }
}

const SCENE_STATE = {
  arrival: {
    room: 'er_entrance',
    playerSpawn: { x: 200, y: 350 },
    npcs: [
      { ...NPC_LIBRARY.robby, x: 550, y: 320 }
    ],
    promptOptions: [
      { id: 'intro_self', label: '先自我介紹', text: '你好，我是小茜，今天來這裡協助後續處理。' },
      { id: 'ask_role', label: '問他在忙什麼', text: '你現在在忙什麼？我應該先跟上哪一段？' },
      { id: 'ask_case', label: '直接問今天的案子', text: '今天是什麼案子？我需要先知道哪些事？' }
    ]
  },
  first_patient: {
    room: 'er_corridor',
    playerSpawn: { x: 250, y: 360 },
    npcs: [
      { ...NPC_LIBRARY.robby, x: 520, y: 300 },
      { ...NPC_LIBRARY.dana, x: 650, y: 380 }
    ],
    promptOptions: [
      { id: 'ask_death_time', label: '確認死亡時間', text: '我需要先確認死亡時間和送到院時的狀況。' },
      { id: 'ask_family_status', label: '問家屬情況', text: '家屬現在在哪裡？有人先陪著她嗎？' },
      { id: 'ask_next_step', label: '問下一步要做什麼', text: '我接下來應該先跟誰確認，還是直接去找家屬？' }
    ]
  },
  family_meeting: {
    room: 'waiting_room',
    playerSpawn: { x: 180, y: 360 },
    npcs: [
      { ...NPC_LIBRARY.chen_meizhu, x: 590, y: 345 }
    ],
    promptOptions: [
      { id: 'ask_father_personality', label: '請她談父親是什麼樣的人', text: '我想知道，妳爸爸是什麼樣的人？' },
      { id: 'ask_last_meal', label: '問上次見面', text: '妳上次跟爸爸一起吃飯，是什麼時候？那天他看起來怎麼樣？' },
      { id: 'ask_daily_life', label: '問父親平常生活', text: '如果要跟我形容他平常的日子，妳會先想到什麼？' }
    ]
  },
  act1_end: {
    room: 'er_corridor',
    playerSpawn: { x: 620, y: 360 },
    npcs: [
      { ...NPC_LIBRARY.robby, x: 360, y: 320 }
    ],
    promptOptions: [
      { id: 'answer_directly', label: '直接回答問了什麼', text: '我問她，妳爸爸是什麼樣的人。' },
      { id: 'answer_deflect', label: '先反問他為什麼在意', text: '你怎麼會想知道我問了她什麼？' },
      { id: 'answer_reflect', label: '談家屬剛剛的狀態', text: '她剛剛不是在說死亡，她是在努力把爸爸想回來。' }
    ]
  }
}

export function getSceneState(sceneId) {
  return SCENE_STATE[sceneId] ?? null
}
