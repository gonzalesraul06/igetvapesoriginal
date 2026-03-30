const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

function stripMarkup(value: string) {
  return collapseWhitespace(decodeEntities(value).replace(/<[^>]*>/g, ' '));
}

export function truncateAtWord(value: string, maxLength: number) {
  const clean = stripMarkup(value);

  if (clean.length <= maxLength) {
    return clean;
  }

  const sliced = clean.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const cutIndex = lastSpace > Math.floor(maxLength * 0.6) ? lastSpace : maxLength;

  return `${clean.slice(0, cutIndex).trim().replace(/[.,;:!?-]+$/, '')}...`;
}

export function buildMetaTitle(
  title: string,
  options?: {
    maxLength?: number;
    suffix?: string;
  },
) {
  const maxLength = options?.maxLength ?? TITLE_MAX_LENGTH;
  const suffix = options?.suffix ?? ' | IGET Vapes';
  const clean = collapseWhitespace(stripMarkup(title))
    .replace(/\s*[|:-]\s*IGET Vapes Australia$/i, '')
    .replace(/\s*[|:-]\s*IGET Vapes Original$/i, '')
    .replace(/\s*[|:-]\s*IGET Vapes$/i, '')
    .trim();

  const mentionsBrand = /iget|alibarbar/i.test(clean);
  const candidates = new Set<string>();

  if (clean) {
    if (mentionsBrand) {
      candidates.add(clean);
    } else {
      candidates.add(`${clean}${suffix}`);
      candidates.add(clean);
    }
  }

  for (const separator of [' | ', ' — ', ' - ', ': ']) {
    if (!clean.includes(separator)) continue;
    const segment = clean.split(separator)[0]?.trim();
    if (!segment) continue;
    if (mentionsBrand) {
      candidates.add(segment);
    } else {
      candidates.add(`${segment}${suffix}`);
      candidates.add(segment);
    }
  }

  const simplified = clean
    .replace(/\b(Buy Online Australia|Australia[- ]Wide Delivery|Complete Buying Guide|All Flavours|All 33 Flavours|All 26 Flavours|All 23 Flavours|All 18 Flavours|All 15 Flavours|All 7 Flavours)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+[|—-]\s*$/, '')
    .trim();

  if (simplified) {
    if (/iget|alibarbar/i.test(simplified)) {
      candidates.add(simplified);
    } else {
      candidates.add(`${simplified}${suffix}`);
      candidates.add(simplified);
    }
  }

  for (const candidate of candidates) {
    if (candidate.length <= maxLength) {
      return candidate;
    }
  }

  return truncateAtWord(Array.from(candidates)[0] ?? clean, maxLength);
}

export function buildMetaDescription(description: string, maxLength = DESCRIPTION_MAX_LENGTH) {
  return truncateAtWord(description, maxLength);
}