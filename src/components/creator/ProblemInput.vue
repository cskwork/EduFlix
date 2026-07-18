<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Subject, Difficulty } from '../../types/content'
import {
  BUILTIN_SUBJECTS, SUBJECT_LABELS, DIFFICULTY_LABELS, DIFFICULTY_EMOJI,
  isSubjectSlug,
} from '../../types/content'

// ProblemInput이 부모에게 내보내는 통합 상태
export interface ProblemInputValue {
  problem: string
  subject: Subject | null
  difficulty: Difficulty
}

const props = defineProps<{
  modelValue: ProblemInputValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ProblemInputValue]
}>()

// 로컬 입력값 (subject 직접입력 모드)
const customSubjectInput = ref<string>(
  props.modelValue.subject && !BUILTIN_SUBJECTS.includes(props.modelValue.subject as never)
    ? props.modelValue.subject
    : ''
)

// 추천 과목 (자격증·확장 과목)
const suggestedSubjects: { slug: Subject; label: string }[] = [
  { slug: 'coding', label: '코딩' },
  { slug: 'toeic', label: '토익' },
  { slug: 'korean-history', label: '한국사' },
  { slug: 'computer-science', label: '컴퓨터과학' },
  { slug: 'social-studies', label: '사회' },
  { slug: 'korean', label: '국어' },
]

// 난이도 옵션
const difficulties: { value: Difficulty; label: string; emoji: string; desc: string }[] = [
  { value: 'easy', label: DIFFICULTY_LABELS.easy, emoji: DIFFICULTY_EMOJI.easy, desc: '처음 배우는 수준' },
  { value: 'medium', label: DIFFICULTY_LABELS.medium, emoji: DIFFICULTY_EMOJI.medium, desc: '기본기를 다지는 수준' },
  { value: 'hard', label: DIFFICULTY_LABELS.hard, emoji: DIFFICULTY_EMOJI.hard, desc: '응용까지 도전' },
]

const problemValue = computed(() => props.modelValue.problem)
const problemCharCount = computed(() => props.modelValue.problem.length)

function updateProblem(value: string) {
  emit('update:modelValue', { ...props.modelValue, problem: value })
}

function selectBuiltinSubject(subject: Subject) {
  customSubjectInput.value = ''
  emit('update:modelValue', { ...props.modelValue, subject })
}

function selectDifficulty(difficulty: Difficulty) {
  emit('update:modelValue', { ...props.modelValue, difficulty })
}

// 직접 입력 subject 처리
function onCustomSubjectInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  customSubjectInput.value = raw
  // 한국어 → kebab-case slug 변환 (간이 매핑)
  const slug = slugifySubject(raw)
  if (slug) {
    emit('update:modelValue', { ...props.modelValue, subject: slug })
  }
}

// 추천 확장 과목 클릭
function selectSuggested(slug: Subject) {
  customSubjectInput.value = ''
  emit('update:modelValue', { ...props.modelValue, subject: slug })
}

// 한국어/영어 입력을 slug로 변환
const SUBJECT_KO_TO_SLUG: Record<string, string> = {
  '코딩': 'coding',
  '프로그래밍': 'coding',
  '코딩테스트': 'coding-test',
  '토익': 'toeic',
  '토플': 'toefl',
  '한국사': 'korean-history',
  '세계사': 'world-history',
  '컴퓨터': 'computer-science',
  '컴퓨터과학': 'computer-science',
  '사회': 'social-studies',
  '국어': 'korean',
  '한국어': 'korean',
  '수학': 'math',
  '과학': 'science',
  '영어': 'english',
  '화학': 'chemistry',
  '물리': 'physics',
  '생물': 'biology',
  '지구과학': 'earth-science',
}

function slugifySubject(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  // 한국어 직접 매핑 우선
  if (SUBJECT_KO_TO_SLUG[trimmed]) return SUBJECT_KO_TO_SLUG[trimmed]
  // 영어 입력은 kebab-case화
  const ascii = trimmed.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  if (isSubjectSlug(ascii)) return ascii
  return ''
}

function isSubjectSelected(slug: Subject): boolean {
  return props.modelValue.subject === slug
}

const isCustomMode = computed(() => {
  const s = props.modelValue.subject
  return !!s && !BUILTIN_SUBJECTS.includes(s as never) && !suggestedSubjects.some((item) => item.slug === s)
})
</script>

<template>
  <div class="problem-input">
    <!-- 1. 문제 입력 -->
    <div class="section">
      <label class="input-label">문제를 알려주세요</label>
      <p class="input-description">
        텍스트로 붙여넣거나 직접 적어주세요. AI가 이 문제를 재미있는 학습 콘텐츠로 바꿔줘요.
      </p>
      <textarea
        class="problem-textarea"
        :value="problemValue"
        placeholder="예시:&#10;사과 5개가 있고 3개를 더 샀습니다. 전체 사과는 몇 개인가요?&#10;&#10;또는:&#10;다음 Python 코드의 출력을 쓰세요.&#10;print([x*2 for x in range(3)])&#10;&#10;또는:&#10;토익 Part 5 빈칸 문제..."
        maxlength="5000"
        @input="updateProblem(($event.target as HTMLTextAreaElement).value)"
      />
      <div class="char-count" :class="{ over: problemCharCount > 4500 }">
        {{ problemCharCount }} / 5000
      </div>
    </div>

    <!-- 2. 과목 선택 (선택) -->
    <div class="section">
      <label class="input-label">어떤 과목인가요? <span class="optional">선택</span></label>
      <p class="input-description">
        안 고르면 AI가 문제에서 추천해요. 직접 입력도 가능해요.
      </p>

      <div class="subjects-row">
        <button
          v-for="slug in (['math', 'science', 'english'] as Subject[])"
          :key="slug"
          type="button"
          class="subject-pill"
          :class="{ selected: isSubjectSelected(slug) }"
          @click="selectBuiltinSubject(slug)"
        >
          {{ SUBJECT_LABELS[slug] ?? slug }}
        </button>
        <button
          v-for="item in suggestedSubjects"
          :key="item.slug"
          type="button"
          class="subject-pill ghost"
          :class="{ selected: isSubjectSelected(item.slug) }"
          @click="selectSuggested(item.slug)"
        >
          + {{ item.label }}
        </button>
      </div>

      <div class="custom-input-row">
        <input
          :value="customSubjectInput"
          type="text"
          class="custom-subject-input"
          placeholder="또는 직접 입력 (예: 정보처리기사, 한국사, 일본어...)"
          @input="onCustomSubjectInput"
        />
        <span v-if="isCustomMode" class="custom-badge">선택됨: {{ modelValue.subject }}</span>
      </div>
    </div>

    <!-- 3. 난이도 -->
    <div class="section">
      <label class="input-label">난이도를 골라주세요</label>
      <p class="input-description">학습자 수준에 맞춰 언어와 사례를 조절해요.</p>

      <div class="difficulty-grid">
        <button
          v-for="d in difficulties"
          :key="d.value"
          type="button"
          class="difficulty-card"
          :class="{ selected: modelValue.difficulty === d.value }"
          @click="selectDifficulty(d.value)"
        >
          <span class="difficulty-emoji">{{ d.emoji }}</span>
          <span class="difficulty-label">{{ d.label }}</span>
          <span class="difficulty-desc">{{ d.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-label {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.optional {
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-pill);
}

.input-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: calc(-1 * var(--spacing-xs));
  margin-bottom: var(--spacing-sm);
}

.problem-textarea {
  width: 100%;
  min-height: 160px;
  padding: var(--spacing-md);
  background: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.problem-textarea:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

.problem-textarea::placeholder {
  color: var(--color-text-muted);
  white-space: pre-wrap;
}

.char-count {
  align-self: flex-end;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.char-count.over {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
}

.subjects-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.subject-pill {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.subject-pill.ghost {
  background: transparent;
  border-style: dashed;
}

.subject-pill:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.subject-pill.selected {
  background: var(--color-brand-primary);
  color: #fff;
  border-color: var(--color-brand-primary);
}

.custom-input-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.custom-subject-input {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.custom-subject-input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(255, 92, 57, 0.2);
}

.custom-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(47, 191, 113, 0.12);
  color: #2fbf71;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--color-bg-card);
  border: var(--border-sticker);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.difficulty-card:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.difficulty-card.selected {
  border-color: var(--color-brand-primary);
  background: rgba(255, 92, 57, 0.08);
}

.difficulty-emoji {
  font-size: 2rem;
  line-height: 1;
}

.difficulty-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.difficulty-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 600px) {
  .difficulty-grid {
    grid-template-columns: 1fr;
  }
}
</style>
