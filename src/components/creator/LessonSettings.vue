<script setup lang="ts">
import { useI18n } from '../../i18n'
import { GRADES } from '../../types/content'
import type { Grade, ContentType } from '../../types/content'
import { gradeLabel, contentTypeLabel } from '../../i18n/labels'
export interface LessonSettingsValue { grade: Grade; audience: 'teacher' | 'student'; objectives: string; minutes: number; context: string; contentType: ContentType | '' }
const props = defineProps<{ modelValue: LessonSettingsValue }>()
const emit = defineEmits<{ 'update:modelValue': [value: LessonSettingsValue] }>()
const { locale } = useI18n()
const say = (ko: string, en: string) => locale.value === 'ko' ? ko : en
function update(key: keyof LessonSettingsValue, value: string | number) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
</script>
<template>
  <fieldset class="lesson-settings">
    <legend>{{ say('수업에 맞게 설정하기', 'Shape the lesson') }}</legend>
    <p>{{ say('학년과 난이도는 별개입니다. 학생 수준과 수업 목표를 구체적으로 알려 주세요.', 'Grade and difficulty are independent. Describe your learners and lesson goals.') }}</p>
    <div class="settings-grid">
      <label>{{ say('대상 학년', 'Grade') }}<select :value="modelValue.grade" @change="update('grade', ($event.target as HTMLSelectElement).value)"><option v-for="grade in GRADES" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option></select></label>
      <label>{{ say('사용 목적', 'Purpose') }}<select :value="modelValue.audience" @change="update('audience', ($event.target as HTMLSelectElement).value)"><option value="teacher">{{ say('교사 수업용', 'Teacher-led lesson') }}</option><option value="student">{{ say('학생 자습용', 'Independent learning') }}</option></select></label>
      <label>{{ say('활동 시간 (분)', 'Duration (minutes)') }}<input type="number" min="5" max="120" :value="modelValue.minutes" @input="update('minutes', Number(($event.target as HTMLInputElement).value))" /></label>
      <label>{{ say('콘텐츠 유형', 'Content type') }}<select :value="modelValue.contentType" @change="update('contentType', ($event.target as HTMLSelectElement).value)"><option value="">{{ say('목표에 맞게 AI가 선택', 'Let AI choose for the goals') }}</option><option v-for="type in (['exploration', 'quiz', 'simulation', 'game', 'story'] as ContentType[])" :key="type" :value="type">{{ contentTypeLabel(type) }}</option></select></label>
    </div>
    <label>{{ say('학습 목표', 'Learning objectives') }}<textarea :value="modelValue.objectives" maxlength="1200" rows="3" :placeholder="say('예: 분모가 같은 분수를 그림으로 비교하고 그 이유를 설명한다.', 'Example: Compare fractions with the same denominator and explain why.')" @input="update('objectives', ($event.target as HTMLTextAreaElement).value)" /></label>
    <label>{{ say('선수 지식·수업 조건·추가 요구', 'Prior knowledge, teaching conditions and other needs') }}<textarea :value="modelValue.context" maxlength="3000" rows="3" @input="update('context', ($event.target as HTMLTextAreaElement).value)" /></label>
  </fieldset>
</template>
<style scoped>
.lesson-settings { border: 0; padding: 0; margin: 0 0 2rem; }
legend { font-size: 1.5rem; font-weight: 700; margin-bottom: .65rem; }
p { line-height: 1.6; margin-bottom: 1.25rem; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
label { display: flex; flex-direction: column; gap: .45rem; margin-bottom: 1rem; font-weight: 600; }
input, select, textarea { width: 100%; min-height: 44px; border: 1px solid var(--color-text-light); border-radius: var(--radius-sm); padding: .65rem; background: var(--color-bg-card); color: var(--color-text-primary); font: inherit; font-weight: 400; }
textarea { resize: vertical; }
@media (max-width: 480px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
