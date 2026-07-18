import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SubjectSelect from '../../src/components/creator/SubjectSelect.vue'
import IconSet from '../../src/components/icons/IconSet.vue'

describe('SubjectSelect', () => {
  it('IconSet으로 3개 기본 과목을 표시한다', () => {
    const wrapper = mount(SubjectSelect, { props: { modelValue: null } })

    // 4번째 카드는 "직접 입력" (IconSet 없이 + 문자로 표시)
    const builtinCards = wrapper.findAll('.subject-card').filter((card) =>
      card.findComponent(IconSet).exists())
    expect(builtinCards).toHaveLength(3)
    expect(builtinCards.map((card) => card.findComponent(IconSet).props('name')))
      .toEqual(['math', 'science', 'english'])
    expect(wrapper.text()).toContain('수학')
    expect(wrapper.text()).toContain('과학')
    expect(wrapper.text()).toContain('영어')
  })

  it('"직접 입력" 카드를 추가로 제공한다', () => {
    const wrapper = mount(SubjectSelect, { props: { modelValue: null } })

    expect(wrapper.findAll('.subject-card')).toHaveLength(4)
    expect(wrapper.find('.custom-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('직접 입력')
  })

  it('직접 입력 카드 클릭 시 입력 필드가 노출된다', async () => {
    const wrapper = mount(SubjectSelect, { props: { modelValue: null } })

    await wrapper.find('.custom-card').trigger('click')
    expect(wrapper.find('.custom-input-wrap').exists()).toBe(true)
  })

  it('추천 확장 과목 칩을 빠른 선택으로 제공한다', () => {
    const wrapper = mount(SubjectSelect, { props: { modelValue: null } })

    // 추천 칩이 노출되어 있어야 함 (코딩, 토익, 한국사, 컴퓨터과학)
    expect(wrapper.text()).toContain('코딩')
    expect(wrapper.text()).toContain('토익')
    expect(wrapper.text()).toContain('한국사')
    expect(wrapper.text()).toContain('컴퓨터과학')
  })
})
