import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { loadImage } from '../utils/dom';
import { DefaultCustomUrlIcon } from '../SVG';
import { getUrlChar } from '../utils/text';

const Item = React.forwardRef(
  (
    {
      item,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      withOpacity,
      isDragging,
      style,
      i,
      isVisible,
      ...props
    },
    ref,
  ) => {
    const { curPlatformAlias } = useContext(AppContext);
    const [isLoadingIcon, setIsLoadingIcon] = useState(false);
    const [hasFavicon, setHasFavicon] = useState(true);
    useEffect(() => {
      if (typeof item.icon !== 'string') return;
      setIsLoadingIcon(true);
      loadImage(item.icon)
        .then((src) => {
          if (item.icon !== src) return;
          setIsLoadingIcon(false);
        })
        .catch((src) => {
          if (item.icon !== src) return;
          setIsLoadingIcon(false);
          setHasFavicon(false);
        });
    }, [item.icon]);

    const inlineStyles = {
      display: isVisible ? 'flex' : 'none',
      opacity: withOpacity ? '0.7' : '1',
      ...style,
    };

    let iconChar;
    if (typeof item.icon === 'string') {
      iconChar = getUrlChar(item.icon);
    }
    return (
      <div
        ref={ref}
        className='tabDivWrapper'
        style={inlineStyles}
        onMouseEnter={() => onMouseEnter(item)}
        onMouseLeave={() => onMouseLeave(item)}
        onMouseMove={() => onMouseMove(item)}
        {...props}
      >
        <div
          className={`tabDiv ${
            curPlatformAlias === item.alias ? 'active' : ''
          }`}
          //title={item.name}
        >
          {typeof item.icon === 'string' ? (
            isLoadingIcon ? (
              <DefaultCustomUrlIcon />
            ) : hasFavicon ? (
              <div
                className='tabDivIcon'
                style={{ backgroundImage: `url('${item.icon}')` }}
              />
            ) : (
              <div className='tabDivIcon tabDivChar'>{iconChar}</div>
            )
          ) : (
            item.icon
          )}
        </div>
      </div>
    );
  },
);

export default Item;
