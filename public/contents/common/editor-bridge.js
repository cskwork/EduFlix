/**
 * EduFlix 콘텐츠 편집 브릿지
 * iframe 내에서 실행되어 부모 편집 패널과 postMessage 통신
 */
(function() {
  'use strict';

  // 편집 모드 활성화 여부
  let isEditMode = false;

  // CSS 변수 추출을 위한 기본 변수 목록
  const CSS_VARIABLES = [
    { variable: '--primary-color', label: '주요 색상', category: 'primary' },
    { variable: '--secondary-color', label: '보조 색상', category: 'secondary' },
    { variable: '--accent-color', label: '강조 색상', category: 'accent' },
    { variable: '--bg-color', label: '배경 색상', category: 'background' },
    { variable: '--text-color', label: '텍스트 색상', category: 'text' },
    { variable: '--text-light', label: '밝은 텍스트', category: 'text' },
    { variable: '--error-color', label: '오류 색상', category: 'accent' },
    { variable: '--success-color', label: '성공 색상', category: 'accent' }
  ];

  // 텍스트 추출 선택자 목록
  const TEXT_SELECTORS = [
    { selector: 'h1.main-title, .question-box h1', type: 'title', label: '메인 제목' },
    { selector: '.sub-text, .question-box p', type: 'description', label: '설명 텍스트' },
    { selector: 'h2', type: 'title', label: '섹션 제목' },
    { selector: 'h3', type: 'title', label: '소제목' },
    { selector: '.instruction, .tip-text', type: 'instruction', label: '안내 문구' },
    { selector: '.dialogue-box p, #typewriter-text', type: 'dialogue', label: '대화 내용' },
    { selector: '.pizza-label, .size, .price', type: 'label', label: '라벨' }
  ];

  /**
   * 편집 가능한 텍스트 추출
   */
  function extractTexts() {
    const texts = [];
    let idCounter = 0;

    TEXT_SELECTORS.forEach(({ selector, type, label }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        // 빈 텍스트나 스크립트로 채워지는 요소는 건너뛰기
        const text = el.textContent?.trim();
        if (!text || el.id === 'typewriter-text') return;

        // 상위 씬 찾기
        const scene = el.closest('.scene');
        const sceneName = scene ? scene.id.replace('-scene', '') : 'global';

        texts.push({
          id: `text-${idCounter++}`,
          label: `${label} ${index + 1}`,
          path: generateSelector(el),
          value: text,
          type: type,
          scene: sceneName
        });
      });
    });

    return texts;
  }

  /**
   * 고유 CSS 선택자 생성
   */
  function generateSelector(element) {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || []).filter(el => el.tagName === current.tagName);
      if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;

      path.unshift(selector);
      current = current.parentNode;
    }

    return path.join(' > ');
  }

  /**
   * CSS 변수 값 추출
   */
  function extractStyles() {
    const styles = [];
    const computedStyle = getComputedStyle(document.documentElement);

    CSS_VARIABLES.forEach(({ variable, label, category }) => {
      const value = computedStyle.getPropertyValue(variable).trim();
      if (value) {
        styles.push({
          id: `style-${variable.replace(/^--/, '')}`,
          label: label,
          variable: variable,
          value: value,
          type: 'color',
          category: category
        });
      }
    });

    return styles;
  }

  /**
   * 퀴즈 데이터 추출
   */
  function extractQuizzes() {
    // Arbitrary generated scripts do not expose a reliable answer model.
    return [];
  }

  /**
   * 텍스트 업데이트
   */
  function updateText(id, path, value) {
    try {
      const element = document.querySelector(path);
      if (element) {
        element.textContent = value;
        return true;
      }
    } catch (e) {
      console.warn('텍스트 업데이트 실패:', e);
    }
    return false;
  }

  /**
   * CSS 변수 업데이트
   */
  function updateStyle(variable, value) {
    try {
      document.documentElement.style.setProperty(variable, value);
      return true;
    } catch (e) {
      console.warn('스타일 업데이트 실패:', e);
    }
    return false;
  }

  /**
   * 퀴즈 업데이트
   */
  function updateQuiz(id, updates) {
    return false;
  }

  /**
   * 전체 콘텐츠 추출
   */
  function extractAllContent() {
    let overrides;
    try { overrides = JSON.parse(document.getElementById('eduflix-editor-overrides')?.textContent || 'null'); } catch {}
    return {
      overrides,
      texts: extractTexts(),
      styles: extractStyles(),
      quizzes: extractQuizzes()
    };
  }

  /**
   * postMessage 핸들러
   */
  function handleMessage(event) {
    // origin 검증: 콘텐츠 iframe과 편집 패널은 항상 같은 origin에서 서빙되므로 정확히 일치해야 한다.
    // 부분 일치(includes)는 evil-eduflix.example.com 같은 도메인도 통과시키므로 사용하지 않는다.
    if (event.origin !== window.location.origin || event.source !== window.parent) {
      return;
    }

    const { type, payload } = event.data || {};

    console.log('[Bridge] 메시지 수신:', type);

    switch (type) {
      case 'EDITOR_INIT':
        isEditMode = true;
        // 편집 모드 시각적 표시
        document.body.classList.add('editor-mode');
        // 준비 완료 응답
        console.log('[Bridge] EDITOR_INIT 수신 - EDITOR_READY 응답');
        window.parent.postMessage({
          type: 'EDITOR_READY',
          payload: { ready: true }
        }, window.location.origin);
        break;

      case 'EXTRACT_CONTENT':
        const content = extractAllContent();
        window.parent.postMessage({
          type: 'CONTENT_EXTRACTED',
          payload: content
        }, window.location.origin);
        break;

      case 'UPDATE_TEXT':
        if (payload) {
          const success = updateText(payload.id, payload.path, payload.value);
          window.parent.postMessage({
            type: 'UPDATE_APPLIED',
            payload: { type: 'text', id: payload.id, success }
          }, window.location.origin);
        }
        break;

      case 'UPDATE_STYLE':
        if (payload) {
          const success = updateStyle(payload.variable, payload.value);
          window.parent.postMessage({
            type: 'UPDATE_APPLIED',
            payload: { type: 'style', variable: payload.variable, success }
          }, window.location.origin);
        }
        break;

      case 'UPDATE_QUIZ':
        if (payload) {
          const success = updateQuiz(payload.id, payload);
          window.parent.postMessage({
            type: 'UPDATE_APPLIED',
            payload: { type: 'quiz', id: payload.id, success }
          }, window.location.origin);
        }
        break;

      default:
        break;
    }
  }

  /**
   * 편집 모드용 스타일 주입
   */
  function injectEditorStyles() {
    const style = document.createElement('style');
    style.id = 'editor-bridge-styles';
    style.textContent = `
      .editor-mode [data-editable]:hover {
        outline: 2px dashed #3b82f6;
        outline-offset: 2px;
        cursor: text;
      }
      .editor-mode .editing {
        outline: 2px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 초기화
   */
  function init() {
    if (window.EduFlixEditor) return;
    const stored = document.getElementById('eduflix-editor-overrides');
    if (stored) {
      try {
        const changes = JSON.parse(stored.textContent);
        const apply = () => {
          if (isEditMode) return;
          (changes.texts || []).forEach(text => {
            let element;
            try { element = document.querySelector(text.path); } catch { return; }
            if (!element || element.textContent === text.value) return;
            const scene = element.closest('.scene');
            if (text.scene && text.scene !== 'global' && scene?.id.replace('-scene', '') !== text.scene) return;
            if (typeof text.originalValue === 'string' && element.textContent?.trim() !== text.originalValue) return;
            element.textContent = text.value;
          });
          (changes.styles || []).forEach(style => {
            if (document.documentElement.style.getPropertyValue(style.variable) !== style.value) updateStyle(style.variable, style.value);
          });
        };
        apply();
        new MutationObserver(apply).observe(document.body, { childList: true, subtree: true, characterData: true });
      } catch (error) { console.error('Saved editor changes could not be applied', error); }
    }
    // 메시지 리스너 등록
    window.addEventListener('message', handleMessage);

    // 편집 모드 스타일 주입
    injectEditorStyles();

    // 전역 API 노출 (디버깅용)
    window.EduFlixEditor = {
      extractAllContent,
      updateText,
      updateStyle,
      updateQuiz,
      isEditMode: () => isEditMode
    };

    console.log('[EduFlix Editor Bridge] 초기화 완료');

    // 초기화 완료 후 자동으로 EDITOR_READY 전송 (race condition 방지)
    // 부모가 리스너를 등록하기 전에 메시지를 놓쳤을 경우를 대비
    window.parent.postMessage({
      type: 'EDITOR_READY',
      payload: { ready: true, auto: true }
    }, window.location.origin);
    console.log('[EduFlix Editor Bridge] 자동 EDITOR_READY 전송');
  }

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
