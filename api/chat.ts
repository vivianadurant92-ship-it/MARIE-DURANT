export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' })

  const { messages, system, max_tokens = 1500, model = 'claude-sonnet-5' } = req.body

  // Wrap system prompt as a content block to enable prompt caching
  const systemPayload = system
    ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
    : undefined

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({ model, max_tokens, system: systemPayload, messages }),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch {
    return res.status(500).json({ error: 'Failed to reach Anthropic API' })
  }
}
