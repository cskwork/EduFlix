import { readFile } from 'node:fs/promises'

async function loadEngine(): Promise<void> {
  const engineCode = await readFile(`${process.cwd()}/public/contents/common/engine.js`, 'utf-8')
  const run = new Function(engineCode)
  run()
}

describe('EduFlixEngine story character rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="main-content"><div id="scene-container"></div></div>'
  })

  it('renders an img element when character.image is a path', async () => {
    await loadEngine()

    const engine = (window as unknown as { Engine: { init: (data: unknown) => void; switchScene: (id: string) => void } }).Engine

    engine.init({
      title: 'Test',
      hook: { question: 'Q?' },
      story: {
        character: { image: 'assets/character.svg' },
        situation: 'Story',
      },
      interaction: {
        title: 'Play',
        instruction: 'Do it',
      },
    })

    engine.switchScene('story')

    const img = document.querySelector('#story-char img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('assets/character.svg')
  })
})
