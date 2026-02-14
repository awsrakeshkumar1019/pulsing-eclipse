'use client';

import { useState, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';

export function usePeers() {
    const [peers, setPeers] = useState({});
    const peersRef = useRef({});

    const createPeer = useCallback(
        ({ targetId, socket, stream, userName, initiator = true }) => {
            // Don't create duplicate peers
            if (peersRef.current[targetId]) {
                console.log(`Peer already exists for ${targetId}`);
                return peersRef.current[targetId];
            }

            console.log(
                `Creating ${initiator ? 'initiator' : 'receiver'} peer for ${targetId}`
            );

            const peer = new SimplePeer({
                initiator,
                trickle: true,
                stream: stream || undefined,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                    ],
                },
            });

            peer.on('signal', (signal) => {
                if (initiator) {
                    socket.emit('signal-offer', {
                        to: targetId,
                        signal,
                        userName,
                    });
                } else {
                    socket.emit('signal-answer', {
                        to: targetId,
                        signal,
                    });
                }
            });

            peer.on('stream', (remoteStream) => {
                console.log(`Received stream from ${targetId}`);
                setPeers((prev) => ({
                    ...prev,
                    [targetId]: {
                        ...prev[targetId],
                        stream: remoteStream,
                    },
                }));
            });

            peer.on('error', (err) => {
                console.error(`Peer error (${targetId}):`, err.message);
                // Clean up on error
                removePeer(targetId);
            });

            peer.on('close', () => {
                console.log(`Peer connection closed: ${targetId}`);
                removePeer(targetId);
            });

            peersRef.current[targetId] = peer;

            setPeers((prev) => ({
                ...prev,
                [targetId]: {
                    peer,
                    stream: null,
                    userName: '',
                },
            }));

            return peer;
        },
        []
    );

    const signalPeer = useCallback((targetId, signal) => {
        const peer = peersRef.current[targetId];
        if (peer && !peer.destroyed) {
            try {
                peer.signal(signal);
            } catch (err) {
                console.error(`Failed to signal peer ${targetId}:`, err);
            }
        }
    }, []);

    const removePeer = useCallback((targetId) => {
        const peer = peersRef.current[targetId];
        if (peer) {
            try {
                peer.destroy();
            } catch (e) {
                // Already destroyed
            }
            delete peersRef.current[targetId];
        }

        setPeers((prev) => {
            const updated = { ...prev };
            delete updated[targetId];
            return updated;
        });
    }, []);

    const removeAllPeers = useCallback(() => {
        Object.keys(peersRef.current).forEach((id) => {
            try {
                peersRef.current[id].destroy();
            } catch (e) {
                // Already destroyed
            }
        });
        peersRef.current = {};
        setPeers({});
    }, []);

    const replaceStream = useCallback((newStream) => {
        const videoTrack = newStream.getVideoTracks()[0];
        if (!videoTrack) {
            console.warn('No video track found in new stream');
            return;
        }

        Object.entries(peersRef.current).forEach(([peerId, peer]) => {
            if (peer && !peer.destroyed) {
                try {
                    // Access the underlying RTCPeerConnection
                    const pc = peer._pc;
                    if (pc) {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(
                            (s) => s.track && s.track.kind === 'video'
                        );
                        if (videoSender) {
                            videoSender
                                .replaceTrack(videoTrack)
                                .then(() => {
                                    console.log(`Replaced video track for peer ${peerId}`);
                                })
                                .catch((err) => {
                                    console.error(`Failed to replace track for ${peerId}:`, err);
                                });
                        } else {
                            // No existing video sender — try finding any sender without a track
                            const emptySender = senders.find(
                                (s) => !s.track || s.track.kind === 'video'
                            );
                            if (emptySender) {
                                emptySender.replaceTrack(videoTrack).catch((err) => {
                                    console.error(`Fallback replace failed for ${peerId}:`, err);
                                });
                            } else {
                                console.warn(`No suitable sender found for peer ${peerId}`);
                            }
                        }
                    } else {
                        console.warn(`No RTCPeerConnection for peer ${peerId}`);
                    }
                } catch (err) {
                    console.error(`Failed to replace stream for ${peerId}:`, err);
                }
            }
        });
    }, []);

    return {
        peers,
        peersRef,
        createPeer,
        signalPeer,
        removePeer,
        removeAllPeers,
        replaceStream,
    };
}
