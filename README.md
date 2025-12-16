📈 Real-Time Stock Broker Client Dashboard
A live multi-user stock subscription system built for the Escrow Stack CUPI on-campus hiring assignment.


🚀 Overview

This project is a real-time Stock Broker Client Dashboard that allows users to:

Log in using their email address

Subscribe to supported stock tickers

Receive live stock price updates every second without page refresh

Have multiple users open simultaneously, each with their own independent dashboard

Stock prices are simulated on the server using a random number generator to mimic real-time market behavior.


🧱 Architecture Overview

The app is intentionally kept simple but structured like a production-grade real-time system.

Client (Browser)

Renders the dashboard UI (login, available stocks, subscriptions)

Opens a persistent Socket.IO connection to the backend

Subscribes/unsubscribes to stocks via socket events

Reacts to two types of real-time events:

priceUpdate → personalized prices for subscribed stocks

tickerUpdate → global snapshot for the header ticker bar

Server (Node.js + Express + Socket.IO)

Serves static assets from /public

Maintains in-memory stock prices for 5 supported tickers

For each connected socket:

Stores email (used as session identity)

Stores subscriptions (Set of tickers)

Every second:

Updates prices using a random generator (±1%)

Emits tickerUpdate (broadcast to all users)

Emits priceUpdate (only to users subscribed to those stocks)

This separation between broadcast events and per-user events
demonstrates how real-time trading or notification systems are designed in production.


✅ Assignment Requirements Mapping

Login with email

The app provides a login screen where users enter their email.

Each connected client is associated with an email via Socket.IO.

Subscribe to supported stocks

Supported tickers: GOOG, TSLA, AMZN, META, NVDA

Users can subscribe and unsubscribe using UI controls.

Update stock prices without refreshing the dashboard

Prices update every second on the server.

Updates are pushed to the browser using WebSockets (Socket.IO).

No page reload is required.

Support at least two users with async updates

Each socket maintains its own subscription set.

Multiple users can subscribe to different stocks simultaneously.

Each dashboard updates independently in real time.

Use random number generator for prices

Each stock price fluctuates randomly by approximately ±1% per second.

No external APIs are used.


🧩 Features & UI Highlights

Email-based login (lightweight, no registration required)

Logout functionality to clear session and return to login screen

Modern dark-themed trading UI

Global animated stock ticker bar for market overview
Personalized welcome banner

Price movement indicators

Green flash for upward movement

Red flash for downward movement

Responsive layout suitable for desktop and smaller screens


🛠 Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express

Real-Time Communication: Socket.IO

Other: In-memory random price generator


📦 How to Run Locally

Install dependencies:
npm install


Start the server:
node server.js


Open in browser:
http://localhost:3000


🌐 Deployed Version

The application is deployed and accessible via the provided Web Page Link in the submission form.
(First load may take a few seconds if the free hosting instance is starting.)


👨‍💻 Developer Notes

Authentication is intentionally lightweight and email-based to match the scope of the assignment.

In real stock broker platforms, registration involves KYC and regulatory steps, which were outside the scope of this evaluation.

The focus of this project is on real-time behavior, clean architecture, and multi-user asynchronous updates.


👤 Developed By
Shifanaaz Abdulsab Nadaf
KLE Technological University
Submission for Escrow Stack CUPI – On-Campus Hiring Assignment
