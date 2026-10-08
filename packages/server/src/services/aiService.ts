// Model Pool Gemini Gratis (Diurutkan berdasarkan limit harian tertinggi & performa)
export const GEMINI_FREE_POOL = [
  'gemini-3.1-flash-lite', // 500 RPD, 15 RPM
  'gemini-3.5-flash-lite', // 500 RPD, 15 RPM
  'gemini-2.5-flash-lite', // 20 RPD, 10 RPM
  'gemini-3.7-flash',      // 20 RPD, 5 RPM
  'gemini-3.6-flash',      // 20 RPD, 5 RPM
  'gemini-3.5-flash',      // 20 RPD, 5 RPM
  'gemini-3.8-flash',      // 20 RPD, 5 RPM
  'gemma-4-31b-it',        // 14.4K RPD, 30 RPM
  'gemma-4-26b-a4b-it',    // 14.4K RPD, 30 RPM
]

export async function callGeminiGenerate(model: string, apiKey: string, messages: any[]) {
  const systemMessages = messages.filter((m: any) => m.role === 'system')
  const nonSystemMessages = messages.filter((m: any) => m.role !== 'system')

  const systemInstruction =
    systemMessages.length > 0
      ? { parts: [{ text: systemMessages.map((m: any) => m.content).join('\n\n') }] }
      : undefined

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
  for (const m of nonSystemMessages) {
    const role = m.role === 'assistant' ? 'model' : 'user'
    const text = String(m.content || '').trim()
    if (!text) continue
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n\n' + text
    } else {
      contents.push({ role, parts: [{ text }] })
    }
  }

  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Halo' }] })
  }

  const payload: any = { contents }
  if (systemInstruction) {
    payload.systemInstruction = systemInstruction
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`HTTP ${resp.status}: ${errText}`)
  }

  const data: any = await resp.json()
  const candidate = data.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text || ''
  return text
}

export async function handleGeminiWithAutoRotate(body: any, env?: any) {
  const { messages, model } = body || {}
  const apiKey =
    (env as any)?.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    'AIzaSyBJ7_sKQpDZ3L0WGsun5QwhZOTbgt2MOEE'

  // Susun kandidat model: jika model spesifik dipilih, coba model itu terlebih dahulu
  let candidateModels = [...GEMINI_FREE_POOL]
  if (model && model !== 'auto' && GEMINI_FREE_POOL.includes(model)) {
    candidateModels = [model, ...GEMINI_FREE_POOL.filter((m) => m !== model)]
  }

  const errors: string[] = []
  for (const currentModel of candidateModels) {
    try {
      const text = await callGeminiGenerate(currentModel, apiKey, messages)
      if (text) {
        return {
          success: true,
          message: text,
          model: currentModel,
          provider: 'gemini',
          rotated: model && model !== 'auto' && currentModel !== model,
          data: {
            message: text,
            model: currentModel,
            provider: 'gemini',
            rotated: model && model !== 'auto' && currentModel !== model,
          },
        }
      }
    } catch (err: any) {
      errors.push(`${currentModel}: ${err?.message || err}`)
      console.warn(`[Gemini Auto-Rotate] Model ${currentModel} gagal/limit, mencoba model berikutnya...`)
    }
  }

  return {
    success: false,
    error: `Semua model Gemini dalam pool mengalami limit/gangguan: ${errors.slice(0, 3).join('; ')}`,
  }
}

export async function handleOllamaChat(body: any, env?: any) {
  const { messages, model } = body || {}
  const apiKey =
    (env as any)?.OLLAMA_API_KEY ||
    process.env.OLLAMA_API_KEY ||
    '361654291a15448aab20c16d74894024.mrX4sBHI54Fu6uFMHgtmsszk'
  const selectedModel =
    !model || model === 'auto' || model.startsWith('gemini') ? 'gemma4:31b' : model

  const resp = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: false,
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    return { success: false, error: `Ollama Cloud Error (${resp.status}): ${errText}` }
  }

  const data: any = await resp.json()
  const content = data.message?.content || ''
  return {
    success: true,
    message: content,
    thinking: data.message?.thinking || '',
    model: data.model,
    provider: 'ollama',
    data: {
      message: content,
      thinking: data.message?.thinking || '',
      model: data.model,
      provider: 'ollama',
    },
  }
}

// Handler terpadu integrasi AI (Google Gemini Auto-Rotate + Ollama Cloud)
export async function handleAiChat(body: any, env?: any) {
  try {
    const { messages, model, provider } = body || {}
    if (!messages || !Array.isArray(messages)) {
      return { success: false, error: 'Parameter messages harus berupa array [{ role, content }]' }
    }

    const isGemini =
      provider === 'gemini' ||
      !model ||
      model === 'auto' ||
      model.startsWith('gemini') ||
      model.startsWith('gemma-4')

    if (isGemini) {
      const geminiResult = await handleGeminiWithAutoRotate(body, env)
      if (geminiResult.success) {
        return geminiResult
      }
      console.warn('[AI Service] Gemini pool exhausted, falling back to Ollama Cloud...')
    }

    return await handleOllamaChat(body, env)
  } catch (err: any) {
    return { success: false, error: 'Gagal menghubungi AI Service: ' + (err?.message || err) }
  }
}
