import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator, Text, Platform } from "react-native";
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
import { LogDisplay, LogManager } from "./LogDisplay";

registerGlobals();

const BACKEND_URL = process.env.Backend_URL || "https://golive-hg5x.onrender.com";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://194.163.178.69:7880/" ||"ws://194.163.178.69:7880/";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🔄 Starting app initialization...");
        console.log(`📍 Backend URL: ${BACKEND_URL}`);
        console.log(`📍 LiveKit URL: ${LIVEKIT_URL}`);
        
        console.log("🔊 Starting audio session...");
        await AudioSession.startAudioSession();
        console.log("✅ Audio session started");

        console.log(`🌐 Fetching token from ${BACKEND_URL}/getToken`);
        const res = await fetch(`${BACKEND_URL}/getToken`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const tokenResponse = await res.text();
        if (!tokenResponse) {
          throw new Error("Empty token response from backend");
        }

        console.log("✅ Token fetched successfully:", tokenResponse.substring(0, 20) + "...");
        console.log("🔗 Connecting to LiveKit server...");
        setToken(tokenResponse);
      } catch (error) {
        const errorMsg = `❌ Initialization error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        setError(errorMsg);
      }
    };

    init();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <LogDisplay />
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading...</Text>
        <LogDisplay />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        options={{ adaptiveStream: { pixelDensity: "screen" } }}
        audio={true}
        video={true}
      >
        <RoomView />
      </LiveKitRoom>
      <LogDisplay />
    </View>
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
  appContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 20,
    lineHeight: 20,
  },
});
