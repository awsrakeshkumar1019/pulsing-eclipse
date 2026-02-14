'use client';

import { useState, useRef, useCallback } from 'react';

export function useMediaStream() {
    const [stream, setStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const streamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const originalStreamRef = useRef(null);

    const initStream = useCallback(async ({ video = true, audio = true } = {}) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: video
                    ? {
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        facingMode: 'user',
                    }
                    : false,
                audio: audio
                    ? {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                    : false,
            });

            streamRef.current = mediaStream;
            originalStreamRef.current = mediaStream;
            setStream(mediaStream);
            setIsAudioEnabled(audio);
            setIsVideoEnabled(video);

            return mediaStream;
        } catch (error) {
            console.error('Failed to get media stream:', error);
            // Fallback: try audio only
            if (video) {
                try {
                    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true,
                    });
                    streamRef.current = audioOnlyStream;
                    originalStreamRef.current = audioOnlyStream;
                    setStream(audioOnlyStream);
                    setIsAudioEnabled(true);
                    setIsVideoEnabled(false);
                    return audioOnlyStream;
                } catch (audioError) {
                    console.error('Failed to get audio stream:', audioError);
                }
            }
            throw error;
        }
    }, []);

    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                return audioTrack.enabled;
            }
        }
        return false;
    }, []);

    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                return videoTrack.enabled;
            }
        }
        return false;
    }, []);

    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                },
                audio: false,
            });

            screenStreamRef.current = screenStream;
            setIsScreenSharing(true);

            // Create a combined stream: screen video + original audio
            const combinedStream = new MediaStream();
            // Add the screen video track
            screenStream.getVideoTracks().forEach((track) => {
                combinedStream.addTrack(track);
            });
            // Keep the original audio track
            if (originalStreamRef.current) {
                originalStreamRef.current.getAudioTracks().forEach((track) => {
                    combinedStream.addTrack(track);
                });
            }

            // Update stream state so local video shows the screen
            streamRef.current = combinedStream;
            setStream(combinedStream);

            // Listen for when user stops screen share via browser UI
            screenStream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

            return screenStream;
        } catch (error) {
            console.error('Failed to start screen sharing:', error);
            return null;
        }
    }, []);

    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);

        // Restore the original camera stream
        if (originalStreamRef.current) {
            streamRef.current = originalStreamRef.current;
            setStream(originalStreamRef.current);
        }

        return originalStreamRef.current;
    }, []);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }
        setStream(null);
        setIsScreenSharing(false);
    }, []);

    return {
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
    };
}
