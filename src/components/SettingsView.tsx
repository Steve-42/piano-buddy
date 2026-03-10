// 设置页面：每日目标、LLM API 配置

import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/db'
import type { UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function handleSave() {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChange(field: keyof UserSettings, value: string | number) {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* 顶部 */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors mr-4"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-white">设置</h1>
        </div>

        {/* 练习目标 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">练习目标</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-sm text-slate-400 mb-2">
              每日目标（分钟）
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={settings.dailyGoalMinutes}
              onChange={(e) =>
                handleChange('dailyGoalMinutes', parseInt(e.target.value) || 30)
              }
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2
                         border border-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </section>

        {/* AI 设置 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">AI 鼓励设置</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                API 地址
              </label>
              <input
                type="url"
                value={settings.llmApiEndpoint}
                onChange={(e) => handleChange('llmApiEndpoint', e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2
                           border border-slate-600 focus:border-indigo-500 focus:outline-none
                           text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                支持任何 OpenAI 兼容 API（如 Claude、本地模型等）
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.llmApiKey}
                onChange={(e) => handleChange('llmApiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2
                           border border-slate-600 focus:border-indigo-500 focus:outline-none
                           text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                密钥仅存储在本地浏览器中，不会上传到任何服务器
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={settings.llmModel}
                onChange={(e) => handleChange('llmModel', e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2
                           border border-slate-600 focus:border-indigo-500 focus:outline-none
                           text-sm"
              />
            </div>

            {!settings.llmApiKey && (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                <p className="text-sm text-amber-300">
                  未配置 API Key 时将使用内置的默认鼓励语。
                  配置后可获得更个性化的 AI 鼓励。
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
