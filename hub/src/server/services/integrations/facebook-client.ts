/**
 * Facebook & Instagram posting client.
 * Uses Meta Graph API for both Facebook Page posts and Instagram Business posts.
 *
 * Required environment variables:
 *   FACEBOOK_PAGE_ACCESS_TOKEN - Long-lived Page Access Token
 *   FACEBOOK_PAGE_ID           - Your Facebook Page ID
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID - Instagram Business Account ID
 *
 * Setup guide:
 * 1. Go to https://developers.facebook.com/ → Create an app (Business type)
 * 2. Add "Pages" and "Instagram" products
 * 3. In Graph API Explorer:
 *    - Select your app, select "Get Page Access Token"
 *    - Grant: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish
 * 4. Exchange short-lived token for long-lived:
 *    GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
 * 5. Get Page Access Token:
 *    GET /{USER_ID}/accounts?access_token={LONG_LIVED_USER_TOKEN}
 * 6. Get Instagram Business Account ID:
 *    GET /{PAGE_ID}?fields=instagram_business_account&access_token={PAGE_TOKEN}
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

function getConfig() {
  return {
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
    instagramAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
  };
}

export interface FacebookPostResult {
  id: string;
  postUrl: string;
}

export interface InstagramPostResult {
  id: string;
  postUrl: string;
}

/**
 * Post a text message (with optional link) to a Facebook Page.
 */
export async function postToFacebook(
  message: string,
  options?: { link?: string; imageUrl?: string }
): Promise<FacebookPostResult> {
  const { pageAccessToken, pageId } = getConfig();
  if (!pageAccessToken || !pageId) {
    throw new Error('Facebook not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID.');
  }

  let endpoint = `${GRAPH_API_BASE}/${pageId}/feed`;
  const body: Record<string, string> = {
    message,
    access_token: pageAccessToken,
  };

  // If an image URL is provided, use the photos endpoint instead
  if (options?.imageUrl) {
    endpoint = `${GRAPH_API_BASE}/${pageId}/photos`;
    body.url = options.imageUrl;
  } else if (options?.link) {
    body.link = options.link;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`Facebook post failed: ${error.error?.message || res.status}`);
  }

  const data = await res.json();
  const postId = data.id || data.post_id || '';

  return {
    id: postId,
    postUrl: `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
  };
}

/**
 * Post an image with caption to Instagram Business Account.
 * Instagram requires an image — text-only posts are not supported.
 *
 * Flow (2-step):
 * 1. Create media container with image URL + caption
 * 2. Publish the container
 */
export async function postToInstagram(
  caption: string,
  imageUrl: string
): Promise<InstagramPostResult> {
  const { pageAccessToken, instagramAccountId } = getConfig();
  if (!pageAccessToken || !instagramAccountId) {
    throw new Error('Instagram not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID.');
  }

  // Step 1: Create media container
  const createRes = await fetch(`${GRAPH_API_BASE}/${instagramAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: pageAccessToken,
    }),
  });

  if (!createRes.ok) {
    const error = await createRes.json().catch(() => ({ error: { message: createRes.statusText } }));
    throw new Error(`Instagram media creation failed: ${error.error?.message || createRes.status}`);
  }

  const createData = await createRes.json();
  const containerId = createData.id;

  // Step 2: Publish the container
  const publishRes = await fetch(`${GRAPH_API_BASE}/${instagramAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: pageAccessToken,
    }),
  });

  if (!publishRes.ok) {
    const error = await publishRes.json().catch(() => ({ error: { message: publishRes.statusText } }));
    throw new Error(`Instagram publish failed: ${error.error?.message || publishRes.status}`);
  }

  const publishData = await publishRes.json();
  return {
    id: publishData.id,
    postUrl: `https://www.instagram.com/p/${publishData.id}/`,
  };
}

export function isConfigured(): { facebook: boolean; instagram: boolean } {
  const { pageAccessToken, pageId, instagramAccountId } = getConfig();
  return {
    facebook: !!(pageAccessToken && pageId),
    instagram: !!(pageAccessToken && instagramAccountId),
  };
}
