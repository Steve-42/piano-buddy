// 音频检测服务：使用 YAMNet 模型识别钢琴声
//
// YAMNet 是 Google 的音频事件分类模型，能识别 521 种声音
// 通过 TensorFlow.js 在浏览器端运行，不需要服务器

import * as tf from '@tensorflow/tfjs'

// YAMNet 要求 16kHz 单声道
const YAMNET_SAMPLE_RATE = 16000
const SAMPLE_DURATION_SEC = 1.5 // 每次采集 1.5 秒音频
const SAMPLE_INTERVAL_MS = 4000 // 每 4 秒分析一次（录音1.5s + 推理时间）

// 钢琴直接类别（高权重）
const PIANO_DIRECT_INDICES = [
  148, // Piano
  149, // Electric piano
  150, // Keyboard (musical)
]

// 音乐父类别（低权重，需要配合其他信号）
const MUSIC_PARENT_INDICES = [
  132, // Music
  133, // Musical instrument
]

// 需要排除的非钢琴声音（即使被归类为 Music 也不算）
const EXCLUDED_INDICES = [
  0, 1, 2, 3, 25, 26, // Speech 相关
  20, 21, 27, 28, 29, // Singing 相关
]

// 置信度阈值
const PIANO_DIRECT_THRESHOLD = 0.08 // Piano 类别直接匹配，阈值较低
const MUSIC_PARENT_THRESHOLD = 0.25  // Music 父类别需要更高置信度

// 连续检测次数
const CONSECUTIVE_DETECTIONS_NEEDED = 2

export interface DebugInfo {
  topClass: string
  topScore: number
  pianoScore: number
  isPiano: boolean
  modelLoaded: boolean
  result: string
  audioLevel: number // 音频电平，用于确认麦克风是否在工作
}

export type OnDetectionCallback = (detected: boolean, debug: DebugInfo) => void

// 内嵌前 10 个常见类别 + 钢琴相关类别名称，避免依赖外部 CSV
const BUILTIN_CLASS_NAMES: Record<number, string> = {
  0: 'Speech', 1: 'Child speech', 2: 'Conversation', 3: 'Narration',
  4: 'Babbling', 5: 'Speech synthesizer', 6: 'Shout', 7: 'Screaming',
  8: 'Whispering', 9: 'Laughter', 10: 'Baby laughter', 11: 'Giggle',
  12: 'Snicker', 13: 'Belly laugh', 14: 'Chuckle/chortle', 15: 'Crying',
  16: 'Baby cry', 17: 'Whimper', 18: 'Wail/moan', 19: 'Sigh',
  20: 'Singing', 21: 'Choir', 22: 'Yodeling', 23: 'Chant',
  24: 'Mantra', 25: 'Male speech', 26: 'Female speech',
  27: 'Child singing', 28: 'Synthetic singing', 29: 'Rapping',
  30: 'Humming', 31: 'Groan', 32: 'Grunt', 33: 'Whistling',
  34: 'Breathing', 35: 'Wheeze', 36: 'Snoring', 37: 'Gasp',
  38: 'Pant', 39: 'Snort', 40: 'Cough', 41: 'Throat clearing',
  42: 'Sneeze', 43: 'Sniff', 44: 'Run', 45: 'Shuffle',
  46: 'Walk/footsteps', 47: 'Chewing/mastication', 48: 'Biting',
  49: 'Gargling', 50: 'Stomach rumble', 51: 'Burping/eructation',
  52: 'Hiccup', 53: 'Fart', 54: 'Hands', 55: 'Finger snapping',
  56: 'Clapping', 57: 'Heart sounds', 58: 'Heart murmur',
  132: 'Music', 133: 'Musical instrument', 134: 'Plucked string instrument',
  135: 'Guitar', 136: 'Electric guitar', 137: 'Bass guitar',
  138: 'Acoustic guitar', 139: 'Steel guitar/slide guitar',
  140: 'Tapping (guitar)', 141: 'Strum', 142: 'Banjo', 143: 'Sitar',
  144: 'Mandolin', 145: 'Zither', 146: 'Ukulele',
  147: 'Bowed string instrument', 148: 'Piano',
  149: 'Electric piano', 150: 'Keyboard (musical)',
  151: 'Organ', 152: 'Electronic organ', 153: 'Hammond organ',
  154: 'Synthesizer', 155: 'Sampler', 156: 'Harpsichord',
  492: 'Silence', 493: 'Other sourceless', 494: 'Noise',
  495: 'Mains hum', 496: 'Static', 497: 'Pink noise',
  498: 'Tick', 499: 'Click', 500: 'Hum',
}

// 也尝试加载完整列表
let fullClassNames: Map<number, string> | null = null

async function loadFullClassNames(): Promise<void> {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv',
    )
    const csv = await response.text()
    const map = new Map<number, string>()
    const lines = csv.trim().split('\n')

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // CSV 格式: index,mid,display_name（display_name 可能被引号包裹）
      const firstComma = line.indexOf(',')
      const secondComma = line.indexOf(',', firstComma + 1)
      if (firstComma > 0 && secondComma > 0) {
        const idx = parseInt(line.substring(0, firstComma))
        let name = line.substring(secondComma + 1).trim()
        // 去掉可能的引号
        if (name.startsWith('"') && name.endsWith('"')) {
          name = name.slice(1, -1)
        }
        map.set(idx, name)
      }
    }
    fullClassNames = map
  } catch {
    // 加载失败就用内嵌的
  }
}

function getClassName(idx: number): string {
  return fullClassNames?.get(idx) ?? BUILTIN_CLASS_NAMES[idx] ?? `Class ${idx}`
}

export class AudioDetector {
  private model: tf.GraphModel | null = null
  private mediaStream: MediaStream | null = null
  private intervalId: number | null = null
  private callback: OnDetectionCallback | null = null
  private debugCallback: ((debug: DebugInfo) => void) | null = null
  private consecutiveDetections = 0
  private consecutiveSilence = 0
  private modelLoading = false
  private detecting = false // 防止重入

  onDebug(cb: (debug: DebugInfo) => void): void {
    this.debugCallback = cb
  }

  private async loadModel(): Promise<void> {
    if (this.model || this.modelLoading) return
    this.modelLoading = true

    try {
      // 并行加载模型和类别名称
      await Promise.all([
        tf.loadGraphModel(
          'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1',
          { fromTFHub: true },
        ).then((m) => { this.model = m }),
        loadFullClassNames(),
      ])
    } finally {
      this.modelLoading = false
    }
  }

  async start(callback: OnDetectionCallback): Promise<void> {
    this.callback = callback
    this.consecutiveDetections = 0
    this.consecutiveSilence = 0
    this.detecting = false

    this.debugCallback?.({
      topClass: '加载 AI 模型中...',
      topScore: 0,
      pianoScore: 0,
      isPiano: false,
      modelLoaded: false,
      result: 'loading',
      audioLevel: 0,
    })

    try {
      // 并行加载模型和获取麦克风
      const [, stream] = await Promise.all([
        this.loadModel(),
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: { ideal: 48000 },
          },
        }),
      ])

      this.mediaStream = stream

      this.debugCallback?.({
        topClass: '模型已加载，等待第一次检测...',
        topScore: 0,
        pianoScore: 0,
        isPiano: false,
        modelLoaded: true,
        result: 'ready',
        audioLevel: 0,
      })

      // 立即做一次检测，然后定期重复
      this.detect()
      this.intervalId = window.setInterval(() => {
        this.detect()
      }, SAMPLE_INTERVAL_MS)
    } catch (error) {
      console.error('启动失败:', error)
      throw error
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }
    this.callback = null
    this.detecting = false
  }

  private async detect(): Promise<void> {
    // 防止重入（上一次检测还没完成时跳过）
    if (this.detecting || !this.model || !this.mediaStream) return
    this.detecting = true

    try {
      // 用 MediaRecorder 录制音频片段
      const audioData = await this.recordWithMediaRecorder()
      if (!audioData || audioData.length === 0) {
        this.detecting = false
        return
      }

      // 计算音频电平（用于确认麦克风是否工作）
      let maxAbs = 0
      for (let i = 0; i < audioData.length; i++) {
        const abs = Math.abs(audioData[i])
        if (abs > maxAbs) maxAbs = abs
      }

      // 如果音频全是静音（电平极低），直接判定无声
      if (maxAbs < 0.001) {
        const debug: DebugInfo = {
          topClass: 'Silence',
          topScore: 1,
          pianoScore: 0,
          isPiano: false,
          modelLoaded: true,
          result: 'silent',
          audioLevel: maxAbs,
        }
        this.consecutiveSilence++
        this.consecutiveDetections = 0
        if (this.consecutiveSilence >= CONSECUTIVE_DETECTIONS_NEEDED) {
          this.callback?.(false, debug)
        }
        this.debugCallback?.(debug)
        this.detecting = false
        return
      }

      // 运行 YAMNet 推理
      const waveform = tf.tensor1d(audioData)
      const result = this.model.predict(waveform)

      const scores = Array.isArray(result) ? result[0] : result
      const scoresData = await (scores as tf.Tensor).data()
      const numClasses = 521
      const numFrames = Math.max(1, scoresData.length / numClasses)

      // 取所有帧的平均分数
      const avgScores = new Float32Array(numClasses)
      for (let i = 0; i < scoresData.length; i++) {
        avgScores[i % numClasses] += scoresData[i] / numFrames
      }

      // 找出钢琴直接类别的最高分
      let pianoDirectScore = 0
      for (const idx of PIANO_DIRECT_INDICES) {
        if (avgScores[idx] > pianoDirectScore) {
          pianoDirectScore = avgScores[idx]
        }
      }

      // 找出音乐父类别的最高分
      let musicParentScore = 0
      for (const idx of MUSIC_PARENT_INDICES) {
        if (avgScores[idx] > musicParentScore) {
          musicParentScore = avgScores[idx]
        }
      }

      // 检查排除类别（说话、唱歌等）
      let excludedScore = 0
      for (const idx of EXCLUDED_INDICES) {
        if (avgScores[idx] > excludedScore) {
          excludedScore = avgScores[idx]
        }
      }

      // 找出得分最高的类别
      let topIdx = 0
      let topScore = 0
      for (let i = 0; i < numClasses; i++) {
        if (avgScores[i] > topScore) {
          topScore = avgScores[i]
          topIdx = i
        }
      }

      // 综合判断逻辑：
      // 1. Piano 直接匹配 → 低阈值即可
      // 2. Music 父类别匹配 + 没有说话/唱歌声 → 较高阈值
      const isPianoDirect = pianoDirectScore > PIANO_DIRECT_THRESHOLD
      const isMusicNotSpeech =
        musicParentScore > MUSIC_PARENT_THRESHOLD && excludedScore < musicParentScore
      const isPiano = isPianoDirect || isMusicNotSpeech

      // 合并分数用于显示（取两者中更有意义的）
      const pianoScore = Math.max(pianoDirectScore, isPiano ? musicParentScore : 0)

      const debug: DebugInfo = {
        topClass: getClassName(topIdx),
        topScore: Math.round(topScore * 1000) / 1000,
        pianoScore: Math.round(pianoScore * 1000) / 1000,
        isPiano,
        modelLoaded: true,
        result: isPiano ? 'PIANO' : 'silent',
        audioLevel: Math.round(maxAbs * 1000) / 1000,
      }

      if (isPiano) {
        this.consecutiveDetections++
        this.consecutiveSilence = 0
      } else {
        this.consecutiveSilence++
        this.consecutiveDetections = 0
      }

      if (this.consecutiveDetections >= CONSECUTIVE_DETECTIONS_NEEDED) {
        this.callback?.(true, debug)
      }
      if (this.consecutiveSilence >= CONSECUTIVE_DETECTIONS_NEEDED) {
        this.callback?.(false, debug)
      }
      this.debugCallback?.(debug)

      // 清理张量
      waveform.dispose()
      if (Array.isArray(result)) {
        result.forEach((t) => (t as tf.Tensor).dispose())
      } else {
        (result as tf.Tensor).dispose()
      }
    } catch (error) {
      console.error('检测出错:', error)
    } finally {
      this.detecting = false
    }
  }

  // 使用 MediaRecorder 录制音频，然后用 OfflineAudioContext 解码并重采样到 16kHz
  private async recordWithMediaRecorder(): Promise<Float32Array | null> {
    if (!this.mediaStream) return null

    return new Promise((resolve) => {
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(this.mediaStream!, {
        mimeType: this.getSupportedMimeType(),
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks)
          const arrayBuffer = await blob.arrayBuffer()

          // 用 OfflineAudioContext 解码音频并重采样到 16kHz
          const numSamples = YAMNET_SAMPLE_RATE * SAMPLE_DURATION_SEC
          const offlineCtx = new OfflineAudioContext(1, numSamples, YAMNET_SAMPLE_RATE)

          const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)
          const source = offlineCtx.createBufferSource()
          source.buffer = audioBuffer
          source.connect(offlineCtx.destination)
          source.start()

          const rendered = await offlineCtx.startRendering()
          resolve(rendered.getChannelData(0))
        } catch (error) {
          console.error('音频解码失败:', error)
          resolve(null)
        }
      }

      recorder.start()
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, SAMPLE_DURATION_SEC * 1000)
    })
  }

  private getSupportedMimeType(): string {
    // 优先使用 WAV/WebM，iOS Safari 可能只支持 mp4
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return '' // 让浏览器选择默认格式
  }
}

export const audioDetector = new AudioDetector()
