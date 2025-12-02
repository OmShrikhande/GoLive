import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors()); // ✅ allow Expo device to request tokens

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

app.listen(3000, () => {
  console.log("✅ Token server running on http://localhost:3000");
});
