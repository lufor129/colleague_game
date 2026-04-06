import Phaser from 'phaser'

/**
 * BootScene — 啟動畫面，讓玩家輸入 MiniMax API Key
 * Demo 用，正式版應改成後端 proxy
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x1a1a2e)

    this.add.text(400, 120, '台大醫院急診室', {
      fontSize: '28px',
      color: '#7eb8f7',
      fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
    }).setOrigin(0.5)

    this.add.text(400, 165, '— 一個關於死亡與回顧的故事 —', {
      fontSize: '13px',
      color: '#4a6fa5',
      fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif'
    }).setOrigin(0.5)

    // API Key 輸入框
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    `

    const label = document.createElement('div')
    label.textContent = '請輸入 MiniMax API Key'
    label.style.cssText = `color: #aaaacc; font-size: 13px; font-family: sans-serif;`

    const input = document.createElement('input')
    input.type = 'password'
    input.placeholder = '輸入 MiniMax API Key'
    input.style.cssText = `
      background: rgba(10, 10, 30, 0.85);
      border: 1px solid #4a6fa5;
      border-radius: 6px;
      color: #e8e8f0;
      font-size: 14px;
      padding: 8px 14px;
      width: 320px;
      outline: none;
    `

    const btn = document.createElement('button')
    btn.textContent = '進入急診室'
    btn.style.cssText = `
      background: #2a4a7f;
      color: #e8e8f0;
      border: 1px solid #4a6fa5;
      border-radius: 6px;
      padding: 10px 32px;
      font-size: 15px;
      cursor: pointer;
      font-family: Noto Sans TC, sans-serif;
    `

    const note = document.createElement('div')
    note.textContent = 'API Key 僅存於本機記憶體，透過本地 proxy 呼叫 MiniMax'
    note.style.cssText = `color: #555577; font-size: 11px; font-family: sans-serif;`

    const start = () => {
      const key = input.value.trim()
      if (!key) {
        input.style.borderColor = '#ff6b6b'
        return
      }
      overlay.remove()
      this.scene.start('ERScene', { apiKey: key })
    }

    btn.addEventListener('click', start)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') start() })

    overlay.appendChild(label)
    overlay.appendChild(input)
    overlay.appendChild(btn)
    overlay.appendChild(note)
    document.body.appendChild(overlay)
  }
}
