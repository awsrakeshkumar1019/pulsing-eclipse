'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Copy, Check } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useMediaStream } from '@/hooks/useMediaStream';
import { usePeers } from '@/hooks/usePeers';
import VideoGrid from '@/components/VideoGrid';
import Controls from '@/components/Controls';
import ChatPanel from '@/components/ChatPanel';
import '@/styles/room.css';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId;

    const { getSocket, disconnect } = useSocket();
    const {
        stream,
        streamRef,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        initStream,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        stopStream,
    } = useMediaStream();
    const { peers, createPeer, signalPeer, removePeer, removeAllPeers, replaceStream } =
        usePeers();

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [participantCount, setParticipantCount] = useState(1);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [copied, setCopied] = useState(false);

    const socketRef = useRef(null);
    const joinedRef = useRef(false);

    // Timer
    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s
                .toString()
                .padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s
            .toString()
            .padStart(2, '0')}`;
    };

    // Initialize
    useEffect(() => {
        if (joinedRef.current) return;
        joinedRef.current = true;

        const name = sessionStorage.getItem('meetup-username') || `User-${Math.floor(Math.random() * 1000)}`;
        setUserName(name);

        const init = async () => {
            try {
                const mediaStream = await initStream({ video: true, audio: true });
                const socket = getSocket();
                socketRef.current = socket;

                socket.on('connect', () => {
                    setIsConnected(true);
                });

                // Join room once connected
                const joinRoom = () => {
                    socket.emit('join-room', { roomId, userName: name });
                    setIsLoading(false);
                    setIsConnected(true);
                };

                if (socket.connected) {
                    joinRoom();
                } else {
                    socket.on('connect', joinRoom);
                }

                // Handle existing users in room
                socket.on('existing-users', (users) => {
                    users.forEach((user) => {
                        createPeer({
                            targetId: user.id,
                            socket,
                            stream: mediaStream,
                            userName: name,
                            initiator: true,
                        });
                    });
                });

                // Handle new user joining
                socket.on('user-joined', (user) => {
                    createPeer({
                        targetId: user.id,
                        socket,
                        stream: mediaStream,
                        userName: name,
                        initiator: false,
                    });
                });

                // Handle incoming offer
                socket.on('signal-offer', ({ from, signal, userName: remoteUserName }) => {
                    let peer = createPeer({
                        targetId: from,
                        socket,
                        stream: mediaStream,
                        userName: name,
                        initiator: false,
                    });

                    // Update peer userName
                    if (remoteUserName) {
                        // This will be picked up when the peer stream arrives
                    }

                    signalPeer(from, signal);
                });

                // Handle incoming answer
                socket.on('signal-answer', ({ from, signal }) => {
                    signalPeer(from, signal);
                });

                // Handle user leaving
                socket.on('user-left', ({ id }) => {
                    removePeer(id);
                });

                // Handle chat messages
                socket.on('chat-message', (msg) => {
                    setMessages((prev) => [...prev, msg]);
                    setIsChatOpen((open) => {
                        if (!open) {
                            setUnreadMessages((prev) => prev + 1);
                        }
                        return open;
                    });
                });

                // Handle participant count
                socket.on('participant-count', (count) => {
                    setParticipantCount(count);
                });

                // Handle media toggle from remote
                socket.on('media-toggle', ({ userId, type, enabled }) => {
                    // Update peer state - could enhance peers state here
                });
            } catch (error) {
                console.error('Failed to initialize:', error);
                setIsLoading(false);
            }
        };

        init();

        return () => {
            // Cleanup on unmount
        };
    }, [roomId]);

    // Toggle audio
    const handleToggleAudio = useCallback(() => {
        const enabled = toggleAudio();
        if (socketRef.current) {
            socketRef.current.emit('media-toggle', {
                roomId,
                type: 'audio',
                enabled,
            });
        }
    }, [roomId, toggleAudio]);

    // Toggle video
    const handleToggleVideo = useCallback(() => {
        const enabled = toggleVideo();
        if (socketRef.current) {
            socketRef.current.emit('media-toggle', {
                roomId,
                type: 'video',
                enabled,
            });
        }
    }, [roomId, toggleVideo]);

    // Toggle screen share
    const handleToggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            const originalStream = stopScreenShare();
            if (originalStream) {
                replaceStream(originalStream);
            }
        } else {
            const screenStream = await startScreenShare();
            if (screenStream) {
                // Replace the video track on all peer connections with screen track
                replaceStream(screenStream);

                // When user stops screen share via browser UI, restore camera for peers too
                const videoTrack = screenStream.getVideoTracks()[0];
                if (videoTrack) {
                    const origOnEnded = videoTrack.onended;
                    videoTrack.onended = () => {
                        // stopScreenShare (called via useMediaStream) restores streamRef 
                        // to the camera. We also need to notify peers.
                        // Use a small delay to let stopScreenShare finish first.
                        setTimeout(() => {
                            if (streamRef.current) {
                                replaceStream(streamRef.current);
                            }
                        }, 100);
                        if (origOnEnded) origOnEnded();
                    };
                }
            }
        }
    }, [isScreenSharing, startScreenShare, stopScreenShare, replaceStream, streamRef]);

    // Toggle chat
    const handleToggleChat = useCallback(() => {
        setIsChatOpen((prev) => !prev);
        setUnreadMessages(0);
    }, []);

    // Send message
    const handleSendMessage = useCallback(
        (message) => {
            if (socketRef.current) {
                socketRef.current.emit('chat-message', {
                    roomId,
                    message,
                    userName,
                });
            }
        },
        [roomId, userName]
    );

    // Leave call
    const handleLeaveCall = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { roomId });
        }
        removeAllPeers();
        stopStream();
        disconnect();
        router.push('/');
    }, [roomId, removeAllPeers, stopStream, disconnect, router]);

    // Copy room ID
    const handleCopyRoomId = useCallback(() => {
        navigator.clipboard.writeText(roomId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [roomId]);

    if (isLoading) {
        return (
            <div className="room-loading">
                <div className="room-loading-spinner" />
                <p className="room-loading-text">Connecting to meeting...</p>
            </div>
        );
    }

    return (
        <div className="room-container">
            {/* Copied toast */}
            {copied && <div className="copy-toast">Meeting code copied!</div>}

            {/* Header */}
            <header className="room-header">
                <div className="room-header-left">
                    <span className="room-header-logo">MeetUp</span>
                    <div className="room-header-divider" />
                    <button
                        className="room-header-id"
                        onClick={handleCopyRoomId}
                        title="Click to copy meeting code"
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {roomId}
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
                <div className="room-header-right">
                    <span className="room-timer">{formatTime(elapsedTime)}</span>
                    <div className="participant-badge">
                        <Users size={14} />
                        {participantCount}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="room-main">
                <div className={`room-content ${isChatOpen ? 'chat-open' : ''}`}>
                    <VideoGrid
                        localStream={stream}
                        peers={peers}
                        userName={userName}
                        isAudioEnabled={isAudioEnabled}
                        isVideoEnabled={isVideoEnabled}
                        isScreenSharing={isScreenSharing}
                    />
                </div>

                {/* Chat Panel */}
                {isChatOpen && (
                    <ChatPanel
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onClose={handleToggleChat}
                        currentUserId={socketRef.current?.id}
                    />
                )}
            </div>

            {/* Controls */}
            <Controls
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isScreenSharing={isScreenSharing}
                isChatOpen={isChatOpen}
                unreadMessages={unreadMessages}
                onToggleAudio={handleToggleAudio}
                onToggleVideo={handleToggleVideo}
                onToggleScreenShare={handleToggleScreenShare}
                onToggleChat={handleToggleChat}
                onLeaveCall={handleLeaveCall}
            />
        </div>
    );
}
