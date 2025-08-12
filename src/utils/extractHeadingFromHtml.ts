export function extractHeadingFromHtml(html: string): string | null {
  if (!html || !html.trim()) return null
  
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Look for headings in order of preference (h1 first, then h2, etc.)
  const headingSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  
  for (const selector of headingSelectors) {
    const heading = tempDiv.querySelector(selector)
    if (heading && heading.textContent?.trim()) {
      return heading.textContent.trim()
    }
  }
  
  return null
}