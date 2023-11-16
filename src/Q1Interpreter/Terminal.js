import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../../node_modules/github-markdown-css/github-markdown.css';

const START_LIVE_SYNTAX = '++start live++';
const STOP_LIVE_SYNTAX = '++stop live++';
const USER_INPUT_SYNTAX = '>';

const Terminal = ({ id, show }) => {
  const [content, setContent] = useState({
    markdown: '',
    isLive: false,
    liveContent: '',
  });

  useEffect(() => {
    window.ipc.on(
      'q1App-receiveTerminalData',
      (event, { id: receivedId, data }) => {
        if (receivedId !== id) return;
        setContent((content) => {
          if (data.trim() === USER_INPUT_SYNTAX) {
            return content;
          }
          if (data.trim() === START_LIVE_SYNTAX) {
            return { ...content, isLive: true };
          }
          if (data.trim() === STOP_LIVE_SYNTAX) {
            return { ...content, liveContent: '', isLive: false };
          }
          if (content.isLive) {
            return { ...content, liveContent: data };
          }
          return { ...content, markdown: `${content.markdown}\n${data}` };
        });
      },
    );

    window.ipc.send('q1App-terminalCreate', { id });
    return () => {
      window.ipc.send('q1App-terminalRemove', { id });
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const scrollDOM = document.querySelector(`.terminal-markdown-${id}`);
    scrollDOM && scrollDOM.scrollBy(0, 10000);
  }, [id, content]);

  return (
    <div className='terminal' style={{ display: show ? 'block' : 'none' }}>
      <ReactMarkdown
        children={`${content.markdown}\n${content.liveContent}`}
        remarkPlugins={[remarkGfm]}
        className={`markdown-body terminal-content terminal-markdown-${id}`}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, '')}
                style={dark}
                language={match[1]}
                PreTag='div'
              />
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
        }}
      />
    </div>
  );
};

export default Terminal;
