import {ALPHABET, normalize} from './dictionary.js';

function tileElement(cell) {
  return cell.querySelector('.tile,.racktile,.rack-tile,[data-letter],[data-tile]') || cell;
}

export function explicitDraft(cell) {
  return cell.matches('[data-pending="true"],[data-committed="false"],[data-state="pending"],[data-status="pending"],.pending-tile,.tentative,.uncommitted') ||
    !!cell.querySelector('.racktile,.rack-tile,[draggable="true"],[data-pending="true"],[data-committed="false"],.pending-tile,.tentative,.uncommitted') ||
    cell.getAttribute('draggable') === 'true';
}

function background(element) {
  const window = element.ownerDocument?.defaultView;
  if (!window) return '';
  const color = window.getComputedStyle(element).backgroundColor;
  return !color || ['transparent', 'rgba(0, 0, 0, 0)'].includes(color) ? '' : color;
}

export function rackAppearance(cell, rackCells) {
  const color = background(tileElement(cell)) || background(cell);
  if (!color) return false;
  return rackCells.some(rackCell => {
    const tile = tileElement(rackCell);
    return !!tile.textContent.trim() && (background(tile) || background(rackCell)) === color;
  });
}

// Reconstruct only visible, mutually consistent played words. A challenge or an
// incomplete/nonmatching history must never erase committed letters from a board.
export function moveHistory(root) {
  const containers = [...root.querySelectorAll('.movelist,.move-list,#movelist,[data-moves],.moves-list')];
  if (!containers.length) return null;
  const entries = [];
  for (const container of containers) {
    const rows = [...container.querySelectorAll('.move,.wordmove,[data-move]')].filter(element => {
      const parent = element.parentElement.closest('.move,.wordmove,[data-move]');
      return !parent || parent === container;
    });
    for (const row of rows) {
      if (row.matches('.pending,.tentative,[data-pending="true"]')) continue;
      const wordNode = row.querySelector('.wordmove') || row;
      const textNode = wordNode.querySelector('i,[data-word],.word');
      const word = normalize(textNode?.getAttribute('data-word') || textNode?.textContent || row.getAttribute('data-word') || '');
      const coordinate = wordNode.textContent.match(/\(\s*([A-O](?:1[0-5]|[1-9])|(?:1[0-5]|[1-9])[A-O])\s*\)/i)?.[1] || row.getAttribute('data-coord');
      if (!coordinate) continue;
      if (word.length < 2 || [...word].some(letter => !ALPHABET.includes(letter))) return null;
      const horizontal = /^[A-O]/i.test(coordinate);
      const match = coordinate.match(horizontal ? /^([A-O])(\d+)$/i : /^(\d+)([A-O])$/i);
      if (!match) return null;
      const rowIndex = (horizontal ? match[1] : match[2]).toUpperCase().charCodeAt(0) - 65;
      const col = +(horizontal ? match[2] : match[1]) - 1;
      entries.push({word, row: rowIndex, col, direction: horizontal ? 'horizontal' : 'vertical'});
    }
  }
  if (containers.some(container => /ÓLEYFILEG|VÉFENG|CHALL|RESP/.test(normalize(container.textContent)))) return null;
  const coordinates = new Map();
  for (const entry of entries) {
    for (let i = 0; i < entry.word.length; i++) {
      const row = entry.row + (entry.direction === 'vertical' ? i : 0);
      const col = entry.col + (entry.direction === 'horizontal' ? i : 0);
      if (row > 14 || col > 14 || row < 0 || col < 0) return null;
      const key = `${row},${col}`;
      if (coordinates.has(key) && coordinates.get(key) !== entry.word[i]) return null;
      coordinates.set(key, entry.word[i]);
    }
  }
  return {stamp: JSON.stringify(entries), coordinates};
}

export function classifyDrafts(root, cells, raw, rackCells, rackSlots) {
  const draft = new Set();
  const history = moveHistory(root);
  const complete = history && [...history.coordinates].every(([key, letter]) => raw.get(key)?.letter === letter);
  for (const {e, row, col} of cells) {
    const key = `${row},${col}`;
    if (!raw.has(key) || (complete && history.coordinates.has(key))) continue;
    if (explicitDraft(e)) draft.add(key);
  }
  if (complete) {
    const extra = cells.filter(({row, col}) => raw.has(`${row},${col}`) && !history.coordinates.has(`${row},${col}`));
    const capacity = 7 - rackSlots.filter(Boolean).length;
    // Even with history, require both enough vacant rack slots and rack-like
    // rendering. A shortened history alone is not evidence that a tile is a draft.
    if (extra.length <= capacity && extra.every(({e, row, col}) => draft.has(`${row},${col}`) || rackAppearance(e, rackCells))) {
      for (const {row, col} of extra) draft.add(`${row},${col}`);
    }
  }
  return {draft, historyStamp: history?.stamp ?? null};
}
