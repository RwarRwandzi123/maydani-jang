const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const file = path.join(__dirname, "public", "index.html");
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Game page not found");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const players = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).slice(2, 10);
  players.set(id, { x: 100, y: 100, name: "Player" });

  ws.send(JSON.stringify({
    type: "welcome",
    id,
    players: Object.fromEntries(players)
  }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "move" && players.has(id)) {
        const p = players.get(id);
        p.x = Math.max(0, Math.min(2000, Number(data.x) || 0));
        p.y = Math.max(0, Math.min(2000, Number(data.y) || 0));
      }
    } catch (e) {}
  });

  ws.on("close", () => players.delete(id));
});

setInterval(() => {
  const update = JSON.stringify({
    type: "players",
    players: Object.fromEntries(players)
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(update);
    }
  });
}, 100);

server.listen(PORT, () => {
  console.log("Battlefield server running on " + PORT);
});
