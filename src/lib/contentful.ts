export interface PhotoItem {
  id: string;
  title: string;
  alt: string;
  imageUrl: string;
  width: number;
  height: number;
  tags?: string[];
  description?: string;
  location?: string;
  locationLat?: number;
  locationLon?: number;
  targetLocationLat?: number;
  targetLocationLon?: number;
  rotation?: number;
  focalLength?: string;
  shutterSpeed?: string;
  aperture?: string;
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
  metadata?: {
    tags?: ContentfulLink[];
  };
  fields?: Record<string, unknown>;
}

interface ContentfulResponse {
  items?: ContentfulEntry[];
  includes?: {
    Asset?: ContentfulAsset[];
  };
}

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

function toNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const maybeRichText = value as { nodeType?: unknown; content?: unknown };
    if (typeof maybeRichText.nodeType === 'string' && Array.isArray(maybeRichText.content)) {
      const text = readRichTextText(maybeRichText).trim();
      return text.length > 0 ? text : undefined;
    }
  }
  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toStringValue(item))
      .filter((item): item is string => typeof item === 'string');
    return parts.length > 0 ? parts : undefined;
  }

  const single = toStringValue(value);
  return single ? [single] : undefined;
}

function readMetadataTagIds(entry: ContentfulEntry): string[] | undefined {
  const tagIds = (entry.metadata?.tags ?? [])
    .map((tag) => (typeof tag?.sys?.id === 'string' ? tag.sys.id : null))
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

  return tagIds.length > 0 ? tagIds : undefined;
}

function toLocationCoordinates(value: unknown): { lat: number; lon: number } | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const maybeLocation = value as { lat?: unknown; lon?: unknown };
  if (typeof maybeLocation.lat === 'number' && Number.isFinite(maybeLocation.lat) && typeof maybeLocation.lon === 'number' && Number.isFinite(maybeLocation.lon)) {
    return { lat: maybeLocation.lat, lon: maybeLocation.lon };
  }
  return undefined;
}

function readRichTextText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const richNode = node as { nodeType?: unknown; value?: unknown; content?: unknown };

  if (richNode.nodeType === 'text' && typeof richNode.value === 'string') {
    return richNode.value;
  }

  if (!Array.isArray(richNode.content)) return '';

  const childTexts = richNode.content.map((child) => readRichTextText(child)).filter((part) => part.length > 0);
  const joiner = richNode.nodeType === 'paragraph' ? '' : '\n';
  return childTexts.join(joiner);
}

async function fetchContentfulPhotos(): Promise<PhotoItem[]> {
  const space = import.meta.env.CONTENTFUL_SPACE_ID;
  const environment = import.meta.env.CONTENTFUL_ENV ?? 'master';
  const token = import.meta.env.CONTENTFUL_CDA_TOKEN;
  const locale = import.meta.env.CONTENTFUL_LOCALE ?? 'en-US';
  const contentType = import.meta.env.CONTENTFUL_CONTENT_TYPE;

  if (!space || !token) {
    console.warn('Contentful environment variables missing. Using placeholder images.');
    return [];
  }
  
  console.log('Fetching photos from Contentful...');

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

  console.log(`Successfully fetched ${data.items?.length ?? 0} entries from Contentful`);

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
    const description = toStringValue(descriptionCandidate);
    const locationRaw = firstDefinedValue(fields, locale, ['location', 'place']);
    const location = toStringValue(locationRaw);
    const locationCoordinates = toLocationCoordinates(locationRaw);
    const targetLocationRaw = firstDefinedValue(fields, locale, ['targetLocation']);
    const targetLocationCoordinates = toLocationCoordinates(targetLocationRaw);
    const rotation = toNumericValue(firstDefinedValue(fields, locale, ['rotation', 'rotationAngle']));
    const focalLength = toStringValue(firstDefinedValue(fields, locale, ['focalLength']));
    const shutterSpeed = toStringValue(firstDefinedValue(fields, locale, ['shutterSpeed']));
    const aperture = toStringValue(
      firstDefinedValue(fields, locale, [
        'aperture',
        'aperture2',
        'apperture',
        'aperature',
        'fStop',
        'fstop',
        'f-stop',
        'f_stop',
        'fNumber',
        'fnumber',
        'fNumberValue',
      ]),
    );
    const iso = toStringValue(firstDefinedValue(fields, locale, ['iso', 'ISO']));
    const fieldTags = toStringArray(firstDefinedValue(fields, locale, ['tags', 'tag']));
    const metadataTagIds = readMetadataTagIds(entry);
    const tags = Array.from(new Set([...(fieldTags ?? []), ...(metadataTagIds ?? [])]));

    photos.push({
      id,
      title,
      alt,
      imageUrl: url,
      width,
      height,
      tags: tags.length > 0 ? tags : undefined,
      description,
      location: location ?? (locationCoordinates ? `${locationCoordinates.lat},${locationCoordinates.lon}` : undefined),
      locationLat: locationCoordinates?.lat,
      locationLon: locationCoordinates?.lon,
      targetLocationLat: targetLocationCoordinates?.lat,
      targetLocationLon: targetLocationCoordinates?.lon,
      rotation,
      focalLength,
      shutterSpeed,
      aperture,
      iso,
    });
    console.log(`Parsed photo: "${title}" -> ${url}`);
  }

  console.log(`Parsed ${photos.length} photos from Contentful`);
  return photos;
}

export async function getContentfulPhotos(): Promise<PhotoItem[]> {
  return fetchContentfulPhotos();
}
