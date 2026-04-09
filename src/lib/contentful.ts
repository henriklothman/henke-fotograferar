export interface PhotoItem {
  id: string;
  title: string;
  alt: string;
  imageUrl: string;
  width: number;
  height: number;
  description?: string;
  focalLength?: string;
  shutterSpeed?: string;
  iso?: string;
}

interface ContentfulLink {
  sys?: {
    type?: string;
    linkType?: string;
    id?: string;
  };
}

interface ContentfulAsset {
  sys?: {
    id?: string;
  };
  fields?: Record<string, unknown>;
}

interface ContentfulEntry {
  sys?: {
    id?: string;
  };
  fields?: Record<string, unknown>;
}

interface ContentfulResponse {
  items?: ContentfulEntry[];
  includes?: {
    Asset?: ContentfulAsset[];
  };
}

let cachedPhotos: Promise<PhotoItem[]> | null = null;
const CONTENTFUL_TIMEOUT_MS = 8000;

function getLocalizedValue(value: unknown, locale: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const localizedRecord = value as Record<string, unknown>;
  if ('sys' in localizedRecord) {
    return value;
  }

  if (locale in localizedRecord) {
    return localizedRecord[locale];
  }

  const keys = Object.keys(localizedRecord);
  const localeKeyPattern = /^[a-z]{2}(?:-[A-Z0-9]{2,4})?$/;
  const looksLocalized = keys.length > 0 && keys.every((key) => localeKeyPattern.test(key));
  if (looksLocalized) {
    const firstValue = Object.values(localizedRecord)[0];
    return firstValue ?? null;
  }

  return value;
}

function firstDefinedValue(fields: Record<string, unknown>, locale: string, keys: string[]): unknown {
  for (const key of keys) {
    if (!(key in fields)) continue;
    const value = getLocalizedValue(fields[key], locale);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

function isAssetLink(value: unknown): value is ContentfulLink {
  if (!value || typeof value !== 'object') return false;
  const sys = (value as ContentfulLink).sys;
  return sys?.type === 'Link' && sys?.linkType === 'Asset' && typeof sys?.id === 'string';
}

function findAssetField(fields: Record<string, unknown>, locale: string): unknown {
  const preferred = firstDefinedValue(fields, locale, [
    'image',
    'photo',
    'asset',
    'coverImage',
    'featuredImage',
    'mainImage',
    'images',
    'photos',
  ]);

  if (preferred) {
    if (Array.isArray(preferred)) return preferred[0];
    return preferred;
  }

  for (const raw of Object.values(fields)) {
    const value = getLocalizedValue(raw, locale);
    if (Array.isArray(value) && value.length > 0 && isAssetLink(value[0])) return value[0];
    if (isAssetLink(value)) return value;
  }

  return null;
}

function normalizeAssetUrl(url: string): string {
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

async function fetchContentfulPhotos(): Promise<PhotoItem[]> {
  const space = import.meta.env.CONTENTFUL_SPACE_ID;
  const environment = import.meta.env.CONTENTFUL_ENV ?? 'master';
  const token = import.meta.env.CONTENTFUL_CDA_TOKEN;
  const locale = import.meta.env.CONTENTFUL_LOCALE ?? 'en-US';
  const contentType = import.meta.env.CONTENTFUL_CONTENT_TYPE;

  if (!space || !token) {
    return [];
  }

  const url = new URL(`https://cdn.contentful.com/spaces/${space}/environments/${environment}/entries`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('include', '2');
  url.searchParams.set('limit', '1000');
  if (contentType) {
    url.searchParams.set('content_type', contentType);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONTENTFUL_TIMEOUT_MS);
  let data: ContentfulResponse;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.error(`Contentful request failed: ${response.status} ${response.statusText}`);
      return [];
    }
    data = (await response.json()) as ContentfulResponse;
  } catch (error) {
    console.error('Contentful request error:', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }

  const assets = data.includes?.Asset ?? [];
  const assetById = new Map<string, ContentfulAsset>(
    assets
      .filter((asset) => typeof asset.sys?.id === 'string')
      .map((asset) => [asset.sys!.id!, asset]),
  );

  const photos: PhotoItem[] = [];

  for (const entry of data.items ?? []) {
    const fields = entry.fields ?? {};
    const imageRef = findAssetField(fields, locale);
    if (!imageRef || !isAssetLink(imageRef)) continue;

    const asset = assetById.get(imageRef.sys!.id!);
    if (!asset?.fields) continue;

    const file = getLocalizedValue(asset.fields.file, locale) as Record<string, unknown> | null;
    const details = (file?.details ?? {}) as Record<string, unknown>;
    const imageDetails = (details.image ?? {}) as Record<string, unknown>;
    const url = typeof file?.url === 'string' ? normalizeAssetUrl(file.url) : null;
    const width = toNumber(imageDetails.width);
    const height = toNumber(imageDetails.height);

    if (!url || !width || !height) continue;

    const idCandidate = firstDefinedValue(fields, locale, ['slug', 'id', 'photoId']);
    const id =
      (typeof idCandidate === 'string' && idCandidate.trim().length > 0 ? idCandidate.trim() : null) ?? entry.sys?.id;
    if (!id) continue;

    const titleCandidate = firstDefinedValue(fields, locale, ['title', 'name', 'headline', 'caption']);
    const title = typeof titleCandidate === 'string' && titleCandidate.trim().length > 0 ? titleCandidate : id;

    const altCandidate = firstDefinedValue(fields, locale, ['alt', 'altText', 'description']);
    const alt = typeof altCandidate === 'string' && altCandidate.trim().length > 0 ? altCandidate : title;

    const descriptionCandidate = firstDefinedValue(fields, locale, ['description', 'body', 'caption']);
    const description =
      typeof descriptionCandidate === 'string' && descriptionCandidate.trim().length > 0
        ? descriptionCandidate
        : undefined;
    const focalLength = toStringValue(firstDefinedValue(fields, locale, ['focalLength']));
    const shutterSpeed = toStringValue(firstDefinedValue(fields, locale, ['shutterSpeed']));
    const iso = toStringValue(firstDefinedValue(fields, locale, ['iso', 'ISO']));

    photos.push({
      id,
      title,
      alt,
      imageUrl: url,
      width,
      height,
      description,
      focalLength,
      shutterSpeed,
      iso,
    });
  }

  return photos;
}

export async function getContentfulPhotos(): Promise<PhotoItem[]> {
  if (!cachedPhotos) {
    cachedPhotos = fetchContentfulPhotos();
  }
  const photos = await cachedPhotos;
  if (photos.length === 0) {
    cachedPhotos = null;
  }
  return photos;
}
