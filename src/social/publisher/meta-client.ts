import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/index.js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

let client: AxiosInstance | null = null;

export function getMetaClient(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: GRAPH_API_BASE,
      timeout: 30000,
    });
  }
  return client;
}

export function isMetaConfigured(): boolean {
  return !!(config.META_ACCESS_TOKEN && config.INSTAGRAM_BUSINESS_ACCOUNT_ID);
}

export function isFacebookConfigured(): boolean {
  return !!(config.FACEBOOK_PAGE_ACCESS_TOKEN && config.FACEBOOK_PAGE_ID);
}

export interface MediaContainerResponse {
  id: string;
}

export interface PublishResponse {
  id: string;
}

export interface MediaStatusResponse {
  status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  status?: string;
}

export async function waitForMediaReady(containerId: string, token: string, maxAttempts = 10): Promise<boolean> {
  const client = getMetaClient();

  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await client.get<MediaStatusResponse>(`/${containerId}`, {
      params: { fields: 'status_code,status', access_token: token },
    });

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      console.error(`[Meta] Media container ${containerId} failed: ${data.status}`);
      return false;
    }

    // Wait 3 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.error(`[Meta] Media container ${containerId} timed out after ${maxAttempts} attempts`);
  return false;
}
