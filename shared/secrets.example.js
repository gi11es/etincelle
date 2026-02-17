// Copy this file to secrets.js and fill in the values.
// secrets.js is gitignored — it only lives on the server.

// GitHub fine-grained Personal Access Token
// Create at: https://github.com/settings/personal-access-tokens/new
//   - Repository access: select ONLY your etincelle repo
//   - Permissions: Issues (Read & Write), Metadata (Read)
export const GITHUB_TOKEN = 'PASTE_YOUR_TOKEN_HERE';
export const GITHUB_OWNER = 'gi11es';
export const GITHUB_REPO = 'etincelle';

// Imgur Client-ID for anonymous screenshot uploads in bug reports.
// Register at: https://api.imgur.com/oauth2/addclient
//   - Authorization type: "Anonymous usage without user authorization"
export const IMGUR_CLIENT_ID = 'PASTE_YOUR_IMGUR_CLIENT_ID_HERE';
