// Content Sync Service
// Syncs generated content from art-assets to EduFlix public directory

import type { ContentManifest, Subject, GradeLevel, ContentType, Grade, Language } from '../../src/types/content'
import { getArtAssetsRoot } from './art-assets'

// File system imports
const fs = require('fs/promises')
const path = require('path')

// Paths
const EDUFLIX_CONTENTS_DIR = 'public/contents'
const MOBILE_CSS_RELATIVE_PATH = '../../../common/mobile.css'

// Content sync result
export interface ContentSyncResult {
  success: boolean
  contentId?: string
  manifest?: ContentManifest
  error?: string
}

// Convert art-assets moduleId to EduFlix contentId
function generateContentId(moduleId: string, _subject: Subject): string {
  // art-assets moduleId format: YYYYMMDD-topic-slug
  // Keep it as-is for EduFlix compatibility
  // _subject reserved for future use (e.g., subject-prefixed IDs)
  return moduleId
}

// Extract grade level from grade string
function gradeToGradeLevel(grade: Grade): GradeLevel {
  if (grade.startsWith('elementary')) return 'elementary'
  if (grade.startsWith('middle')) return 'middle'
  return 'high'
}

// Inject mobile.css link into HTML
function injectMobileCss(html: string): string {
  // Find the closing </head> or first <link> to insert mobile.css
  // We want mobile.css after any existing style.css
  const styleLinkMatch = html.match(/<link[^>]*href=["']style\.css["'][^>]*>/i)

  if (styleLinkMatch) {
    // Insert mobile.css link after style.css
    const mobileCssLink = `\n    <link rel="stylesheet" href="${MOBILE_CSS_RELATIVE_PATH}">`
    return html.replace(styleLinkMatch[0], styleLinkMatch[0] + mobileCssLink)
  }

  // Fallback: insert before </head>
  const headCloseMatch = html.match(/<\/head>/i)
  if (headCloseMatch) {
    const mobileCssLink = `    <link rel="stylesheet" href="${MOBILE_CSS_RELATIVE_PATH}">\n  `
    return html.replace(headCloseMatch[0], mobileCssLink + headCloseMatch[0])
  }

  // No head tag found, return as-is
  console.warn('Could not find </head> tag to inject mobile.css')
  return html
}

// Determine content type from generated content
function inferContentType(_files: string[]): ContentType {
  // Default to simulation for educational content
  // Could be enhanced by parsing HTML for game elements, quiz markers, etc.
  // _files reserved for future analysis of content type
  return 'simulation'
}

// Sync content from art-assets to EduFlix
export async function syncContent(options: {
  moduleId: string
  modulePath: string
  subject: Subject
  grade: Grade
  interests: string[]
  language: Language
  files?: string[]
}): Promise<ContentSyncResult> {
  const { moduleId, modulePath, subject, grade, interests, language, files = ['index.html', 'script.js', 'style.css'] } = options

  try {
    // Resolve paths
    const artAssetsRoot = getArtAssetsRoot()
    const sourceDir = path.join(artAssetsRoot, modulePath)

    const gradeLevel = gradeToGradeLevel(grade)
    const contentId = generateContentId(moduleId, subject)
    const targetDir = path.join(EDUFLIX_CONTENTS_DIR, subject, gradeLevel, contentId)

    // Validate source directory exists
    try {
      await fs.access(sourceDir)
    } catch {
      return {
        success: false,
        error: `소스 디렉토리를 찾을 수 없습니다: ${sourceDir}`,
      }
    }

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true })

    // Copy files with transformations
    let title = contentId // Default title
    let description = '' // Will be extracted or generated

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file)
      const targetPath = path.join(targetDir, file)

      try {
        let content = await fs.readFile(sourcePath, 'utf-8')

        // Apply transformations based on file type
        if (file === 'index.html') {
          // Inject mobile.css
          content = injectMobileCss(content)

          // Extract title from HTML
          const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
          if (titleMatch) {
            title = titleMatch[1].trim()
          }

          // Try to extract description from meta tag
          const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
          if (descMatch) {
            description = descMatch[1].trim()
          }
        }

        await fs.writeFile(targetPath, content, 'utf-8')
      } catch (error) {
        console.warn(`Failed to copy file ${file}:`, error)
        // Continue with other files
      }
    }

    // Generate description if not found
    if (!description) {
      description = `${interests.join(', ')}에 관한 ${subject === 'math' ? '수학' : subject === 'english' ? '영어' : '과학'} 학습 콘텐츠`
    }

    // Create manifest
    const manifest: ContentManifest = {
      id: contentId,
      title,
      subject,
      gradeLevel,
      grade,
      type: inferContentType(files),
      language,
      description,
      thumbnail: '',
      path: `/contents/${subject}/${gradeLevel}/${contentId}/index.html`,
      tags: interests,
      createdAt: new Date().toISOString(),
    }

    // Save manifest
    await fs.writeFile(
      path.join(targetDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    )

    // Update catalog
    await updateCatalog(manifest)

    return {
      success: true,
      contentId,
      manifest,
    }
  } catch (error) {
    console.error('Content sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 동기화 실패',
    }
  }
}

// Update the content catalog (index.json)
async function updateCatalog(manifest: ContentManifest): Promise<void> {
  const catalogPath = path.join(EDUFLIX_CONTENTS_DIR, 'index.json')

  let catalog = {
    version: '1.0.0',
    lastUpdated: '',
    contents: [] as ContentManifest[],
  }

  try {
    const catalogData = await fs.readFile(catalogPath, 'utf-8')
    catalog = JSON.parse(catalogData)
  } catch {
    // Catalog doesn't exist, will create new one
  }

  // Check for duplicate ID
  const existingIndex = catalog.contents.findIndex((c) => c.id === manifest.id)
  if (existingIndex >= 0) {
    // Update existing entry
    catalog.contents[existingIndex] = manifest
  } else {
    // Add new entry
    catalog.contents.push(manifest)
  }

  catalog.lastUpdated = new Date().toISOString()

  await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8')
}

// Validate that content was synced correctly
export async function validateSync(contentId: string, subject: Subject, gradeLevel: GradeLevel): Promise<boolean> {
  const targetDir = path.join(EDUFLIX_CONTENTS_DIR, subject, gradeLevel, contentId)

  try {
    // Check essential files exist
    await fs.access(path.join(targetDir, 'index.html'))
    await fs.access(path.join(targetDir, 'manifest.json'))

    // Verify mobile.css link is present
    const html = await fs.readFile(path.join(targetDir, 'index.html'), 'utf-8')
    if (!html.includes('mobile.css')) {
      console.warn('mobile.css link not found in synced content')
      return false
    }

    return true
  } catch {
    return false
  }
}
