<script setup lang="ts">
// 콘텐츠 편집 패널 - 메인 컴포넌트
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  EditableContent,
  EditableText,
  EditableStyle,
  EditableQuiz,
  EditorMessage,
  ExtractedContentPayload
} from '../../types/editor'
import TextEditor from './TextEditor.vue'
import StyleEditor from './StyleEditor.vue'
import QuizEditor from './QuizEditor.vue'
import ExportImportButtons from './ExportImportButtons.vue'

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
const quizzes = ref<EditableQuiz[]>([])

// 원본 데이터 (변경 감지용)
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
const tabs = [
  { id: 'text', label: '텍스트', icon: 'T' },
  { id: 'style', label: '스타일', icon: 'S' },
  { id: 'quiz', label: '퀴즈', icon: 'Q' }
] as const

// postMessage 핸들러
function handleMessage(event: MessageEvent) {
  const { type, payload } = event.data || {}

  switch (type) {
    case 'EDITOR_READY':
      // iframe 준비 완료 - 콘텐츠 추출 요청
      sendToIframe({ type: 'EXTRACT_CONTENT' })
      break

    case 'CONTENT_EXTRACTED':
      if (payload) {
        const extracted = payload as ExtractedContentPayload
        texts.value = extracted.texts || []
        styles.value = extracted.styles || []
        quizzes.value = extracted.quizzes || []
        originalData.value = JSON.parse(JSON.stringify(extracted))
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
    props.iframeRef.contentWindow.postMessage(message, '*')
  }
}

// 텍스트 업데이트 핸들러
function handleTextUpdate(text: EditableText) {
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
  const index = styles.value.findIndex(s => s.id === style.id)
  if (index !== -1) {
    styles.value[index] = style
    sendToIframe({
      type: 'UPDATE_STYLE',
      payload: { variable: style.variable, value: style.value }
    })
  }
}

// 퀴즈 업데이트 핸들러
function handleQuizUpdate(quiz: EditableQuiz) {
  const index = quizzes.value.findIndex(q => q.id === quiz.id)
  if (index !== -1) {
    quizzes.value[index] = quiz
    sendToIframe({
      type: 'UPDATE_QUIZ',
      payload: quiz
    })
  }
}

// 저장
async function handleSave() {
  isSaving.value = true
  error.value = null

  try {
    const response = await fetch(`/api/content/${props.contentId}/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editableContent.value)
    })

    const result = await response.json()

    if (result.success) {
      hasChanges.value = false
      originalData.value = JSON.parse(JSON.stringify({
        texts: texts.value,
        styles: styles.value,
        quizzes: quizzes.value
      }))
      emit('save', editableContent.value)
    } else {
      error.value = result.error || '저장에 실패했습니다'
    }
  } catch (e) {
    error.value = '서버 연결에 실패했습니다'
    console.error('저장 오류:', e)
  } finally {
    isSaving.value = false
  }
}

// 취소 (원본으로 복원)
function handleCancel() {
  if (hasChanges.value && !confirm('변경사항이 저장되지 않습니다. 취소하시겠습니까?')) {
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
    // iframe 로드 완료 후 편집 모드 초기화
    sendToIframe({ type: 'EDITOR_INIT' })
  }
}

// iframe ref 변경 감지
watch(() => props.iframeRef, (newRef) => {
  if (newRef) {
    // iframe이 이미 로드되었다면 바로 초기화
    if (newRef.contentDocument?.readyState === 'complete') {
      initEditor()
    } else {
      newRef.addEventListener('load', initEditor, { once: true })
    }
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <aside class="editor-panel">
    <header class="editor-header">
      <h2>콘텐츠 편집</h2>
      <button class="close-btn" aria-label="닫기" @click="handleCancel">
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
      <p>콘텐츠 분석 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="editor-error">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="initEditor">다시 시도</button>
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
      <QuizEditor
        v-if="activeTab === 'quiz'"
        :quizzes="quizzes"
        @update="handleQuizUpdate"
      />
    </div>

    <!-- 하단 액션 버튼 -->
    <footer class="editor-footer">
      <ExportImportButtons :content-id="contentId" />

      <div class="action-buttons">
        <button class="btn-cancel" :disabled="isSaving" @click="handleCancel">
          취소
        </button>
        <button
          class="btn-save"
          :disabled="!hasChanges || isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving">저장 중...</span>
          <span v-else>저장</span>
        </button>
      </div>

      <div v-if="hasChanges" class="unsaved-indicator">
        변경사항이 있습니다
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
  border-bottom: 1px solid var(--color-bg-card);
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
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

/* 탭 */
.editor-tabs {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--color-bg-card);
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
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
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
  border: 3px solid var(--color-bg-card);
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
  color: var(--color-text-primary);
  border-radius: 6px;
  font-size: var(--font-size-sm);
}

/* 푸터 */
.editor-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-bg-card);
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
  border-radius: 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.btn-cancel {
  background-color: var(--color-bg-card);
  color: var(--color-text-secondary);
}

.btn-cancel:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

.btn-save {
  background-color: var(--color-brand-primary);
  color: var(--color-text-primary);
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
