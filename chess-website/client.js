const chessboard = document.getElementById('chessboard');
const statusDiv = document.getElementById('status');

const piecesUnicode = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

let board = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

let selected = null;
let turn = 'white';
let playerColor = null;
let socket = null;

function createBoard() {
  chessboard.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      if ((row + col) % 2 === 0) {
        square.classList.add('light');
      } else {
        square.classList.add('dark');
      }
      square.dataset.row = row;
      square.dataset.col = col;
      square.textContent = piecesUnicode[board[row][col]] || '';
      square.addEventListener('click', () => onSquareClick(row, col));
      chessboard.appendChild(square);
    }
  }
}

function onSquareClick(row, col) {
  if (!playerColor) {
    alert('Waiting for opponent...');
    return;
  }
  if (turn !== playerColor) {
    alert("It's not your turn");
    return;
  }
  const piece = board[row][col];
  if (selected) {
    if (isValidMove(selected.row, selected.col, row, col)) {
      makeMove(selected.row, selected.col, row, col);
      selected = null;
      updateStatus();
      sendMove(selected, {row, col});
    } else {
      selected = null;
      createBoard();
    }
  } else {
    if (piece && isPieceColor(piece, playerColor)) {
      selected = {row, col};
      highlightSquare(row, col);
    }
  }
}

function isPieceColor(piece, color) {
  if (color === 'white') {
    return piece === piece.toUpperCase();
  } else {
    return piece === piece.toLowerCase();
  }
}

function highlightSquare(row, col) {
  createBoard();
  const squares = chessboard.children;
  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    if (parseInt(sq.dataset.row) === row && parseInt(sq.dataset.col) === col) {
      sq.classList.add('highlight');
      break;
    }
  }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
  // Basic validation: move to a different square and not capturing own piece
  if (fromRow === toRow && fromCol === toCol) return false;
  const piece = board[fromRow][fromCol];
  const target = board[toRow][toCol];
  if (target && isPieceColor(target, turn)) return false;
  // For simplicity, allow any move (no chess rules enforcement)
  return true;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = '';
  turn = turn === 'white' ? 'black' : 'white';
  createBoard();
}

function updateStatus() {
  if (!playerColor) {
    statusDiv.textContent = 'Waiting for opponent to join...';
  } else if (turn === playerColor) {
    statusDiv.textContent = "Your turn (" + playerColor + ")";
  } else {
    statusDiv.textContent = "Opponent's turn";
  }
}

function sendMove(from, to) {
  if (!socket) return;
  const message = {
    type: 'move',
    from: from,
    to: to
  };
  socket.send(JSON.stringify(message));
}

function handleMessage(event) {
  const message = JSON.parse(event.data);
  if (message.type === 'init') {
    playerColor = message.color;
    updateStatus();
  } else if (message.type === 'move') {
    const { from, to } = message;
    makeMove(from.row, from.col, to.row, to.col);
    updateStatus();
  } else if (message.type === 'error') {
    alert(message.message);
  }
}

function connect() {
  socket = new WebSocket(`ws://${window.location.host}`);
  socket.onopen = () => {
    console.log('Connected to server');
  };
  socket.onmessage = handleMessage;
  socket.onclose = () => {
    alert('Connection closed');
  };
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

createBoard();
connect();
