import { runCodexText, type CodexTextOptions } from './codex'
import {
  DEFAULT_ZAI_URL, runZaiFiles, runZaiText, type ZaiFilesOptions, type ZaiTextOptions,
} from './zai'

export type FactoryLlmProvider = 'zai' | 'codex'
type Env = Partial<Record<string, string | undefined>>

export interface FactoryLlmConfig {
  provider: FactoryLlmProvider
  model: string
  apiKey?: string
  apiUrl?: string
  keyConfigured: boolean
}

export interface FactoryTextOptions {
  prompt: string
  label?: string
  outFile: string
  schemaFile?: string
  timeoutMs?: number
  validateOutput?: (text: string) => string | undefined
}

export interface FactoryFilesOptions {
  prompt: string
  label?: string
  requiredFiles: readonly string[]
  stagingDir: string
  responseFile: string
  timeoutMs?: number
}

export function getFactoryLlmConfig(env: Env = process.env): FactoryLlmConfig {
  const rawProvider = env.FACTORY_LLM_PROVIDER?.trim().toLowerCase() || 'zai'
  if (rawProvider !== 'zai' && rawProvider !== 'codex') {
    throw new Error(`지원하지 않는 FACTORY_LLM_PROVIDER입니다: ${rawProvider}`)
  }
  if (rawProvider === 'codex') {
    return { provider: 'codex', model: env.FACTORY_CODEX_MODEL?.trim() || 'gpt-5.6-sol', keyConfigured: true }
  }
  const apiKey = env.ZAI_API_KEY?.trim()
  return {
    provider: 'zai',
    model: env.ZAI_MODEL?.trim() || 'glm-5.3-flash',
    apiKey,
    apiUrl: env.ZAI_API_URL?.trim() || DEFAULT_ZAI_URL,
    keyConfigured: Boolean(apiKey),
  }
}

interface EngineDependencies {
  env?: Env
  runZaiText?: (options: ZaiTextOptions) => Promise<void>
  runZaiFiles?: (options: ZaiFilesOptions) => Promise<void>
  runCodex?: (options: CodexTextOptions) => Promise<void>
}

export async function runFactoryText(
  options: FactoryTextOptions,
  dependencies: EngineDependencies = {},
): Promise<void> {
  const config = getFactoryLlmConfig(dependencies.env)
  if (config.provider === 'codex') {
    await (dependencies.runCodex ?? runCodexText)(options)
    return
  }
  if (!config.apiKey) throw new Error('ZAI_API_KEY가 설정되지 않았습니다.')
  await (dependencies.runZaiText ?? runZaiText)({
    ...options,
    apiKey: config.apiKey,
    model: config.model,
    apiUrl: config.apiUrl,
  })
}

export async function runFactoryFiles(
  options: FactoryFilesOptions,
  dependencies: EngineDependencies = {},
): Promise<void> {
  const config = getFactoryLlmConfig(dependencies.env)
  if (config.provider === 'codex') {
    await (dependencies.runCodex ?? runCodexText)({
      prompt: options.prompt,
      outFile: options.responseFile,
      cwd: options.stagingDir,
      workspaceWrite: true,
      timeoutMs: options.timeoutMs,
      label: options.label,
    })
    return
  }
  if (!config.apiKey) throw new Error('ZAI_API_KEY가 설정되지 않았습니다.')
  await (dependencies.runZaiFiles ?? runZaiFiles)({
    ...options,
    apiKey: config.apiKey,
    model: config.model,
    apiUrl: config.apiUrl,
  })
}
