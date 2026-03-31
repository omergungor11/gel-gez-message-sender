import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config/index.js';
import type { Trend } from '../db/schema.js';

let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: config.GOOGLE_PROJECT_ID,
      location: config.GOOGLE_LOCATION,
    });
  }
  return vertexAI;
}

export async function generateCaptionWithGemini(
  trend: Trend,
  platform: 'instagram' | 'facebook'
): Promise<{ caption: string; hashtags: string }> {
  if (!config.GOOGLE_PROJECT_ID) {
    console.log('[Gemini] Google Project ID ayarlanmamış, fallback caption kullanılıyor');
    return fallbackCaption(trend, platform);
  }

  try {
    const ai = getVertexAI();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Sen bir profesyonel gayrimenkul ve ilan pazarlamacısısın. KKTC'deki gelgezgor.com platformunda trend olan bir ilan için ${platform === 'instagram' ? 'Instagram' : 'Facebook'} paylaşım metni yaz.

İlan Bilgileri:
- Başlık: ${trend.baslik}
- Fiyat: ${trend.fiyat || 'Belirtilmemiş'}
- Konum: ${trend.konum || 'KKTC'}
- Açıklama: ${trend.aciklama || 'Yok'}

Kurallar:
- Türkçe yaz
- ${platform === 'instagram' ? 'Kısa ve çarpıcı ol, emoji kullan, 150 kelimeyi geçme' : 'Detaylı ama okunabilir ol, 200 kelimeyi geçme'}
- İlanın trendde olduğunu vurgula
- Çağrı eylemi (CTA) ekle
- gelgezgor.com markasını doğal şekilde dahil et
- JSON formatında dön: {"caption": "...", "hashtags": "..."}

Sadece JSON döndür, başka metin ekleme.`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || '',
      };
    }

    return fallbackCaption(trend, platform);
  } catch (error: any) {
    console.error('[Gemini] Caption üretim hatası:', error.message);
    return fallbackCaption(trend, platform);
  }
}

export async function generateImagenPrompt(trend: Trend): Promise<string> {
  if (!config.GOOGLE_PROJECT_ID) {
    return fallbackImagePrompt(trend);
  }

  try {
    const ai = getVertexAI();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Sen bir profesyonel gayrimenkul fotoğrafçısısın. Google Imagen 3 için optimize edilmiş bir görsel üretim promptu yaz.

İlan: ${trend.baslik}
Konum: ${trend.konum || 'Kuzey Kıbrıs'}
Kategori: ${detectCategory(trend.baslik)}

Stil: Minimalist, altın saat ışığı, lüks, Kıbrıs modern mimarisi, profesyonel emlak fotoğrafçılığı.

Sadece İngilizce prompt döndür, 1-2 cümle. Başka metin ekleme.`;

    const result = await model.generateContent(prompt);
    return result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || fallbackImagePrompt(trend);
  } catch (error: any) {
    console.error('[Gemini] Imagen prompt hatası:', error.message);
    return fallbackImagePrompt(trend);
  }
}

export async function generateImageWithImagen(prompt: string, aspectRatio: '1:1' | '3:1' | '16:9' = '1:1'): Promise<Buffer | null> {
  if (!config.GOOGLE_PROJECT_ID) {
    console.log('[Imagen] Google Project ID ayarlanmamış, AI görsel üretilemiyor');
    return null;
  }

  try {
    // Use Vertex AI Imagen 3 endpoint
    const { PredictionServiceClient } = await import('@google-cloud/aiplatform');
    const client = new PredictionServiceClient({
      apiEndpoint: `${config.GOOGLE_LOCATION}-aiplatform.googleapis.com`,
    });

    const endpoint = `projects/${config.GOOGLE_PROJECT_ID}/locations/${config.GOOGLE_LOCATION}/publishers/google/models/imagen-3.0-generate-001`;

    const [response] = await client.predict({
      endpoint,
      instances: [{ prompt }] as any,
      parameters: {
        structValue: {
          fields: {
            sampleCount: { numberValue: 1 },
            aspectRatio: { stringValue: aspectRatio },
            safetyFilterLevel: { stringValue: 'block_few' },
          },
        },
      } as any,
    });

    const predictions = response.predictions as any[];
    if (predictions?.[0]?.structValue?.fields?.bytesBase64Encoded?.stringValue) {
      const base64 = predictions[0].structValue.fields.bytesBase64Encoded.stringValue;
      return Buffer.from(base64, 'base64');
    }

    return null;
  } catch (error: any) {
    console.error('[Imagen] Görsel üretim hatası:', error.message);
    return null;
  }
}

function detectCategory(title: string): string {
  if (/villa|daire|ev|arsa|residence|penthouse|satılık|kiralık/i.test(title)) return 'Emlak';
  if (/araba|araç|mercedes|bmw|vasıta/i.test(title)) return 'Vasıta';
  if (/telefon|laptop|bilgisayar|elektronik/i.test(title)) return 'Elektronik';
  return 'Genel';
}

function fallbackCaption(trend: Trend, platform: string): { caption: string; hashtags: string } {
  const konum = trend.konum || 'KKTC';
  const fiyat = trend.fiyat ? `\n💰 ${trend.fiyat}` : '';

  return {
    caption: `🔥 Bugünün Trend İlanı!\n\n${trend.baslik}${fiyat}\n📍 ${konum}\n\n👉 Detaylar gelgezgor.com'da!\n\n${platform === 'instagram' ? 'Bio\'daki linkten ulaşın!' : trend.url}`,
    hashtags: '#GelGezGor #KKTC #KuzeyKıbrıs #Trendİlanlar #Emlak',
  };
}

function fallbackImagePrompt(trend: Trend): string {
  const category = detectCategory(trend.baslik);
  if (category === 'Emlak') {
    return 'Luxury Mediterranean villa with infinity pool, golden hour sunset, Cyprus coastline, professional architectural photography, warm tones, 8k resolution';
  }
  return 'Professional product photography, minimalist background, warm studio lighting, high-end commercial style, 8k resolution';
}
