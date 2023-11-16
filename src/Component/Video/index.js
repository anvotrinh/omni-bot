import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ReplayIcon } from '../../SVG';
import './index.scss';

const Video = forwardRef(({ src, className }, ref) => {
  useImperativeHandle(ref, () => ({
    pause() {
      videoRef.current.pause();
    },
    play() {
      videoRef.current.play();
    },
    replay,
  }));
  const videoRef = useRef();
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    videoRef.current.load();
  }, [src]);

  useEffect(() => {
    videoRef.current.addEventListener('ended', () => {
      setShowReplay(true);
    });
  });

  const replay = () => {
    setShowReplay(false);
    videoRef.current.currentTime = 0;
    videoRef.current.play();
  };

  return (
    <div className={`${className} q1Video`}>
      <video ref={videoRef} autoplay='autoplay'>
        <source src={src} />
      </video>
      {showReplay && (
        <div className='q1Video-replayBtn' onClick={replay}>
          <ReplayIcon />
        </div>
      )}
    </div>
  );
});

export default Video;
