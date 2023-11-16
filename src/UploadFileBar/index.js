import React, { useContext, useRef } from 'react';
import { useEffect } from 'react';
import { AppContext } from '../App';
import './index.scss';
import UploadFileItem from './Item';
import { useSlateStatic } from 'slate-react';
import { focusBlurredSelection } from '../Input/utils';
import { isSameObjectAttrs } from '../utils/object';

const UploadFileBar = () => {
  const { curPlatformAlias, uploadFiles, setUploadFiles } =
    useContext(AppContext);
  const editor = useSlateStatic();
  const base64Map = useRef({});

  useEffect(() => {
    window.onChangeUploadFile = (data) => {
      if (curPlatformAlias !== data.id) return;
      const updatedFiles = data.items.map((item) => {
        const { imgSrc, base64Image, ...itemData } = item;
        if (base64Image) {
          base64Map.current[imgSrc] = base64Image;
        }
        const itemImgSrc = base64Map.current[imgSrc] || imgSrc;
        return {
          ...itemData,
          imgSrc: itemImgSrc,
        };
      });
      setUploadFiles((prevUpdatedFiles) => {
        let isChanged = false;
        if (updatedFiles.length > prevUpdatedFiles.length) {
          isChanged = true;
        } else if (updatedFiles.length === prevUpdatedFiles.length) {
          isChanged = updatedFiles.some((file, i) => {
            return !isSameObjectAttrs(file, prevUpdatedFiles[i]);
          });
        }
        if (isChanged) {
          window.ipc.send('q1-appFocusBack');
        }
        return updatedFiles;
      });
    };
  }, [curPlatformAlias, setUploadFiles]);

  const handleItemDelete = (index) => {
    window.ipc.send('q1App-deleteUploadFile', {
      id: curPlatformAlias,
      fileIndex: index,
    });
  };

  const handleMouseUp = () => {
    focusBlurredSelection(editor);
  };

  const style = {
    display: uploadFiles.length === 0 ? 'none' : 'flex',
  };
  return (
    <div className='uploadFileBar' style={style} onMouseUp={handleMouseUp}>
      {uploadFiles.map((item, i) => (
        <UploadFileItem
          key={i}
          index={i}
          onDelete={handleItemDelete}
          {...item}
        />
      ))}
    </div>
  );
};

export default UploadFileBar;
