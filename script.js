const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const ALL_NUMBERS = Array.from({ length: 37 }, (_, index) => index);
const BOARD_SPACES = 37;
const ADJUSTMENT_STRENGTH = 1.35;
const ADJUSTMENT_SMOOTHING = 6;

const history = [];
const selectedBet = {
  base: null,
  dynamic: null,
  strategy: null,
};

const elements = {
  app: document.querySelector("#app"),
  baseBoard: document.querySelector("#baseBoard"),
  dynamicBoard: document.querySelector("#dynamicBoard"),
  basePanel: document.querySelector("#basePanel"),
  dynamicPanel: document.querySelector("#dynamicPanel"),
  startButton: document.querySelector("#startButton"),
  tracker: document.querySelector("#tracker"),
  entryForm: document.querySelector("#entryForm"),
  spinInput: document.querySelector("#spinInput"),
  formMessage: document.querySelector("#formMessage"),
  historyStrip: document.querySelector("#historyStrip"),
  statsGrid: document.querySelector("#statsGrid"),
  strategyGrid: document.querySelector("#strategyGrid"),
  strategyPanel: document.querySelector("#strategyPanel"),
  totalSpins: document.querySelector("#totalSpins"),
  hotNumbers: document.querySelector("#hotNumbers"),
  coldNumbers: document.querySelector("#coldNumbers"),
};

const BETS = buildBets();
const STAT_BETS = [
  "red",
  "black",
  "green",
  "even",
  "odd",
  "low",
  "high",
  "dozen-1",
  "dozen-2",
  "dozen-3",
  "column-1",
  "column-2",
  "column-3",
];
const STRATEGY_BETS = [
  "strategy-rolex",
  "strategy-voisins",
  "strategy-tiers",
  "strategy-orphelins",
  "strategy-james-bond",
];

renderBoard(elements.baseBoard);
renderBoard(elements.dynamicBoard);
renderStrategyCards();
renderAllStats();
refreshButtonMetadata("base");
refreshButtonMetadata("dynamic");

elements.baseBoard.addEventListener("click", handleBoardClick);
elements.dynamicBoard.addEventListener("click", handleBoardClick);
elements.strategyGrid.addEventListener("click", handleStrategyClick);
elements.startButton.addEventListener("click", startTracker);
elements.entryForm.addEventListener("submit", handleSpinSubmit);

function buildBets() {
  const bets = {};

  ALL_NUMBERS.forEach((number) => {
    bets[`num-${number}`] = {
      id: `num-${number}`,
      name: `Numero ${number}`,
      shortName: String(number),
      numbers: [number],
      note: "Apuesta directa a una sola casilla.",
    };
  });

  bets.red = {
    id: "red",
    name: "Rojo",
    shortName: "Rojo",
    numbers: Array.from(RED_NUMBERS),
    note: "Incluye 18 numeros rojos; el 0 no cuenta como rojo.",
  };
  bets.black = {
    id: "black",
    name: "Negro",
    shortName: "Negro",
    numbers: ALL_NUMBERS.filter((number) => number > 0 && !RED_NUMBERS.has(number)),
    note: "Incluye 18 numeros negros; el 0 no cuenta como negro.",
  };
  bets.green = {
    id: "green",
    name: "Verde",
    shortName: "Verde",
    numbers: [0],
    note: "Solo cubre el 0.",
  };
  bets.even = {
    id: "even",
    name: "Par",
    shortName: "Par",
    numbers: ALL_NUMBERS.filter((number) => number > 0 && number % 2 === 0),
    note: "El 0 no cuenta como par en la ruleta.",
  };
  bets.odd = {
    id: "odd",
    name: "Impar",
    shortName: "Impar",
    numbers: ALL_NUMBERS.filter((number) => number % 2 === 1),
    note: "El 0 no cuenta como impar.",
  };
  bets.low = {
    id: "low",
    name: "1 a 18",
    shortName: "1-18",
    numbers: range(1, 18),
    note: "Cubre los numeros bajos.",
  };
  bets.high = {
    id: "high",
    name: "19 a 36",
    shortName: "19-36",
    numbers: range(19, 36),
    note: "Cubre los numeros altos.",
  };
  bets["dozen-1"] = {
    id: "dozen-1",
    name: "1st 12",
    shortName: "1st 12",
    numbers: range(1, 12),
    note: "Primera docena.",
  };
  bets["dozen-2"] = {
    id: "dozen-2",
    name: "2nd 12",
    shortName: "2nd 12",
    numbers: range(13, 24),
    note: "Segunda docena.",
  };
  bets["dozen-3"] = {
    id: "dozen-3",
    name: "3rd 12",
    shortName: "3rd 12",
    numbers: range(25, 36),
    note: "Tercera docena.",
  };
  bets["column-1"] = {
    id: "column-1",
    name: "Columna inferior 2 to 1",
    shortName: "Col. inf.",
    numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    note: "La fila inferior del tablero visual.",
  };
  bets["column-2"] = {
    id: "column-2",
    name: "Columna central 2 to 1",
    shortName: "Col. central",
    numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    note: "La fila central del tablero visual.",
  };
  bets["column-3"] = {
    id: "column-3",
    name: "Columna superior 2 to 1",
    shortName: "Col. sup.",
    numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    note: "La fila superior del tablero visual.",
  };
  bets["strategy-rolex"] = {
    id: "strategy-rolex",
    name: "Jugada rolex",
    shortName: "Rolex",
    numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 13, 16, 19, 22, 15, 18, 21, 24],
    note: "Cubre la fila central y el bloque extra marcado alrededor del centro del tablero.",
    accent: "rolex",
  };
  bets["strategy-voisins"] = {
    id: "strategy-voisins",
    name: "Vecinos del Cero",
    shortName: "Vecinos",
    numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
    note: "Sector fisico alrededor del 0 en la ruleta europea; cubre 17 numeros.",
    accent: "voisins",
  };
  bets["strategy-tiers"] = {
    id: "strategy-tiers",
    name: "Tercio del Cilindro",
    shortName: "Tercio",
    numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
    note: "Sector opuesto a los vecinos del cero; se juega normalmente con 6 caballos.",
    accent: "tiers",
  };
  bets["strategy-orphelins"] = {
    id: "strategy-orphelins",
    name: "Los Huerfanos",
    shortName: "Huerfanos",
    numbers: [1, 6, 9, 14, 17, 20, 31, 34],
    note: "Numeros que no pertenecen ni a Vecinos del Cero ni al Tercio.",
    accent: "orphelins",
  };
  bets["strategy-james-bond"] = {
    id: "strategy-james-bond",
    name: "Estrategia James Bond",
    shortName: "James Bond",
    numbers: [0, ...range(13, 36)],
    note: "Cubre 0, la linea 13-18 y los altos 19-36; 25 numeros en total.",
    accent: "bond",
  };

  return bets;
}

function renderBoard(board) {
  board.innerHTML = "";

  const zeroCell = createCell("num-0", "0", "zero-cell number-cell green");
  zeroCell.style.gridColumn = "1";
  zeroCell.style.gridRow = "1 / 4";
  zeroCell.innerHTML = "<span>0</span>";
  board.append(zeroCell);

  const visualRows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  visualRows.forEach((row, rowIndex) => {
    row.forEach((number, colIndex) => {
      const color = getNumberColor(number);
      const cell = createCell(`num-${number}`, String(number), `number-cell ${color}`);
      cell.style.gridColumn = String(colIndex + 2);
      cell.style.gridRow = String(rowIndex + 1);
      board.append(cell);
    });
  });

  [
    { id: "column-3", row: 1 },
    { id: "column-2", row: 2 },
    { id: "column-1", row: 3 },
  ].forEach(({ id, row }) => {
    const cell = createCell(id, "2 to 1", "row-bet");
    cell.style.gridColumn = "14";
    cell.style.gridRow = String(row);
    board.append(cell);
  });

  [
    { id: "dozen-1", label: "1st 12", column: "2 / 6" },
    { id: "dozen-2", label: "2nd 12", column: "6 / 10" },
    { id: "dozen-3", label: "3rd 12", column: "10 / 14" },
  ].forEach(({ id, label, column }) => {
    const cell = createCell(id, label, "dozen-bet");
    cell.style.gridColumn = column;
    cell.style.gridRow = "4";
    board.append(cell);
  });

  [
    { id: "low", label: "1 to 18", column: "2 / 4", className: "outside-bet" },
    { id: "even", label: "EVEN", column: "4 / 6", className: "outside-bet" },
    { id: "red", label: "", column: "6 / 8", className: "outside-bet color-bet red" },
    { id: "black", label: "", column: "8 / 10", className: "outside-bet color-bet black" },
    { id: "odd", label: "ODD", column: "10 / 12", className: "outside-bet" },
    { id: "high", label: "19 to 36", column: "12 / 14", className: "outside-bet" },
  ].forEach(({ id, label, column, className }) => {
    const cell = createCell(id, label, className);
    cell.style.gridColumn = column;
    cell.style.gridRow = "5";
    board.append(cell);
  });
}

function createCell(betId, label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `roulette-cell ${className}`;
  button.dataset.bet = betId;
  button.textContent = label;
  button.setAttribute("aria-label", `${BETS[betId].name}. Ver probabilidad.`);
  return button;
}

function handleBoardClick(event) {
  const button = event.target.closest("[data-bet]");

  if (!button) {
    return;
  }

  const board = event.currentTarget;
  const boardType = board.dataset.board;
  selectedBet[boardType] = button.dataset.bet;

  board.querySelectorAll(".is-active").forEach((activeButton) => {
    activeButton.classList.remove("is-active");
  });
  button.classList.add("is-active");
  renderProbabilityPanel(boardType, button.dataset.bet);
}

function renderProbabilityPanel(boardType, betId) {
  const bet = BETS[betId];
  const panel = boardType === "base" ? elements.basePanel : elements.dynamicPanel;
  const base = baseProbability(bet);
  const adjusted = probabilityForBet(bet, boardType);
  const count = countHits(bet.numbers);
  const isDynamic = boardType === "dynamic";
  const countText = `${bet.numbers.length}/${BOARD_SPACES} casillas`;

  if (!isDynamic || history.length === 0) {
    panel.innerHTML = `
      <strong>${bet.name}</strong>
      Probabilidad de exito: <span class="probability-main">p = ${formatPercent(base)}</span>
      <br>${countText}. ${bet.note}
    `;
    return;
  }

  const expected = history.length * base;
  const direction =
    count > expected + 0.05
      ? "ha salido mas de lo esperado, asi que baja."
      : count < expected - 0.05
        ? "ha salido menos de lo esperado, asi que sube."
        : "va cerca de lo esperado.";

  panel.innerHTML = `
    <strong>${bet.name}</strong>
    Probabilidad ajustada: <span class="probability-main">p = ${formatPercent(adjusted)}</span>
    <br>Base: ${formatPercent(base)}. Historial: ${count}/${history.length}. ${direction}
  `;
}

function startTracker() {
  resetTrackerSession();

  if (elements.tracker.hidden) {
    elements.tracker.hidden = false;
    document.body.classList.add("is-started");
  }

  window.requestAnimationFrame(() => {
    elements.tracker.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.spinInput.focus({ preventScroll: true });
  });
}

function resetTrackerSession() {
  history.length = 0;
  selectedBet.dynamic = null;
  selectedBet.strategy = null;
  elements.spinInput.value = "";
  showFormMessage("", false);
  elements.dynamicPanel.textContent =
    "Sin tiradas anotadas: las probabilidades son iguales que en la ruleta general.";
  elements.strategyPanel.textContent = "Pulsa una jugada especial para ver su probabilidad.";
  elements.dynamicBoard.querySelectorAll(".is-active").forEach((button) => {
    button.classList.remove("is-active");
  });
  elements.strategyGrid.querySelectorAll(".is-active").forEach((button) => {
    button.classList.remove("is-active");
  });
  renderAllStats();
  refreshButtonMetadata("dynamic");
}

function handleSpinSubmit(event) {
  event.preventDefault();

  const rawValue = elements.spinInput.value.trim();
  const number = Number(rawValue);

  if (rawValue === "" || !Number.isInteger(number) || number < 0 || number > 36) {
    showFormMessage("Pon un numero entero entre 0 y 36.", false);
    return;
  }

  history.push(number);
  elements.spinInput.value = "";
  showFormMessage(`Anotado el ${number}.`, true);
  renderAllStats();
  refreshButtonMetadata("dynamic");

  if (selectedBet.dynamic) {
    renderProbabilityPanel("dynamic", selectedBet.dynamic);
  }

  window.requestAnimationFrame(() => {
    elements.historyStrip.scrollLeft = elements.historyStrip.scrollWidth;
  });
}

function renderAllStats() {
  renderHistory();
  renderStatsGrid();
  renderStrategyCards();
  renderTemperature();
}

function renderHistory() {
  elements.historyStrip.innerHTML = "";

  if (history.length === 0) {
    const empty = document.createElement("span");
    empty.className = "history-empty";
    empty.textContent = "Sin tiradas todavia";
    elements.historyStrip.append(empty);
    return;
  }

  history.forEach((number, index) => {
    const chip = document.createElement("span");
    chip.className = `chip ${getNumberColor(number)}`;
    chip.textContent = String(number);
    chip.title = `Ronda ${index + 1}`;
    elements.historyStrip.append(chip);
  });
}

function renderStatsGrid() {
  elements.totalSpins.textContent =
    history.length === 1 ? "1 tirada" : `${history.length} tiradas`;
  elements.statsGrid.innerHTML = "";

  STAT_BETS.forEach((betId) => {
    const bet = BETS[betId];
    const count = countHits(bet.numbers);
    const probability = probabilityForBet(bet, "dynamic");
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <b>${bet.shortName}</b>
      <span>n = ${count} | <span class="stat-prob">p = ${formatPercent(probability)}</span></span>
    `;
    elements.statsGrid.append(card);
  });
}

function renderTemperature() {
  if (history.length === 0) {
    elements.hotNumbers.textContent = "Anota tiradas para calcularlos.";
    elements.coldNumbers.textContent = "Anota tiradas para calcularlos.";
    return;
  }

  const counts = countNumbers();
  const expectedPerNumber = history.length / BOARD_SPACES;
  const scoredNumbers = ALL_NUMBERS.map((number) => ({
    number,
    count: counts.get(number) || 0,
    hotScore: (counts.get(number) || 0) - expectedPerNumber,
    coldScore: expectedPerNumber - (counts.get(number) || 0),
  }));

  const hot = scoredNumbers
    .filter((item) => item.count > 0)
    .sort((a, b) => b.hotScore - a.hotScore || b.count - a.count || a.number - b.number)
    .slice(0, 6);

  const cold = scoredNumbers
    .sort((a, b) => b.coldScore - a.coldScore || a.count - b.count || a.number - b.number)
    .slice(0, 6);

  elements.hotNumbers.textContent = hot.length
    ? hot.map((item) => `${item.number} (${item.count})`).join(", ")
    : "Todavia no hay repetidos claros.";
  elements.coldNumbers.textContent = cold.map((item) => `${item.number} (${item.count})`).join(", ");
}

function renderStrategyCards() {
  elements.strategyGrid.innerHTML = "";

  STRATEGY_BETS.forEach((betId) => {
    const bet = BETS[betId];
    const count = countHits(bet.numbers);
    const probability = probabilityForBet(bet, "dynamic");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `strategy-card ${bet.accent}`;
    button.dataset.strategy = betId;
    button.setAttribute(
      "aria-label",
      `${bet.name}. Probabilidad ${formatPercent(probability)}.`
    );

    if (selectedBet.strategy === betId) {
      button.classList.add("is-active");
    }

    button.innerHTML = `
      <span class="wheel-art" aria-hidden="true"></span>
      <span class="strategy-copy">
        <b>${bet.name}</b>
        <span>${bet.numbers.length} numeros | n = ${count}</span>
        <span class="stat-prob">p = ${formatPercent(probability)}</span>
      </span>
    `;
    elements.strategyGrid.append(button);
  });

  if (selectedBet.strategy) {
    renderStrategyPanel(selectedBet.strategy);
  }
}

function handleStrategyClick(event) {
  const button = event.target.closest("[data-strategy]");

  if (!button) {
    return;
  }

  selectedBet.strategy = button.dataset.strategy;
  elements.strategyGrid.querySelectorAll(".is-active").forEach((activeButton) => {
    activeButton.classList.remove("is-active");
  });
  button.classList.add("is-active");
  renderStrategyPanel(button.dataset.strategy);
}

function renderStrategyPanel(betId) {
  const bet = BETS[betId];
  const base = baseProbability(bet);
  const adjusted = probabilityForBet(bet, "dynamic");
  const count = countHits(bet.numbers);
  const numbers = bet.numbers.join(", ");

  if (history.length === 0) {
    elements.strategyPanel.innerHTML = `
      <strong>${bet.name}</strong>
      Probabilidad de exito: <span class="probability-main">p = ${formatPercent(base)}</span>
      <br>${bet.note}
      <br>${bet.numbers.length}/${BOARD_SPACES} casillas. Numeros: ${numbers}.
    `;
    return;
  }

  const expected = history.length * base;
  const direction =
    count > expected + 0.05
      ? "ha salido mas de lo esperado, asi que baja."
      : count < expected - 0.05
        ? "ha salido menos de lo esperado, asi que sube."
        : "va cerca de lo esperado.";

  elements.strategyPanel.innerHTML = `
    <strong>${bet.name}</strong>
    Probabilidad ajustada: <span class="probability-main">p = ${formatPercent(adjusted)}</span>
    <br>${bet.note}
    <br>Base: ${formatPercent(base)}. Historial: ${count}/${history.length}. ${direction}
  `;
}

function refreshButtonMetadata(boardType) {
  const board = boardType === "base" ? elements.baseBoard : elements.dynamicBoard;

  board.querySelectorAll("[data-bet]").forEach((button) => {
    const bet = BETS[button.dataset.bet];
    const probability = probabilityForBet(bet, boardType);
    button.title = `${bet.name}: p = ${formatPercent(probability)}`;
    button.setAttribute(
      "aria-label",
      `${bet.name}. Probabilidad ${formatPercent(probability)}.`
    );
  });
}

function probabilityForBet(bet, boardType) {
  const base = baseProbability(bet);

  if (boardType !== "dynamic" || history.length === 0) {
    return base;
  }

  const observed = countHits(bet.numbers);
  const expected = history.length * base;
  const pressure = (expected - observed) / (history.length + ADJUSTMENT_SMOOTHING);
  const adjusted = base * (1 + ADJUSTMENT_STRENGTH * pressure);
  const min = Math.max(0.001, base * 0.25);
  const max = Math.min(0.92, base * 1.85 + 0.025);

  return clamp(adjusted, min, max);
}

function baseProbability(bet) {
  return bet.numbers.length / BOARD_SPACES;
}

function countHits(numbers) {
  const numberSet = new Set(numbers);
  return history.reduce((total, number) => total + (numberSet.has(number) ? 1 : 0), 0);
}

function countNumbers() {
  return history.reduce((counts, number) => {
    counts.set(number, (counts.get(number) || 0) + 1);
    return counts;
  }, new Map());
}

function getNumberColor(number) {
  if (number === 0) {
    return "green";
  }

  return RED_NUMBERS.has(number) ? "red" : "black";
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function showFormMessage(message, isOk) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-ok", isOk);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
