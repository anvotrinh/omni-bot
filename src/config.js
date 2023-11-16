export const CHAT_PLATFORMS = [
  'gp',
  'bi',
  'po',
  'ba',
  'pi',
  'pe',
  'ch',
  'hu',
  'cl',
  'interpreter',
];
export const AUTO_CONTENT_SUGGEST_PLATFORMS = ['go', 'gi', 'mp', 'yt'];

export const UI_CONFIGS = {
  keepShowingSuggestion: {
    'self-PlatformBarClick': true,
    'otherTag-PlatformBarClick': true,
    'rest-PlatformBarClick': true,
    'self-PlatformTagClick': true,
    'otherTag-PlatformTagClick': true,
  },
  shouldCustomURLOpenInOneTab: true,
  loadingTrigger: {
    'loadingPage-start': 'begin-page-load',
    'loadingPage-end': 'did-stop-loading',
    'loadingBottom-start': 'did-start-loading',
    'loadingBottom-end': 'did-stop-loading',
    'loadingBottom-startNavigation': 'did-start-navigation',
    'loadingBottom-endNavigation': 'did-stop-loading',
  },
  operationsEnabled: true,
  maximizeEnabled: true,
  canOperationPageBeBlurred: false,
  promptTemplates: {
    gp: [
      {
        'Google Chrome':
          'Write an essay about [CUSTOM_TOPIC]. Make sure the essay is [CUSTOM_NUMBER] paragraphs long in Google Chrome',
        'Microsoft Word':
          'Write an essay about [CUSTOM_TOPIC]. Make sure the essay is [CUSTOM_NUMBER] paragraphs long in Microsoft Word',
        'Visual Studio Code':
          'Write an essay about [CUSTOM_TOPIC]. Make sure the essay is [CUSTOM_NUMBER] paragraphs long in Visual Studio Code',
        'Other':
          'Write an essay about [CUSTOM_TOPIC]. Make sure the essay is [CUSTOM_NUMBER] paragraphs long',
      },
      {
        'Google Chrome': 'Write a song about [CUSTOM_THEME] in Google Chrome',
        'Microsoft Word': 'Write a song about [CUSTOM_THEME] in Microsoft Word',
        'Visual Studio Code':
          'Write a song about [CUSTOM_THEME] in Visual Studio Code',
        'Other': 'Write a song about [CUSTOM_THEME]',
      },
      {
        Universal: 'Top 10 songs about [CUSTOM_THEME]',
      },
      {
        Universal: 'Write this in a more refined way',
      },
    ],
    cl: [
      {
        'Google Chrome':
          'Write a song about [CUSTOM_THEME] for kids in Google Chrome',
        'Microsoft Word':
          'Write a song about [CUSTOM_THEME] for kids in Microsoft Word',
        'Visual Studio Code':
          'Write a song about [CUSTOM_THEME] for kids in Visual Studio Code',
        'Other': 'Write a song about [CUSTOM_THEME] for kids',
      },
      {
        Universal: 'Top 10 songs for kids about [CUSTOM_THEME]',
      },
    ],
  },
};
