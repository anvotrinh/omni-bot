import { Editor, Transforms, Range, Text, Element, Node, Point } from 'slate';
import { ReactEditor } from 'slate-react';
import { jsx } from 'slate-hyperscript';
import { OPERATION_CHAR, PLATFORM_CHAR } from '../App';
import { UI_CONFIGS } from '../config';

export const isAppChar = (char) => {
  const appChars = [PLATFORM_CHAR];
  if (UI_CONFIGS.operationsEnabled) {
    appChars.push(OPERATION_CHAR);
  }
  return appChars.includes(char);
};

export const withEditor = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const path = entry[1];
    // is editor
    if (path.length === 0) {
      let numberOfParagraph = 0;
      let lastParagraphIndex = -1;
      let lastParagraph;
      editor.children.forEach((child, i) => {
        if (Element.isElement(child) && child.type === 'paragraph') {
          numberOfParagraph++;
          lastParagraphIndex = i;
          lastParagraph = child;
        }
      });

      // merge Paragraph if there is more than 1 Paragraph
      if (numberOfParagraph > 1) {
        const lastStr = Node.string(lastParagraph);
        Transforms.removeNodes(editor, {
          at: [lastParagraphIndex],
        });
        editor.insertText(`\n${lastStr}`);
        return;
      }

      // if is collapse at platform tag
      if (isSelectionCollapsed(editor)) {
        const [platformTagEntry] = Editor.nodes(editor, {
          at: editor.selection,
          match: (n) => Element.isElement(n) && n.type === 'platformTag',
        });
        if (platformTagEntry) {
          Transforms.move(editor);
          return;
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

const isPlatformTag = (node) => {
  return Element.isElement(node) && node.type === 'platformTag';
};

const isNextToPlatformTag = (parent, index) => {
  const nextIndex = index + 1;
  if (nextIndex >= parent.length) return false;
  const nextNode = parent.children[nextIndex];
  return isPlatformTag(nextNode);
};
export const withPlatformTags = (editor) => {
  const { normalizeNode, isInline, isVoid, markableVoid } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // not allow non-@ character between platformTags
    if (Element.isElement(node) && node.type === 'paragraph') {
      for (const [childNode, childPath] of Node.children(editor, path)) {
        if (!Text.isText(childNode)) continue;
        if (
          isNextToPlatformTag(node, childPath[childPath.length - 1]) &&
          childNode.text !== '' &&
          childNode.text !== PLATFORM_CHAR
        ) {
          Transforms.select(editor, {
            anchor: Editor.start(editor, childPath),
            focus: Editor.end(editor, childPath),
          });
          if (!childNode.text.includes(PLATFORM_CHAR)) {
            Transforms.delete(editor);
          } else {
            Transforms.insertText(editor, PLATFORM_CHAR);
          }
          return;
        }
      }
    }

    normalizeNode(entry);
  };

  editor.isInline = (element) => {
    return element.type === 'platformTag' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'platformTag' ? true : isVoid(element);
  };

  editor.markableVoid = (element) => {
    return element.type === 'platformTag' || markableVoid(element);
  };

  return editor;
};

export const getPlatformTagAliasList = (editor) => {
  return Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (n) => Element.isElement(n) && n.type === 'platformTag',
    }),
  ).map((e) => e[0].alias);
};

export const getInputString = (editor) => {
  return Node.string(editor);
};

export const insertPlatformTag = (editor, platform) => {
  const { selection } = editor;
  if (isSelectionExpanded(editor)) return;

  const platformTag = {
    type: 'platformTag',
    alias: platform.alias,
    children: [{ text: '' }],
  };
  const { target } = getCurrentAppSearch(editor, PLATFORM_CHAR);
  // clicked from suggestion list 2nd time
  if (!target) {
    Transforms.insertNodes(editor, platformTag);
    return;
  }

  const currentNode = Editor.node(editor, selection.anchor.path);
  if (!currentNode) return;

  // if @ at the begin of the text, just insert
  if (isAtBeginOfNode(target)) {
    Transforms.select(editor, target);
    Transforms.insertNodes(editor, platformTag);
    return;
  }

  // if @ at the middle of the text, insert left edge and remove all other tags
  Editor.withoutNormalizing(editor, () => {
    Transforms.select(editor, target);
    Transforms.insertNodes(editor, platformTag);
    const [insertedNodeEntry] = Editor.nodes(editor, {
      at: [],
      match: (n) =>
        Element.isElement(n) &&
        n.type === 'platformTag' &&
        n.alias === platform.alias,
    });

    if (!insertedNodeEntry) return;
    // move to the left edge
    Transforms.moveNodes(editor, {
      at: insertedNodeEntry[1],
      to: Editor.start(editor, []).path,
    });
    // remove other tags
    Transforms.removeNodes(editor, {
      at: [],
      match: (n) =>
        Element.isElement(n) &&
        n.type === 'platformTag' &&
        n.alias !== platform.alias,
    });
  });
};

export const removePlatformSearch = (editor) => {
  if (isSelectionExpanded(editor)) return;

  const { target } = getCurrentAppSearch(editor, PLATFORM_CHAR);
  if (!target) return;
  Transforms.select(editor, target);
  Transforms.delete(editor);
};

export const removeOperationSearch = (editor) => {
  if (isSelectionExpanded(editor)) return;

  const { target } = getCurrentAppSearch(editor, OPERATION_CHAR);
  if (!target) return;
  Transforms.select(editor, target);
  Transforms.delete(editor);
};

export const getCurrentAppSearch = (editor, char) => {
  const { selection } = editor;
  if (isSelectionExpanded(editor)) {
    return { target: null };
  }

  const nodeEntry = getSelectionLowestText(editor);
  if (!nodeEntry) return { target: null };

  // find CHAR offset
  const [start] = Range.edges(selection);
  // if cursor at the start of the line, return
  if (start.offset === 0) return { target: null };
  // find the CHAR before the cursor
  const [currentNode, currentPath] = nodeEntry;
  const nodeText = currentNode.text;
  let lastAIndex = null;
  for (let i = start.offset - 1; i >= 0; i--) {
    if (nodeText[i] === char) {
      lastAIndex = i;
      break;
    } else if (isAppChar(nodeText[i])) {
      // case other app char
      break;
    }
  }
  // if no CHAR before the cursor, return
  if (lastAIndex === null) return { target: null };
  const aPoint = {
    path: currentPath,
    offset: lastAIndex,
  };
  const target = Editor.range(editor, aPoint, start);
  const res = {
    target,
    search: Editor.string(editor, target).substring(1),
  };
  return res;
};

// for selection
export const isAtBeginOfNode = ({ anchor, focus }) => {
  return anchor.offset === 0 || focus.offset === 0;
};
// for selection
export const isAtBeginOfEditor = (editor) => {
  return Point.equals(Editor.start(editor, []), editor.selection.anchor);
};
export const isAtEndOfEditor = (editor) => {
  return Point.equals(Editor.end(editor, []), editor.selection.anchor);
};
export const getCharBeforeSelection = (editor) => {
  if (isSelectionExpanded(editor)) return '';
  const nodeEntry = getSelectionLowestText(editor);
  if (!nodeEntry) return '';
  const [node] = nodeEntry;
  const str = Node.string(node);
  if (!str) return '';
  if (editor.selection.anchor.offset === 0) return '';
  return str[editor.selection.anchor.offset - 1];
};

export const getTextSearch = (editor) => {
  const tags = getPlatformTagAliasList(editor);
  const textStr = getInputString(editor);
  if (tags.length === 0) return textStr;
  return `@${tags.join(',')} ${textStr}`;
};

export const removeAllPlatformTag = (editor) => {
  Transforms.removeNodes(editor, {
    at: [],
    match: (n) => Element.isElement(n) && n.type === 'platformTag',
  });
};

export const removePlatformTag = (editor, alias) => {
  Transforms.removeNodes(editor, {
    at: [],
    match: (n) =>
      Element.isElement(n) && n.type === 'platformTag' && n.alias === alias,
  });
};

export const removeAllText = (editor) => {
  Transforms.removeNodes(editor, {
    at: [],
    match: (n) => Text.isText(n) && n.text !== '',
  });
  Transforms.select(editor, {
    anchor: Editor.end(editor, []),
    focus: Editor.end(editor, []),
  });
};

export const focusBlurredSelection = (editor, delay = 0, callback) => {
  if (ReactEditor.isFocused(editor)) return;
  try {
    ReactEditor.focus(editor);
    Transforms.deselect(editor);
  } catch (e) {
    console.log(e);
    return;
  }
  // if only use ReactEditor.focus, the cursor will display at the start
  // of the editor. So we have to use blurSelection.
  if (!editor.blurSelection) {
    selectionAll(editor);
    return;
  }
  if (delay === 0) {
    // use try/catch incase editor has been modified
    try {
      Transforms.select(editor, editor.blurSelection);
    } catch (e) {
      console.log(e);
    }
  } else {
    setTimeout(() => {
      if (!editor.blurSelection) return;
      // use try/catch incase editor has been modified
      try {
        Transforms.select(editor, editor.blurSelection);
        callback && callback();
      } catch (e) {
        console.log(e);
      }
    }, delay);
  }
};

export const isSelectionCollapsed = (editor) => {
  const { selection } = editor;
  return selection ? Range.isCollapsed(selection) : true;
};

export const isSelectionExpanded = (editor) => {
  const { selection } = editor;
  return selection ? Range.isExpanded(selection) : false;
};

export const getSelectionLowestText = (editor) => {
  const { selection } = editor;
  if (!selection) return null;

  const [match] = Editor.nodes(editor, {
    at: selection,
    match: (n) => Text.isText(n),
    mode: 'lowest',
  });

  return match;
};

export const replaceAllText = (editor, text) => {
  selectionAll(editor);
  editor.insertText(text);
  Transforms.select(editor, {
    anchor: Editor.end(editor, []),
    focus: Editor.end(editor, []),
  });
};

export const selectionAll = (editor) => {
  Transforms.select(editor, {
    anchor: Editor.start(editor, []),
    focus: Editor.end(editor, []),
  });
};

export const checkPlatformTagAdjacent = (editor) => {
  const res = {
    hasAtLeft: false,
    hasAtRight: false,
  };
  const { selection } = editor;
  if (!selection) return res;
  const [start] = Range.edges(selection);

  const nodeEntry = getSelectionLowestText(editor);
  if (!nodeEntry) return res;
  const [node, nodePath] = nodeEntry;

  const textIndex = nodePath[nodePath.length - 1];
  const parentNode = Node.parent(editor, nodePath);
  // has left platformtag if selection at the start of the text
  if (textIndex > 0 && start.offset === 0) {
    const prevNode = parentNode.children[textIndex - 1];
    if (Element.isElement(prevNode) && prevNode.type === 'platformTag') {
      res.hasAtLeft = true;
    }
  }
  // has right platformtag if selection at the end of the text
  if (
    parentNode.children.length - 1 > textIndex &&
    (node.text.length === 0 || start.offset === node.text.length)
  ) {
    const nextNode = parentNode.children[textIndex + 1];
    if (Element.isElement(nextNode) && nextNode.type === 'platformTag') {
      res.hasAtRight = true;
    }
  }
  return res;
};

export const hideCursor = () => {
  const scrollDOM = document.getElementById('inputScrollWrapper');
  if (!scrollDOM) return false;
  scrollDOM.style.caretColor = 'transparent';
};

export const showCursor = () => {
  const scrollDOM = document.getElementById('inputScrollWrapper');
  if (!scrollDOM) return false;
  scrollDOM.style.caretColor = 'unset';
};

// text node after platform tags
const findFirstTextNode = (editor) => {
  const paragraphNode = editor.children.find((child) => {
    return Element.isElement(child) && child.type === 'paragraph';
  });
  if (!paragraphNode) return null;
  let firstTextNode = null;
  for (let i = 0; i < paragraphNode.children.length; i++) {
    const child = paragraphNode.children[i];
    if (Text.isText(child)) {
      if (!firstTextNode) firstTextNode = child;
    } else {
      firstTextNode = null;
    }
  }
  return firstTextNode;
};

export const normalizeSelection = (editor) => {
  if (!editor.selection) return;
  if (isSelectionCollapsed(editor)) {
    if (!editor.isJustPressedHome) return;
    editor.isJustPressedHome = false;
    const isAtBeginOfEditor = Point.equals(
      Editor.start(editor, []),
      editor.selection.focus,
    );
    if (!isAtBeginOfEditor) return;
    const firstTextNode = findFirstTextNode(editor);
    if (!firstTextNode) return;
    const firstTextNodePath = ReactEditor.findPath(editor, firstTextNode);
    Transforms.select(editor, {
      anchor: Editor.start(editor, firstTextNodePath),
      focus: Editor.start(editor, firstTextNodePath),
    });
    return;
  }

  const [platformTagEntry] = Editor.nodes(editor, {
    at: editor.selection,
    match: (n) => Element.isElement(n) && n.type === 'platformTag',
  });

  if (!platformTagEntry) return;

  const selectionEnd = Editor.end(editor, editor.selection);

  const firstTextNode = findFirstTextNode(editor);

  if (!firstTextNode) return;
  const firstTextNodePath = ReactEditor.findPath(editor, firstTextNode);
  const newStartPoint = Editor.start(editor, firstTextNodePath);
  Transforms.select(editor, {
    anchor: newStartPoint,
    focus: selectionEnd,
  });
};

const deserialize = (el) => {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  } else if (el.nodeName === 'BR') {
    return '\n';
  }

  const { nodeName } = el;
  let parent = el;

  let children = Array.from(parent.childNodes).map(deserialize).flat();

  if (children.length === 0) {
    children = [{ text: '' }];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  if (nodeName === 'B') {
    return children.map((child) => jsx('text', { bold: true }, child));
  }

  return children;
};
export const insertPromptTemplate = (editor, template, shouldReplace) => {
  if (shouldReplace) {
    selectionAll(editor);
  }
  const html = template.replace(/\[/g, '<b>').replace(/\]/g, '</b>');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const fragment = deserialize(parsed.body);
  Transforms.insertFragment(editor, fragment);
  const totalBNode = Array.from(parsed.body.children).filter(
    (e) => e.nodeName === 'B',
  ).length;
  setTimeout(() => {
    selectNextBoldText(editor, true, true, totalBNode);
  }, 25);
};

export const selectNextBoldText = (
  editor,
  isBackward = false,
  shouldSelectCurrent = false,
  numberOfPass = 1,
) => {
  const { selection } = editor;
  if (!selection) return;

  const nodeEntry = getSelectionLowestText(editor);
  if (!nodeEntry) return;
  const nodePath = nodeEntry[1];

  const textIndex = nodePath[nodePath.length - 1];
  const parentNode = Node.parent(editor, nodePath);
  let boldCounter = 0;
  function checkNode(node) {
    if (!node.bold) return false;
    const currentNodePath = ReactEditor.findPath(editor, node);
    Transforms.select(editor, {
      anchor: Editor.start(editor, currentNodePath),
      focus: Editor.end(editor, currentNodePath),
    });
    boldCounter++;
    return boldCounter >= numberOfPass;
  }
  if (isBackward) {
    const beginIndex = shouldSelectCurrent ? textIndex : textIndex - 1;
    for (let i = beginIndex; i >= 0; i--) {
      if (checkNode(parentNode.children[i])) break;
    }
    return;
  }
  const beginIndex = shouldSelectCurrent ? textIndex : textIndex + 1;
  for (let i = beginIndex; i < parentNode.children.length; i++) {
    if (checkNode(parentNode.children[i])) break;
  }
};

export const isEqualRange = (range1, range2) => {
  if (!range1 && range2) return false;
  if (range1 && !range2) return false;
  if (!range1 && !range2) return true;
  return Range.equals(range1, range2);
};
