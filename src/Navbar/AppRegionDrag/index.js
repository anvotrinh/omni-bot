import React from 'react';
import cx from 'classnames';
import './index.scss';

const AppRegionDrag = ({ width }) => {
  const style = {};
  if (width === 'full') {
    style.flex = 1;
  } else {
    style.width = `${width}px`;
  }
  return (
    <div
      className={cx({ appRegionDrag: true, full: width === 'full' })}
      style={style}
    />
  );
};

export default AppRegionDrag;
