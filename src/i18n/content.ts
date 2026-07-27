// 콘텐츠 카탈로그 메타데이터(제목·설명)를 현재 UI 언어로 해석한다.
//
// index.json / manifest.json의 title·description은 콘텐츠 원문 언어(대개 한국어)를 유지하고,
// 선택적 `translations` 필드에 언어별 번역을 담는다. 번역이 없으면 원문으로 폴백한다.
//
//   { "title": "피자로 배우는 분수",
//     "translations": { "en": { "title": "Fraction Pizza", "description": "..." } } }
import type { ContentTranslations } from '../types/content'
import { getLocale, type LocaleCode } from './index'

export interface LocalizableContent {
  title: string
  description?: string
  translations?: ContentTranslations
}

function translationFor(
  content: LocalizableContent,
  locale: LocaleCode
): { title?: string; description?: string } | undefined {
  return content.translations?.[locale]
}

export function localizedTitle(content: LocalizableContent, locale: LocaleCode = getLocale()) {
  return translationFor(content, locale)?.title?.trim() || content.title
}

export function localizedDescription(
  content: LocalizableContent,
  locale: LocaleCode = getLocale()
) {
  return translationFor(content, locale)?.description?.trim() || content.description || ''
}
