// a lot of repetition and some of the functions can be refactored in better versions, breaking them down in smaller chunks, also a beginning to look monolithic, also lacks error handling
const flipButton = document.querySelector('#flip-button');
const gamesBoardContainer = document.querySelector('#games-board-container');
const startButton = document.querySelector('#start-button');
const optionContainer = document.querySelector('.options-container');
const infoDisplay = document.querySelector('#info');
const turnDisplay = document.querySelector('#turn-display');

// Break code on null values, you can wrap in try catch if you wish to carry on executing
if (flipButton === null || optionContainer === null)
  throw new Error('Document not loaded correctly');

let angle = 0;

// flip option
function flip() {
  const optionShips = Array.from(optionContainer.children);

  angle = angle === 0 ? 90 : 0;

  optionShips.forEach((optionShip) => {
    optionShip.style.transform = `rotate(${angle}deg)`;
  });
}

flipButton.addEventListener('click', flip);

// create board
const width = 10;

if (gamesBoardContainer === null)
  throw new Error('Document not loaded correctly');

function createBoard(color, user) {
  const gameBoardContainer = document.createElement('div');
  gameBoardContainer.classList.add('game-board');
  gameBoardContainer.style.backgroundColor = color;
  gameBoardContainer.id = user;

  for (let i = 0; i < width * width; i++) {
    const block = document.createElement('div');
    block.classList.add('block');
    block.id = i;
    gameBoardContainer.append(block);
  }

  gamesBoardContainer.append(gameBoardContainer);
}

createBoard('yellow', 'player');
createBoard('pink', 'computer');

// create ships
class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const destroyer = new Ship('destroyer', 2);
const submarine = new Ship('submarine', 3);
const cruiser = new Ship('cruiser', 3);
const battleship = new Ship('battleship', 4);
const carrier = new Ship('carrier', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
  // handle index start errors, i made an integration of both Ania solutions to decrease validations
  // honestly probably a switch case situation
  const validStart = isHorizontal
    ? (startIndex % 10) + ship.length - 1 <= 9 //checks if it crosses the right border
      ? startIndex
      : startIndex - ((startIndex % 10) + ship.length - 10) //corrects position
    : startIndex <= width * width - ship.length * width //checks if it crosses the bottom border
    ? startIndex
    : startIndex - width * (ship.length - 1); // corrects position

  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i]);
    } else {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i * width]);
    }
  }

  const notTaken = shipBlocks.every(
    (shipBlock) => !shipBlock.classList.contains('taken')
  );
  return { shipBlocks, notTaken };
}

function addShipPiece(user, ship, startId) {
  const allBoardBlocks = document.querySelectorAll(`#${user} div`);
  const randomBoolean = Math.random() < 0.5;
  const isHorizontal = user === 'player' ? angle === 0 : randomBoolean;
  const randomStartIndex = Math.floor(Math.random() * width * width);

  const startIndex = startId ? startId : randomStartIndex;

  const { shipBlocks, notTaken } = getValidity(
    allBoardBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add('taken');
    });
  } else {
    // not sure why Ania validates twice the user, being that there are only 2 instances, i decided to only apply an else
    // this could be further simplified in one line, not sure the gains since it would leave a hanging const, i prefer the if and else for cleaner approach
    if (user === 'computer') {
      // i can't think of a better solution then making a recursion in this instance, so i am sticking with Ania solution
      addShipPiece(user, ship, startId);
    } else {
      notDropped = true;
    }
  }
}

ships.forEach((ship) => {
  addShipPiece('computer', ship);
});

// Drag and drop player ships
let draggedShip = null;
const optionsShips = Array.from(optionContainer.children);

// bug you can drag pieces on the player board
optionsShips.forEach((optionShip) =>
  optionShip.addEventListener('dragstart', dragStart)
);

const allPlayerBlocks = document.querySelectorAll('#player div');

allPlayerBlocks.forEach((playerBlock) => {
  playerBlock.addEventListener('dragover', dragOver);
  playerBlock.addEventListener('drop', dropShip);
});

function dragStart(e) {
  notDropped = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  if (!draggedShip) return false; // temporary fix
  const ship = ships[draggedShip.id];
  highlightArea(e.target.id, ship);
}

function dropShip(e) {
  e.preventDefault();
  if (!draggedShip) return false; // temporary fix
  const startId = e.target.id;
  const ship = ships[draggedShip.id];
  addShipPiece('player', ship, startId);
  if (!notDropped) {
    draggedShip.remove();
    draggedShip = null;
  }
}

// add high light
function highlightArea(startIndex, ship) {
  const allBoardBlocks = document.querySelectorAll('#player div');
  let isHorizontal = angle === 0;

  const { shipBlocks, notTaken } = getValidity(
    allBoardBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add('hover');
      setTimeout(() => shipBlock.classList.remove('hover'), 500);
    });
  }
}

let gameOver = false;
let playerTurn;

function startGame() {
  if (playerTurn !== undefined) return;

  if (optionContainer.children.length !== 0) {
    infoDisplay.textContent = 'Please place all your ships!';
  } else {
    turnDisplay.textContent = 'Player turn';
    infoDisplay.textContent = 'Game Start';
    const allBoardBlocks = document.querySelectorAll('#computer div');
    allBoardBlocks.forEach((block) =>
      block.addEventListener('click', handleClick)
    );
  }
}

startButton.addEventListener('click', startGame);

let playerHits = [];
let computerHits = [];
let playerSunkShips = [];
let computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains('taken')) {
      e.target.classList.add('boom');
      infoDisplay.textContent = 'Hit!';
      let classes = Array.from(e.target.classList);
      classes = classes.filter(
        (className) =>
          className !== 'block' && className !== 'boom' && className !== 'taken'
      );
      playerHits.push(...classes);
      checkScore('player', playerHits, playerSunkShips);
    }

    if (!e.target.classList.contains('taken')) {
      infoDisplay.textContent = 'Miss!';
      e.target.classList.add('empty');
    }

    playerTurn = false;
    const allBoardBlocks = document.querySelectorAll('#computer div');

    allBoardBlocks.forEach((block) =>
      block.removeEventListener('click', handleClick)
    );

    setTimeout(computerGo, 3000);
  }
}

// Computer turn
function computerGo() {
  if (!gameOver) {
    turnDisplay.textContent = 'Computer Turn';
    infoDisplay.textContent = 'Computer is thinking';

    setTimeout(() => {
      let randomGo = Math.floor(Math.random() * width * width);
      const allBoardBlocks = document.querySelectorAll('#player div');

      const targetClassList = allBoardBlocks[randomGo].classList;

      //if it targets a hit or miss
      if (
        (targetClassList.contains('boom') &&
          targetClassList.contains('taken')) ||
        targetClassList.contains('empty')
      ) {
        computerGo();
        return;

        // if it targets a ship with no hit
      } else if (
        !targetClassList.contains('boom') &&
        targetClassList.contains('taken')
      ) {
        targetClassList.add('boom');
        infoDisplay.textContent = 'Computer Hit!';
        let classes = Array.from(targetClassList);
        classes = classes.filter(
          (className) =>
            className !== 'block' &&
            className !== 'boom' &&
            className !== 'taken'
        );
        computerHits.push(...classes);
        checkScore('computer', computerHits, computerSunkShips);

        // if it does not target a ship
      } else if (
        !targetClassList.contains('boom') &&
        !targetClassList.contains('taken')
      ) {
        infoDisplay.textContent = 'Computer Miss!';
        targetClassList.add('empty');
      }
    }, 3000);

    setTimeout(() => {
      playerTurn = true;
      turnDisplay.textContent = 'Player Turn';
      infoDisplay.textContent = 'Please take your turn!';

      const allBoardBlocks = document.querySelectorAll('#computer div');
      allBoardBlocks.forEach((block) =>
        block.addEventListener('click', handleClick)
      );
    }, 6000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (
      userHits.filter((storedShipName) => storedShipName === shipName)
        .length === shipLength
    ) {
      // surprise shallow copy of array!!! need a a tid bit research here
      if (user === 'player')
        infoDisplay.textContent = `You have sunk the computers's ${shipName}!`;
      playerHits = userHits.filter((storedShip) => storedShip !== shipName);
      if (user === 'computer')
        infoDisplay.textContent = `You have sunk the players's ${shipName}!`;
      computerHits = userHits.filter((storedShip) => storedShip !== shipName);

      userSunkShips.push(shipName);
    }
  }

  ships.forEach((ship) => checkShip(ship.name, ship.length));

  if (playerSunkShips.length === 5) {
    infoDisplay.textContent = 'You have sunk all the computer ships, you Won!';
    gameOver = true;
  }
  if (computerSunkShips.length === 5) {
    infoDisplay.textContent = 'Computer has sunk all your ships, you Lost!';
    gameOver = true;
  }
}
