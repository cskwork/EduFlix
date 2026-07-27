// 지원 언어 레지스트리
//
// 언어를 추가하려면
//   1. src/i18n/messages/<code>.ts 를 en.ts 기준으로 번역해 만들고
//   2. 아래 LOCALES에 항목 하나를 추가하면 된다.
// 나머지(전환 UI, 저장, <html lang>, 생성 언어)는 자동으로 따라온다.
import type { Language } from '../types/content'
import en, { type MessageSchema } from './messages/en'
import ko from './messages/ko'

export interface LocaleDefinition {
  /** 해당 언어 사용자가 보는 이름 (전환 UI에 노출) */
  nativeLabel: string
  /** 로그·접근성 라벨용 영어 이름 */
  englishLabel: string
  /** <html lang> 값 */
  htmlLang: string
  /** 전환 UI의 짧은 배지 */
  shortLabel: string
  /**
   * 이 UI 언어에서 콘텐츠를 생성할 때 사용할 언어.
   * 콘텐츠 파이프라인은 아직 ko/en만 지원하므로, 미지원 언어는 en으로 둔다.
   */
  contentLanguage: Language
  messages: MessageSchema
}

export const LOCALES = {
  en: {
    nativeLabel: 'English',
    englishLabel: 'English',
    htmlLang: 'en',
    shortLabel: 'EN',
    contentLanguage: 'en',
    messages: en,
  },
  ko: {
    nativeLabel: '한국어',
    englishLabel: 'Korean',
    htmlLang: 'ko',
    shortLabel: 'KO',
    contentLanguage: 'ko',
    messages: ko,
  },
} satisfies Record<string, LocaleDefinition>

export type LocaleCode = keyof typeof LOCALES

/** 저장된 선호 언어가 없을 때 사용하는 기본 언어 */
export const DEFAULT_LOCALE: LocaleCode = 'en'

/** 번역이 비어 있을 때 최종적으로 참조하는 언어 */
export const FALLBACK_LOCALE: LocaleCode = 'en'

export const LOCALE_CODES = Object.keys(LOCALES) as LocaleCode[]

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOCALES, value)
}

export type { MessageSchema }
