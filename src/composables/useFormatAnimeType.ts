const TYPE_MAP: Record<string, string> = {
  'TV Сериал': 'ТВ',
  'TV сериал': 'ТВ',
  'Сериал': 'ТВ',
  'Полнометражный фильм': 'Фильм',
  'Короткометражный фильм': 'Короткометр.',
  'OVA': 'OVA',
  'ONA': 'ONA',
  'Спешл': 'Спешл',
  'Special': 'Спешл',
  'Movie': 'Фильм',
  'TV': 'ТВ',
};

export function formatAnimeType(raw?: string | null): string {
  if (!raw) return '';
  return TYPE_MAP[raw] ?? raw;
}
