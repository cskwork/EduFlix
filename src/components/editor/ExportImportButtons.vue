<script setup lang="ts">
// Export/Import 버튼 컴포넌트
import { ref } from 'vue'

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
    const response = await fetch(`/api/content/${props.contentId}/export`)

    if (!response.ok) {
      throw new Error('Export 실패')
    }

    // Blob으로 다운로드
    const blob = await response.blob()
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
    alert('콘텐츠 내보내기에 실패했습니다')
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
  if (!file.name.endsWith('.zip')) {
    importError.value = 'ZIP 파일만 가져올 수 있습니다'
    return
  }

  isImporting.value = true
  importError.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/content/import', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      let message = '콘텐츠를 성공적으로 가져왔습니다'
      if (result.contentId !== result.originalId) {
        message += `\n(ID 충돌로 새 ID 생성: ${result.contentId})`
      }
      alert(message)
      // 페이지 리로드하여 새 콘텐츠 반영
      window.location.reload()
    } else {
      importError.value = result.error || '가져오기 실패'
    }
  } catch (e) {
    console.error('Import 오류:', e)
    importError.value = '서버 연결에 실패했습니다'
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
        <span v-if="isExporting">내보내는 중...</span>
        <span v-else>내보내기</span>
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
        <span v-if="isImporting">가져오는 중...</span>
        <span v-else>가져오기</span>
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.export-btn:hover:not(:disabled),
.import-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  border-color: rgba(255, 255, 255, 0.2);
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
