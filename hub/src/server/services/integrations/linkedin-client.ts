/**
 * LinkedIn posting client.
 * Uses LinkedIn API v2 for posting text and image content.
 *
 * Required environment variables:
 *   LINKEDIN_ACCESS_TOKEN - OAuth2 Access Token with w_member_social scope
 *   LINKEDIN_PERSON_URN   - Your LinkedIn person URN (e.g., "urn:li:person:XXXX")
 *
 * Setup guide:
 * 1. Go to https://www.linkedin.com/developers/ → Create an app
 * 2. Request access to "Share on LinkedIn" (w_member_social) and "Sign In with LinkedIn using OpenID Connect"
 * 3. In Auth tab, add redirect URL: http://localhost:3000/api/linkedin/callback
 * 4. Generate OAuth2 token:
 *    a. Visit: https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=openid%20profile%20w_member_social
 *    b. Exchange code for access token:
 *       POST https://www.linkedin.com/oauth/v2/accessToken
 *       grant_type=authorization_code&code={CODE}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&redirect_uri={REDIRECT_URI}
 * 5. Get your person URN:
 *    GET https://api.linkedin.com/v2/userinfo (with Bearer token)
 *    → use "sub" field as person URN: urn:li:person:{sub}
 */

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

function getConfig() {
  return {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    personUrn: process.env.LINKEDIN_PERSON_URN || '',
  };
}

function headers() {
  return {
    Authorization: `Bearer ${getConfig().accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': '202401',
  };
}

export interface LinkedInPostResult {
  id: string;
  postUrl: string;
}

/**
 * Post a text message (with optional article/link) to LinkedIn.
 */
export async function postToLinkedIn(
  text: string,
  options?: { articleUrl?: string; articleTitle?: string; imageUrl?: string }
): Promise<LinkedInPostResult> {
  const { accessToken, personUrn } = getConfig();
  if (!accessToken || !personUrn) {
    throw new Error('LinkedIn not configured. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN.');
  }

  // Build the post body
  const postBody: Record<string, any> = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // Add article/link if provided
  if (options?.articleUrl) {
    const shareContent = postBody.specificContent['com.linkedin.ugc.ShareContent'];
    shareContent.shareMediaCategory = 'ARTICLE';
    shareContent.media = [
      {
        status: 'READY',
        originalUrl: options.articleUrl,
        title: { text: options.articleTitle || options.articleUrl },
      },
    ];
  }

  const res = await fetch(`${LINKEDIN_API_BASE}/v2/ugcPosts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LinkedIn post failed: ${res.status} ${errorText}`);
  }

  // LinkedIn returns the post URN in the X-RestLi-Id header or response body
  const postUrn = res.headers.get('X-RestLi-Id') || '';
  const postId = postUrn.replace('urn:li:share:', '').replace('urn:li:ugcPost:', '');

  return {
    id: postUrn,
    postUrl: `https://www.linkedin.com/feed/update/${postUrn}/`,
  };
}

export function isConfigured(): boolean {
  const { accessToken, personUrn } = getConfig();
  return !!(accessToken && personUrn);
}
