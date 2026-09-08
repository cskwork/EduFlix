<script setup lang="ts">
// Export/Import 버튼 컴포넌트
import { useRouter } from 'vue-router'
import { isStaticMode } from '../../services/api/capabilities'
import { isLocalContentId } from '../../services/content/localContent'
import { exportLocalArchive, importLocalArchive } from '../../services/content/localArchive'
import { ref } from 'vue'
import { withAdminToken } from '../../services/api/adminToken'
import { useI18n } from '../../i18n'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  contentId: string
}>()

const isExporting = ref(false)
const isImporting = ref(false)
const importError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Export 핸들러
async function handleExport() {
  isExporting.value = true

  try {
    let blob: globalThis.Blob
    if (isLocalContentId(props.contentId)) {
      blob = new globalThis.Blob([Uint8Array.from(await exportLocalArchive(props.contentId))], { type: 'application/zip' })
    } else {
      const response = await fetch(`/api/content/${props.contentId}/export`)
      if (!response.ok) throw new Error('Export failed')
      blob = await response.blob()
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.contentId}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Export 오류:', e)
    alert(t('editor.transfer.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

// Import 파일 선택
function triggerFileInput() {
  fileInputRef.value?.click()
}

// Import 핸들러
async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // ZIP 파일 검증
  if (!file.name.toLowerCase().endsWith('.zip')) {
    importError.value = t('editor.transfer.zipOnly')
    return
  }

  isImporting.value = true
  importError.value = null

  try {
    if (isStaticMode || isLocalContentId(props.contentId)) {
      if (file.size > 2 * 1024 * 1024) throw new Error('Archive is too large')
      const id = await importLocalArchive(new Uint8Array(await file.arrayBuffer()))
      await router.push(`/content/${id}`)
      return
    }
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/content/import', {
      method: 'POST',
      headers: withAdminToken(),
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      let message = t('editor.transfer.importSucceeded')
      if (result.contentId !== result.originalId) {
        message += t('editor.transfer.importIdConflict', { contentId: result.contentId })
      }
      alert(message)
      // 페이지 리로드하여 새 콘텐츠 반영
      window.location.reload()
    } else {
      importError.value = result.error || t('editor.transfer.importFailed')
    }
  } catch (e) {
    console.error('Import 오류:', e)
    importError.value = t('editor.transfer.connectionFailed')
  } finally {
    isImporting.value = false
    // 파일 입력 초기화
    if (target) target.value = ''
  }
}
</script>

<template>
  <div class="export-import">
    <div class="button-group">
      <button
        class="export-btn"
        :disabled="isExporting"
        @click="handleExport"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span v-if="isExporting">{{ t('editor.transfer.exporting') }}</span>
        <span v-else>{{ t('editor.transfer.export') }}</span>
      </button>

      <button
        class="import-btn"
        :disabled="isImporting"
        @click="triggerFileInput"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span v-if="isImporting">{{ t('editor.transfer.importing') }}</span>
        <span v-else>{{ t('editor.transfer.import') }}</span>
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept=".zip"
        class="file-input-hidden"
        @change="handleImport"
      />
    </div>

    <p v-if="importError" class="error-message">{{ importError }}</p>
  </div>
</template>

<style scoped>
.export-import {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
}

.export-btn,
.import-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.export-btn:hover:not(:disabled),
.import-btn:hover:not(:disabled) {
  background-color: var(--color-bg-card-hover);
  color: var(--color-text-primary);
  border-color: rgba(59, 53, 98, 0.16);
}

.export-btn:disabled,
.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-input-hidden {
  display: none;
}

.error-message {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  text-align: center;
}
</style>
