import express from "express";
import cors from "cors";
import https from "https";
import fs from "fs";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const createToken = async () => {
  const roomName = "quickstart-room";
  const participantName = "user-" + Math.floor(Math.random() * 10000);

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
  res.send(await createToken());
});

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync("/certs/server.key"),
  cert: fs.readFileSync("/certs/server.crt"),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ Secure Token server running on https://${PORT}`);
});
