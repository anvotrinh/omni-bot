import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { SerializeAddon } from 'xterm-addon-serialize';
import '../../node_modules/xterm/css/xterm.css';

const Terminal = ({ id, show }) => {
  const xTermDOM = useRef();
  const contentDOM = useRef();
  const [contentHTML, setContentHTML] = useState('');

  useEffect(() => {
    const term = new XTerminal({ cols: 80, rows: 30 });
    const serializeAddon = new SerializeAddon();
    term.loadAddon(serializeAddon);
    term.open(xTermDOM.current);

    const handleTerminalChange = () => {
      const html = serializeAddon.serializeAsHTML();
      const updatedHTML = html
        .replace('<html><body><!--StartFragment--><pre>', '')
        .replace('</pre><!--EndFragment--></body></html>', '');
      setContentHTML(updatedHTML);
    };
    window.ipc.on(
      'q1App-receiveTerminalData',
      (event, { id: receivedId, data }) => {
        if (receivedId !== id) return;
        term.write(data);
        // term.write(data, handleTerminalChange);
      },
    );

    window.ipc.send('q1App-terminalCreate', { id });
    return () => {
      window.ipc.send('q1App-terminalRemove', { id });
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // contentDOM.current.scrollBy(0, 10000);
  }, [contentHTML]);

  return (
    <div
      className='terminal'
      data-terminal-id={id}
      style={{ display: show ? 'block' : 'none' }}
    >
      <div ref={xTermDOM} className='terminal-xterm'></div>
      <div
        ref={contentDOM}
        className='terminal-content'
        dangerouslySetInnerHTML={{ __html: contentHTML }}
      ></div>
    </div>
  );
};

export default Terminal;
