export type StageName = "plan" | "storyboard" | "assets" | "judge";

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  value?: T;
}

export interface PlanOutput {
  slug: string;
  title: string;
  description: string;
  topic: string;
  grade: string;
  subject: string;
  achievementStandard: Record<string, unknown>;
  learningObjectives: Array<Record<string, unknown>>;
  prerequisites: unknown[];
  misconceptions: unknown[];
  lessonFlow: unknown[];
  contentType: { selected: string; rationale: string; [key: string]: unknown };
}

export interface StoryboardOutput {
  scenes: Array<{ id: string; [key: string]: unknown }>;
  quiz: { questions: unknown[]; [key: string]: unknown };
}

export interface GeneratedAsset {
  assetId: string;
  fileName: string;
  scenes: string[];
  purpose: string;
  prompt: string;
  alt: string;
  width: number;
  height: number;
}

export interface AssetPlan {
  contentId: string;
  generated: GeneratedAsset[];
  reused: unknown[];
  cssAlternatives: unknown[];
  coverage: unknown[];
  [key: string]: unknown;
}

export type AssetPlanOutput = AssetPlan;

export interface JudgeOutput {
  passed: boolean;
  summary: string;
  criteria: Array<{
    id: string;
    status: "pass" | "fail";
    evidence: string[];
    fix?: string;
    [key: string]: unknown;
  }>;
  failedIds: string[];
  revisionBrief: { required: boolean; instructions: string[] };
}

export interface ContentManifest {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  grade: string;
  type: string;
  language: string;
  description: string;
  path: string;
  thumbnail: string;
  [key: string]: unknown;
}

const CONTENT_TYPES = new Set(["simulation", "game", "quiz", "exploration", "story"]);
const SCENE_NAMES = ["hook", "story", "core", "quiz", "wrap"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasStrings(value: unknown, allowEmpty = false): value is string[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(isNonEmptyString);
}

function validateNamedObjects(
  value: unknown, fields: string[], label: string, errors: string[], allowEmpty = true,
): void {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    errors.push(`'${label}'는${allowEmpty ? "" : " 비어 있지 않은"} 배열이어야 합니다.`);
    return;
  }
  value.forEach((item, index) => {
    if (!isRecord(item) || fields.some((field) => !isNonEmptyString(item[field]))) {
      errors.push(`'${label}[${index}]'에는 ${fields.join(", ")} 값이 필요합니다.`);
    }
  });
}

function validateAchievement(value: unknown, errors: string[]): void {
  if (!isRecord(value) || !isNonEmptyString(value.code) || !isNonEmptyString(value.statement) ||
      typeof value.estimated !== "boolean" || !isNonEmptyString(value.rationale)) {
    errors.push("'achievementStandard'에는 code, statement, estimated, rationale가 필요합니다.");
  }
}

function validateLessonFlow(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) { errors.push("'lessonFlow'는 배열이어야 합니다."); return; }
  const scenes = value.map((item) => isRecord(item) ? item.scene : undefined);
  if (scenes.length !== 5 || !SCENE_NAMES.every((name, index) => scenes[index] === name)) {
    errors.push("'lessonFlow'는 hook, story, core, quiz, wrap 순서의 다섯 장면이어야 합니다.");
  }
  value.forEach((item, index) => {
    if (!isRecord(item) || !isNonEmptyString(item.purpose) || !hasStrings(item.objectiveIds) ||
        typeof item.minutes !== "number" || item.minutes <= 0) {
      errors.push(`'lessonFlow[${index}]'에는 purpose, objectiveIds, 양수 minutes가 필요합니다.`);
    }
  });
}

function validatePlan(value: unknown, errors: string[]): value is PlanOutput {
  if (!isRecord(value)) {
    errors.push("기획 산출물은 JSON 객체여야 합니다.");
    return false;
  }

  validateAchievement(value.achievementStandard, errors);
  if (!isNonEmptyString(value.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) ||
      !isNonEmptyString(value.title) || !isNonEmptyString(value.description)) {
    errors.push("기획 산출물에는 안전한 slug, title, description이 필요합니다.");
  }
  if (!isNonEmptyString(value.topic) || !isNonEmptyString(value.grade) ||
      !/^(elementary-[1-6]|middle-[1-3]|high-[1-3])$/.test(String(value.grade)) ||
      !["math", "science", "english"].includes(String(value.subject))) {
    errors.push("기획 산출물에는 topic, grade, subject가 필요합니다.");
  }
  validateNamedObjects(value.prerequisites, ["knowledge", "check"], "prerequisites", errors);
  validateNamedObjects(value.misconceptions, ["misconception", "correction"], "misconceptions", errors);
  validateLessonFlow(value.lessonFlow, errors);
  if (!Array.isArray(value.learningObjectives) ||
      !value.learningObjectives.every((item) => isRecord(item) && isNonEmptyString(item.id) &&
        isNonEmptyString(item.statement) && isNonEmptyString(item.evidence)) ||
      value.learningObjectives.length < 2 || value.learningObjectives.length > 3) {
    errors.push("'learningObjectives'는 statement가 있는 2~3개 객체 배열이어야 합니다.");
  }
  if (!isRecord(value.contentType) || !isNonEmptyString(value.contentType.selected) ||
      !CONTENT_TYPES.has(value.contentType.selected) || !isNonEmptyString(value.contentType.rationale)) {
    errors.push("'contentType'에는 허용된 selected와 rationale이 필요합니다.");
  }
  if (!isRecord(value.languageGuidance) || !isNonEmptyString(value.languageGuidance.learnerLevel) ||
      !hasStrings(value.languageGuidance.termsToExplain)) {
    errors.push("'languageGuidance'에는 learnerLevel과 termsToExplain이 필요합니다.");
  }
  return errors.length === 0;
}

function validInteraction(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.controls) || !isNonEmptyString(value.initialState) ||
      !Array.isArray(value.rules)) return false;
  const controls = value.controls.every((item) => isRecord(item) && isNonEmptyString(item.id) &&
    isNonEmptyString(item.action) && isNonEmptyString(item.accessibleName));
  const rules = value.rules.every((item) => isRecord(item) && ["trigger", "stateChange", "visualResult",
    "feedback", "correction"].every((field) => isNonEmptyString(item[field])));
  return controls && rules;
}

function validScene(value: unknown, expectedId: string): boolean {
  return isRecord(value) && value.id === expectedId && isNonEmptyString(value.purpose) &&
    hasStrings(value.objectiveIds) && hasStrings(value.narration) && isNonEmptyString(value.prompt) &&
    isNonEmptyString(value.visualSpec) && validInteraction(value.interaction) && Array.isArray(value.assets) &&
    value.assets.every((asset) => isRecord(asset) && ["id", "purpose", "visual", "alt"]
      .every((field) => isNonEmptyString(asset[field])) && typeof asset.required === "boolean") &&
    isNonEmptyString(value.completionCondition);
}

function validQuestion(value: unknown): boolean {
  if (!isRecord(value) || !["id", "objectiveId", "prompt", "correctChoiceId", "correctFeedback",
    "incorrectFeedback", "hint"].every((field) => isNonEmptyString(value[field])) || !Array.isArray(value.choices)) {
    return false;
  }
  return value.choices.length >= 2 && value.choices.every((choice) => isRecord(choice) &&
    isNonEmptyString(choice.id) && isNonEmptyString(choice.text)) &&
    value.choices.some((choice) => isRecord(choice) && choice.id === value.correctChoiceId);
}

function validateStoryboard(value: unknown, errors: string[]): value is StoryboardOutput {
  if (!isRecord(value)) {
    errors.push("스토리보드 산출물은 JSON 객체여야 합니다.");
    return false;
  }
  if (!Array.isArray(value.scenes)) {
    errors.push("'scenes'는 배열이어야 합니다.");
  } else {
    const scenes = value.scenes;
    SCENE_NAMES.forEach((name, index) => {
      if (!validScene(scenes[index], name)) errors.push(`'scenes[${index}]'는 ${name} 장면 계약을 충족해야 합니다.`);
    });
    if (scenes.length !== 5) errors.push("'scenes'는 정확히 다섯 장면이어야 합니다.");
  }
  if (!isRecord(value.quiz) || !Array.isArray(value.quiz.questions) ||
      value.quiz.questions.length < 3 || value.quiz.questions.length > 5) {
    errors.push("'quiz.questions'는 3~5개 배열이어야 합니다.");
  } else if (value.quiz.sceneId !== "quiz" || !value.quiz.questions.every(validQuestion)) {
    errors.push("'quiz'에는 sceneId=quiz와 완전한 문항 필드가 필요합니다.");
  }
  if (!isNonEmptyString(value.title) || !isNonEmptyString(value.learnerRole) ||
      !hasStrings(value.accessibilityNotes)) errors.push("스토리보드 title, learnerRole, accessibilityNotes가 필요합니다.");
  return errors.length === 0;
}

function validateGeneratedAssets(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) { errors.push("'generated'는 신규 이미지 명세 배열이어야 합니다."); return; }
  if (value.length > 2) errors.push("신규 생성 이미지는 최대 2개까지 허용됩니다.");
  value.forEach((asset, index) => {
    if (!isRecord(asset) || !["assetId", "fileName", "purpose", "prompt", "alt"]
      .every((field) => isNonEmptyString(asset[field])) || !hasStrings(asset.scenes) ||
      typeof asset.width !== "number" || asset.width <= 0 || typeof asset.height !== "number" || asset.height <= 0) {
      errors.push(`'generated[${index}]'는 전체 이미지 명세 필드를 포함해야 합니다.`);
    } else if (!["thumbnail.png", "hook-visual.png"].includes(String(asset.fileName))) {
      errors.push(`'generated[${index}].fileName'은 허용된 파일명이어야 합니다.`);
    }
  });
}

function validateReusedAssets(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) { errors.push("'reused'는 배열이어야 합니다."); return; }
  value.forEach((asset, index) => {
    const source = isRecord(asset) ? asset.sourcePath : undefined;
    if (!isRecord(asset) || !["assetId", "sourcePath", "purpose", "alt"]
      .every((field) => isNonEmptyString(asset[field])) || !hasStrings(asset.scenes) ||
      !/^\/contents\/(?:backgrounds|icons|diagrams|illustrations)\/[^/\\]+$/.test(String(source))) {
      errors.push(`'reused[${index}]'는 전체 공용 에셋 명세와 허용된 sourcePath가 필요합니다.`);
    }
  });
}

function validateAssetLinks(value: Record<string, unknown>, errors: string[]): void {
  if (!Array.isArray(value.cssAlternatives)) errors.push("'cssAlternatives'는 배열이어야 합니다.");
  else value.cssAlternatives.forEach((item, index) => {
    if (!isRecord(item) || !["assetId", "implementation", "altStrategy"]
      .every((field) => isNonEmptyString(item[field])) || !hasStrings(item.scenes)) {
      errors.push(`'cssAlternatives[${index}]'는 전체 CSS 대안 명세가 필요합니다.`);
    }
  });
  if (!Array.isArray(value.coverage)) errors.push("'coverage'는 배열이어야 합니다.");
  else value.coverage.forEach((item, index) => {
    if (!isRecord(item) || !isNonEmptyString(item.storyboardAssetId) ||
        !["reuse", "generated", "css"].includes(String(item.resolvedBy)) ||
        !isNonEmptyString(item.resolvedAssetId)) errors.push(`'coverage[${index}]'는 전체 해결 참조가 필요합니다.`);
  });
}

function validateAssets(value: unknown, errors: string[]): value is AssetPlanOutput {
  if (!isRecord(value)) {
    errors.push("에셋 계획은 JSON 객체여야 합니다.");
    return false;
  }
  if (!isNonEmptyString(value.contentId)) errors.push("'contentId'가 필요합니다.");
  validateGeneratedAssets(value.generated, errors);
  validateReusedAssets(value.reused, errors);
  validateAssetLinks(value, errors);
  return errors.length === 0;
}

function validateJudge(value: unknown, errors: string[]): value is JudgeOutput {
  if (!isRecord(value)) {
    errors.push("심사 결과는 JSON 객체여야 합니다.");
    return false;
  }
  if (typeof value.passed !== "boolean") errors.push("'passed'는 불리언이어야 합니다.");
  if (!isNonEmptyString(value.summary)) errors.push("'summary'가 필요합니다.");
  const failedIds: string[] = [];
  if (!Array.isArray(value.criteria) || value.criteria.length !== 22) {
    errors.push("'criteria'는 품질 항목 22개를 정확히 포함해야 합니다.");
  } else {
    value.criteria.forEach((item, index) => {
      const expectedId = `Q${String(index + 1).padStart(2, "0")}`;
      if (!isRecord(item) || item.id !== expectedId || !["pass", "fail"].includes(String(item.status))) {
        errors.push(`'criteria[${index}]'는 ${expectedId}의 pass/fail 판정이어야 합니다.`);
      } else if (!Array.isArray(item.evidence) || item.evidence.length === 0 ||
          !item.evidence.every(isNonEmptyString)) {
        errors.push(`'criteria[${index}].evidence'는 배열이어야 합니다.`);
      } else if (item.fix !== undefined && !isNonEmptyString(item.fix)) {
        errors.push(`'criteria[${index}].fix'는 제공하는 경우 비어 있지 않은 문자열이어야 합니다.`);
      } else if (item.status === "fail") {
        failedIds.push(expectedId);
      }
    });
  }
  if (!Array.isArray(value.failedIds)) errors.push("'failedIds'는 배열이어야 합니다.");
  else if (JSON.stringify(value.failedIds) !== JSON.stringify(failedIds)) {
    errors.push("'failedIds'는 실제 fail 항목과 정확히 일치해야 합니다.");
  }
  if (!isRecord(value.revisionBrief) || typeof value.revisionBrief.required !== "boolean" ||
      !Array.isArray(value.revisionBrief.instructions)) {
    errors.push("'revisionBrief'에는 required와 instructions 배열이 필요합니다.");
  } else if (value.revisionBrief.required !== (failedIds.length > 0) ||
      (failedIds.length > 0 && value.revisionBrief.instructions.length === 0)) {
    errors.push("'revisionBrief'는 fail 항목 유무와 일치하고 실패 시 수정 지시를 포함해야 합니다.");
  }
  if (typeof value.passed === "boolean" && value.passed !== (failedIds.length === 0)) {
    errors.push("'passed'는 22개 항목의 판정과 일치해야 합니다.");
  }
  return errors.length === 0;
}

export function validateStageOutput<T = unknown>(stage: StageName, value: unknown): ValidationResult<T> {
  const errors: string[] = [];
  const valid = stage === "plan" ? validatePlan(value, errors)
    : stage === "storyboard" ? validateStoryboard(value, errors)
      : stage === "assets" ? validateAssets(value, errors)
        : validateJudge(value, errors);
  return { valid, errors, ...(valid ? { value: value as T } : {}) };
}

export function parseAndValidateStageOutput<T = unknown>(stage: StageName, json: string): ValidationResult<T> {
  try {
    return validateStageOutput<T>(stage, JSON.parse(json));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, errors: [`JSON을 해석할 수 없습니다: ${reason}`] };
  }
}

export function stageOutputValidationError(stage: StageName, json: string): string | undefined {
  const result = parseAndValidateStageOutput(stage, json);
  return result.valid ? undefined : `${stage} JSON 검증 실패:\n- ${result.errors.join("\n- ")}`;
}

function assertValid<T>(stage: StageName, value: unknown): asserts value is T {
  const result = validateStageOutput<T>(stage, value);
  if (!result.valid) throw new Error(`${stage} JSON 검증 실패:\n- ${result.errors.join("\n- ")}`);
}

export function assertPlan(value: unknown): asserts value is PlanOutput {
  assertValid<PlanOutput>("plan", value);
}

export function assertStoryboard(value: unknown): asserts value is StoryboardOutput {
  assertValid<StoryboardOutput>("storyboard", value);
}

export function assertAssetPlan(value: unknown): asserts value is AssetPlan {
  assertValid<AssetPlan>("assets", value);
}

export function assertAssetPlanContext(
  plan: AssetPlan,
  storyboard: unknown,
  availableAssets: string[],
  options: { skipImages?: boolean; contentId?: string } = {},
): void {
  const reused = Array.isArray(plan.reused) ? plan.reused.filter(isRecord) : [];
  for (const [index, asset] of reused.entries()) {
    if (!availableAssets.includes(String(asset.sourcePath))) {
      throw new Error(`reused[${index}].sourcePath가 주입된 공용 에셋 목록에 없습니다.`);
    }
  }
  if (options.skipImages) {
    if (plan.generated.length > 0) {
      throw new Error("--skip-images에서는 generated 에셋을 사용할 수 없습니다.");
    }
    const thumbnail = reused.find((asset) => asset.assetId === "thumbnail" &&
      typeof asset.sourcePath === "string" && /\.png$/i.test(asset.sourcePath));
    if (!thumbnail) throw new Error("--skip-images에서는 assetId 'thumbnail'인 공용 PNG가 필요합니다.");
  }
  if (options.contentId && plan.contentId !== options.contentId) {
    throw new Error(`에셋 계획 contentId는 '${options.contentId}'여야 합니다.`);
  }
  const scenes = isRecord(storyboard) && Array.isArray(storyboard.scenes) ? storyboard.scenes : [];
  const requiredIds = scenes.flatMap((scene) => isRecord(scene) && Array.isArray(scene.assets)
    ? scene.assets.filter((asset) => isRecord(asset) && asset.required !== false && isNonEmptyString(asset.id))
      .map((asset) => String(asset.id)) : []);
  const coverage = Array.isArray(plan.coverage) ? plan.coverage.filter(isRecord) : [];
  for (const id of requiredIds) {
    const matches = coverage.filter((item) => item.storyboardAssetId === id);
    if (matches.length !== 1) throw new Error(`coverage는 필수 스토리보드 에셋 '${id}'를 정확히 한 번 해결해야 합니다.`);
  }
  const resolvedIds = new Set([
    ...plan.generated.map((asset) => asset.assetId).filter(isNonEmptyString),
    ...reused.map((asset) => asset.assetId).filter(isNonEmptyString),
    ...(Array.isArray(plan.cssAlternatives) ? plan.cssAlternatives.filter(isRecord)
      .map((asset) => asset.assetId).filter(isNonEmptyString) : []),
  ]);
  for (const [index, item] of coverage.entries()) {
    if (!isNonEmptyString(item.storyboardAssetId) || !isNonEmptyString(item.resolvedAssetId) ||
        !["reuse", "generated", "css"].includes(String(item.resolvedBy)) ||
        !resolvedIds.has(item.resolvedAssetId)) {
      throw new Error(`coverage[${index}]가 실제 에셋 계획 항목을 가리키지 않습니다.`);
    }
  }
}

export function validateManifest(value: unknown): ValidationResult<ContentManifest> {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ["manifest.json은 JSON 객체여야 합니다."] };

  const stringFields = [
    "id", "title", "subject", "gradeLevel", "type", "language",
    "description", "path", "thumbnail", "createdAt",
  ];
  for (const field of stringFields) {
    if (!isNonEmptyString(value[field])) errors.push(`manifest의 '${field}' 값이 필요합니다.`);
  }
  if (!isNonEmptyString(value.grade) || !/^(elementary|middle|high)-[1-6]$/.test(value.grade)) {
    errors.push("manifest의 'grade'는 elementary|middle|high와 1~6 학년 조합이어야 합니다.");
  }
  if (Object.keys(value).length !== 12) {
    errors.push(`manifest는 정확히 12개 필드여야 합니다(현재 ${Object.keys(value).length}개).`);
  }
  if (!Array.isArray(value.tags) || !value.tags.every(isNonEmptyString)) {
    errors.push("manifest의 'tags'는 문자열 배열이어야 합니다.");
  }
  if (isNonEmptyString(value.createdAt) &&
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.createdAt)) {
    errors.push("manifest의 'createdAt'은 UTC ISO 8601 문자열이어야 합니다.");
  }
  if (isNonEmptyString(value.subject) && !["math", "science", "english"].includes(value.subject)) {
    errors.push("manifest의 'subject' 값이 허용된 교과가 아닙니다.");
  }
  if (isNonEmptyString(value.gradeLevel) && !["elementary", "middle", "high"].includes(value.gradeLevel)) {
    errors.push("manifest의 'gradeLevel' 값이 허용된 학교급이 아닙니다.");
  }
  if (isNonEmptyString(value.grade) && isNonEmptyString(value.gradeLevel) &&
      value.grade.split("-")[0] !== value.gradeLevel) {
    errors.push("manifest의 'grade' 학교급은 'gradeLevel'과 일치해야 합니다.");
  }
  if (isNonEmptyString(value.language) && !["ko", "en"].includes(value.language)) {
    errors.push("manifest의 'language' 값이 허용된 언어가 아닙니다.");
  }
  if (isNonEmptyString(value.type) && !CONTENT_TYPES.has(value.type)) {
    errors.push("manifest의 'type' 값이 허용된 콘텐츠 유형이 아닙니다.");
  }
  return { valid: errors.length === 0, errors, ...(errors.length === 0 ? { value: value as ContentManifest } : {}) };
}
