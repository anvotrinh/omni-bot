import { ClaudeSvg, GoogleSvg, BingSvg } from '../SVG';

const actionIconMap = {
  action1: <ClaudeSvg />,
  action2: <GoogleSvg />,
  action3: <BingSvg />,
};

export function fillIconToActions(actionList) {
  return actionList.map((action) => {
    const icon = actionIconMap[action.id];
    return {
      ...action,
      icon,
    };
  });
}
