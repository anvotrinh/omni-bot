import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useSlateStatic } from 'slate-react';

import imageA1 from '../../Images/submitButton/A1.png';
import imageA2 from '../../Images/submitButton/A2.png';
import imageB1 from '../../Images/submitButton/B1.png';
import imageB2 from '../../Images/submitButton/B2.png';
import imageB3 from '../../Images/submitButton/B3.png';
import imageC1 from '../../Images/submitButton/C1.png';
import imageC2 from '../../Images/submitButton/C2.png';
import imageD1 from '../../Images/submitButton/D1.png';
import imageD2 from '../../Images/submitButton/D2.png';
import ImageSequence from '../../Component/ImageSequence';
import { focusBlurredSelection } from '../utils';
import './index.scss';

const HOVER_OUT_STATE_TIME = 200;
const RELEASE_STATE_TIME = 500;

const stateMap = {
  idle: {
    images: [imageA1, imageA2, imageA1],
    customTimes: { 0: [1500, 2500] },
  },
  hover: {
    images: [imageA1, imageB1, imageB2],
    customTimes: { 2: 0 },
  },
  hoverOut: {
    images: [imageB2, imageB3, imageA1],
    customTimes: { 2: 0 },
  },
  pressing: {
    images: [imageB2, imageB1, imageC1, imageC2],
    customTimes: { 3: 0 },
  },
  released: {
    images: [imageC2, imageC1, imageD1, imageD2, imageD1, imageA1],
    customTimes: { 3: 200, 5: 0 },
  },
  pressingAndReleased: {
    images: [imageC1, imageC2, imageC1, imageD1, imageD2, imageD1, imageA1],
    customTimes: { 4: 200, 6: 0 },
  },
};

const SubmitButton = forwardRef(({ onSubmit }, ref) => {
  useImperativeHandle(ref, () => ({
    playAnimation() {
      if (isPlayAnimation) {
        setIsPlayAnimation(false);
        setTimeout(startPlayAnimation);
      } else {
        startPlayAnimation();
      }
    },
  }));

  const editor = useSlateStatic();
  const [isHover, setIsHover] = useState(false);
  const [isHoverOut, setIsHoverOut] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const [isPlayAnimation, setIsPlayAnimation] = useState(false);
  const [isDisabledHover, setIsDisabledHover] = useState(false);
  const releaseTimeoutId = useRef();
  const hoverOutTimeoutId = useRef();
  const playAnimationTimeoutId = useRef();
  const isMouseDowned = useRef();

  useEffect(() => {
    window.ipc.on('appHide', function () {
      setIsHover((isHover) => {
        if (isHover) {
          setIsDisabledHover(true);
        }
        return isHover;
      });
    });
  }, []);

  const startPlayAnimation = () => {
    setIsPlayAnimation(true);
    isMouseDowned.current = true;

    playAnimationTimeoutId.current &&
      clearTimeout(playAnimationTimeoutId.current);
    playAnimationTimeoutId.current = setTimeout(() => {
      setIsPlayAnimation(false);
      if (!isHover) {
        isMouseDowned.current = false;
      }
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHover(false);
    setIsPressing(false);

    if (isMouseDowned.current || isDisabledHover) {
      setIsDisabledHover(false);
      isMouseDowned.current = false;
      return;
    }
    setIsHoverOut(true);

    hoverOutTimeoutId.current && clearTimeout(hoverOutTimeoutId.current);
    hoverOutTimeoutId.current = setTimeout(() => {
      setIsHoverOut(false);
    }, HOVER_OUT_STATE_TIME);
  };
  const handleMouseEnter = () => {
    setIsHover(true);
  };
  const handleMouseDown = () => {
    // clear play animation
    setIsPlayAnimation(false);
    playAnimationTimeoutId.current &&
      clearTimeout(playAnimationTimeoutId.current);

    setIsPressing(true);
    isMouseDowned.current = true;
    setIsDisabledHover(false);
  };
  const handleMouseUp = () => {
    if (isHover && isPressing) {
      // focus back to composebox
      focusBlurredSelection(editor);

      onSubmit();
      setIsReleased(true);
      releaseTimeoutId.current && clearTimeout(releaseTimeoutId.current);
      releaseTimeoutId.current = setTimeout(() => {
        setIsReleased(false);
      }, RELEASE_STATE_TIME);
    }
    setIsPressing(false);
    setIsDisabledHover(false);
  };

  let state = 'idle';
  if (isPlayAnimation) {
    state = 'pressingAndReleased';
  } else if (isReleased) {
    state = 'released';
  } else if (isPressing && isHover) {
    state = 'pressing';
  } else if (isHover && !isMouseDowned.current && !isDisabledHover) {
    state = 'hover';
  } else if (isHoverOut) {
    state = 'hoverOut';
  }
  const { images, customTimes } = stateMap[state];
  return (
    <button
      className='buttonSubmit'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <ImageSequence
        key={state}
        images={images}
        customFrameTimes={customTimes}
      />
    </button>
  );
});

export default SubmitButton;
