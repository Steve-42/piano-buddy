// 设置页 - cream + emerald 主题，单屏克制布局
// 保留所有原有功能：每日目标、AI API 配置、背景图

import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/db'
import type { UserSettings } from '../types'
import { DEFAULT_SETTINGS, BUILTIN_LLM } from '../types'
import { PB, PAGE_BG, SERIF } from '../styles/tokens'

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [showApiAdvanced, setShowApiAdvanced] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  function handleChange<K extends keyof UserSettings>(field: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="screen-fade"
      style={{
        minHeight: '100vh',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
        color: PB.ink,
        background: PAGE_BG,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
        }}
      >
        <button onClick={onBack} aria-label="返回" style={navArrowBtn}>
          ‹
        </button>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 19,
            fontWeight: 500,
            color: PB.ink,
            letterSpacing: '-0.01em',
          }}
        >
          设置
        </div>
        <div style={{ width: 32 }} />
      </div>

      {/* 每日目标 */}
      <Group>
        <Row label="每日目标" detail={`${settings.dailyGoalMinutes} 分钟`} />
        <SliderRow
          value={settings.dailyGoalMinutes}
          min={5}
          max={60}
          step={5}
          onChange={(v) => handleChange('dailyGoalMinutes', v)}
        />
      </Group>

      {/* 提醒时间 */}
      <Group>
        <Row label="提醒时间">
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => handleChange('reminderTime', e.target.value)}
            style={inlineInput}
          />
        </Row>
      </Group>

      {/* AI 鼓励 */}
      <Group>
        <Row label="AI 鼓励">
          <span style={{ fontSize: 12, color: PB.inkDim, marginRight: 6 }}>
            {settings.llmApiKey ? '自定义' : BUILTIN_LLM.apiKey ? '内置' : '默认文案'}
          </span>
          <button
            onClick={() => setShowApiAdvanced((v) => !v)}
            style={chevronBtn}
            aria-label="展开 AI 设置"
          >
            {showApiAdvanced ? '∧' : '›'}
          </button>
        </Row>
        {showApiAdvanced && (
          <div style={{ padding: '4px 16px 16px' }}>
            <FieldLabel>API 地址</FieldLabel>
            <input
              type="url"
              value={settings.llmApiEndpoint}
              onChange={(e) => handleChange('llmApiEndpoint', e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              style={textInput}
            />
            <FieldHint>支持任何 OpenAI 兼容 API（如 Claude、本地模型等）</FieldHint>

            <FieldLabel>API Key</FieldLabel>
            <input
              type="password"
              value={settings.llmApiKey}
              onChange={(e) => handleChange('llmApiKey', e.target.value)}
              placeholder="sk-..."
              style={textInput}
            />
            <FieldHint>密钥仅存储在本地浏览器中，不会上传到任何服务器。</FieldHint>

            <FieldLabel>模型名称</FieldLabel>
            <input
              type="text"
              value={settings.llmModel}
              onChange={(e) => handleChange('llmModel', e.target.value)}
              placeholder="gpt-4o-mini"
              style={textInput}
            />

            {!settings.llmApiKey && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  background: PB.emeraldBg,
                  border: `1px solid ${PB.emeraldSoft}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: PB.emeraldDeep,
                  lineHeight: 1.5,
                }}
              >
                {BUILTIN_LLM.apiKey
                  ? '已启用内置 AI 鼓励，无需配置即可使用。填写自己的 API Key 可切换为自定义模型。'
                  : '未配置 API Key 时使用内置默认文案。配置后可获得更个性化的 AI 鼓励。'}
              </div>
            )}
          </div>
        )}
      </Group>

      {/* 背景图片 */}
      <Group>
        <Row label="花园背景">
          {settings.backgroundImage && (
            <button
              onClick={() => handleChange('backgroundImage', '')}
              style={{ ...chevronBtn, color: '#b25656' }}
              aria-label="清除背景图"
            >
              清除
            </button>
          )}
        </Row>
        <div style={{ padding: '0 16px 14px' }}>
          {settings.backgroundImage && (
            <div
              style={{
                position: 'relative',
                borderRadius: 10,
                overflow: 'hidden',
                height: 100,
                marginBottom: 10,
              }}
            >
              <img
                src={settings.backgroundImage}
                alt="背景预览"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                handleChange('backgroundImage', reader.result as string)
              }
              reader.readAsDataURL(file)
            }}
            style={{
              width: '100%',
              fontSize: 12,
              color: PB.inkSoft,
            }}
          />
          <FieldHint>图片仅存储在本地。未设置时使用默认渐变背景。</FieldHint>
        </div>
      </Group>

      <button
        onClick={handleSave}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '14px 18px',
          borderRadius: 14,
          border: `1px solid ${saved ? PB.emerald : PB.emeraldDark}`,
          background: saved
            ? `linear-gradient(180deg, ${PB.emeraldBg}, ${PB.emeraldSoft})`
            : `linear-gradient(180deg, #fffaee, ${PB.creamWarm})`,
          color: PB.emeraldDeep,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'inherit',
          letterSpacing: '0.04em',
          cursor: 'pointer',
          boxShadow: saved
            ? 'none'
            : 'inset 0 1.5px 3px rgba(255,255,255,0.9), 0 6px 18px -8px rgba(5,102,105,0.25)',
          transition: 'all 200ms ease',
        }}
      >
        {saved ? '已保存' : '保存设置'}
      </button>

      <div
        style={{
          textAlign: 'center',
          marginTop: 18,
          fontSize: 11,
          color: PB.inkDim,
          fontStyle: 'italic',
          fontFamily: SERIF,
          letterSpacing: '0.02em',
        }}
      >
        弹琴是为了你自己。
      </div>
    </div>
  )
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(120,100,70,0.08)',
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  )
}

interface RowProps {
  label: string
  detail?: string
  children?: React.ReactNode
}

function Row({ label, detail, children }: RowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        minHeight: 50,
        borderBottom: '1px solid rgba(120,100,70,0.06)',
      }}
    >
      <div style={{ flex: 1, fontSize: 14, color: PB.ink }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {detail && <div style={{ fontSize: 13, color: PB.inkSoft }}>{detail}</div>}
        {children}
      </div>
    </div>
  )
}

interface SliderRowProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function SliderRow({ value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          color: PB.inkDim,
          letterSpacing: '0.05em',
        }}
      >
        <span>{min} 分</span>
        <span>{max} 分</span>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: PB.inkDim,
        letterSpacing: '0.06em',
        marginTop: 12,
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: PB.inkDim, marginTop: 5, lineHeight: 1.5 }}>{children}</div>
  )
}

const chevronBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: PB.inkDim,
  fontSize: 14,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1,
}

const navArrowBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 99,
  border: '1px solid rgba(120,100,70,0.12)',
  background: 'rgba(255,255,255,0.5)',
  color: PB.inkSoft,
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const inlineInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(120,100,70,0.16)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 13,
  color: PB.ink,
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
}

const textInput: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(120,100,70,0.16)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
  color: PB.ink,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}
