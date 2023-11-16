import React from 'react';
import { MiniCrossIcon } from '../SVG';

const UploadFileItem = ({
  index,
  name,
  size,
  type,
  imgSrc,
  isLoading,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className='uploadFileItem uploadFileItem_loading'>
        <div className='iconLoadingIndicator'></div>
      </div>
    );
  }
  let detail = '';
  if (type) {
    if (size) {
      detail = `${type} · ${size}`;
    } else {
      detail = type;
    }
  }
  return (
    <div className='uploadFileItem'>
      {imgSrc && <img src={imgSrc} alt='upload item' />}
      <div className='uploadFileItem-name'>{name}</div>
      <div className='uploadFileItem-detail'>{detail}</div>
      <div className='uploadFileItem-deleteBtn' onClick={() => onDelete(index)}>
        <MiniCrossIcon />
      </div>
    </div>
  );
};

export default UploadFileItem;
