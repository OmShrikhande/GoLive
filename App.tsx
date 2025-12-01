import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator, Text, Platform } from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useRoomContext,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import dotenv from "dotenv";
import { LogDisplay, LogManager } from "./LogDisplay";

registerGlobals();

const BACKEND_URL = process.env.Backend_URL || "http://194.163.178.69:3000";
// Ensure LIVEKIT_URL does not end with a trailing slash. The LiveKit SDK
// will append the required `/rtc?auth_token=...` path internally when you
// provide the `token` prop to `LiveKitRoom`. Keeping a trailing slash can
// cause malformed URLs like `ws://host:7880//rtc?...`.
const LIVEKIT_URL = (process.env.LIVEKIT_URL || "ws://194.163.178.69:7880").replace(/\/$/, "");

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchTokenWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${retries}: Fetching token from ${url}`);
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const tokenResponse = await res.text();
      if (!tokenResponse || tokenResponse.length < 10) {
        throw new Error("Invalid or empty token response");
      }

      console.log("✅ Token fetched successfully on attempt", attempt);
      return tokenResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Attempt ${attempt} failed: ${errorMsg}`);

      if (attempt < retries) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
  throw new Error("All retries exhausted");
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🔄 Starting app initialization...");
        console.log(`📍 Backend URL: ${BACKEND_URL}`);
        console.log(`📍 LiveKit URL: ${LIVEKIT_URL}`);
        console.log(`📱 Platform: ${Platform.OS}`);

        console.log("🔊 Starting audio session...");
        await AudioSession.startAudioSession();
        console.log("✅ Audio session started");

        console.log(`🌐 Fetching token from ${BACKEND_URL}/getToken`);
        const tokenResponse = await fetchTokenWithRetry(`${BACKEND_URL}/getToken`);

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
        onError={(error) => {
          const errMsg = `❌ LiveKit connection error: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errMsg);
          setError(errMsg);
        }}
      >
        <RoomView />
      </LiveKitRoom>
      <LogDisplay />
    </View>
  );
}

const RoomView = () => {
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.ScreenShare,
  ]);

  const renderTrack = ({ item }) => {
    if (isTrackReference(item)) {
      return <VideoTrack trackRef={item} style={styles.participantView} />;
    } else {
      return <View style={styles.participantView} />;
    }
  };

  return (
    <View style={styles.container}>
      {tracks.length > 0 ? (
        <FlatList
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={(_, index) => index.toString()}
        />
      ) : (
        <Text style={styles.noTracksText}>Waiting for video tracks...</Text>
      )}
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
  noTracksText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
