import { decodeContentZip, encodeContentZip } from '../contentArchive'
import { buildLocalDocument, getLocalContent, saveLocalContent, type LocalContent } from './localContent'
import { isSubjectSlug } from '../../types/content'

async function inflateBounded(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  const source = new Blob([Uint8Array.from(bytes)]).stream()
  const reader = source.pipeThrough(new DecompressionStream('deflate-raw')).getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > maxBytes) throw new Error('Archive is too large')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  const output = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length }
  return output
}

export async function exportLocalArchive(id: string): Promise<Uint8Array> {
  const content = await getLocalContent(id)
  if (!content) throw new Error('Content not found')
  const manifest = { id: content.id, title: content.title, description: content.description, subject: content.subject, gradeLevel: content.gradeLevel, grade: content.grade, type: content.type, language: content.language, createdAt: content.createdAt }
  return encodeContentZip({
    'index.html': buildLocalDocument(content),
    'manifest.json': JSON.stringify(manifest),
  })
}

export async function importLocalArchive(bytes: Uint8Array): Promise<string> {
  const files = await decodeContentZip(bytes, inflateBounded)
  if (!files['index.html'] || !files['manifest.json']) throw new Error('index.html and manifest.json are required')
  const manifest = JSON.parse(files['manifest.json'])
  if (typeof manifest.title !== 'string' || !manifest.title.trim() ||
      !['elementary', 'middle', 'high'].includes(manifest.gradeLevel) ||
      typeof manifest.subject !== 'string' || !isSubjectSlug(manifest.subject) ||
      !['game', 'quiz', 'exploration', 'simulation', 'story'].includes(manifest.type)) {
    throw new Error('Invalid content manifest')
  }
  const id = `local-${crypto.randomUUID()}`
  const content: LocalContent = {
    id, title: manifest.title, description: typeof manifest.description === 'string' ? manifest.description : '',
    subject: manifest.subject, gradeLevel: manifest.gradeLevel, grade: typeof manifest.grade === 'string' ? manifest.grade : `${manifest.gradeLevel}-1`,
    type: manifest.type, language: typeof manifest.language === 'string' ? manifest.language : 'ko',
    html: files['index.html'], css: files['style.css'] ?? '', js: files['script.js'] ?? '', createdAt: new Date().toISOString(),
  }
  await saveLocalContent(content)
  return id
}
