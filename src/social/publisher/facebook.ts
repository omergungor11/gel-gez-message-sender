import { config, isDryRun } from '../../config/index.js';
import { getMetaClient, isFacebookConfigured } from './meta-client.js';

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Publish a photo post to Facebook Page
 */
export async function publishFacebookPost(
  imageUrl: string,
  message: string,
): Promise<FacebookPostResult> {
  if (!isFacebookConfigured()) {
    return { success: false, error: 'Facebook API not configured' };
  }

  if (isDryRun) {
    console.log(`[Facebook DRY-RUN] Post: ${message.substring(0, 60)}...`);
    console.log(`  Image: ${imageUrl}`);
    return { success: true, postId: 'dry-run-fb-' + Date.now() };
  }

  const client = getMetaClient();
  const pageId = config.FACEBOOK_PAGE_ID;
  const token = config.FACEBOOK_PAGE_ACCESS_TOKEN;

  try {
    // Publish photo directly to Page
    const { data } = await client.post(
      `/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          message,
          access_token: token,
        },
      },
    );

    console.log(`[Facebook] Published: ${data.id || data.post_id}`);
    return { success: true, postId: data.id || data.post_id };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`[Facebook] Publish error: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Publish a multi-photo post to Facebook Page
 */
export async function publishFacebookMultiPhoto(
  imageUrls: string[],
  message: string,
): Promise<FacebookPostResult> {
  if (!isFacebookConfigured()) {
    return { success: false, error: 'Facebook API not configured' };
  }

  if (isDryRun) {
    console.log(`[Facebook DRY-RUN] Multi-photo: ${imageUrls.length} images`);
    return { success: true, postId: 'dry-run-fb-multi-' + Date.now() };
  }

  const client = getMetaClient();
  const pageId = config.FACEBOOK_PAGE_ID;
  const token = config.FACEBOOK_PAGE_ACCESS_TOKEN;

  try {
    // Step 1: Upload each photo as unpublished
    const photoIds: string[] = [];
    for (const url of imageUrls) {
      const { data } = await client.post(
        `/${pageId}/photos`,
        null,
        {
          params: {
            url,
            published: false,
            access_token: token,
          },
        },
      );
      photoIds.push(data.id);
    }

    // Step 2: Create post with attached photos
    const attachedMedia = photoIds.map(id => ({ media_fbid: id }));
    const { data } = await client.post(
      `/${pageId}/feed`,
      {
        message,
        attached_media: attachedMedia,
        access_token: token,
      },
    );

    console.log(`[Facebook] Multi-photo published: ${data.id}`);
    return { success: true, postId: data.id };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`[Facebook] Multi-photo error: ${msg}`);
    return { success: false, error: msg };
  }
}
