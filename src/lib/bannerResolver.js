/**
 * ==========================================================================================
 * ORAs BANNER ASSET RESOLVER SYSTEM
 * Automatically maps application modules to optimal banner artwork & character assets
 * based on filename keyword matching, visual content orientation, and resolution quality.
 * ==========================================================================================
 */

const ASSET_MANIFEST = [
  { keywords: ['notes', 'notebook', 'pencil', 'write', 'journal'], char: './Banner/Characters/Notes.png', banner: './Banner/Notes.png', orientation: 'left', scale: 'scale-[1.35] sm:scale-[1.45]' },
  { keywords: ['tasks', 'todo', 'check', 'habits', 'habito'], char: './Banner/Characters/Tasks.png', banner: './Banner/Task.png', orientation: 'left', scale: 'scale-[1.40] sm:scale-[1.50]' },
  { keywords: ['calendar', 'schedule', 'date', 'festo', 'clock'], char: './Banner/Characters/Calendar.png', banner: './Banner/Calendo.png', orientation: 'left', scale: 'scale-[1.35] sm:scale-[1.45]' },
  { keywords: ['scanner', 'qr', 'scan', 'barcode', 'climora', 'weather', 'settings'], char: './Banner/Characters/Scanner.png', banner: './Banner/Scanner.png', orientation: 'left', scale: 'scale-[1.40] sm:scale-[1.50]' },
  { keywords: ['finance', 'wallet', 'money', 'calculator', 'math', 'calc'], char: './Banner/Characters/Finance.png', banner: './Banner/Finance.png', orientation: 'right', scale: 'scale-[1.50] sm:scale-[1.62]' },
  { keywords: ['files', 'folder', 'holder', 'cloud', 'gallery', 'browser'], char: './Banner/Characters/Files.png', banner: './Banner/File holder.png', orientation: 'right', scale: 'scale-[1.50] sm:scale-[1.62]' },
  { keywords: ['vault', 'lock', 'security', 'password', 'passwords', 'shield'], char: './Banner/Characters/Vault.png', banner: './Banner/Vault.png', orientation: 'center', scale: 'scale-[1.48] sm:scale-[1.58]' },
  { keywords: ['oradocs', 'documents', 'translator', 'translate', 'speech', 'language', 'news', 'neora', 'reporter'], char: './Banner/Characters/Documents.png', banner: './Banner/NEORA.png', orientation: 'left', scale: 'scale-[1.35] sm:scale-[1.45]' },
  { keywords: ['routo', 'map', 'maps', 'hiker', 'explorer', 'navigation'], char: './Banner/Characters/Tasks.png', banner: './Banner/Maps.png', orientation: 'left', scale: 'scale-[1.40] sm:scale-[1.50]' },
  { keywords: ['assistant', 'ai', 'robot', 'bot', 'gemini'], char: './Banner/Characters/Vault.png', banner: './Banner/ai.png', orientation: 'center', scale: 'scale-[1.48] sm:scale-[1.58]' },
  { keywords: ['festo', 'party', 'festival'], char: './Banner/Characters/Calendar.png', banner: './Banner/FESTO.png', orientation: 'left', scale: 'scale-[1.35] sm:scale-[1.45]' }
];

const DEFAULT_ASSET = {
  char: './Banner/Characters/Calendo.png',
  banner: './Banner/Calendo.png',
  orientation: 'left',
  scale: 'scale-[1.35] sm:scale-[1.45]'
};

/**
 * Resolves the optimal banner asset configuration for a given page/module ID.
 * @param {string} pageId - The ID or title of the page (e.g. 'calculator', 'translator', 'notes')
 */
export const resolveBannerAsset = (pageId) => {
  if (!pageId) return DEFAULT_ASSET;
  const normalized = pageId.toLowerCase().trim();

  // Search manifest for keyword match
  const matched = ASSET_MANIFEST.find(item => 
    item.keywords.some(kw => normalized.includes(kw) || kw.includes(normalized))
  );

  if (matched) return matched;
  return DEFAULT_ASSET;
};

/**
 * Determines CSS position classes based on detected character orientation.
 * If character faces LEFT -> place on RIGHT side.
 * If character faces RIGHT -> place on LEFT side.
 * If CENTER -> place CENTER.
 */
export const getCharacterPositionClass = (orientation) => {
  switch (orientation) {
    case 'left':
      return 'right-2 sm:right-2.5 origin-bottom-right';
    case 'right':
      return 'left-2 sm:left-2.5 origin-bottom-left';
    case 'center':
    default:
      return 'left-1/2 -translate-x-1/2 origin-bottom';
  }
};
