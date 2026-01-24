/**
 * Resources Utility - Title sanitization and safe link generation
 */

/**
 * Sanitizes a resource title for safe URLs and display
 * @param {string} str - Raw title from Gemini or fallback
 * @returns {string} Sanitized title
 */
export function sanitizeTitle(str) {
  if (typeof str !== 'string') return '';
  
  // Remove newlines, extra whitespace
  let sanitized = str
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Cap at 90 characters
  if (sanitized.length > 90) {
    sanitized = sanitized.substring(0, 87) + '...';
  }

  return sanitized;
}

/**
 * URL-encodes a string for safe use in URLs
 * @param {string} str - String to encode
 * @returns {string} Encoded string
 */
export function encodeForUrl(str) {
  return encodeURIComponent(str);
}

/**
 * Builds safe resource links from titles
 * @param {Object} params
 * @param {string} params.subject - Subject ID (dsa or python-ml)
 * @param {string} params.topic - Topic name
 * @param {Array<string>} params.titles - Array of resource titles (should be 3)
 * @param {boolean} params.isWeakConcept - Whether these are for weak concepts
 * @returns {Array<Object>} Array of { label, title, url, reasonCode }
 */
export function buildResourceLinks({
  subject,
  topic,
  titles = [],
  isWeakConcept = false
}) {
  if (!Array.isArray(titles) || titles.length === 0) {
    titles = generateFallbackTitles(topic);
  }

  // Sanitize all titles
  const sanitized = titles.map(t => sanitizeTitle(t)).filter(t => t.length > 0);

  // If we don't have 3, generate fallbacks
  while (sanitized.length < 3) {
    sanitized.push(generateFallbackTitles(topic)[sanitized.length]);
  }

  // Take exactly 3
  const finalTitles = sanitized.slice(0, 3);

  const reasonCode = isWeakConcept ? 'weak_concept' : 'topic_support';
  const resources = [];

  // For each title, create links on YouTube, GFG, and Python docs (if Python-ML)
  finalTitles.forEach(title => {
    // YouTube
    resources.push({
      label: 'YouTube',
      title,
      url: `https://www.youtube.com/results?search_query=${encodeForUrl(title)}`,
      reasonCode
    });

    // GeeksforGeeks
    resources.push({
      label: 'GeeksforGeeks',
      title,
      url: `https://www.geeksforgeeks.org/?s=${encodeForUrl(title)}`,
      reasonCode
    });

    // Python Docs (for Python-ML only)
    if (subject === 'python-ml') {
      resources.push({
        label: 'Python Docs',
        title,
        url: `https://docs.python.org/3/search.html?q=${encodeForUrl(title)}`,
        reasonCode
      });
    }
  });

  return resources;
}

/**
 * Generates deterministic fallback titles based on topic
 * @param {string} topic - Topic name
 * @returns {Array<string>} Array of 3 fallback titles
 */
export function generateFallbackTitles(topic) {
  const base = topic || 'Programming';
  return [
    `${base} basics`,
    `${base} common patterns`,
    `${base} practice problems`
  ];
}

/**
 * Safely parses Gemini JSON response for resource titles
 * @param {string} jsonString - Raw JSON response from Gemini
 * @returns {Array<string>} Array of titles, or empty array if parse fails
 */
export function parseGeminiResourceResponse(jsonString) {
  if (typeof jsonString !== 'string') return [];

  try {
    // Try to extract JSON object from potential markdown code blocks
    let clean = jsonString;
    if (clean.includes('```json')) {
      clean = clean.split('```json')[1]?.split('```')[0] || clean;
    } else if (clean.includes('```')) {
      clean = clean.split('```')[1]?.split('```')[0] || clean;
    }

    const parsed = JSON.parse(clean.trim());

    // Extract resourceTitles array
    const titles = parsed.resourceTitles || parsed.titles || [];

    if (!Array.isArray(titles)) return [];

    // Validate each is a string
    return titles.filter(t => typeof t === 'string');
  } catch (error) {
    console.error('Failed to parse Gemini resource response:', error.message);
    return [];
  }
}
