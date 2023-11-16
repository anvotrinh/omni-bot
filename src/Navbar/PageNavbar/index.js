import React from 'react';
import { ArrowLeftIcon } from '../../SVG';
import AppRegionDrag from '../AppRegionDrag';
import './index.scss';
import { useSlateStatic } from 'slate-react';
import { focusBlurredSelection } from '../../Input/utils';

const PageNavbar = ({ back, title, onBack }) => {
  const editor = useSlateStatic();

  const handleDoubleClick = () => {
    window.ipc.send('q1App-toggleMaximize');
    focusBlurredSelection(editor);
  };

  return (
    <div className='pageNavbar' onDoubleClick={handleDoubleClick}>
      <AppRegionDrag width={16} />
      <div className='pageNavbar-btnGroup' onClick={onBack}>
        <div className='btn' title={back} style={{ marginRight: '4px' }}>
          <ArrowLeftIcon />
        </div>
        <span className='pageNavbar-btnText'>{back}</span>
      </div>
      <span className='pageNavbar-title'>{title}</span>
      <AppRegionDrag width='full' />
    </div>
  );
};

export default PageNavbar;
