/**
 * GitHub Issues API client for bug reports.
 * Creates issues via the REST API — requires a fine-grained PAT
 * with Issues:write scoped to the target repo.
 */

let config = null;

async function loadConfig() {
  if (config) return config;
  try {
    const secrets = await import('../secrets.js');
    if (!secrets.GITHUB_TOKEN || secrets.GITHUB_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
      return null;
    }
    config = {
      token: secrets.GITHUB_TOKEN,
      owner: secrets.GITHUB_OWNER,
      repo: secrets.GITHUB_REPO,
    };
    return config;
  } catch {
    return null;
  }
}

/**
 * Create a GitHub issue with the bug report.
 * @param {string} title - Issue title
 * @param {string} body - Markdown body
 * @returns {Promise<{url: string}>} The created issue URL
 * @throws {Error} if API call fails
 */
export async function createIssue(title, body) {
  const cfg = await loadConfig();
  if (!cfg) throw new Error('GitHub token not configured');

  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: ['bug-report'],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub API error ${res.status}: ${err.message || res.statusText}`);
  }

  const issue = await res.json();
  return { url: issue.html_url };
}

/**
 * Upload a screenshot to Imgur for embedding in GitHub issues.
 * @param {string} dataUrl - data:image/... URI
 * @returns {Promise<string|null>} Imgur URL or null on failure
 */
export async function uploadScreenshot(dataUrl) {
  try {
    const secrets = await import('../secrets.js');
    const clientId = secrets.IMGUR_CLIENT_ID;
    if (!clientId || clientId === 'PASTE_YOUR_IMGUR_CLIENT_ID_HERE') return null;

    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');

    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${clientId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, type: 'base64' }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.link || null;
  } catch {
    return null;
  }
}

/**
 * Check if GitHub submission is available (token configured).
 */
export async function isConfigured() {
  return (await loadConfig()) !== null;
}
