'use client';

import VideoTile from './VideoTile';

export default function VideoGrid({
    localStream,
    peers,
    userName,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
}) {
    const peerEntries = Object.entries(peers);
    const totalParticipants = 1 + peerEntries.length;

    const getGridClass = () => {
        if (totalParticipants === 1) return 'grid-1';
        if (totalParticipants === 2) return 'grid-2';
        if (totalParticipants === 3) return 'grid-3';
        if (totalParticipants === 4) return 'grid-4';
        return 'grid-many';
    };

    return (
        <div className={`video-grid ${getGridClass()}`}>
            {/* Local video */}
            <VideoTile
                stream={localStream}
                userName={userName}
                isLocal={true}
                isMuted={!isAudioEnabled}
                isVideoOff={!isVideoEnabled}
                isScreenSharing={isScreenSharing}
            />

            {/* Remote videos */}
            {peerEntries.map(([peerId, peerData]) => (
                <VideoTile
                    key={peerId}
                    stream={peerData.stream}
                    userName={peerData.userName || `Participant`}
                    isLocal={false}
                    isMuted={peerData.isMuted || false}
                    isVideoOff={peerData.isVideoOff || false}
                />
            ))}
        </div>
    );
}
