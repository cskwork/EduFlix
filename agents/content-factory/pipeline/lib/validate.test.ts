import { describe, expect, test } from "bun:test";
import {
  assertAssetPlan, assertAssetPlanContext, assertPlan, assertStoryboard, validateManifest, validateStageOutput,
} from "./validate";
import { validPlan } from "../test-fixtures";

describe("단계 산출물 타입가드", () => {
  test("프롬프트의 기획 JSON 계약을 허용한다", () => {
    expect(() => assertPlan({
      slug: "symmetry", title: "대칭", description: "대칭 설명",
      topic: "대칭", grade: "elementary-5", subject: "math",
      achievementStandard: { code: "추정", statement: "대칭을 이해한다", estimated: true, rationale: "주제 근거" },
      learningObjectives: ["1", "2"].map((id) => ({ id: `LO${id}`, statement: `목표 ${id}`, evidence: "조작 결과" })),
      prerequisites: [{ knowledge: "도형", check: "도형 찾기" }],
      misconceptions: [{ misconception: "모양만 같으면 대칭", correction: "대응점을 확인한다" }],
      lessonFlow: ["hook", "story", "core", "quiz", "wrap"].map((scene) =>
        ({ scene, purpose: "목표 연결", objectiveIds: ["LO1"], minutes: 3 })),
      contentType: { selected: "simulation", rationale: "조작 관찰" },
      languageGuidance: { learnerLevel: "초5", termsToExplain: ["대칭"] },
    })).not.toThrow();
  });

  test("기획 최상위 입력과 언어 지침을 요구한다", () => {
    const plan = validPlan();
    delete (plan as { topic?: string }).topic;
    expect(() => assertPlan(plan)).toThrow("topic");
    // subject는 kebab-case slug만 허용 (공백·특수문자 불가)
    const invalidSubject = { ...validPlan(), subject: "Korean History!" };
    expect(() => assertPlan(invalidSubject)).toThrow("subject");
  });

  test("비어 있는 기획 내부 객체와 배열 항목을 거부한다", () => {
    expect(() => assertPlan({
      slug: "symmetry", title: "대칭", description: "대칭 설명",
      achievementStandard: {},
      learningObjectives: [{ statement: "목표 1" }, { statement: "목표 2" }],
      prerequisites: [{}], misconceptions: [{}],
      lessonFlow: ["hook", "story", "core", "quiz", "wrap"].map((scene) => ({ scene })),
      contentType: { selected: "simulation", rationale: "조작 관찰" },
    })).toThrow("achievementStandard");
  });

  test("다섯 장면 순서와 퀴즈 수를 확인한다", () => {
    expect(() => assertStoryboard({
      title: "대칭 탐험", learnerRole: "탐험가",
      scenes: ["hook", "story", "core", "quiz", "wrap"].map((id) => ({
        id, purpose: "목표 연결", objectiveIds: ["LO1"], narration: ["안내"], prompt: "해 볼까요?",
        visualSpec: "대칭 도형", interaction: { controls: [], initialState: "처음", rules: [] },
        assets: [], completionCondition: "다음 버튼",
      })),
      quiz: { sceneId: "quiz", questions: ["1", "2", "3"].map((id) => ({
        id: `Q${id}`, objectiveId: "LO1", prompt: "문제",
        choices: [{ id: "A", text: "답" }, { id: "B", text: "다른 답" }],
        correctChoiceId: "A", correctFeedback: "맞아요", incorrectFeedback: "다시", hint: "힌트",
      })) },
      accessibilityNotes: ["키보드"],
    })).not.toThrow();
  });

  test("빈 스토리보드 장면과 문항 내부 필드를 거부한다", () => {
    expect(() => assertStoryboard({
      scenes: ["hook", "story", "core", "quiz", "wrap"].map((id) => ({ id })),
      quiz: { questions: [{}, {}, {}] },
    })).toThrow("scenes[0]");
  });

  test("신규 이미지 2개 초과를 거부한다", () => {
    const generated = [1, 2, 3].map((index) => ({ fileName: `${index}.png`, prompt: "그림" }));
    expect(() => assertAssetPlan({ generated, coverage: [] })).toThrow("최대 2개");
  });

  test("에셋 파일 경로 이탈과 허용되지 않은 이름을 거부한다", () => {
    expect(() => assertAssetPlan({
      generated: [{ assetId: "outside", fileName: "../outside.png", scenes: ["hook"],
        purpose: "그림", prompt: "그림", alt: "그림", width: 1200, height: 675 }],
      reused: [], cssAlternatives: [], coverage: [],
    })).toThrow("허용된 파일명");
    expect(() => assertAssetPlan({
      generated: [],
      reused: [{ assetId: "bad", sourcePath: "/contents/illustrations/../../secret.png",
        scenes: ["hook"], purpose: "그림", alt: "그림" }],
      cssAlternatives: [], coverage: [],
    })).toThrow("sourcePath");
  });

  test("에셋 계획의 reused, cssAlternatives, coverage 내부 계약을 검증한다", () => {
    expect(() => assertAssetPlan({ generated: [], reused: [{}], cssAlternatives: [{}], coverage: [{}] }))
      .toThrow("reused[0]");
  });

  test("재사용 목록 membership과 필수 에셋 coverage를 교차 검증한다", () => {
    const storyboard = { scenes: [{ assets: [{ id: "visual", required: true }] }] };
    const plan = {
      generated: [], reused: [{ assetId: "shared", sourcePath: "/contents/icons/known.svg" }],
      coverage: [{ storyboardAssetId: "visual", resolvedBy: "reuse", resolvedAssetId: "shared" }],
    };
    expect(() => assertAssetPlanContext(plan, storyboard, ["/contents/icons/known.svg"])).not.toThrow();
    expect(() => assertAssetPlanContext(plan, storyboard, [])).toThrow("공용 에셋 목록");
    expect(() => assertAssetPlanContext({ ...plan, coverage: [] }, storyboard,
      ["/contents/icons/known.svg"])).toThrow("coverage");
  });

  test("skip-images는 주입 목록의 thumbnail 공용 PNG를 요구한다", () => {
    const storyboard = { scenes: [] };
    const withoutThumbnail = { generated: [], reused: [], coverage: [] };
    expect(() => assertAssetPlanContext(withoutThumbnail, storyboard,
      ["/contents/backgrounds/shared.png"], { skipImages: true })).toThrow("thumbnail");
    const withThumbnail = { generated: [], reused: [
      { assetId: "thumbnail", sourcePath: "/contents/backgrounds/shared.png" },
    ], coverage: [] };
    expect(() => assertAssetPlanContext(withThumbnail, storyboard,
      ["/contents/backgrounds/shared.png"], { skipImages: true })).not.toThrow();
    const withGenerated = { ...withThumbnail,
      generated: [{ assetId: "thumbnail", fileName: "thumbnail.png", prompt: "그림" }] };
    expect(() => assertAssetPlanContext(withGenerated, storyboard,
      ["/contents/backgrounds/shared.png"], { skipImages: true })).toThrow("generated");
  });

  test("에셋 계획 contentId를 요구한다", () => {
    expect(() => assertAssetPlan({ generated: [], reused: [], cssAlternatives: [], coverage: [] }))
      .toThrow("contentId");
  });

  test("심사 총평과 항목 판정이 모순되면 거부한다", () => {
    const criteria = Array.from({ length: 22 }, (_, index) => ({
      id: `Q${String(index + 1).padStart(2, "0")}`,
      status: "pass",
      evidence: ["근거"],
    }));
    const result = validateStageOutput("judge", {
      passed: false,
      summary: "모순",
      criteria,
      failedIds: [],
      revisionBrief: { required: false, instructions: [] },
    });
    expect(result.valid).toBe(false);
  });

  test("생성 manifest의 고정 12필드를 검증한다", () => {
    const result = validateManifest({
      id: "symmetry", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/symmetry/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    });
    expect(result.valid).toBe(true);
    expect(validateManifest({
      id: "symmetry", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/symmetry/index.html", thumbnail: "thumbnail.png",
      createdAt: "not-a-date", tags: ["대칭"],
    }).valid).toBe(false);
  });

  test("manifest grade 형식과 gradeLevel 접두사를 검증한다", () => {
    const manifest = {
      id: "symmetry", title: "대칭", subject: "math", gradeLevel: "elementary",
      grade: "elementary-5", type: "simulation", language: "ko", description: "설명",
      path: "/contents/math/elementary/symmetry/index.html", thumbnail: "thumbnail.png",
      createdAt: "2026-07-13T00:00:00.000Z", tags: ["대칭"],
    };
    for (const grade of [5, "5학년", "elementary-7", "middle-5"]) {
      expect(validateManifest({ ...manifest, grade }).valid).toBe(false);
    }
    expect(validateManifest({ ...manifest, gradeLevel: "high", grade: "high-6" }).valid).toBe(true);
  });
});
