<script setup lang="ts">
// 언어 전환 드롭다운 - 헤더 우측 상단
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n, type LocaleCode } from '../../i18n'

const { t, locale, availableLocales, setLocale } = useI18n()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const currentLabel = computed(
  () => availableLocales.find((item) => item.code === locale.value)?.shortLabel ?? locale.value
)

function toggle() {
  isOpen.value = !isOpen.value
}

function choose(code: LocaleCode) {
  setLocale(code)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (!isOpen.value) return
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="rootRef" class="language-switcher">
    <button
      type="button"
      class="language-button"
      :aria-label="t('language.switcherLabel')"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span class="language-code">{{ currentLabel }}</span>
    </button>

    <transition name="dropdown">
      <ul v-if="isOpen" class="language-menu" role="listbox" :aria-label="t('language.label')">
        <li v-for="item in availableLocales" :key="item.code">
          <button
            type="button"
            class="language-option"
            :class="{ active: item.code === locale }"
            role="option"
            :aria-selected="item.code === locale"
            :lang="item.htmlLang"
            @click="choose(item.code)"
          >
            <span class="option-label">{{ item.nativeLabel }}</span>
            <span class="option-code">{{ item.shortLabel }}</span>
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  color: var(--color-text-primary);
  background: #fff;
  border: var(--border-sticker);
  box-shadow: 0 2px 0 rgba(59, 53, 98, 0.08);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.language-button:hover {
  background: var(--color-subject-english-soft);
  transform: translateY(-1px);
}

.language-code {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
}

.language-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  list-style: none;
  background: #fff;
  border: var(--border-sticker);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 0 rgba(59, 53, 98, 0.08), 0 14px 28px rgba(59, 53, 98, 0.14);
  z-index: var(--z-dropdown, 1000);
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm, 10px);
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.language-option:hover {
  background: rgba(255, 176, 31, 0.2);
}

.language-option.active {
  background: var(--color-brand-primary);
  color: #fff;
}

.option-code {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  letter-spacing: 0.5px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 479px) {
  .language-button {
    height: 36px;
    padding: 0 10px;
  }
}
</style>
