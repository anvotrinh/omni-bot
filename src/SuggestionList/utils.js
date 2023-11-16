import { OPERATION_CHAR, PLATFORM_CHAR } from '../App';
import { getCurrentAppSearch, getPlatformTagAliasList } from '../Input/utils';
import { CREATE_OPERATION_PAGE_NAME } from '../Pages/CreateOperationPage';
import { UI_CONFIGS } from '../config';

export function getPlatformSuggestions(editor, tabList) {
  const search = getCurrentAppSearch(editor, PLATFORM_CHAR).search || '';
  const tags = getPlatformTagAliasList(editor);
  const lowerCaseSearch = search.toLowerCase();
  const suggestions = tabList.filter(({ name, alias, isPlatform }) => {
    if (!isPlatform) return false;
    if (alias.startsWith('url')) return false;
    if (tags.includes(alias)) return false;

    if (!search) return true;
    if (name.toLowerCase().includes(lowerCaseSearch)) return true;
    if (alias.toLowerCase().includes(lowerCaseSearch)) return true;

    return false;
  });
  if (!search) return suggestions;
  suggestions.sort((s1, s2) => {
    const { name: s1Name, alias: s1Alias } = s1;
    const { name: s2Name, alias: s2Alias } = s2;

    if (s1Name.startsWith(search) && !s2Name.startsWith(search)) return -1;
    if (s2Name.startsWith(search) && !s1Name.startsWith(search)) return 1;

    const s1LowerCaseName = s1Name.toLowerCase();
    const s2LowerCaseName = s2Name.toLowerCase();
    if (
      s1LowerCaseName.startsWith(lowerCaseSearch) &&
      !s2LowerCaseName.startsWith(lowerCaseSearch)
    )
      return -1;
    if (
      s2LowerCaseName.startsWith(lowerCaseSearch) &&
      !s1LowerCaseName.startsWith(lowerCaseSearch)
    )
      return 1;

    const index1 = suggestions.findIndex((t) => t.alias === s1Alias);
    const index2 = suggestions.findIndex((t) => t.alias === s2Alias);
    return index1 - index2;
  });
  return suggestions;
}

export function getOperationSuggestions(
  editor,
  operationList,
  curPlatformAlias,
  curBackgroundApp,
) {
  const search = getCurrentAppSearch(editor, OPERATION_CHAR).search || '';
  const lowerCaseSearch = search.toLowerCase();

  // get prompt templates
  let promptTemplates = [];
  Object.keys(UI_CONFIGS.promptTemplates).forEach((platformAlias) => {
    const platformPromptTemplates = UI_CONFIGS.promptTemplates[platformAlias]
      .filter((temp) => temp[curBackgroundApp] || temp.Universal)
      .map((temp) => ({
        alias: platformAlias,
        name: temp[curBackgroundApp] || temp.Universal,
        isPromptTemplate: true,
      }));
    promptTemplates = promptTemplates.concat(platformPromptTemplates);
  });

  const operationListWithCreate = [
    {
      name: 'Create Operation',
      page: CREATE_OPERATION_PAGE_NAME,
      alias: 'local',
      isOperation: true,
    },
    ...operationList.map((o) => ({ ...o, alias: 'local', isOperation: true })),
    ...promptTemplates,
  ];

  const operations = operationListWithCreate.filter(({ name }) => {
    if (!search) return true;
    if (name.toLowerCase().includes(lowerCaseSearch)) return true;
    return false;
  });
  if (!search) return operations;

  operations.sort((o1, o2) => {
    const { name: o1Name, alias: o1PlatformAlias } = o1;
    const { name: o2Name, alias: o2PlatformAlias } = o2;

    if (
      o1PlatformAlias === curPlatformAlias &&
      o2PlatformAlias !== curPlatformAlias
    )
      return -1;
    if (
      o2PlatformAlias === curPlatformAlias &&
      o1PlatformAlias !== curPlatformAlias
    )
      return 1;

    if (o1Name.startsWith(search) && !o2Name.startsWith(search)) return -1;
    if (o2Name.startsWith(search) && !o1Name.startsWith(search)) return 1;

    const s1LowerCaseName = o1Name.toLowerCase();
    const s2LowerCaseName = o2Name.toLowerCase();
    if (
      s1LowerCaseName.startsWith(lowerCaseSearch) &&
      !s2LowerCaseName.startsWith(lowerCaseSearch)
    )
      return -1;
    if (
      s2LowerCaseName.startsWith(lowerCaseSearch) &&
      !s1LowerCaseName.startsWith(lowerCaseSearch)
    )
      return 1;

    const index1 = operations.findIndex((t) => t.name === o1Name);
    const index2 = operations.findIndex((t) => t.name === o2Name);
    return index1 - index2;
  });
  return operations;
}
