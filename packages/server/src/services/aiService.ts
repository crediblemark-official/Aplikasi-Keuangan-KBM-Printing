// KBM Business AI Service
// Provider Utama: Ollama Cloud + Cloudflare Workers AI (Zero Latency Edge)

export const OLLAMA_DEFAULT_MODEL = 'gemma4:31b'

export async function handleCloudflareWorkersAi(body: any, env?: any) {
  if (!env?.AI) return null
  const { messages, model } = body || {}
  const targetModel = (model && model.startsWith('@cf/')) ? model : '@cf/meta/llama-3.1-8b-instruct'

  try {
    const cfMessages = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: String(m.content || ''),
    }))

    const resp = await env.AI.run(targetModel, {
      messages: cfMessages,
      max_tokens: 1024,
    })

    const text = resp?.response || ''
    if (text) {
      return {
        success: true,
        message: text,
        model: targetModel,
        provider: 'cloudflare-workers-ai',
        data: {
          message: text,
          model: targetModel,
          provider: 'cloudflare-workers-ai',
        },
      }
    }
  } catch (err: any) {
    console.warn('[Workers AI] Warning/Fallback:', err?.message || err)
  }
  return null
}

export async function handleOllamaChat(body: any, env?: any) {
  const { messages, model } = body || {}
  const apiKey =
    (env as any)?.OLLAMA_API_KEY ||
    process.env.OLLAMA_API_KEY ||
    '361654291a15448aab20c16d74894024.mrX4sBHI54Fu6uFMHgtmsszk'

  const selectedModel =
    !model || model === 'auto' || model.startsWith('@cf/') ? OLLAMA_DEFAULT_MODEL : model

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
    model: data.model || selectedModel,
    provider: 'ollama',
    data: {
      message: content,
      thinking: data.message?.thinking || '',
      model: data.model || selectedModel,
      provider: 'ollama',
    },
  }
}

// Handler terpadu integrasi AI (Ollama Cloud + Cloudflare Workers AI)
export async function handleAiChat(body: any, env?: any) {
  try {
    const { messages, model } = body || {}
    if (!messages || !Array.isArray(messages)) {
      return { success: false, error: 'Parameter messages harus berupa array [{ role, content }]' }
    }

    // 1. Jika model spesifik Cloudflare dipilih:
    if (model && model.startsWith('@cf/')) {
      const cfRes = await handleCloudflareWorkersAi(body, env)
      if (cfRes?.success) return cfRes
      // Fallback ke Ollama jika Workers AI gagal
      return await handleOllamaChat(body, env)
    }

    // 2. Default / Auto: Gunakan Ollama Cloud (Gemma 4 31B)
    const ollamaRes = await handleOllamaChat(body, env)
    if (ollamaRes.success) {
      return ollamaRes
    }

    // 3. Fallback jika Ollama Cloud bermasalah: coba Cloudflare Workers AI
    console.warn('[AI Service] Ollama Cloud gagal, mencoba Cloudflare Workers AI fallback...')
    const cfFallback = await handleCloudflareWorkersAi(body, env)
    if (cfFallback?.success) {
      return cfFallback
    }

    return ollamaRes
  } catch (err: any) {
    return { success: false, error: 'Gagal menghubungi AI Service: ' + (err?.message || err) }
  }
}
