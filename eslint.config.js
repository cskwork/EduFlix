import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'archive/**', 'agents/**/*.js', 'contents/**/*.js', 'public/contents/**/*.js', 'update_story_pass1_batch1.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        HTMLElement: 'readonly',
        HTMLIFrameElement: 'readonly',
        HTMLDivElement: 'readonly',
        document: 'readonly',
        console: 'readonly',
        KeyboardEvent: 'readonly',
        MessageEvent: 'readonly',
        Event: 'readonly',
        HTMLInputElement: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
)
