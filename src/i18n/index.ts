// 경량 i18n 런타임
//
// 외부 의존성 없이 Vue 반응성만으로 동작한다.
// - t('a.b.c', { name: 'x' })  : 점 경로 키 + {placeholder} 치환
// - 복수형: 'item | items' 형태로 값을 적고 params.count를 넘기면 자동 선택
// - 키 경로는 영어 카탈로그에서 파생된 타입이라 오타가 컴파일 타임에 잡힌다
import { computed, ref, type App, type ComputedRef } from 'vue'
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALES,
  LOCALE_CODES,
  isLocaleCode,
  type LocaleCode,
  type LocaleDefinition,
  type MessageSchema,
} from './locales'

export const LOCALE_STORAGE_KEY = 'eduflix_locale'

type Primitive = string | number
export type TranslateParams = Record<string, Primitive>

// 중첩 객체를 점 경로 문자열 유니온으로 변환
type PathsOf<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${PathsOf<T[K]>}`
    }[keyof T & string]

export type MessageKey = PathsOf<MessageSchema>

const currentLocale = ref<LocaleCode>(DEFAULT_LOCALE)

function readStoredLocale(): LocaleCode | null {
  try {
    const stored = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY)
    return isLocaleCode(stored) ? stored : null
  } catch {
    // Safari 프라이빗 모드 등 localStorage 접근이 막힌 환경
    return null
  }
}

function persistLocale(locale: LocaleCode) {
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // 저장 실패는 무시 - 세션 동안만 유지된다
  }
}

/**
 * 초기 언어를 결정한다.
 * 저장된 선호가 있으면 그것을, 없으면 기본 언어(영어)를 쓴다.
 * 브라우저 언어를 따르지 않는 것은 의도적이다 - 기본값은 항상 영어다.
 */
export function detectInitialLocale(): LocaleCode {
  return readStoredLocale() ?? DEFAULT_LOCALE
}

function resolveRaw(locale: LocaleCode, key: string): string | undefined {
  const segments = key.split('.')
  let node: unknown = LOCALES[locale].messages

  for (const segment of segments) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[segment]
  }

  return typeof node === 'string' ? node : undefined
}

function selectPluralForm(message: string, params?: TranslateParams): string {
  if (!message.includes(' | ')) return message

  const forms = message.split(' | ')
  const count = Number(params?.count)
  const index = Number.isFinite(count) && count === 1 ? 0 : 1

  return forms[index] ?? forms[0] ?? message
}

function interpolate(message: string, params?: TranslateParams): string {
  if (!params) return message

  return message.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** 특정 언어로 번역한다 (반응성이 필요 없는 곳에서 사용) */
export function translate(
  locale: LocaleCode,
  key: MessageKey,
  params?: TranslateParams
): string {
  const raw = resolveRaw(locale, key) ?? resolveRaw(FALLBACK_LOCALE, key)
  if (raw === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] 번역 키를 찾을 수 없습니다: ${key}`)
    }
    return key
  }

  return interpolate(selectPluralForm(raw, params), params)
}

/**
 * 현재 언어로 번역한다.
 * currentLocale을 읽으므로 템플릿/computed 안에서 자동으로 반응한다.
 */
export function t(key: MessageKey, params?: TranslateParams): string {
  return translate(currentLocale.value, key, params)
}

export function getLocale(): LocaleCode {
  return currentLocale.value
}

export function setLocale(locale: LocaleCode) {
  if (!isLocaleCode(locale)) return

  currentLocale.value = locale
  persistLocale(locale)
  applyDocumentLocale(locale)
}

function applyDocumentLocale(locale: LocaleCode) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = LOCALES[locale].htmlLang
}

/** 콘텐츠 생성 요청에 사용할 언어 (파이프라인이 지원하는 ko/en) */
export function contentLanguageForLocale(locale: LocaleCode = currentLocale.value) {
  return LOCALES[locale].contentLanguage
}

export interface LocaleOption extends LocaleDefinition {
  code: LocaleCode
}

export const availableLocales: LocaleOption[] = LOCALE_CODES.map((code) => ({
  code,
  ...LOCALES[code],
}))

export interface UseI18n {
  t: typeof t
  locale: ComputedRef<LocaleCode>
  localeDefinition: ComputedRef<LocaleOption>
  setLocale: typeof setLocale
  availableLocales: LocaleOption[]
  contentLanguage: ComputedRef<ReturnType<typeof contentLanguageForLocale>>
}

export function useI18n(): UseI18n {
  return {
    t,
    locale: computed(() => currentLocale.value),
    localeDefinition: computed(() => ({
      code: currentLocale.value,
      ...LOCALES[currentLocale.value],
    })),
    setLocale,
    availableLocales,
    contentLanguage: computed(() => contentLanguageForLocale(currentLocale.value)),
  }
}

/** Vue 플러그인 - `$t`를 전역 등록하고 저장된 언어를 복원한다 */
export const i18n = {
  install(app: App) {
    app.config.globalProperties.$t = t
    setLocale(detectInitialLocale())
  },
}

// 앱 밖(스토어·서비스)에서 import한 경우에도 <html lang>이 맞도록 초기화한다
setLocale(detectInitialLocale())

export { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES, LOCALE_CODES, isLocaleCode }
export type { LocaleCode, LocaleDefinition, MessageSchema }

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: typeof t
  }
}
