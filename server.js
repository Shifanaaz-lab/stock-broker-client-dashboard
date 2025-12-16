// server.js
// ----------------------------------------------------
// Real-Time Stock Broker Client Dashboard
// Built for Escrow Stack CUPI on-campus hiring assignment
//
// Features:
// - Email-based login (per-socket identity)
// - Subscribe/unsubscribe to supported stocks
// - Random price generator (no external APIs)
// - Real-time updates via Socket.IO
// - Per-user subscriptions + global ticker feed
// ----------------------------------------------------

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// --- Basic app setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static("public"));

// --- Domain configuration ---

/**
 * Supported stock tickers for this demo.
 * (Requirement: choose 5 stocks, e.g. GOOG, TSLA, AMZN, META, NVDA)
 */
const SUPPORTED_STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

/**
 * In-memory store for stock prices.
 * In a real app this would be replaced by a market data provider or database.
 */
let stockPrices = {
  GOOG: 2800,
  TSLA: 700,
  AMZN: 3300,
  META: 350,
  NVDA: 900,
};

// --- Price simulation logic ---

/**
 * Randomly tweak each stock price by ±1%.
 * This satisfies the requirement to use a random number generator
 * instead of real stock prices.
 */
function updatePricesRandomly() {
  for (const ticker of SUPPORTED_STOCKS) {
    const current = stockPrices[ticker];
    const changePercent = (Math.random() * 2 - 1) / 100; // -1% to +1%
    const newPrice = current + current * changePercent;
    stockPrices[ticker] = Number(newPrice.toFixed(2));
  }
}

// --- Real-time socket handling ---

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Store per-user context on the socket
  socket.data.email = null;
  socket.data.subscriptions = new Set();

  /**
   * Login handler
   * Simple: associates an email string with the socket.
   */
  socket.on("login", (email) => {
    socket.data.email = email;
    console.log(`User logged in: ${email} (${socket.id})`);

    // Send static config + initial prices
    socket.emit("supportedStocks", SUPPORTED_STOCKS);
    socket.emit("initialPrices", stockPrices);
  });

  /**
   * Subscribe handler
   * Adds the ticker to this socket's subscriptions set.
   */
  socket.on("subscribe", (ticker) => {
    if (!SUPPORTED_STOCKS.includes(ticker)) {
      // Silently ignore invalid tickers (could also emit an error event)
      return;
    }

    socket.data.subscriptions.add(ticker);
    console.log(
      `User ${socket.data.email || socket.id} subscribed to ${ticker}`
    );

    // Tell the client its latest subscription list
    socket.emit("subscribed", Array.from(socket.data.subscriptions));
  });

  /**
   * Unsubscribe handler
   * Removes the ticker from this socket's subscriptions set.
   */
  socket.on("unsubscribe", (ticker) => {
    if (!socket.data.subscriptions.has(ticker)) return;

    socket.data.subscriptions.delete(ticker);
    console.log(
      `User ${socket.data.email || socket.id} unsubscribed from ${ticker}`
    );

    socket.emit("subscribed", Array.from(socket.data.subscriptions));
  });

  /**
   * Optional: explicit logout handler
   * Clears email + subscriptions for this socket.
   */
  socket.on("logout", () => {
    console.log(`User logged out: ${socket.data.email || socket.id}`);
    socket.data.email = null;
    socket.data.subscriptions = new Set();
    // After this, the client won't receive any more priceUpdate events
    // until it logs in again and subscribes.
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// --- Global price update loop ---
// Every second:
//   1) Update prices using random generator
//   2) Broadcast full price list to ticker bar (all users)
//   3) Send per-user price maps for their subscriptions

setInterval(() => {
  updatePricesRandomly();

  // 1) Broadcast full price list to all clients (for header ticker bar)
  io.emit("tickerUpdate", stockPrices);

  // 2) For each connected client, send only the subscribed prices
  for (const [id, socket] of io.sockets.sockets) {
    const subs = Array.from(socket.data.subscriptions || []);
    if (subs.length === 0) continue;

    const payload = {};
    subs.forEach((ticker) => {
      payload[ticker] = stockPrices[ticker];
    });

    socket.emit("priceUpdate", payload);
  }
}, 1000);

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
