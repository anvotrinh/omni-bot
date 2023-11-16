import React, { useContext, useState } from 'react';
import cx from 'classnames';
import { AppContext } from '../../App';
import { useSlate } from 'slate-react';
import { Transforms } from 'slate';
import { CrossHoverIcon, CrossIcon, GoogleSvg } from '../../SVG';
import { removePlatformTag } from '../utils';
import './index.scss';

const PlatformTag = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { setCurPlatformAlias, curPlatformAlias, tabList } =
    useContext(AppContext);
  const [isDeleteBtnHover, setIsDeleteBtnHover] = useState(false);

  const handleClick = () => {
    setCurPlatformAlias(element.alias, 'platformTag');
    window?.searchbar?.events?.emit('q1-changeTab', {
      alias: element.alias,
    });

    // to make it run before the editor onchange
    setTimeout(() => {
      if (!editor.secondLastSelection) return;
      const scrollDOM = document.getElementById('inputScrollWrapper');
      // to fix the scroll jump to the cursor prev position
      scrollDOM.style.overflowY = 'clip';
      Transforms.select(editor, editor.secondLastSelection);
      setTimeout(() => {
        scrollDOM.style.overflowY = 'auto';
      });
    });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    removePlatformTag(editor, element.alias);
  };

  const tabInfo = tabList.find((p) => p.alias === element.alias);
  const tabIcon = tabInfo?.icon || <GoogleSvg />;
  return (
    <div
      className={cx({
        platformTag: true,
        active: curPlatformAlias === element.alias,
      })}
      {...attributes}
      contentEditable={false}
    >
      <div className='platformTagContentWrapper'>
        <div className='platformTagContent' onClick={handleClick}>
          {tabIcon}
          <div
            className='platformTagDeleteBtn'
            onClick={handleDeleteClick}
            onMouseEnter={() => setIsDeleteBtnHover(true)}
            onMouseLeave={() => setIsDeleteBtnHover(false)}
          >
            {isDeleteBtnHover ? <CrossHoverIcon /> : <CrossIcon />}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default PlatformTag;
