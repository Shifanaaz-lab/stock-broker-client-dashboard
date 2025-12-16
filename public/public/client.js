// client.js
// ----------------------------------------------------
// Frontend logic for Real-Time Stock Broker Client Dashboard
// ----------------------------------------------------

// Establish a real-time connection to the backend (Socket.IO)
const socket = io();

// ----- DOM ELEMENT REFERENCES -----
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("email");
const userEmailSpan = document.getElementById("user-email");
const welcomeNameSpan = document.getElementById("welcome-name");
const welcomeLabelSpan = document.getElementById("welcome-label"); // may be null if HTML not updated
const logoutBtn = document.getElementById("logout-btn"); // may be null if HTML not updated

const availableStocksBody = document.getElementById("available-stocks-body");
const subscribedStocksBody = document.getElementById("subscribed-stocks-body");
const tickerTrack = document.getElementById("ticker-track");

// ----- CLIENT-SIDE STATE -----
let supportedStocks = [];
let subscribedTickers = new Set();
let latestPrices = {};
let previousPrices = {};
let tickerPrices = {};
let previousTickerPrices = {};

// ----------------------------------------------------
// LOGIN / LOGOUT HANDLING
// ----------------------------------------------------

function handleLogin() {
  const email = emailInput.value.trim();
  if (!email) {
    alert("Please enter a valid email.");
    return;
  }

  socket.emit("login", email);

  // header email
  userEmailSpan.textContent = email;

  // friendly name from email
  let namePart = email;
  if (email.includes("@")) {
    [namePart] = email.split("@");
  }
  if (namePart.length > 0) {
    const formattedName =
      namePart.charAt(0).toUpperCase() + namePart.slice(1);
    welcomeNameSpan.textContent = formattedName;
  } else {
    welcomeNameSpan.textContent = "User";
  }

  // neutral welcome label (if present)
  if (welcomeLabelSpan) {
    welcomeLabelSpan.textContent = "Welcome,";
  }

  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
}

function handleLogout() {
  // tell server
  socket.emit("logout");

  // reset state
  supportedStocks = [];
  subscribedTickers = new Set();
  latestPrices = {};
  previousPrices = {};
  tickerPrices = {};
  previousTickerPrices = {};

  // clear UI
  availableStocksBody.innerHTML = "";
  subscribedStocksBody.innerHTML = "";
  if (tickerTrack) tickerTrack.innerHTML = "";

  userEmailSpan.textContent = "";
  welcomeNameSpan.textContent = "";
  if (welcomeLabelSpan) {
    welcomeLabelSpan.textContent = "Welcome,";
  }

  emailInput.value = "";

  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

// login button
loginBtn.addEventListener("click", handleLogin);

// enter key for login
emailInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleLogin();
  }
});

// logout button (only if it exists)
if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

// ----------------------------------------------------
// SOCKET EVENT HANDLERS
// ----------------------------------------------------

socket.on("supportedStocks", (stocks) => {
  supportedStocks = stocks;
  renderAvailableStocks();
});

socket.on("initialPrices", (prices) => {
  latestPrices = { ...latestPrices, ...prices };
  tickerPrices = { ...prices };
  renderSubscribedStocks();
  renderTickerBar();
});

socket.on("subscribed", (subs) => {
  subscribedTickers = new Set(subs);
  renderSubscribedStocks();
});

socket.on("priceUpdate", (priceMap) => {
  latestPrices = { ...latestPrices, ...priceMap };
  renderSubscribedStocks();
});

socket.on("tickerUpdate", (priceMap) => {
  previousTickerPrices = { ...tickerPrices };
  tickerPrices = { ...priceMap };
  renderTickerBar();
});

// ----------------------------------------------------
// RENDERING FUNCTIONS
// ----------------------------------------------------

function renderAvailableStocks() {
  availableStocksBody.innerHTML = "";

  supportedStocks.forEach((ticker) => {
    const tr = document.createElement("tr");

    const tdTicker = document.createElement("td");
    tdTicker.textContent = ticker;

    const tdAction = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Subscribe";
    btn.className = "btn small";
    btn.addEventListener("click", () => subscribeToStock(ticker));

    tdAction.appendChild(btn);
    tr.appendChild(tdTicker);
    tr.appendChild(tdAction);
    availableStocksBody.appendChild(tr);
  });
}

function renderSubscribedStocks() {
  subscribedStocksBody.innerHTML = "";

  if (subscribedTickers.size === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "No subscriptions yet.";
    td.className = "empty-row";
    tr.appendChild(td);
    subscribedStocksBody.appendChild(tr);
    return;
  }

  Array.from(subscribedTickers).forEach((ticker) => {
    const tr = document.createElement("tr");

    const tdTicker = document.createElement("td");
    tdTicker.textContent = ticker;

    const tdPrice = document.createElement("td");
    const price = latestPrices[ticker];

    if (price !== undefined) {
      tdPrice.textContent = `$${price}`;

      const prev = previousPrices[ticker];
      if (prev !== undefined && prev !== price) {
        if (price > prev) {
          tdPrice.classList.add("price-up");
          tdPrice.classList.remove("price-down");
        } else if (price < prev) {
          tdPrice.classList.add("price-down");
          tdPrice.classList.remove("price-up");
        }

        setTimeout(() => {
          tdPrice.classList.remove("price-up", "price-down");
        }, 600);
      }

      previousPrices[ticker] = price;
    } else {
      tdPrice.textContent = "Loading...";
    }

    const tdAction = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Unsubscribe";
    btn.className = "btn small secondary";
    btn.addEventListener("click", () => unsubscribeFromStock(ticker));

    tdAction.appendChild(btn);

    tr.appendChild(tdTicker);
    tr.appendChild(tdPrice);
    tr.appendChild(tdAction);

    subscribedStocksBody.appendChild(tr);
  });
}

function renderTickerBar() {
  if (!tickerTrack) return;

  tickerTrack.innerHTML = "";

  Object.entries(tickerPrices).forEach(([ticker, price]) => {
    const span = document.createElement("span");
    span.className = "ticker-item";

    const prev = previousTickerPrices[ticker];
    let directionSymbol = "•";
    let dirClass = "neutral";

    if (prev !== undefined && prev !== price) {
      if (price > prev) {
        directionSymbol = "↑";
        dirClass = "up";
      } else if (price < prev) {
        directionSymbol = "↓";
        dirClass = "down";
      }
    }

    span.innerHTML = `
      <span class="ticker-symbol">${ticker}</span>
      <span class="ticker-price ${dirClass}">${directionSymbol} $${price}</span>
    `;

    tickerTrack.appendChild(span);
  });
}

// ----------------------------------------------------
// ACTION HELPERS
// ----------------------------------------------------

function subscribeToStock(ticker) {
  socket.emit("subscribe", ticker);
}

function unsubscribeFromStock(ticker) {
  socket.emit("unsubscribe", ticker);
}
