<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useI18n } from '../i18n'
import { gradeLabel, subjectLabel, difficultyLabel } from '../i18n/labels'
import SubjectSelect from '../components/creator/SubjectSelect.vue'
import { GRADES } from '../types/content'
import type { LessonBlockKind, LessonDocument } from '../types/lesson'
import { LESSON_FILE_MAX_BYTES, removeQuizChoice, newLesson, newBlock, listLessons, saveLesson, validateLesson, renderLesson, importLesson, lessonBrief } from '../services/studio/lesson'
import { generateLessonDraft } from '../services/studio/generateLesson'
import { starterLessons } from '../services/studio/starters'
import { canGenerate } from '../services/api/capabilities'
import { useContentStore } from '../stores/content'

const { locale, contentLanguage } = useI18n()
const say = (ko: string, en: string) => locale.value === 'ko' ? ko : en
const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()
const lesson = ref<LessonDocument>(newLesson(contentLanguage.value))
const saved = ref<LessonDocument[]>([])
const selectedBlock = ref(0)
const block = computed(() => lesson.value.blocks[selectedBlock.value])
const dirty = ref(false)
const busy = ref(false)
const aiBusy = ref(false)
let draftController: InstanceType<typeof globalThis.AbortController> | undefined
const error = ref('')
const notice = ref('')
const previewHtml = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const activeTab = ref<'edit' | 'preview'>('edit')
const blockKinds: LessonBlockKind[] = ['explanation', 'activity', 'quiz', 'reflection']
const kindLabel = (kind: LessonBlockKind) => ({ explanation: say('개념 설명', 'Explanation'), activity: say('탐구 활동', 'Activity'), quiz: say('확인 문항', 'Knowledge check'), reflection: say('성찰·적용', 'Reflection') })[kind]
const subjects = ['math', 'science', 'korean', 'english', 'social-studies', 'art', 'coding', 'world-history']
const customSubject = ref(false)
watch(lesson, () => { dirty.value = true; notice.value = '' }, { deep: true, flush: 'sync' })
function confirmLeave() { return !dirty.value || confirm(say('저장하지 않은 변경사항이 있습니다. 다른 수업으로 이동할까요?', 'You have unsaved changes. Leave this lesson?')) }
function beforeUnload(event: Event) { if (dirty.value) { event.preventDefault();  } }
onBeforeRouteLeave(() => confirmLeave())
onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  try {
    saved.value = await listLessons()
    const requested = saved.value.find(item => item.id === route.query.id)
    if (requested) open(requested)
  } catch { error.value = say('저장한 수업을 불러오지 못했습니다. 브라우저 저장소를 확인하거나 파일을 가져오세요.', 'Could not load saved lessons. Check browser storage or import a backup.') }
})
onUnmounted(() => { window.removeEventListener('beforeunload', beforeUnload); draftController?.abort() })
function open(value?: LessonDocument, duplicate = false) {
  if (!confirmLeave()) return
  lesson.value = value ? JSON.parse(JSON.stringify(value)) : newLesson(contentLanguage.value)
  if (duplicate) lesson.value.id = `local-studio-${globalThis.crypto.randomUUID()}`
  selectedBlock.value = 0; dirty.value = duplicate; error.value = ''; notice.value = ''; previewHtml.value = ''; activeTab.value = 'edit'
}
function addBlock(kind: LessonBlockKind) {
  if (lesson.value.blocks.length >= 40) return
  lesson.value.blocks.push(newBlock(kind, lesson.value.language)); selectedBlock.value = lesson.value.blocks.length - 1
}
function removeChoice(index: number) {
  const quiz = block.value
  if (!quiz?.options || quiz.options.length <= 2) return
  const removedAnswer = quiz.answer === index
  lesson.value.blocks[selectedBlock.value] = removeQuizChoice(quiz, index)
  if (removedAnswer) notice.value = say('정답 보기를 삭제했습니다. 새 정답을 선택한 뒤 저장하세요.', 'The correct choice was removed. Select a new answer before saving.')
}
function moveBlock(delta: number) {
  const next = selectedBlock.value + delta
  if (next < 0 || next >= lesson.value.blocks.length) return
  const [item] = lesson.value.blocks.splice(selectedBlock.value, 1)
  if (item) lesson.value.blocks.splice(next, 0, item)
  selectedBlock.value = next
}
function removeBlock() {
  if (lesson.value.blocks.length <= 1 || !confirm(say('이 학습 블록을 삭제할까요?', 'Delete this learning block?'))) return
  lesson.value.blocks.splice(selectedBlock.value, 1); selectedBlock.value = Math.max(0, selectedBlock.value - 1)
}
async function save() {
  busy.value = true; error.value = ''; notice.value = ''
  try {
    const snapshot = JSON.stringify(lesson.value)
    const result = await saveLesson(lesson.value)
    if (JSON.stringify(lesson.value) === snapshot) { lesson.value = result; dirty.value = false }
    saved.value = await listLessons()
    notice.value = say('이 브라우저에 저장했습니다. JSON 파일로 백업할 수 있습니다.', 'Saved in this browser. Export JSON to keep a backup.')
    await contentStore.loadContents()
  } catch (e) { error.value = e instanceof Error ? e.message : say('저장하지 못했습니다. 파일로 내보낸 뒤 다시 시도하세요.', 'Could not save. Export a backup and try again.') }
  finally { busy.value = false }
}
function preview() {
  error.value = ''
  try { previewHtml.value = renderLesson(lesson.value); activeTab.value = 'preview' }
  catch (e) { error.value = (e as Error).message }
}
function download(format: 'json' | 'html') {
  error.value = ''
  try {
    const valid = validateLesson(lesson.value)
    const text = format === 'json' ? JSON.stringify(valid, null, 2) : renderLesson(valid)
    const url = URL.createObjectURL(new globalThis.Blob([text], { type: format === 'json' ? 'application/json' : 'text/html' }))
    const a = document.createElement('a'); a.href = url; a.download = `${valid.title.replace(/[^\p{L}\p{N}_-]/gu, '_')}.${format}`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notice.value = say(format === 'json' ? 'JSON 파일은 다시 가져와 수정할 수 있습니다.' : 'HTML 파일은 인터넷 없이 열어 학습할 수 있습니다.', format === 'json' ? 'Import this JSON file to edit again.' : 'Open this HTML file offline to learn.')
  } catch (e) { error.value = (e as Error).message }
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]
  if (!file) return
  try {
    if (file.size > LESSON_FILE_MAX_BYTES) throw new Error(say('8MiB 이하의 수업 JSON 또는 HTML 파일을 선택하세요.', 'Choose a lesson JSON or HTML file no larger than 8MiB.'))
    const imported = importLesson(await file.text()); open(imported, true)
  } catch (e) { error.value = (e as Error).message }
  finally { input.value = '' }
}
async function draftWithAI() {
  if (aiBusy.value) return
  if (lesson.value.blocks.some(item => item.title.trim() || item.body.trim()) && !confirm(say(
    'AI 초안이 완성되면 현재 학습 블록을 교체합니다. 계속할까요?',
    'A successful AI draft will replace the current learning blocks. Continue?',
  ))) return
  error.value = ''; notice.value = ''; aiBusy.value = true
  draftController = new globalThis.AbortController()
  const controller = draftController
  const timer = window.setTimeout(() => controller.abort(), 300_000)
  const snapshot = JSON.stringify(lesson.value)
  try {
    const generated = await generateLessonDraft(JSON.parse(snapshot), controller.signal)
    if (controller.signal.aborted) return
    if (JSON.stringify(lesson.value) !== snapshot) {
      notice.value = say('생성 중 수업이 바뀌어 AI 초안을 적용하지 않았습니다. 현재 수업은 유지됩니다.', 'Your lesson changed during generation, so the AI draft was not applied.')
      return
    }
    lesson.value = generated; selectedBlock.value = 0; activeTab.value = 'edit'; previewHtml.value = ''
    notice.value = say('AI 초안이 준비되었습니다. 내용과 정답을 검토한 뒤 저장하세요. 아직 저장되지 않았습니다.', 'AI draft ready. Review the content and answers, then save. It has not been saved yet.')
  } catch (e) {
    error.value = controller.signal.aborted
      ? say('AI 초안 생성을 취소했거나 시간이 초과되었습니다. 현재 수업은 유지됩니다.', 'AI drafting was cancelled or timed out. Your lesson is unchanged.')
      : e instanceof Error ? e.message : say('AI 초안을 생성하지 못했습니다.', 'Could not generate an AI draft.')
  } finally { window.clearTimeout(timer); aiBusy.value = false }
}

async function generate() {
  error.value = ''
  try {
    const valid = validateLesson(lesson.value)
    const context = lessonBrief(valid)
    if (context.length > 3000) throw new Error(say('AI 제작에 전달할 수업 내용이 3,000자를 넘습니다. 블록 내용을 줄여 주세요.', 'The AI brief exceeds 3,000 characters. Shorten the lesson blocks.'))
    if (valid.objectives.length > 1200) throw new Error(say('AI 제작에 전달할 학습 목표는 1,200자 이하로 정리해 주세요.', 'Keep the learning objectives within 1,200 characters for AI generation.'))
    window.sessionStorage.setItem('eduflix-studio-brief', JSON.stringify({ grade: valid.grade, audience: 'teacher', objectives: valid.objectives, minutes: valid.minutes, context, contentType: 'exploration', subject: valid.subject, difficulty: valid.difficulty, title: valid.title }))
    await router.push('/create?brief=studio')
  } catch (e) { error.value = (e as Error).message }
}
</script>

<template>
  <div class="studio">
    <header class="studio-header">
      <div><h1>{{ say('수업 작업실', 'Lesson studio') }}</h1><p>{{ say('설명과 활동을 구성하고, 정답과 해설까지 직접 다듬으세요.', 'Build explanations and activities, then refine answers and feedback.') }}</p></div>
      <div class="toolbar"><button @click="open()">{{ say('새 수업', 'New lesson') }}</button><button @click="fileInput?.click()">{{ say('수업 파일 가져오기', 'Import lesson') }}</button><input ref="fileInput" type="file" accept=".json,.html,application/json,text/html" hidden @change="importFile" /></div>
    </header>
    <p class="storage-note">{{ say('수업은 이 브라우저에 저장됩니다. 다른 기기에서 사용하거나 보관하려면 JSON 파일로 내보내세요.', 'Lessons are saved in this browser. Export JSON to keep a backup or move to another device.') }}</p>
    <div v-if="error" role="alert" class="message error">{{ error }}</div>
    <div v-if="notice" role="status" class="message">{{ notice }}</div>
    <details class="library" :open="!lesson.title && !dirty">
      <summary>{{ say('시작 자료와 저장한 수업', 'Starters and saved lessons') }} <span>{{ starterLessons.length + saved.length }}</span></summary>
      <p>{{ say('시작 자료를 복사해 수업에 맞게 수정하세요. 학년은 활용 제안이며 공식 교육과정 인증을 뜻하지 않습니다.', 'Copy a starter and adapt it. Suggested grades do not imply official curriculum alignment.') }}</p>
      <div class="lesson-library">
        <button v-for="item in saved" :key="item.id" class="library-item" @click="open(item)"><span>{{ say('저장한 수업', 'Saved') }} · {{ gradeLabel(item.grade) }}</span><strong>{{ item.title }}</strong></button>
        <button v-for="item in starterLessons" :key="item.id" class="library-item" @click="open(item, true)"><span>{{ subjectLabel(item.subject) }} · {{ gradeLabel(item.grade) }} · {{ item.minutes }}{{ say('분', ' min') }}</span><strong>{{ item.title }}</strong></button>
      </div>
    </details>
    <div class="workbar"><div class="view-tabs"><button :class="{ selected: activeTab === 'edit' }" @click="activeTab = 'edit'">{{ say('수업 편집', 'Edit lesson') }}</button><button :class="{ selected: activeTab === 'preview' }" @click="preview">{{ say('학생 화면 확인', 'Student preview') }}</button></div><span class="save-status">{{ dirty ? say('저장하지 않은 변경사항', 'Unsaved changes') : say('수업 준비', 'Ready to edit') }}</span><button class="primary" :disabled="busy" @click="save">{{ busy ? say('저장 중…', 'Saving…') : say('수업 저장', 'Save lesson') }}</button></div>
    <div v-if="activeTab === 'edit'" class="workspace">
      <section class="lesson-plan">
        <h2>{{ say('수업 계획', 'Lesson plan') }}</h2>
        <div v-if="canGenerate" class="ai-drafting">
          <p>{{ say('제목과 학습 목표를 입력하면 AI가 설명·활동·문항 초안을 작성합니다. 생성과 검토에 수 분이 걸릴 수 있습니다.', 'Enter a title and objectives to draft explanations, activities and questions with AI. Generation and review can take a few minutes.') }}</p>
          <button class="primary" :disabled="aiBusy || busy" @click="draftWithAI">{{ aiBusy ? say('AI가 초안 작성·검토 중…', 'AI is drafting and reviewing…') : say('AI로 수업 초안 만들기', 'Draft lesson with AI') }}</button>
          <button v-if="aiBusy" @click="draftController?.abort()">{{ say('생성 취소', 'Cancel generation') }}</button>
        </div>
        <label>{{ say('수업 제목', 'Lesson title') }}<input v-model="lesson.title" maxlength="160" :placeholder="say('무엇을 함께 배울까요?', 'What will learners discover?')" /></label>
        <div class="field-pair"><label>{{ say('학년', 'Grade') }}<select v-model="lesson.grade"><option v-for="grade in GRADES" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option></select></label><label>{{ say('과목', 'Subject') }}<select :value="subjects.includes(lesson.subject) && !customSubject ? lesson.subject : 'custom'" @change="($event.target as HTMLSelectElement).value === 'custom' ? customSubject = true : (lesson.subject = ($event.target as HTMLSelectElement).value, customSubject = false)"><option v-for="subject in subjects" :key="subject" :value="subject">{{ subjectLabel(subject) }}</option><option value="custom">{{ say('다른 과목', 'Other subject') }}</option></select></label></div>
        <SubjectSelect v-if="customSubject || !subjects.includes(lesson.subject)" v-model="lesson.subject" />
        <div class="field-pair"><label>{{ say('시간 (분)', 'Minutes') }}<input v-model.number="lesson.minutes" type="number" min="5" max="120" /></label><label>{{ say('난이도', 'Difficulty') }}<select v-model="lesson.difficulty"><option v-for="level in (['easy', 'medium', 'hard'] as const)" :key="level" :value="level">{{ difficultyLabel(level) }}</option></select></label></div>
        <label>{{ say('자료 언어', 'Lesson language') }}<select v-model="lesson.language"><option value="ko">한국어</option><option value="en">English</option></select></label>
        <label>{{ say('학습 목표', 'Learning objectives') }}<textarea v-model="lesson.objectives" maxlength="6000" rows="3" /></label>
        <label>{{ say('선수 지식', 'Prior knowledge') }}<textarea v-model="lesson.prerequisites" maxlength="6000" rows="2" /></label>
        <label>{{ say('교사 진행 안내', 'Teaching notes') }}<textarea v-model="lesson.teacherNotes" maxlength="6000" rows="4" /></label>
      </section>
      <section class="block-workspace">
        <h2>{{ say('학습 흐름', 'Learning sequence') }}</h2>
        <ol class="block-list"><li v-for="(item, index) in lesson.blocks" :key="item.id"><button :class="{ selected: selectedBlock === index }" :aria-pressed="selectedBlock === index" @click="selectedBlock = index"><span>{{ index + 1 }}. {{ kindLabel(item.kind) }}</span><strong>{{ item.title || say('제목을 입력하세요', 'Untitled block') }}</strong></button></li></ol>
        <div class="add-block"><span>{{ say('블록 추가', 'Add block') }}</span><button v-for="kind in blockKinds" :key="kind" :disabled="lesson.blocks.length >= 40" @click="addBlock(kind)">{{ kindLabel(kind) }}</button></div>
        <div v-if="block" class="block-editor">
          <div class="block-heading"><h3>{{ selectedBlock + 1 }}. {{ kindLabel(block.kind) }}</h3><div class="toolbar"><button :disabled="selectedBlock === 0" @click="moveBlock(-1)">{{ say('위로', 'Move up') }}</button><button :disabled="selectedBlock === lesson.blocks.length - 1" @click="moveBlock(1)">{{ say('아래로', 'Move down') }}</button><button :disabled="lesson.blocks.length <= 1" @click="removeBlock">{{ say('삭제', 'Delete') }}</button></div></div>
          <label>{{ say('블록 제목', 'Block title') }}<input v-model="block.title" maxlength="160" /></label>
          <label>{{ block.kind === 'quiz' ? say('질문', 'Question') : say('학습 내용·활동 지시', 'Explanation or activity instructions') }}<textarea v-model="block.body" maxlength="6000" rows="7" /></label>
          <fieldset v-if="block.kind === 'quiz' && block.options" class="quiz-fields"><legend>{{ say('보기와 정답', 'Choices and correct answer') }}</legend><p>{{ say('정답 하나를 선택하세요. 학생의 채점에도 같은 정답이 적용됩니다.', 'Select one correct answer. Student feedback uses this answer.') }}</p><div v-for="(_, index) in block.options" :key="index" class="choice"><input v-model="block.answer" type="radio" :value="index" name="studio-answer" :aria-label="say(`${index + 1}번 보기를 정답으로`, `Set choice ${index + 1} as correct`)" /><input v-model="block.options[index]" maxlength="500" :aria-label="say(`보기 ${index + 1}`, `Choice ${index + 1}`)" /><button :disabled="block.options.length <= 2" @click="removeChoice(index)">{{ say('삭제', 'Remove') }}</button></div><button :disabled="block.options.length >= 6" @click="block.options.push('')">{{ say('보기 추가', 'Add choice') }}</button><label>{{ say('정답 이유·오개념 해설', 'Answer explanation and misconceptions') }}<textarea v-model="block.explanation" maxlength="6000" rows="4" /></label></fieldset>
        </div>
        <details class="sources"><summary>{{ say('참고 출처 편집', 'Edit sources') }}</summary><div v-for="(source, index) in lesson.sources" :key="index" class="source-row"><label>{{ say('자료 제목', 'Source title') }}<input v-model="source.title" maxlength="200" /></label><label>URL<input v-model="source.url" type="url" maxlength="2000" /></label><button @click="lesson.sources.splice(index, 1)">{{ say('삭제', 'Remove') }}</button></div><button :disabled="lesson.sources.length >= 20" @click="lesson.sources.push({ title: '', url: '' })">{{ say('출처 추가', 'Add source') }}</button></details>
      </section>
    </div>
    <section v-else class="preview"><p>{{ say('미리보기의 답과 메모는 저장되지 않습니다. 편집한 수업을 검토한 뒤 배포하세요.', 'Preview answers and notes are not saved. Review the edited lesson before sharing.') }}</p><iframe :srcdoc="previewHtml" sandbox="allow-scripts allow-popups" :title="say('학생 수업 미리보기', 'Student lesson preview')" /></section>
    <footer class="studio-footer"><p>{{ say('수업 전 확인: 학습 목표에 맞는 활동인지, 정답과 해설이 정확한지, 출처와 표현이 학생 수준에 맞는지 검토하세요.', 'Before teaching: review the goals, activities, correct answers, explanations, sources and reading level.') }}</p><div class="toolbar"><button @click="download('json')">{{ say('편집용 JSON 내보내기', 'Export editable JSON') }}</button><button @click="download('html')">{{ say('학생용 HTML 내보내기', 'Export student HTML') }}</button><button v-if="canGenerate" @click="generate">{{ say('이 수업으로 AI 콘텐츠 만들기', 'Create AI content from this lesson') }}</button></div></footer>
  </div>
</template>

<style scoped>
.studio { max-width: 1320px; margin: 0 auto; padding: 2rem 2rem 5rem; color: var(--color-text-primary); }
.studio-header,.toolbar,.workbar,.block-heading { display:flex; align-items:center; gap:.65rem; flex-wrap:wrap; }
.studio-header { justify-content:space-between; margin-bottom:1rem; }.studio-header h1 { font-size:clamp(1.8rem,4vw,2.5rem); margin:0 0 .5rem; }.studio-header p { margin:0; line-height:1.6; }
button,input,select,textarea { font:inherit; color:inherit; }button { min-height:44px; border:1px solid #b9adcb; border-radius:var(--radius-sm); padding:.6rem .9rem; background:var(--color-bg-card); cursor:pointer; }button:hover:not(:disabled):not(.primary):not(.selected){background:var(--color-bg-secondary)}button:disabled{opacity:.45;cursor:not-allowed}button.primary,button.selected {background:var(--color-brand-primary);color:#fff;border-color:var(--color-brand-primary)}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible {outline:3px solid var(--color-brand-primary);outline-offset:3px}
.ai-drafting { margin-bottom:1.5rem; }.ai-drafting p { font-size:.9rem; line-height:1.65; }.ai-drafting button { margin:.3rem .3rem .3rem 0; }
.storage-note { font-size:.9rem; line-height:1.6; padding:.8rem 0; border-bottom:1px solid #d8d1e3; }.message {padding:1rem;background:#edf5ec;border-radius:8px;margin:1rem 0;line-height:1.6}.message.error {background:#fbeeed;color:#7d2525}
.library {border-bottom:1px solid #d8d1e3;padding:1rem 0}summary {cursor:pointer;font-weight:700;min-height:32px}.library summary span {font-weight:400;margin-left:.5rem}.library p {font-size:.9rem;line-height:1.6;max-width:75ch}.lesson-library {display:grid;grid-template-columns:repeat(3,1fr);gap:0 1.5rem;margin-top:1rem}.library-item {text-align:left;border:0;border-bottom:1px solid #d8d1e3;border-radius:0;padding:1rem 0;background:transparent}.library-item span,.library-item strong {display:block}.library-item span {font-size:.78rem;margin-bottom:.4rem}.library-item strong {line-height:1.45}
.workbar {padding:1.3rem 0;border-bottom:1px solid #d8d1e3}.save-status {margin-left:auto;font-size:.85rem}.view-tabs {display:flex;gap:.4rem}.workspace {display:grid;grid-template-columns:minmax(250px,320px) minmax(0,1fr);gap:3rem}.lesson-plan,.block-workspace {min-width:0;padding-top:.5rem}h2 {font-size:1.3rem;margin:1.5rem 0 1rem}h3 {font-size:1.15rem;margin:0}label {display:flex;flex-direction:column;gap:.45rem;font-weight:600;margin-bottom:1rem;font-size:.9rem}input:not([type=radio]),select,textarea {width:100%;min-height:44px;border:1px solid #b9adcb;border-radius:var(--radius-sm);background:var(--color-bg-card);padding:.6rem;font-weight:400;font-size:1rem}textarea{resize:vertical;line-height:1.65}.field-pair {display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.block-list {list-style:none;padding:0;display:flex;overflow-x:auto;gap:.5rem;padding-bottom:.5rem}.block-list button {width:180px;text-align:left;height:100%;}.block-list span,.block-list strong {display:block}.block-list span {font-size:.75rem;margin-bottom:.35rem}.block-list strong {overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:.9rem}.add-block {display:flex;gap:.4rem;align-items:center;flex-wrap:wrap;font-size:.8rem;margin:1rem 0 2rem}.block-editor {border-top:1px solid #d8d1e3;padding-top:1.4rem}.block-heading {justify-content:space-between;margin-bottom:1.5rem}.block-heading button {font-size:.8rem}.quiz-fields {border:0;padding:0;margin:1.5rem 0}.quiz-fields legend {font-weight:700}.quiz-fields p {font-size:.85rem}.choice {display:flex;gap:.8rem;align-items:center;margin-bottom:.7rem}.choice input:not([type=radio]) { min-width:0; flex:1; }.choice button { flex-shrink:0; white-space:nowrap; }.studio input,.studio select,.studio textarea,.studio button { scroll-margin-top:calc(var(--header-height) + 24px); }.choice input[type=radio] {width:22px;height:22px;accent-color:var(--color-brand-primary);flex-shrink:0}.sources {border-top:1px solid #d8d1e3;padding-top:1.5rem;margin-top:2rem}.source-row {display:grid;grid-template-columns:1fr 1.4fr auto;align-items:end;gap:.6rem;margin-top:1rem}.source-row button {margin-bottom:1rem}.studio-footer {margin-top:2.5rem;border-top:1px solid #d8d1e3;padding-top:1.5rem}.studio-footer p {line-height:1.7;max-width:75ch;font-size:.9rem}.preview p {line-height:1.6;font-size:.9rem}.preview iframe {width:100%;height:75vh;min-height:500px;border:1px solid #d8d1e3;border-radius:8px;background:white}
@media(max-width:800px){.studio{padding:1.25rem 1rem 4rem}.workspace{grid-template-columns:1fr;gap:1rem}.lesson-library{grid-template-columns:1fr 1fr}.lesson-plan{border-bottom:1px solid #d8d1e3}.save-status{margin-left:0}.source-row{grid-template-columns:1fr}.source-row label{margin:0}.block-heading{align-items:flex-start}.studio-footer .toolbar button{flex:1 1 180px}}
@media(max-width:480px){.lesson-library{grid-template-columns:1fr}.view-tabs button{font-size:.85rem}.studio-header .toolbar{width:100%}.studio-header .toolbar button{flex:1}.workbar>.primary{margin-left:auto}}
</style>
