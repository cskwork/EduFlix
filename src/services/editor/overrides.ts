import type { SaveContentRequest } from '../../types/editor'

export function validateEditorOverrides(value: unknown): SaveContentRequest {
  const data = value as SaveContentRequest
  if (!data || typeof data.contentId !== 'string' || !Array.isArray(data.texts) ||
      !Array.isArray(data.styles) || !Array.isArray(data.quizzes)) throw new Error('Invalid editor changes')
  if (data.quizzes.length) throw new Error('This content does not support persistent quiz editing')
  if (data.texts.some(text => !text || typeof text.path !== 'string' || typeof text.value !== 'string') ||
      data.styles.some(style => !style || typeof style.variable !== 'string' || !/^--[\w-]+$/.test(style.variable) || typeof style.value !== 'string')) {
    throw new Error('Invalid text or style changes')
  }
  return { contentId: data.contentId, texts: data.texts, styles: data.styles, quizzes: [] }
}

export function embedEditorOverrides(html: string, value: unknown): string {
  const data = validateEditorOverrides(value)
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const cleaned = html.replace(/<script\b[^>]*\bid=["']eduflix-editor-overrides["'][^>]*>[\s\S]*?<\/script\s*>/gi, '')
  const payload = `<script id="eduflix-editor-overrides" type="application/json">${json}</script>`
  const bridge = /<script\b[^>]*src=["'][^"']*editor-bridge\.js["']/i.test(cleaned)
    ? '' : '<script id="editor-bridge-script" src="/contents/common/editor-bridge.js"></script>'
  const insertion = `${payload}\n${bridge}`
  return /<\/body\s*>/i.test(cleaned) ? cleaned.replace(/<\/body\s*>/i, () => `${insertion}\n</body>`) : `${cleaned}\n${insertion}`
}
