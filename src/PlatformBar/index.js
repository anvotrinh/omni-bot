import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { UpArrowSvg, DownArrowSvg } from '../SVG';
import SortableItem from './SortableItem';
import { AppContext } from '../App';
import { useSlate } from 'slate-react';
import {
  focusBlurredSelection,
  getInputString,
  isSelectionCollapsed,
  removeAllPlatformTag,
  selectionAll,
} from '../Input/utils';
import IconButton from '../Component/IconButton';
import {
  changeWebviewImgPlaceholderHeight,
  getBaseTopMenuBarHeight,
  getTopMenuBarHeight,
} from '../utils/dom';
import './index.scss';
import { isAboveFirstRowPlatform } from './utils';

export const ICON_VERTICAL_MARGIN = 4;
const AUTO_COLLAPSE_TIME = 4000;

export function emitLayoutResize(height) {
  const appContainerDOM = window.document.getElementById('app-container');
  const q1LayoutSize = {
    width: appContainerDOM.clientWidth,
    height: Math.ceil(height || appContainerDOM.clientHeight),
    topMenuBarHeight: getTopMenuBarHeight(),
    baseTopMenuBarHeight: getBaseTopMenuBarHeight(),
  };
  window?.searchbar?.events?.emit('q1-layoutResize', q1LayoutSize);
  window.ipc.send('q1App-resizeAutosuggestView', q1LayoutSize);

  changeWebviewImgPlaceholderHeight(q1LayoutSize);
}

const PlatformBar = () => {
  const {
    tabList,
    inputValue,
    setTabList,
    currentPlatformIconHover,
    isAppJustShown,
    isUpdateNotificationShown,
    curPlatformAlias,
    uploadFiles,
    activeOperations,
    hidePage,
    setCurPlatformAlias,
    setCurrentPlatformIconHover,
    setIsAppJustShown,
  } = useContext(AppContext);
  const editor = useSlate();
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isIconVisible, setIsIconVisible] = useState(false);
  const [totalItemOfFirstRow, setTotalItemOfFirstRow] = useState(10);
  const lastClickInfo = useRef({
    time: 0,
    alias: '',
  });
  const listDOM = useRef(null);
  const platformBarDOM = useRef(null);
  const fullPlatformBarHeight = useRef(0);
  const requestAnimationRef = useRef(null);
  const isAddedFakeSelection = useRef(false);
  const platformHoverOutTimeout = useRef();
  const isDragging = useRef(false);
  const autoCollapseTimeoutId = useRef();

  useEffect(() => {
    emitLayoutResize();
  }, [
    inputValue,
    tabList.length,
    uploadFiles.length,
    activeOperations.length,
    isUpdateNotificationShown,
    curPlatformAlias,
  ]);

  const handleItemClick = useCallback(
    (item) => {
      setCurPlatformAlias(item.alias, 'platformBar');
      window.searchbar?.events?.emit('q1-changeTab', {
        alias: item.alias,
      });

      focusBlurredSelection(editor, 50, () => {
        removeAllPlatformTag(editor);
        selectionAll(editor);
      });

      hidePage(); // hide page if it open
    },
    [editor, hidePage, setCurPlatformAlias],
  );

  useEffect(() => {
    window.switchToPreviousPlatform = () => {
      const curItemIndex = tabList.findIndex(
        (item) => item.alias === curPlatformAlias,
      );
      let prevItemIndex = curItemIndex - 1;
      if (prevItemIndex < 0) {
        prevItemIndex = tabList.length - 1;
      }
      handleItemClick(tabList[prevItemIndex]);
    };

    window.switchToNextPlatform = () => {
      const curItemIndex = tabList.findIndex(
        (item) => item.alias === curPlatformAlias,
      );
      let nextItemIndex = curItemIndex + 1;
      if (nextItemIndex >= tabList.length) {
        nextItemIndex = 0;
      }
      handleItemClick(tabList[nextItemIndex]);
    };

    window.switchToPlatformByNumber = (numberStr) => {
      let number = parseInt(numberStr);
      if (number === 0) {
        number = 10;
      }
      // to index
      number -= 1;
      if (tabList.length <= number) return;
      handleItemClick(tabList[number]);
    };
  }, [curPlatformAlias, handleItemClick, tabList]);

  const animatePlatformBarHeight = () => {
    const currentHeight = platformBarDOM.current.offsetHeight;
    if (currentHeight === fullPlatformBarHeight.current) {
      setIsIconVisible(isExpanded);
      return;
    }

    const delta = 5;
    let nextHeight = currentHeight;
    if (isExpanded) {
      // expand
      nextHeight += delta;
      if (nextHeight >= fullPlatformBarHeight.current) {
        nextHeight = fullPlatformBarHeight.current;
      }
    } else {
      // close
      nextHeight -= delta;
      if (nextHeight <= fullPlatformBarHeight.current) {
        nextHeight = fullPlatformBarHeight.current;
      }
    }

    platformBarDOM.current.style.height = nextHeight + 'px';
    emitLayoutResize();
    requestAnimationRef.current = requestAnimationFrame(
      animatePlatformBarHeight,
    );
  };

  useEffect(() => {
    if (!listDOM.current) return;
    const iconWrapperDOMs = listDOM.current.querySelectorAll('.tabDivWrapper');
    if (iconWrapperDOMs.length === 0) return;
    let totalItem = 0;
    const firstLineY = iconWrapperDOMs[0].getBoundingClientRect().y;
    iconWrapperDOMs.forEach((dom) => {
      const { y } = dom.getBoundingClientRect();
      if (firstLineY === y) {
        totalItem++;
      }
    });
    setTotalItemOfFirstRow(totalItem);
  }, [tabList.length]);

  useEffect(() => {
    autoCollapseTimeoutId.current &&
      clearTimeout(autoCollapseTimeoutId.current);

    if (!listDOM.current) return;
    const iconWrapperDOM = listDOM.current.querySelector('.tabDivWrapper');
    if (!iconWrapperDOM) return;
    const rowHeight = iconWrapperDOM.clientHeight + 2 * ICON_VERTICAL_MARGIN;
    if (isExpanded) {
      // calculate next height of platform bar
      const listHeight = listDOM.current.clientHeight;
      fullPlatformBarHeight.current = listHeight;
      setIsIconVisible(true);
      // auto-collapse after time
      if (AUTO_COLLAPSE_TIME > 0) {
        autoCollapseTimeoutId.current = setTimeout(() => {
          setIsExpanded(false);
        }, AUTO_COLLAPSE_TIME);
      }
    } else {
      fullPlatformBarHeight.current = rowHeight;
    }

    cancelAnimationFrame(requestAnimationRef.current);
    requestAnimationRef.current = requestAnimationFrame(
      animatePlatformBarHeight,
    );
    // eslint-disable-next-line
  }, [isExpanded]);

  const checkDoubleClick = (alias) => {
    const currentTime = new Date().getTime();
    // double click case
    if (
      lastClickInfo.current.alias === alias &&
      currentTime - lastClickInfo.current.time < 500
    ) {
      lastClickInfo.current = {
        time: 0,
        alias: '',
      };
      window.searchbar?.events?.emit('q1-tabReturnHome', { alias });
      // focus back composebox
      focusBlurredSelection(editor, 50);

      hidePage(); // hide page if it open
      return true;
    }
    // store the click
    lastClickInfo.current = {
      time: currentTime,
      alias,
    };
    return false;
  };

  const handleDragEnd = (event) => {
    isDragging.current = false;
    // change cursor
    platformBarDOM.current.style.cursor = 'default';
    // remove fake selection
    setTimeout(() => {
      const fakeDOM = document.getElementById('fakeInputScrollWrapper');
      fakeDOM.style.display = 'none';
    }, 100);

    const { active, over } = event;
    if (!over || !active) return;
    if (active.id !== over.id) {
      setTabList((prevList) => {
        const oldIndex = prevList.findIndex((item) => item.id === active.id);
        const newIndex = prevList.findIndex((item) => item.id === over.id);
        return arrayMove(prevList, oldIndex, newIndex);
      });
      focusBlurredSelection(editor, 50);

      hidePage(); // hide page if it open
    } else {
      // to hide the platform text
      setCurrentPlatformIconHover('');

      const item = tabList.find((obj) => obj.id === active.id);
      const isDoubleClick = checkDoubleClick(item.alias);
      if (isDoubleClick) return;

      handleItemClick(item);

      // reset autoCollapse timer if click > 1st row
      if (
        AUTO_COLLAPSE_TIME > 0 &&
        isAboveFirstRowPlatform(event, listDOM.current)
      ) {
        autoCollapseTimeoutId.current &&
          clearTimeout(autoCollapseTimeoutId.current);
        autoCollapseTimeoutId.current = setTimeout(() => {
          setIsExpanded(false);
        }, AUTO_COLLAPSE_TIME);
      }
    }
  };

  const handleDragMove = () => {
    // change cursor
    platformBarDOM.current.style.cursor = 'grabbing';
  };

  const handleDragStart = () => {
    setCurrentPlatformIconHover('');
    isDragging.current = true;
    // add fake selection
    if (isSelectionCollapsed(editor)) return;
    const fakeDOM = document.getElementById('fakeInputScrollWrapper');
    fakeDOM.style.display = 'block';
  };

  const handleItemMouseEnter = (item) => {
    const curTime = new Date().getTime();
    const isComposeBoxJustTyped = curTime - editor.lastTypedTime <= 100;
    const isJustSubmittedQuery = curTime - editor.lastSubmittedTime <= 400;
    if (
      !isAppJustShown &&
      !isDragging.current &&
      !isComposeBoxJustTyped &&
      !isJustSubmittedQuery
    ) {
      platformHoverOutTimeout.current &&
        clearTimeout(platformHoverOutTimeout.current);
      platformHoverOutTimeout.current = null;
      setCurrentPlatformIconHover(item.name);
    }
  };

  const handleItemMouseLeave = () => {
    platformHoverOutTimeout.current &&
      clearTimeout(platformHoverOutTimeout.current);
    platformHoverOutTimeout.current = setTimeout(() => {
      setCurrentPlatformIconHover('');
    }, 150);
  };

  const handleItemMouseMove = (item) => {
    if (
      currentPlatformIconHover === '' &&
      !isAppJustShown &&
      !isDragging.current
    ) {
      platformHoverOutTimeout.current &&
        clearTimeout(platformHoverOutTimeout.current);
      platformHoverOutTimeout.current = null;

      setCurrentPlatformIconHover(item.name);
    }
    if (isAppJustShown) {
      setIsAppJustShown(false);
    }
  };

  return (
    <div className='platform-bar pl-2' ref={platformBarDOM} id='platformBar'>
      <div className='platform-icons'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onDragStart={handleDragStart}
        >
          <SortableContext items={tabList} strategy={rectSortingStrategy}>
            <div ref={listDOM} className='platform-iconList'>
              {tabList.map((item, i) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  id={item.id}
                  i={i}
                  onMouseEnter={handleItemMouseEnter}
                  onMouseLeave={handleItemMouseLeave}
                  onMouseMove={handleItemMouseMove}
                  isVisible={true}
                  // isVisible={
                  //   isIconVisible || isExpanded ? true : i < totalItemOfFirstRow
                  // }
                />
              ))}
              {tabList.length <= totalItemOfFirstRow && (
                <div className='platform-noOther'>
                  <span>
                    More channels coming soon, including a fully local AI!
                  </span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <div className='platform-actions'>
        <IconButton
          title='Expand'
          onClick={() => {
            setIsExpanded(!isExpanded);
            focusBlurredSelection(editor);
          }}
        >
          {isExpanded ? <DownArrowSvg /> : <UpArrowSvg />}
        </IconButton>
      </div>
    </div>
  );
};

export default PlatformBar;
