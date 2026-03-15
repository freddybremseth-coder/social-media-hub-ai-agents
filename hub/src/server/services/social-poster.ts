/**
 * Unified Social Media Posting Service.
 * Routes content to the correct platform client and handles platform-specific formatting.
 */

import {
  postToFacebook,
  postToInstagram,
  isConfigured as fbConfigured,
} from '@/server/services/integrations/facebook-client';
import {
  postToLinkedIn,
  isConfigured as linkedinConfigured,
} from '@/server/services/integrations/linkedin-client';
import { DEFAULT_BRANDS, type BrandConfig } from '@/lib/config/brands';

export interface PostRequest {
  brandId: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  content: string;
  hashtags?: string[];
  imageUrl?: string;
  link?: string;
}

export interface PostResult {
  success: boolean;
  platform: string;
  brandId: string;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Get the optimal platforms for daily rotation.
 * Day 0 = Instagram, Day 1 = Facebook, Day 2 = LinkedIn
 */
export function getTodaysPlatform(): 'instagram' | 'facebook' | 'linkedin' {
  // Use epoch day count for consistent rotation
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const platforms: Array<'instagram' | 'facebook' | 'linkedin'> = [
    'instagram',
    'facebook',
    'linkedin',
  ];
  return platforms[daysSinceEpoch % 3];
}

/**
 * Format content for a specific platform.
 * Adjusts length, hashtag placement, and formatting.
 */
function formatForPlatform(
  content: string,
  platform: string,
  hashtags?: string[]
): string {
  const hashtagStr = hashtags?.length ? '\n\n' + hashtags.join(' ') : '';

  switch (platform) {
    case 'instagram':
      // Instagram: up to 2200 chars, hashtags at the end
      return (content + hashtagStr).slice(0, 2200);

    case 'facebook':
      // Facebook: very generous limit, include hashtags inline
      return content + hashtagStr;

    case 'linkedin':
      // LinkedIn: up to 3000 chars, professional tone, fewer hashtags
      const linkedinHashtags = hashtags?.slice(0, 5).join(' ') || '';
      return (content + (linkedinHashtags ? '\n\n' + linkedinHashtags : '')).slice(0, 3000);

    default:
      return content;
  }
}

/**
 * Post content to a specific platform.
 */
export async function postContent(request: PostRequest): Promise<PostResult> {
  const { brandId, platform, content, hashtags, imageUrl, link } = request;

  const formattedContent = formatForPlatform(content, platform, hashtags);

  try {
    switch (platform) {
      case 'facebook': {
        const fbStatus = fbConfigured();
        if (!fbStatus.facebook) {
          return {
            success: false,
            platform,
            brandId,
            error: 'Facebook not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID.',
          };
        }
        const result = await postToFacebook(formattedContent, { imageUrl, link });
        return {
          success: true,
          platform,
          brandId,
          postId: result.id,
          postUrl: result.postUrl,
        };
      }

      case 'instagram': {
        const igStatus = fbConfigured();
        if (!igStatus.instagram) {
          return {
            success: false,
            platform,
            brandId,
            error: 'Instagram not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID.',
          };
        }
        if (!imageUrl) {
          return {
            success: false,
            platform,
            brandId,
            error: 'Instagram requires an image. Provide an imageUrl.',
          };
        }
        const result = await postToInstagram(formattedContent, imageUrl);
        return {
          success: true,
          platform,
          brandId,
          postId: result.id,
          postUrl: result.postUrl,
        };
      }

      case 'linkedin': {
        if (!linkedinConfigured()) {
          return {
            success: false,
            platform,
            brandId,
            error: 'LinkedIn not configured. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN.',
          };
        }
        const result = await postToLinkedIn(formattedContent, {
          articleUrl: link,
          articleTitle: `Content from ${brandId}`,
        });
        return {
          success: true,
          platform,
          brandId,
          postId: result.id,
          postUrl: result.postUrl,
        };
      }

      default:
        return {
          success: false,
          platform,
          brandId,
          error: `Unsupported platform: ${platform}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      platform,
      brandId,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Post content for all brands on a given platform.
 * Used by the scheduled auto-posting task.
 */
export async function postForAllBrands(
  platform: 'instagram' | 'facebook' | 'linkedin',
  contentGenerator: (brand: BrandConfig, platform: string) => Promise<{
    content: string;
    hashtags: string[];
    imageUrl?: string;
  }>
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const brand of DEFAULT_BRANDS) {
    try {
      console.log(`[SocialPoster] Generating content for ${brand.shortName} on ${platform}...`);
      const generated = await contentGenerator(brand, platform);

      console.log(`[SocialPoster] Posting for ${brand.shortName} on ${platform}...`);
      const result = await postContent({
        brandId: brand.id,
        platform,
        content: generated.content,
        hashtags: generated.hashtags,
        imageUrl: generated.imageUrl,
        link: brand.websites[0] ? `https://${brand.websites[0]}` : undefined,
      });

      results.push(result);
      console.log(
        `[SocialPoster] ${brand.shortName} → ${platform}: ${result.success ? 'OK' : result.error}`
      );
    } catch (error) {
      results.push({
        success: false,
        platform,
        brandId: brand.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Small delay between posts to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}
