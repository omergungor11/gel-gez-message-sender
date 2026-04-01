import { config, isDryRun } from '../../config/index.js';
import { getMetaClient, isMetaConfigured, waitForMediaReady } from './meta-client.js';
import type { MediaContainerResponse, PublishResponse } from './meta-client.js';

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}

/**
 * Publish a single image post to Instagram
 * Flow: Create container → Wait for ready → Publish
 */
export async function publishInstagramPost(
  imageUrl: string,
  caption: string,
): Promise<InstagramPostResult> {
  if (!isMetaConfigured()) {
    return { success: false, error: 'Meta API not configured' };
  }

  if (isDryRun) {
    console.log(`[Instagram DRY-RUN] Post: ${caption.substring(0, 60)}...`);
    console.log(`  Image: ${imageUrl}`);
    return { success: true, postId: 'dry-run-ig-' + Date.now() };
  }

  const client = getMetaClient();
  const igId = config.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = config.META_ACCESS_TOKEN;

  try {
    // Step 1: Create media container
    const { data: container } = await client.post<MediaContainerResponse>(
      `/${igId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: token,
        },
      },
    );

    console.log(`[Instagram] Container created: ${container.id}`);

    // Step 2: Wait for container to be ready
    const ready = await waitForMediaReady(container.id, token);
    if (!ready) {
      return { success: false, error: 'Media container not ready' };
    }

    // Step 3: Publish
    const { data: published } = await client.post<PublishResponse>(
      `/${igId}/media_publish`,
      null,
      {
        params: {
          creation_id: container.id,
          access_token: token,
        },
      },
    );

    console.log(`[Instagram] Published: ${published.id}`);

    // Step 4: Get permalink
    let permalink = '';
    try {
      const { data: media } = await client.get(`/${published.id}`, {
        params: { fields: 'permalink', access_token: token },
      });
      permalink = media.permalink || '';
    } catch {
      // permalink is optional
    }

    return { success: true, postId: published.id, permalink };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`[Instagram] Publish error: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Publish a carousel (multiple images) to Instagram
 * Flow: Create child containers → Create carousel container → Wait → Publish
 */
export async function publishInstagramCarousel(
  imageUrls: string[],
  caption: string,
): Promise<InstagramPostResult> {
  if (!isMetaConfigured()) {
    return { success: false, error: 'Meta API not configured' };
  }

  if (isDryRun) {
    console.log(`[Instagram DRY-RUN] Carousel: ${imageUrls.length} images`);
    console.log(`  Caption: ${caption.substring(0, 60)}...`);
    return { success: true, postId: 'dry-run-carousel-' + Date.now() };
  }

  const client = getMetaClient();
  const igId = config.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = config.META_ACCESS_TOKEN;

  try {
    // Step 1: Create child containers for each image
    const childIds: string[] = [];
    for (const url of imageUrls) {
      const { data } = await client.post<MediaContainerResponse>(
        `/${igId}/media`,
        null,
        {
          params: {
            image_url: url,
            is_carousel_item: true,
            access_token: token,
          },
        },
      );
      childIds.push(data.id);

      // Wait for each child to be ready
      await waitForMediaReady(data.id, token);
    }

    console.log(`[Instagram] ${childIds.length} carousel items created`);

    // Step 2: Create carousel container
    const { data: carousel } = await client.post<MediaContainerResponse>(
      `/${igId}/media`,
      null,
      {
        params: {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: token,
        },
      },
    );

    // Step 3: Wait and publish
    const ready = await waitForMediaReady(carousel.id, token);
    if (!ready) {
      return { success: false, error: 'Carousel container not ready' };
    }

    const { data: published } = await client.post<PublishResponse>(
      `/${igId}/media_publish`,
      null,
      {
        params: {
          creation_id: carousel.id,
          access_token: token,
        },
      },
    );

    console.log(`[Instagram] Carousel published: ${published.id}`);
    return { success: true, postId: published.id };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    console.error(`[Instagram] Carousel error: ${msg}`);
    return { success: false, error: msg };
  }
}
