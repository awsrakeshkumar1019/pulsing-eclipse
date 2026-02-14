'use client';

import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    MessageSquare,
    PhoneOff,
    Users,
} from 'lucide-react';

export default function Controls({
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    unreadMessages,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onToggleChat,
    onLeaveCall,
}) {
    return (
        <div className="controls-bar">
            {/* Microphone */}
            <button
                id="toggle-audio-btn"
                className={`control-btn ${isAudioEnabled ? 'active' : 'muted'}`}
                onClick={onToggleAudio}
            >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                <span className="control-btn-tooltip">
                    {isAudioEnabled ? 'Mute' : 'Unmute'}
                </span>
            </button>

            {/* Camera */}
            <button
                id="toggle-video-btn"
                className={`control-btn ${isVideoEnabled ? 'active' : 'muted'}`}
                onClick={onToggleVideo}
            >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                <span className="control-btn-tooltip">
                    {isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                </span>
            </button>

            {/* Screen Share */}
            <button
                id="toggle-screen-btn"
                className={`control-btn ${isScreenSharing ? 'chat-active' : 'default'}`}
                onClick={onToggleScreenShare}
            >
                {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                <span className="control-btn-tooltip">
                    {isScreenSharing ? 'Stop sharing' : 'Share screen'}
                </span>
            </button>

            {/* Chat */}
            <button
                id="toggle-chat-btn"
                className={`control-btn ${isChatOpen ? 'chat-active' : 'default'}`}
                onClick={onToggleChat}
            >
                <MessageSquare size={20} />
                {unreadMessages > 0 && (
                    <span className="control-btn-badge">{unreadMessages}</span>
                )}
                <span className="control-btn-tooltip">Chat</span>
            </button>

            {/* Leave */}
            <button
                id="leave-call-btn"
                className="control-btn danger"
                onClick={onLeaveCall}
            >
                <PhoneOff size={20} />
                <span className="control-btn-tooltip">Leave call</span>
            </button>
        </div>
    );
}
