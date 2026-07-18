<script setup lang="ts">
// 퀴즈 편집 컴포넌트
import { ref } from 'vue'
import type { EditableQuiz } from '../../types/editor'

const props = defineProps<{
  quizzes: EditableQuiz[]
}>()

const emit = defineEmits<{
  update: [quiz: EditableQuiz]
}>()

// 확장된 퀴즈 ID
const expandedQuizId = ref<string | null>(props.quizzes[0]?.id || null)

// 퀴즈 토글
function toggleQuiz(quizId: string) {
  expandedQuizId.value = expandedQuizId.value === quizId ? null : quizId
}

// 문제 변경
function handleQuestionChange(quiz: EditableQuiz, newQuestion: string) {
  emit('update', { ...quiz, question: newQuestion })
}

// 보기 라벨 변경
function handleOptionLabelChange(quiz: EditableQuiz, optionIndex: number, newLabel: string) {
  const updatedOptions = quiz.options.map((opt, i) =>
    i === optionIndex ? { ...opt, label: newLabel } : opt
  )
  emit('update', { ...quiz, options: updatedOptions })
}

// 보기 값 변경
function handleOptionValueChange(quiz: EditableQuiz, optionIndex: number, newValue: string) {
  const parsedValue = parseFloat(newValue) || newValue
  const updatedOptions = quiz.options.map((opt, i) =>
    i === optionIndex ? { ...opt, value: parsedValue } : opt
  )
  emit('update', { ...quiz, options: updatedOptions })
}

// 정답 변경
function handleCorrectChange(quiz: EditableQuiz, optionIndex: number) {
  const updatedOptions = quiz.options.map((opt, i) => ({
    ...opt,
    isCorrect: i === optionIndex
  }))
  emit('update', { ...quiz, options: updatedOptions })
}

// 피드백 변경
function handleFeedbackChange(quiz: EditableQuiz, type: 'correct' | 'incorrect', newValue: string) {
  emit('update', {
    ...quiz,
    feedback: {
      ...quiz.feedback,
      [type]: newValue
    }
  })
}
</script>

<template>
  <div class="quiz-editor">
    <div v-if="quizzes.length === 0" class="empty-state">
      <p>편집 가능한 퀴즈가 없습니다</p>
      <p class="empty-hint">이 콘텐츠에는 퀴즈 씬이 포함되어 있지 않습니다</p>
    </div>

    <div v-else class="quiz-list">
      <div
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="quiz-item"
        :class="{ expanded: expandedQuizId === quiz.id }"
      >
        <!-- 퀴즈 헤더 -->
        <button
          class="quiz-header"
          @click="toggleQuiz(quiz.id)"
        >
          <span class="quiz-icon">Q</span>
          <span class="quiz-title">{{ quiz.question.substring(0, 30) }}...</span>
          <svg
            class="expand-icon"
            :class="{ rotated: expandedQuizId === quiz.id }"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <!-- 퀴즈 편집 영역 -->
        <div v-show="expandedQuizId === quiz.id" class="quiz-content">
          <!-- 문제 -->
          <div class="form-group">
            <label :for="`${quiz.id}-question`">문제</label>
            <textarea
              :id="`${quiz.id}-question`"
              :value="quiz.question"
              class="text-input"
              rows="2"
              @input="handleQuestionChange(quiz, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <!-- 보기 -->
          <div class="form-group">
            <label>보기</label>
            <div class="options-list">
              <div
                v-for="(option, index) in quiz.options"
                :key="index"
                class="option-item"
              >
                <div class="option-correct">
                  <input
                    type="radio"
                    :name="`${quiz.id}-correct`"
                    :checked="option.isCorrect"
                    @change="handleCorrectChange(quiz, index)"
                  />
                  <span class="correct-label">정답</span>
                </div>

                <div class="option-inputs">
                  <input
                    type="text"
                    :value="option.label"
                    placeholder="보기 텍스트"
                    class="text-input option-label"
                    @input="handleOptionLabelChange(quiz, index, ($event.target as HTMLInputElement).value)"
                  />
                  <input
                    type="text"
                    :value="option.value"
                    placeholder="값"
                    class="text-input option-value"
                    @input="handleOptionValueChange(quiz, index, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 피드백 -->
          <div class="form-group">
            <label>피드백 메시지</label>
            <div class="feedback-inputs">
              <div class="feedback-item">
                <span class="feedback-type correct">정답 시</span>
                <input
                  type="text"
                  :value="quiz.feedback.correct"
                  class="text-input"
                  @input="handleFeedbackChange(quiz, 'correct', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div class="feedback-item">
                <span class="feedback-type incorrect">오답 시</span>
                <input
                  type="text"
                  :value="quiz.feedback.incorrect"
                  class="text-input"
                  @input="handleFeedbackChange(quiz, 'incorrect', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.empty-hint {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-sm);
}

.quiz-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quiz-item {
  background-color: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.quiz-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: transparent;
  color: var(--color-text-primary);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.quiz-header:hover {
  background-color: rgba(59, 53, 98, 0.04);
}

.quiz-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-brand-primary);
  color: #fff;
  border-radius: 6px;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}

.quiz-title {
  flex: 1;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-icon {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.quiz-content {
  padding: var(--spacing-md);
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  border-top: 1px solid rgba(59, 53, 98, 0.08);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group > label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.text-input {
  width: 100%;
  padding: var(--spacing-sm);
  background-color: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.text-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

/* 보기 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: rgba(59, 53, 98, 0.03);
  border-radius: var(--radius-sm);
}

.option-correct {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 40px;
}

.option-correct input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-success);
}

.correct-label {
  font-size: 10px;
  color: var(--color-text-muted);
}

.option-inputs {
  flex: 1;
  display: flex;
  gap: var(--spacing-xs);
}

.option-label {
  flex: 2;
}

.option-value {
  flex: 1;
  font-family: monospace;
}

/* 피드백 */
.feedback-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.feedback-type {
  min-width: 60px;
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.feedback-type.correct {
  background-color: rgba(47, 191, 113, 0.15);
  color: var(--color-success);
}

.feedback-type.incorrect {
  background-color: rgba(244, 63, 94, 0.15);
  color: var(--color-error);
}

.feedback-item .text-input {
  flex: 1;
}
</style>
