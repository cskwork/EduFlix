// A bounded, text-only lesson archive contract shared by browser and Bun.
export const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024
const MAX_ENTRIES = 32
const FILE_NAMES = new Set(['index.html', 'style.css', 'script.js', 'manifest.json'])
const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function concat(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length }
  return result
}

export function encodeContentZip(files: Record<string, string>): Uint8Array {
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  let total = 0
  for (const [name, content] of Object.entries(files)) {
    if (!FILE_NAMES.has(name)) throw new Error(`Unsupported archive file: ${name}`)
    const filename = encoder.encode(name)
    const data = encoder.encode(content)
    total += data.length
    if (total > MAX_ARCHIVE_BYTES) throw new Error('Archive exceeds 2 MiB limit')
    const local = new Uint8Array(30 + filename.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x800, true); lv.setUint32(14, crc32(data), true)
    lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true)
    lv.setUint16(26, filename.length, true); local.set(filename, 30)
    const header = new Uint8Array(46 + filename.length)
    const cv = new DataView(header.buffer)
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x800, true); cv.setUint32(16, crc32(data), true)
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true)
    cv.setUint16(28, filename.length, true); cv.setUint32(42, offset, true)
    header.set(filename, 46)
    chunks.push(local, data); central.push(header); offset += local.length + data.length
  }
  const directory = concat(central)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, central.length, true); ev.setUint16(10, central.length, true)
  ev.setUint32(12, directory.length, true); ev.setUint32(16, offset, true)
  const result = concat([...chunks, directory, end])
  if (result.length > MAX_ARCHIVE_BYTES) throw new Error('Archive exceeds 2 MiB limit')
  return result
}

export async function decodeContentZip(
  bytes: Uint8Array,
  inflate: (compressed: Uint8Array, maxBytes: number) => Promise<Uint8Array>,
): Promise<Record<string, string>> {
  if (bytes.length > MAX_ARCHIVE_BYTES) throw new Error('Archive exceeds 2 MiB limit')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const check = (offset: number, length: number) => {
    if (offset < 0 || length < 0 || offset + length > bytes.length) throw new Error('Truncated ZIP archive')
  }
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) {
      end = i; break
    }
  }
  if (end < 0) throw new Error('ZIP central directory is missing')
  const count = view.getUint16(end + 10, true)
  if (count === 0 || count > MAX_ENTRIES || view.getUint16(end + 8, true) !== count ||
      view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) {
    throw new Error('Unsupported ZIP entry count or multi-disk archive')
  }
  let cursor = view.getUint32(end + 16, true)
  const directoryEnd = cursor + view.getUint32(end + 12, true)
  if (directoryEnd !== end) throw new Error('Invalid ZIP directory bounds')
  const result: Record<string, string> = {}
  const names = new Set<string>()
  const records: Array<{name: string; data: Uint8Array; method: number; size: number; crc: number}> = []
  let total = 0
  for (let entry = 0; entry < count; entry++) {
    check(cursor, 46)
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Invalid ZIP directory entry')
    const flags = view.getUint16(cursor + 8, true)
    const method = view.getUint16(cursor + 10, true)
    const crc = view.getUint32(cursor + 16, true)
    const compressed = view.getUint32(cursor + 20, true)
    const size = view.getUint32(cursor + 24, true)
    const nameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const local = view.getUint32(cursor + 42, true)
    check(cursor + 46, nameLength + extraLength + commentLength)
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength))
    if ((flags & ~0x808) !== 0 || (method !== 0 && method !== 8)) throw new Error('Unsupported ZIP encryption or compression')
    if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').some(p => p === '..' || p === '.')) {
      throw new Error('Unsafe ZIP path')
    }
    if (names.has(name)) throw new Error('Duplicate ZIP filename')
    names.add(name)
    check(local, 30)
    if (view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 8, true) !== method ||
        view.getUint16(local + 6, true) !== flags) throw new Error('ZIP header mismatch')
    const localNameLength = view.getUint16(local + 26, true)
    const start = local + 30 + localNameLength + view.getUint16(local + 28, true)
    check(local + 30, localNameLength)
    if (decoder.decode(bytes.subarray(local + 30, local + 30 + localNameLength)) !== name) throw new Error('ZIP filename mismatch')
    check(start, compressed)
    if (start + compressed > view.getUint32(end + 16, true)) throw new Error('ZIP payload overlaps directory')
    total += size
    if (total > MAX_ARCHIVE_BYTES || compressed > MAX_ARCHIVE_BYTES) throw new Error('Extracted archive exceeds 2 MiB limit')
    if (!name.endsWith('/')) records.push({name, data: bytes.subarray(start, start + compressed), method, size, crc})
    else if (size !== 0) throw new Error('Invalid ZIP directory payload')
    cursor += 46 + nameLength + extraLength + commentLength
  }
  if (cursor !== directoryEnd) throw new Error('Invalid ZIP directory length')
  // Accept a flat archive or one common enclosing folder, never flatten arbitrary paths.
  const prefix = records[0]?.name.includes('/') ? records[0].name.slice(0, records[0].name.lastIndexOf('/') + 1) : ''
  let extracted = 0
  for (const record of records) {
    if (!record.name.startsWith(prefix)) throw new Error('ZIP files must share one folder')
    const name = record.name.slice(prefix.length)
    if (!FILE_NAMES.has(name) || Object.prototype.hasOwnProperty.call(result, name)) throw new Error(`Unsupported or duplicate archive file: ${name}`)
    const data = record.method === 0 ? record.data : await inflate(record.data, Math.max(1, MAX_ARCHIVE_BYTES - extracted))
    extracted += data.length
    if (extracted > MAX_ARCHIVE_BYTES || data.length !== record.size || crc32(data) !== record.crc) throw new Error('ZIP size or checksum mismatch')
    result[name] = decoder.decode(data)
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'index.html') || !Object.prototype.hasOwnProperty.call(result, 'manifest.json')) throw new Error('ZIP requires index.html and manifest.json')
  result['style.css'] ??= ''
  result['script.js'] ??= ''
  return result
}
