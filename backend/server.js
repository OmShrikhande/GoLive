import express from "express";
import cors from "cors";
import https from "https";
import fs from "fs";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const livekitHost = process.env.LIVEKIT_URL || "http://194.163.178.69:7880";
const roomService = new RoomServiceClient(
  livekitHost,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const createToken = async (roomName, participantName) => {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      ttl: "10m",
    }
  );
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};

app.get("/getToken", async (req, res) => {
  const { roomName, participantName } = req.query;
  const room = roomName || "quickstart-room";
  const participant = participantName || "user-" + Math.floor(Math.random() * 10000);
  res.send(await createToken(room, participant));
});

app.get("/getActiveLives", async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    const activeLives = rooms.map((room) => ({
      roomId: room.name,
      roomName: room.name,
      hostName: room.metadata || "Unknown Host",
      participantCount: room.numParticipants,
      createdAt: new Date(room.creationTime * 1000).toISOString(),
    }));
    res.json(activeLives);
  } catch (error) {
    console.error("Error fetching active lives:", error);
    res.status(500).json({ error: "Failed to fetch active lives" });
  }
});

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync("/certs/server.key"),
  cert: fs.readFileSync("/certs/server.crt"),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ Secure Token server running on https://${PORT}`);
});
