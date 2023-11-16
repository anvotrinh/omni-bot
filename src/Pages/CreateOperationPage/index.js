import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSlateStatic } from 'slate-react';

import { AppContext } from '../../App';
import './index.scss';
import PageNavbar from '../../Navbar/PageNavbar';
import { focusBlurredSelection } from '../../Input/utils';
import DropZone from '../../Component/DropZone';

export const CREATE_OPERATION_PAGE_NAME = 'create operation';
const CreateOperationPage = () => {
  const { currentPage, hidePage } = useContext(AppContext);
  const editor = useSlateStatic();
  const [filePath, setFilePath] = useState('');
  const [name, setName] = useState('');
  const [binaryInfo, setBinaryInfo] = useState('');
  const pageDOM = useRef();

  useEffect(() => {
    window.ipc.on('q1App-resultBinaries', (e, data) => {
      setBinaryInfo(data);
    });
  }, []);

  const handleOnDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.ipc.send('q1App-fullFocusBack');

    const filePaths = [...e.dataTransfer.files]
      .map((file) => file.path)
      .filter((path) => path.endsWith('.py'));

    if (filePaths.length > 0) {
      setFilePath(filePaths[0]);
      window.ipc.send('q1App-findBinaries', {
        filePath: filePaths[0],
      });
    }
  };

  const handleSubmit = () => {
    if (!name || !filePath) {
      return;
    }
    window.ipc.send('q1App-createOperation', {
      name,
      filePath,
      binaryInfo: JSON.parse(binaryInfo),
    });
    handleBack();
    // reset
    setFilePath('');
    setName('');
    setBinaryInfo('');
  };

  const handleBack = () => {
    focusBlurredSelection(editor);

    pageDOM.current.style.animation = 'page-disappear 0.2s';
    setTimeout(() => {
      hidePage();
      pageDOM.current.style.visibility = 'hidden';
    }, 180);
  };

  if (currentPage !== CREATE_OPERATION_PAGE_NAME) return null;
  const pageContent = (
    <div className='page createOperationPage' ref={pageDOM}>
      <div className='createOperationPage-inputWrapper'>
        <input
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>
      <textarea
        value={binaryInfo}
        onChange={(e) => setBinaryInfo(e.target.value)}
      ></textarea>
      <DropZone className='createOperationPage-dropZone' onDrop={handleOnDrop}>
        <div>{filePath}</div>
      </DropZone>
    </div>
  );
  return (
    <>
      <PageNavbar back='Back' title='CREATE OPERATION' onBack={handleBack} />
      {pageContent}
    </>
  );
};

export default CreateOperationPage;
