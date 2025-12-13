import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator, Text, Platform, TouchableOpacity, Dimensions } from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useRoomContext,
  useParticipants,
} from "@livekit/react-native";
import { Track, Participant } from "livekit-client";
import dotenv from "dotenv";
import { LogDisplay, LogManager } from "./LogDisplay";

registerGlobals();

const BACKEND_URL = process.env.Backend_URL || "http://194.163.178.69:3000";
const LIVEKIT_URL = (process.env.LIVEKIT_URL || "ws://194.163.178.69:7880").replace(/\/$/, "");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

type UserRole = "host" | "viewer" | null;
type AppScreen = "browse" | "roleSelection" | "room";

interface LiveRoom {
  roomId: string;
  roomName: string;
  hostName: string;
  participantCount: number;
  createdAt: string;
}

async function fetchActiveLives(): Promise<LiveRoom[]> {
  try {
    console.log("📡 Fetching active lives...");
    const res = await fetch(`${BACKEND_URL}/getActiveLives`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const lives = await res.json();
    console.log(`✅ Fetched ${lives.length} active lives`);
    return lives;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to fetch lives: ${errorMsg}`);
    return [];
  }
}

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

interface BrowseLivesScreenProps {
  onStartNewLive: () => void;
  onJoinLive: (room: LiveRoom) => void;
}

const BrowseLivesScreen = ({ onStartNewLive, onJoinLive }: BrowseLivesScreenProps) => {
  const [lives, setLives] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLives();
  }, []);

  const loadLives = async () => {
    setLoading(true);
    const activeLives = await fetchActiveLives();
    setLives(activeLives);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const activeLives = await fetchActiveLives();
    setLives(activeLives);
    setRefreshing(false);
  };

  const renderLiveItem = ({ item }: { item: LiveRoom }) => (
    <TouchableOpacity
      style={styles.liveCard}
      onPress={() => onJoinLive(item)}
    >
      <View style={styles.liveCardContent}>
        <Text style={styles.liveHostName}>🎥 {item.hostName}</Text>
        <Text style={styles.liveRoomName}>{item.roomName}</Text>
        <Text style={styles.liveViewers}>👥 {item.participantCount} watching</Text>
      </View>
      <Text style={styles.joinArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.browseContainer}>
      <View style={styles.browseHeader}>
        <Text style={styles.browseTitle}>🔴 Live Streams</Text>
        <TouchableOpacity
          style={styles.startLiveButton}
          onPress={onStartNewLive}
        >
          <Text style={styles.startLiveButtonText}>+ Start Live</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading lives...</Text>
        </View>
      ) : lives.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>😴 No live streams</Text>
          <Text style={styles.emptyStateSubtext}>Start a new live or check back later</Text>
        </View>
      ) : (
        <FlatList
          data={lives}
          renderItem={renderLiveItem}
          keyExtractor={(item) => item.roomId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          scrollEnabled={true}
        />
      )}
    </View>
  );
};

const RoleSelectionScreen = ({ onSelectRole, onGoBack }: { onSelectRole: (role: UserRole) => void; onGoBack: () => void }) => {
  return (
    <View style={styles.roleSelectionContainer}>
      <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.roleTitle}>Select Your Role</Text>
      <TouchableOpacity
        style={[styles.roleButton, styles.hostButton]}
        onPress={() => onSelectRole("host")}
      >
        <Text style={styles.roleButtonText}>🎥 Join as Host</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.roleButton, styles.viewerButton]}
        onPress={() => onSelectRole("viewer")}
      >
        <Text style={styles.roleButtonText}>👁️ Join as Viewer</Text>
      </TouchableOpacity>
    </View>
  );
};

const Toast = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("browse");
  const [role, setRole] = useState<UserRole>(null);
  const [selectedRoom, setSelectedRoom] = useState<LiveRoom | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

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

  const joinRoom = async (roomName: string, role: UserRole) => {
    try {
      setRole(role);
      const participantName = (role === "host" ? "Host-" : "Viewer-") + Math.floor(Math.random() * 10000);
      console.log(`🌐 Fetching token for room: ${roomName}, participant: ${participantName}`);
      
      const url = `${BACKEND_URL}/getToken?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`;
      const tokenResponse = await fetchTokenWithRetry(url);

      console.log("✅ Token fetched successfully");
      setToken(tokenResponse);
      setCurrentScreen("room");
    } catch (error) {
      const errorMsg = `❌ Connection error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      setError(errorMsg);
    }
  };

  const handleStartNewLive = () => {
    setCurrentScreen("roleSelection");
  };

  const handleJoinLive = (room: LiveRoom) => {
    setSelectedRoom(room);
    joinRoom(room.roomName, "viewer");
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    const roomName = "live-" + Math.floor(Math.random() * 10000);
    joinRoom(roomName, selectedRole);
  };

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

  if (currentScreen === "browse") {
    return <BrowseLivesScreen onStartNewLive={handleStartNewLive} onJoinLive={handleJoinLive} />;
  }

  if (currentScreen === "roleSelection") {
    return <RoleSelectionScreen onSelectRole={handleSelectRole} onGoBack={() => setCurrentScreen("browse")} />;
  }

  if (currentScreen === "room" && token) {
    return (
      <View style={styles.appContainer}>
        <LiveKitRoom
          serverUrl={LIVEKIT_URL}
          token={token}
          connect={true}
          options={{ adaptiveStream: { pixelDensity: "screen" } }}
          audio={role === "host"}
          video={role === "host"}
          onError={(error) => {
            const errMsg = `❌ LiveKit connection error: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errMsg);
            setError(errMsg);
          }}
        >
          <RoomView role={role} onViewerJoined={showToastMessage} />
        </LiveKitRoom>
        <Toast message={toastMessage} visible={showToast} />
        <LogDisplay />
        <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
                setToken(null);
                setRole(null);
                setCurrentScreen("browse");
            }}
        >
            <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.loadingText}>Loading...</Text>
      <LogDisplay />
    </View>
  );
}

interface RoomViewProps {
  role: UserRole;
  onViewerJoined: (message: string) => void;
}

const RoomView = ({ role, onViewerJoined }: RoomViewProps) => {
  const room = useRoomContext();
  const participants = useParticipants();
  const [previousParticipantCount, setPreviousParticipantCount] = useState(0);
  const [hostIdentified, setHostIdentified] = useState(false);
  const [hostParticipant, setHostParticipant] = useState<Participant | null>(null);

  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.ScreenShare,
  ]);

  const filteredTracks = role === "viewer" && hostParticipant
    ? tracks.filter(track => track.participant.sid === hostParticipant.sid)
    : role === "viewer" ? [] : tracks;

  useEffect(() => {
    if (participants.length > 0 && !hostIdentified) {
      let host: Participant | null = null;

      if (role === "viewer") {
        const remoteParticipants = participants.filter(p => !p.isLocal);
        if (remoteParticipants.length > 0) {
          host = remoteParticipants[0];
          console.log(`👁️ Viewer found ${remoteParticipants.length} remote participant(s)`);
        }
      } else {
        const sortedParticipants = [...participants].sort(
          (a, b) => (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0)
        );
        host = sortedParticipants[0];
      }

      if (host) {
        setHostParticipant(host);
        setHostIdentified(true);
        console.log(`🎥 Host identified: ${host.name} (SID: ${host.sid}, isLocal: ${host.isLocal})`);
        console.log(`📊 All participants (${participants.length}):`, participants.map(p => ({ 
          name: p.name, 
          sid: p.sid, 
          isLocal: p.isLocal 
        })));
      }
    }

    if (role === "host" && participants.length > previousParticipantCount) {
      const remoteParticipants = participants.filter(p => !p.isLocal);
      const previousRemoteCount = previousParticipantCount > 0 ? previousParticipantCount - 1 : 0;
      
      if (remoteParticipants.length > previousRemoteCount) {
        const newParticipant = remoteParticipants[remoteParticipants.length - 1];
        const message = `👁️ ${newParticipant.name} joined as viewer`;
        console.log(message);
        onViewerJoined(message);
      }
    }

    setPreviousParticipantCount(participants.length);
  }, [participants, hostIdentified, role, previousParticipantCount, onViewerJoined]);

  useEffect(() => {
    console.log(`📹 Total available tracks: ${tracks.length}`);
    if (tracks.length > 0) {
      console.log(`🔍 All tracks:`, tracks.map(t => ({ 
        source: t.source,
        participantName: t.participant.name,
        participantSid: t.participant.sid,
        isLocal: t.participant.isLocal
      })));
    }

    if (role === "viewer" && hostParticipant) {
      console.log(`👁️ VIEWER MODE - Host SID: ${hostParticipant.sid}`);
      console.log(`🎯 Filtered tracks (host only): ${filteredTracks.length}`);
      if (filteredTracks.length === 0 && tracks.length > 0) {
        console.log(`❌ WARNING: Tracks available but none match host!`);
        console.log(`Track SIDs:`, tracks.map(t => t.participant.sid));
        console.log(`Host SID: ${hostParticipant.sid}`);
      }
    }
  }, [tracks, filteredTracks, hostParticipant, role]);

  const renderTrack = ({ item }) => {
    if (isTrackReference(item)) {
      return <VideoTrack trackRef={item} style={styles.participantView} />;
    } else {
      return <View style={styles.participantView} />;
    }
  };

  const hostCount = participants.length;

  const numColumns = role === "host" && hostCount > 2 ? 2 : 1;

  if (role === "viewer" && participants.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTracksText}>❌ No host in the room. Please try again later.</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      role === "host" && hostCount === 2 && styles.gridContainer2,
      role === "host" && hostCount > 2 && styles.gridContainer3Plus,
    ]}>
      {role === "viewer" && !hostIdentified ? (
        <Text style={styles.noTracksText}>Waiting for host to join...</Text>
      ) : filteredTracks.length > 0 ? (
        <FlatList
          key={`flatlist-${numColumns}`}
          data={filteredTracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.participant.sid}
          numColumns={numColumns}
          scrollEnabled={role === "host" && hostCount > 2}
        />
      ) : (
        <Text style={styles.noTracksText}>
          {role === "viewer" ? "Waiting for host video..." : "Waiting for video tracks..."}
        </Text>
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
  gridContainer2: {
    flex: 1,
    backgroundColor: "#000",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridContainer3Plus: {
    flex: 1,
    backgroundColor: "#000",
  },
  participantView: {
    flex: 1,
    minHeight: 300,
    marginVertical: 10,
    marginHorizontal: 5,
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
  roleSelectionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },
  roleButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hostButton: {
    backgroundColor: "#4CAF50",
  },
  viewerButton: {
    backgroundColor: "#2196F3",
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  toast: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  browseContainer: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 50,
  },
  browseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  browseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  startLiveButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  startLiveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  liveCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveCardContent: {
    flex: 1,
  },
  liveHostName: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },
  liveRoomName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  liveViewers: {
    color: "#4CAF50",
    fontSize: 12,
  },
  joinArrow: {
    color: "#666",
    fontSize: 24,
    marginLeft: 10,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#666",
    fontSize: 14,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
