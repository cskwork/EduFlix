<script setup lang="ts">
// 콘텐츠 편집 패널 - 메인 컴포넌트
import { ref, computed, watch, onUnmounted } from 'vue'
import type {
  EditableContent,
  EditableText,
  EditableStyle,
  EditorMessage,
  SaveContentRequest,
  ExtractedContentPayload
} from '../../types/editor'
import TextEditor from './TextEditor.vue'
import StyleEditor from './StyleEditor.vue'
import ExportImportButtons from './ExportImportButtons.vue'
import { withAdminToken } from '../../services/api/adminToken'
import { getLocalContent, isLocalContentId, saveLocalContent } from '../../services/content/localContent'
import { validateEditorOverrides } from '../../services/editor/overrides'
import { useI18n } from '../../i18n'

const { t } = useI18n()

const props = defineProps<{
  contentId: string
  iframeRef: HTMLIFrameElement | null
}>()

const emit = defineEmits<{
  close: []
  save: [content: EditableContent]
}>()

// 상태
const activeTab = ref<'text' | 'style' | 'quiz'>('text')
const isLoading = ref(true)
const isSaving = ref(false)
const hasChanges = ref(false)
const error = ref<string | null>(null)

// 편집 데이터
const texts = ref<EditableText[]>([])
const styles = ref<EditableStyle[]>([])
const quizzes = ref<EditableContent['quizzes']>([])

// 원본 데이터 (변경 감지용)
let retryTimer: ReturnType<typeof setTimeout> | undefined

const savedOverrides = ref<SaveContentRequest | null>(null)
const originalData = ref<ExtractedContentPayload | null>(null)

// 현재 편집 콘텐츠
const editableContent = computed<EditableContent>(() => ({
  contentId: props.contentId,
  texts: texts.value,
  styles: styles.value,
  quizzes: quizzes.value,
  metadata: {
    title: texts.value.find(t => t.type === 'title')?.value || '',
    description: texts.value.find(t => t.type === 'description')?.value || ''
  }
}))

// 탭 정보
const tabs = computed(
  () =>
    [
      { id: 'text', label: t('editor.tabText'), icon: 'T' },
      { id: 'style', label: t('editor.tabStyle'), icon: 'S' },
      { id: 'quiz', label: t('editor.tabQuiz'), icon: 'Q' }
    ] as const
)

// postMessage 핸들러
function handleMessage(event: MessageEvent) {
  // 콘텐츠 iframe은 같은 origin에서 서빙되므로, 다른 창이 보낸 메시지는 무시한다
  if (event.origin !== window.location.origin || event.source !== props.iframeRef?.contentWindow) return

  const { type, payload } = event.data || {}

  console.log('[Editor] 메시지 수신:', type)

  switch (type) {
    case 'EDITOR_READY':
      // iframe 준비 완료 - 콘텐츠 추출 요청
      console.log('[Editor] EDITOR_READY 수신 - EXTRACT_CONTENT 요청')
      sendToIframe({ type: payload?.auto ? 'EDITOR_INIT' : 'EXTRACT_CONTENT' })
      break

    case 'CONTENT_EXTRACTED':
      if (payload && !hasChanges.value) {
        console.log('[Editor] CONTENT_EXTRACTED 수신 - 분석 완료')
        const extracted = payload as ExtractedContentPayload
        texts.value = extracted.texts || []
        styles.value = extracted.styles || []
        quizzes.value = extracted.quizzes || []
        originalData.value = JSON.parse(JSON.stringify(extracted))
        savedOverrides.value = extracted.overrides ?? null
        isLoading.value = false
      }
      break

    case 'UPDATE_APPLIED':
      // 업데이트 성공 확인
      if (payload?.success) {
        hasChanges.value = true
      }
      break

    default:
      break
  }
}

// iframe으로 메시지 전송
function sendToIframe(message: EditorMessage) {
  if (props.iframeRef?.contentWindow) {
    props.iframeRef.contentWindow.postMessage(message, window.location.origin)
  }
}

// 텍스트 업데이트 핸들러
function handleTextUpdate(text: EditableText) {
  hasChanges.value = true
  const index = texts.value.findIndex(t => t.id === text.id)
  if (index !== -1) {
    texts.value[index] = text
    sendToIframe({
      type: 'UPDATE_TEXT',
      payload: { id: text.id, path: text.path, value: text.value }
    })
  }
}

// 스타일 업데이트 핸들러
function handleStyleUpdate(style: EditableStyle) {
  hasChanges.value = true
  const index = styles.value.findIndex(s => s.id === style.id)
  if (index !== -1) {
    styles.value[index] = style
    sendToIframe({
      type: 'UPDATE_STYLE',
      payload: { variable: style.variable, value: style.value }
    })
  }
}

// 저장
async function handleSave() {
  isSaving.value = true
  error.value = null

  try {
    const changedTexts = texts.value.filter(text => originalData.value?.texts.find(item => item.path === text.path)?.value !== text.value).map(text => ({ ...text, originalValue: savedOverrides.value?.texts.find(item => item.path === text.path)?.originalValue ?? originalData.value?.texts.find(item => item.path === text.path)?.value }))
    const changedStyles = styles.value.filter(style => originalData.value?.styles.find(item => item.variable === style.variable)?.value !== style.value)
    const changes = validateEditorOverrides({
      contentId: props.contentId,
      texts: [...(savedOverrides.value?.texts ?? []).filter(text => !changedTexts.some(item => item.path === text.path)), ...changedTexts],
      styles: [...(savedOverrides.value?.styles ?? []).filter(style => !changedStyles.some(item => item.variable === style.variable)), ...changedStyles],
      quizzes: []
    })
    let result: { success: boolean; error?: string }
    if (isLocalContentId(props.contentId)) {
      const local = await getLocalContent(props.contentId)
      if (!local) throw new Error(t('errors.contentNotFound'))
      await saveLocalContent({ ...local, editorOverrides: changes })
      result = { success: true }
    } else {
      const response = await fetch(`/api/content/${props.contentId}/files`, {
        method: 'PUT',
        headers: withAdminToken({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(changes)
      })
      result = await response.json()
      if (!response.ok) result.success = false
    }

    if (result.success) {
      hasChanges.value = false
      savedOverrides.value = changes
      originalData.value = JSON.parse(JSON.stringify({
        texts: texts.value,
        styles: styles.value,
        quizzes: quizzes.value
      }))
      emit('save', editableContent.value)
    } else {
      error.value = result.error || t('editor.saveFailed')
    }
  } catch (e) {
    error.value = t('editor.connectionFailed')
    console.error('저장 오류:', e)
  } finally {
    isSaving.value = false
  }
}

// 취소 (원본으로 복원)
function handleCancel() {
  if (!confirmDiscard()) {
    return
  }

  if (originalData.value) {
    texts.value = JSON.parse(JSON.stringify(originalData.value.texts))
    styles.value = JSON.parse(JSON.stringify(originalData.value.styles))
    quizzes.value = JSON.parse(JSON.stringify(originalData.value.quizzes))

    // iframe 리로드로 원본 상태 복원
    if (props.iframeRef) {
      props.iframeRef.contentWindow?.location.reload()
    }
  }

  hasChanges.value = false
  emit('close')
}

// iframe 로드 시 편집 모드 초기화
function initEditor() {
  if (props.iframeRef) {
    isLoading.value = true
    error.value = null
    console.log('[Editor] initEditor 호출 - EDITOR_INIT 전송')
    // iframe 로드 완료 후 편집 모드 초기화
    sendToIframe({ type: 'EDITOR_INIT' })

    // 3초 후에도 분석이 안 끝났으면 재시도
    window.clearTimeout(retryTimer)
    retryTimer = setTimeout(() => {
      if (isLoading.value) {
        console.warn('[Editor] 재시도 - EDITOR_INIT (3초 타임아웃)')
        sendToIframe({ type: 'EDITOR_INIT' })
        retryTimer = setTimeout(() => {
          if (isLoading.value) { isLoading.value = false; error.value = t('editor.connectionFailed') }
        }, 3000)
      }
    }, 3000)
  }
}

// 컴포넌트 setup 단계에서 즉시 메시지 리스너 등록 (race condition 방지)
window.addEventListener('message', handleMessage)
console.log('[Editor] 메시지 리스너 등록 완료 (setup 단계)')

// iframe ref 변경 감지
watch(() => props.iframeRef, (newRef) => {
  if (newRef) {
    console.log('[Editor] iframeRef 감지 - readyState:', newRef.contentDocument?.readyState)
    // iframe이 이미 로드되었다면 바로 초기화
    if (newRef.contentDocument?.readyState === 'complete') {
      initEditor()
    } else {
      newRef.addEventListener('load', initEditor, { once: true })
    }
  }
}, { immediate: true })

onUnmounted(() => {
  window.clearTimeout(retryTimer)
  props.iframeRef?.removeEventListener('load', initEditor)
  window.removeEventListener('message', handleMessage)
  console.log('[Editor] 메시지 리스너 제거')
})
function confirmDiscard() { return !hasChanges.value || confirm(t('editor.confirmDiscard')) }
defineExpose({ requestClose: handleCancel, confirmDiscard })
</script>

<template>
  <aside class="editor-panel">
    <header class="editor-header">
      <h2>{{ t('editor.title') }}</h2>
      <button class="close-btn" :aria-label="t('common.close')" @click="handleCancel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="editor-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="editor-loading">
      <div class="loading-spinner"></div>
      <p>{{ t('editor.analyzing') }}</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="editor-error">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="initEditor">{{ t('common.retry') }}</button>
    </div>

    <!-- 편집 콘텐츠 -->
    <div v-else class="editor-content">
      <!-- 텍스트 편집 탭 -->
      <TextEditor
        v-if="activeTab === 'text'"
        :texts="texts"
        @update="handleTextUpdate"
      />

      <!-- 스타일 편집 탭 -->
      <StyleEditor
        v-if="activeTab === 'style'"
        :styles="styles"
        @update="handleStyleUpdate"
      />

      <!-- 퀴즈 편집 탭 -->
      <p v-if="activeTab === 'quiz'">{{ t('editor.quizUnsupported') }}</p>
    </div>

    <!-- 하단 액션 버튼 -->
    <footer class="editor-footer">
      <ExportImportButtons :content-id="contentId" />

      <div class="action-buttons">
        <button class="btn-cancel" :disabled="isSaving" @click="handleCancel">
          {{ t('common.cancel') }}
        </button>
        <button
          class="btn-save"
          :disabled="!hasChanges || isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving">{{ t('common.saving') }}</span>
          <span v-else>{{ t('common.save') }}</span>
        </button>
      </div>

      <div v-if="hasChanges" class="unsaved-indicator">
        {{ t('editor.unsavedChanges') }}
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid rgba(59, 53, 98, 0.08);
}

.editor-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.close-btn:hover {
  background-color: rgba(59, 53, 98, 0.08);
  color: var(--color-text-primary);
}

/* 탭 */
.editor-tabs {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid rgba(59, 53, 98, 0.08);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm);
  background-color: transparent;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background-color: rgba(59, 53, 98, 0.06);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background-color: var(--color-brand-primary);
  color: #fff;
}

.tab-icon {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.tab-label {
  font-size: var(--font-size-xs);
}

/* 콘텐츠 영역 */
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

/* 로딩 상태 */
.editor-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 53, 98, 0.1);
  border-top-color: var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.editor-loading p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* 에러 상태 */
.editor-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  text-align: center;
}

.editor-error p {
  color: var(--color-error);
}

.retry-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-brand-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
}

/* 푸터 */
.editor-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid rgba(59, 53, 98, 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.btn-cancel {
  background-color: var(--color-bg-card);
  border: var(--border-sticker);
  color: var(--color-text-secondary);
}

.btn-cancel:hover:not(:disabled) {
  background-color: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.btn-save {
  background-color: var(--color-brand-primary);
  color: #fff;
  box-shadow: 0 3px 0 rgba(59, 53, 98, 0.2);
}

.btn-save:hover:not(:disabled) {
  background-color: var(--color-brand-secondary);
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unsaved-indicator {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-warning);
}
</style>
