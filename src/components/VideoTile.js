'use client';

import { useRef, useEffect } from 'react';
import { MicOff, Mic } from 'lucide-react';

export default function VideoTile({
    stream,
    userName,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isScreenSharing = false,
}) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const initials = userName
        ? userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
        : '?';

    // Don't mirror the video when screen sharing (text would be unreadable)
    const shouldMirror = isLocal && !isScreenSharing;

    return (
        <div className={`video-tile ${isLocal ? 'local' : ''}`}>
            {stream && !isVideoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={shouldMirror ? 'mirror' : ''}
                />
            ) : (
                <div className="video-tile-avatar">
                    <div className="video-tile-avatar-circle">{initials}</div>
                </div>
            )}

            <div className="video-tile-info">
                <span className="video-tile-name">
                    {userName || 'Unknown'}
                    {isLocal && <span className="video-tile-tag">You</span>}
                </span>
                <div className="video-tile-indicators">
                    <span
                        className={`video-tile-indicator ${isMuted ? 'muted' : 'active'}`}
                    >
                        {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                    </span>
                </div>
            </div>
        </div>
    );
}
