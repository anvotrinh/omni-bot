import React, { useEffect, useState } from 'react';
import { getRandomInteger } from '../utils/number';

const ImageSequence = ({
  images,
  defaultFrameTime = 50,
  customFrameTimes = {},
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const customTime = customFrameTimes[frameIndex];
    let frameTime;
    if (Array.isArray(customTime) && customTime.length === 2) {
      const [minTime, maxTime] = customTime;
      frameTime = getRandomInteger(minTime, maxTime);
    } else if (typeof customTime === 'number') {
      frameTime = customTime;
    } else {
      frameTime = defaultFrameTime;
    }
    // no loop
    if (frameTime === 0) return;

    // loop
    let nextFrameIndex = frameIndex + 1;
    if (nextFrameIndex >= images.length) {
      nextFrameIndex = 0;
    }
    setTimeout(() => {
      setFrameIndex(nextFrameIndex);
    }, frameTime);
  }, [frameIndex, images.length, defaultFrameTime, customFrameTimes]);

  if (images.length === 0) return null;
  return <img src={images[frameIndex]} alt='sequence' />;
};

export default ImageSequence;
