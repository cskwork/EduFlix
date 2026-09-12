export function revisionedContentUrl(url: string, revision = import.meta.env?.VITE_CONTENT_REVISION || ''): string {
  if (!revision || !/^[a-f0-9]{16}$/.test(revision)) return url
  return url.replace(/^\/contents\//, `/content-revisions/${revision}/`)
}
