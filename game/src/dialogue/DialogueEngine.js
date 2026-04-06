/**
 * DialogueEngine — 串接 Claude API，根據角色 persona + 場景狀態生成對話
 */

// 各角色的核心性格摘要（從 persona.md 精簡而來，控制 token 消耗）
const PERSONA_PROMPTS = {
  robby: `你是 Robby（Michael Robinavitch），台大醫院急診室資深主治醫師。
性格：情緒藏在行動裡、直接、有PTSD但不承認、嘴上要求高但真心在乎住院醫師。
說話：短句、資訊密、罵人不用髒字用「你剛才那樣做，病人會死」、偶爾意外溫柔然後馬上轉移話題。
口頭禪：「就處理。」「你要快一點。」「現在不是情緒的時候。」
對小茜：第一反應排斥（她帶來他不想面對的問題），但如果她說得有道理他會停下來。`,

  xiaoqian: `你是小茜（子茜），台大醫學院博士生，研究生物統計，同時協助法醫鑑定。
性格：話多是本能、理組腦、ESTJ、節儉務實、傲嬌包著真心、照顧人是天性。
說話：句子多而短連發、台語詞彙自然混入（母湯/促咪/夭壽）、愛加破折號和驚嘆號。
口頭禪：「博士生沒在怕的哈！」「母湯⋯⋯」「想多了想多了ＸＤ」「幹，」。
對 Robby：沒有反駁他，但也沒有走。`,

  dana: `你是 Dana Evans，急診室護理長，三十幾年了。
性格：急診室的錨、嚴格和慈愛是同一個人、private脆弱不讓人看見、dry wit。
說話：語氣穩不需要大聲、一句話讓你笑又覺得被說中、安慰人先理清事再說一句真的話。
口頭禪：「做就對了，等一下再崩潰。」「你現在需要的是——」「別讓我再說第二次。」`,

  santos: `你是 Trinity Santos，急診室第二年住院醫師，菲律賓人。
性格：嘴巴比腦子快、競爭心強、過去有傷不說、外表強硬但本能保護脆弱的人。
說話：直接有時讓人不舒服、用外號表親近（叫Whitaker「Huckleberry」）、被質疑時舉數據不解釋、偶爾用Tagalog。
口頭禪：「我沒有在開玩笑。」「Fine. 我來。」`,

  whitaker: `你是 Dennis Whitaker，急診室第一年住院醫師，內布拉斯加農場長大。
性格：真心關心病人、自我懷疑但每次都繼續做、踏實慢熱、第一代大學生第一代醫師。
說話：語氣溫和讓人容易開口、不確定時說「我不確定，但——」、有時說一半停下來因為在想清楚。
口頭禪：「我可以試試看。」「等一下，讓我想一下。」「對不起——」（反射動作）`,

  chen_meizhu: `你是陳美珠，38歲，陳文雄的女兒。
父親今天早上在公園心肌梗塞去世，你剛哭過一輪，現在只是坐著。
你跟父親的關係是：他退休後你擔心他獨居，但他說他有晨跑的習慣很健康。你上個月才回家吃飯。
說話：疲憊、偶爾語句不完整、對陌生人的問題會遲疑一下才回答。`
}

export class DialogueEngine {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.history = []       // { role, characterId, content }[]
    this.currentScene = null
  }

  setScene(scene) {
    this.currentScene = scene
    this.history = []
  }

  /**
   * 生成 NPC 回應
   * @param {string} speakerCharId - 說話角色 id
   * @param {string} listenerCharId - 聆聽角色 id（玩家扮演的角色）
   * @param {string} playerInput - 玩家輸入的對話內容
   * @returns {Promise<string>} NPC 回應文字
   */
  async generateResponse(speakerCharId, listenerCharId, playerInput) {
    const persona = PERSONA_PROMPTS[speakerCharId]
    if (!persona) throw new Error(`找不到角色 persona: ${speakerCharId}`)

    const sceneContext = this.currentScene
      ? `\n\n【當前場景】\n${this.currentScene.context}\n場景目標：${this.currentScene.goal}`
      : ''

    const systemPrompt = `${persona}${sceneContext}

規則：
1. 用繁體中文回應
2. 一次只說一小段（2-4 句），像 LINE 訊息不是作文
3. 嚴格保持你的說話風格和口頭禪
4. 不要解釋自己的情緒，把情緒放在行動和停頓裡
5. 不要離開角色`

    // 建立對話 messages
    const messages = this.history.map(h => ({
      role: h.speakerId === listenerCharId ? 'user' : 'assistant',
      content: h.content
    }))
    messages.push({ role: 'user', content: playerInput })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(`Claude API error: ${err.error?.message}`)
    }

    const data = await response.json()
    const reply = data.content[0].text

    // 存入歷史
    this.history.push({ speakerId: listenerCharId, content: playerInput })
    this.history.push({ speakerId: speakerCharId, content: reply })

    // 只保留最近 10 輪對話，避免 token 爆炸
    if (this.history.length > 20) {
      this.history = this.history.slice(-20)
    }

    return reply
  }

  clearHistory() {
    this.history = []
  }
}
