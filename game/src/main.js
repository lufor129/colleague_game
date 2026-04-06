import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { ERScene } from './scenes/ERScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  pixelArt: true,
  scene: [BootScene, ERScene]
}

new Phaser.Game(config)
