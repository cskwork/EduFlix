import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SubjectSelect from '../../src/components/creator/SubjectSelect.vue'
import IconSet from '../../src/components/icons/IconSet.vue'

describe('SubjectSelect', () => {
  it('이모지 문자 대신 IconSet으로 3개 과목을 표시한다', () => {
    const wrapper = mount(SubjectSelect, { props: { modelValue: null } })

    expect(wrapper.findAll('.subject-card')).toHaveLength(3)
    expect(wrapper.findAllComponents(IconSet).map((icon) => icon.props('name')))
      .toEqual(['math', 'science', 'english'])
    expect(wrapper.text()).toContain('수학')
    expect(wrapper.text()).toContain('과학')
    expect(wrapper.text()).toContain('영어')
  })
})
