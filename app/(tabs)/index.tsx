import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { requestToken } from '../../src/api/client';

const gifts = [
  { id: 1, name: 'Rose', amount: 1, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2NrbjZrdnJtYm55a3JtaGpoZ3A4d3k4c2s4c2pna2NpejV3eWJvdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c76IJLufpN5wA/giphy.gif' },
  { id: 2, name: 'Crown', amount: 100, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2tqN2U5aHB1d2l3Z3hpdWJlb21sYnBsc3l6M3Y4d3ZpZ3NqZ3p2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6gDWzmAzrpi5DQU8/giphy.gif' },
  { id: 3, name: 'Diamond', amount: 500, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2tqN2U5aHB1d2l3Z3hpdWJlb21sYnBsc3l6M3Y4d3ZpZ3NqZ3p2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6gDWzmAzrpi5DQU8/giphy.gif' },
  { id: 4, name: 'Gold Coin', amount: 10, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2tqN2U5aHB1d2l3Z3hpdWJlb21sYnBsc3l6M3Y4d3ZpZ3NqZ3p2eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6gDWzmAzrpi5DQU8/giphy.gif' },
  { id: 5, name: 'Heart', amount: 5, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2NrbjZrdnJtYm55a3JtaGpoZ3A4d3k4c2s4c2pna2NpejV3eWJvdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c76IJLufpN5wA/giphy.gif' },
];

async function joinRoom(identity: string, role: 'publisher' | 'viewer') {
  try {
    const token = await requestToken({ roomName: 'demo-room', identity, role });
    Alert.alert('Token received', token.substring(0, 16) + '...');
    // TODO: Initialize LiveKit client with token + connect to LIVEKIT_URL if needed
  } catch (e: any) {
    Alert.alert('Join failed', e.message);
  }
}

const UserScreen = () => {
  const [showGifts, setShowGifts] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.cameraView} />

      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>Streamer</Text>
            <Text style={styles.followers}>1.2M followers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.followButton} onPress={() => joinRoom('user-1', 'viewer')}>
          <Text style={styles.followButtonText}>Join</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.liveChatContainer}>
        <ScrollView style={styles.liveChat}>
          <Text style={styles.chatMessage}><Text style={styles.chatUser}>User1:</Text> Hello!</Text>
          <Text style={styles.chatMessage}><Text style={styles.chatUser}>User2:</Text> Hi there!</Text>
        </ScrollView>
        <View style={styles.chatInputContainer}>
          <TextInput style={styles.chatInput} placeholder="Send a message..." placeholderTextColor="gray" />
          <TouchableOpacity>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setShowGifts(true)} style={styles.iconButton}>
          <Ionicons name="gift" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {showGifts && (
        <View style={styles.giftsPopup}>
          <TouchableOpacity onPress={() => setShowGifts(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.giftsGrid}>
            {gifts.map((gift) => (
              <View key={gift.id} style={styles.giftItem}>
                <Image source={{ uri: gift.gif }} style={styles.giftGif} />
                <Text style={styles.giftName}>{gift.name}</Text>
                <Text style={styles.giftAmount}>{gift.amount}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const StreamerScreen = () => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.cameraView} />

      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>Streamer</Text>
            <Text style={styles.followers}>1.2M followers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.goLiveButton} onPress={() => joinRoom('streamer-1', 'publisher')}>
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.liveChatContainer}>
        <ScrollView style={styles.liveChat}>
          <Text style={styles.chatMessage}><Text style={styles.chatUser}>User1:</Text> Hello!</Text>
          <Text style={styles.chatMessage}><Text style={styles.chatUser}>User2:</Text> Hi there!</Text>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setMicOn(!micOn)} style={styles.iconButton}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={32} color={micOn ? 'white' : 'red'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCameraOn(!cameraOn)} style={styles.iconButton}>
          <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={32} color={cameraOn ? 'white' : 'red'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { role } = useLocalSearchParams();

  if (role === 'streamer') {
    return <StreamerScreen />;
  }

  return <UserScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#333',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  username: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  followers: {
    color: 'gray',
    fontSize: 14,
  },
  followButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  followButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goLiveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  goLiveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  liveChatContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    height: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 10,
  },
  liveChat: {
    flex: 1,
  },
  chatMessage: {
    color: 'white',
    marginBottom: 10,
  },
  chatUser: {
    fontWeight: 'bold',
    color: '#E91E63',
    marginRight: 5,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'gray',
    paddingTop: 10,
  },
  chatInput: {
    flex: 1,
    color: 'white',
    height: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 20,
    padding: 10,
  },
  giftsPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: 40,
  },
  giftItem: {
    alignItems: 'center',
    margin: 15,
  },
  giftGif: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  giftName: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  giftAmount: {
    color: 'gold',
    fontSize: 14,
  },
});
