export function validPlan() {
  return {
    topic: "대칭", grade: "elementary-5", subject: "math",
    achievementStandard: { code: "estimated", statement: "대칭을 이해한다", estimated: true, rationale: "주제 근거" },
    learningObjectives: ["1", "2"].map((id) => ({ id: `LO${id}`, statement: `목표 ${id}`, evidence: "조작 결과" })),
    prerequisites: [{ knowledge: "도형", check: "도형 찾기" }],
    misconceptions: [{ misconception: "모양만 같으면 대칭", correction: "대응점을 확인한다" }],
    lessonFlow: ["hook", "story", "core", "quiz", "wrap"].map((scene) =>
      ({ scene, purpose: "목표 연결", objectiveIds: ["LO1"], minutes: 3 })),
    contentType: { selected: "simulation", rationale: "조작 관찰" },
    languageGuidance: { learnerLevel: "초5", termsToExplain: ["대칭"] },
  };
}

export function validStoryboard() {
  return {
    title: "대칭 탐험", learnerRole: "탐험가",
    scenes: ["hook", "story", "core", "quiz", "wrap"].map((id) => ({
      id, purpose: "목표 연결", objectiveIds: ["LO1"], narration: ["안내"], prompt: "해 볼까요?",
      visualSpec: "대칭 도형", interaction: { controls: [], initialState: "처음", rules: [] },
      assets: [], completionCondition: "다음 버튼",
    })),
    quiz: { sceneId: "quiz", questions: ["1", "2", "3"].map((id) => ({
      id: `Q${id}`, objectiveId: "LO1", prompt: "문제",
      choices: [{ id: "A", text: "답" }, { id: "B", text: "다른 답" }], correctChoiceId: "A",
      correctFeedback: "맞아요", incorrectFeedback: "다시", hint: "힌트",
    })) },
    accessibilityNotes: ["키보드"],
  };
}

export function validAssets(contentId = "id") {
  return { contentId, generated: [], reused: [], cssAlternatives: [], coverage: [] };
}
