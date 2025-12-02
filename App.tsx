import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  VideoTrack,
  isTrackReference,
  registerGlobals,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import dotenv from "dotenv";

// Must be called before using LiveKit
registerGlobals();

// ✅ Change this to your backend URL
const BACKEND_URL = process.env.Backend_URL || "https://golive-hg5x.onrender.com";

 // 👈 use your local IP, not localhost

export default function App() {
  const [token, setToken] = useState(null);

  // Start audio session + fetch token
  useEffect(() => {
    const init = async () => {
      await AudioSession.startAudioSession();

      try {
        const res = await fetch(`${BACKEND_URL}/getToken`);
        const tokenResponse = await res.text();
        setToken(tokenResponse);
      } catch (error) {
        console.error("❌ Error fetching token:", error);
      }
    };

    init();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  // Show loader until token is ready
  if (!token) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
  <LiveKitRoom serverUrl="ws://194.163.178.69:7880/"
    token={token}
    connect={true}
      options={{ adaptiveStream: { pixelDensity: "screen" } }}
      audio={true}
      video={true}
    >  
      <RoomView />
    </LiveKitRoom>
  );
}

const RoomView = () => {
  const tracks = useTracks([Track.Source.Camera]);

  const renderTrack = ({ item }) => {
    if (isTrackReference(item)) {
      return <VideoTrack trackRef={item} style={styles.participantView} />;
    } else {
      return <View style={styles.participantView} />;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(_, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "stretch",
    justifyContent: "center",
  },
  participantView: {
    height: 300,
    marginVertical: 10,
    backgroundColor: "#222",
  },
  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
