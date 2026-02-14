'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Video, Mic, MessageSquare, Monitor, Sparkles } from 'lucide-react';
import '../styles/home.css';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [pendingRoomId, setPendingRoomId] = useState('');

  const handleCreateMeeting = () => {
    const roomId = uuidv4().split('-')[0];
    setPendingRoomId(roomId);
    setShowNameModal(true);
  };

  const handleJoinMeeting = () => {
    if (joinCode.trim()) {
      setPendingRoomId(joinCode.trim());
      setShowNameModal(true);
    }
  };

  const handleEnterRoom = () => {
    const name = userName.trim() || `User-${Math.floor(Math.random() * 1000)}`;
    sessionStorage.setItem('meetup-username', name);
    router.push(`/room/${pendingRoomId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJoinMeeting();
    }
  };

  const handleModalKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEnterRoom();
    }
  };

  return (
    <div className="home-container">
      {/* Animated Background */}
      <div className="home-bg">
        <div className="home-bg-orb" />
        <div className="home-bg-orb" />
        <div className="home-bg-orb" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="navbar-logo-icon">
            <Video size={20} />
          </div>
          <span>MeetUp</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Free &amp; Open Source
        </div>

        <h1 className="hero-title">
          Connect Face to Face,
          <br />
          <span className="hero-title-gradient">From Anywhere</span>
        </h1>

        <p className="hero-subtitle">
          Crystal-clear video calls, real-time chat, and seamless screen sharing.
          No downloads, no signups — just instant meetings.
        </p>

        <div className="hero-actions">
          <button
            id="create-meeting-btn"
            className="btn-create"
            onClick={handleCreateMeeting}
          >
            <Sparkles size={20} />
            <span>Create Instant Meeting</span>
          </button>

          <div className="divider">or join with a code</div>

          <div className="join-form">
            <input
              id="join-code-input"
              className="join-input"
              type="text"
              placeholder="Enter meeting code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              id="join-meeting-btn"
              className="btn-join"
              onClick={handleJoinMeeting}
              disabled={!joinCode.trim()}
            >
              Join
            </button>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon feature-icon-video">
            <Video size={24} />
          </div>
          <h3 className="feature-title">HD Video Calls</h3>
          <p className="feature-desc">
            Crystal-clear video with adaptive quality. Supports multiple
            participants in a responsive grid layout.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon feature-icon-audio">
            <Mic size={24} />
          </div>
          <h3 className="feature-title">Clear Audio</h3>
          <p className="feature-desc">
            Echo cancellation and noise suppression built in. Mute and unmute
            with a single tap.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon feature-icon-chat">
            <MessageSquare size={24} />
          </div>
          <h3 className="feature-title">Real-Time Chat</h3>
          <p className="feature-desc">
            Send messages instantly during your call. Share links, notes, and
            ideas without interrupting.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon feature-icon-screen">
            <Monitor size={24} />
          </div>
          <h3 className="feature-title">Screen Sharing</h3>
          <p className="feature-desc">
            Share your entire screen or a specific window. Perfect for
            presentations and collaboration.
          </p>
        </div>
      </section>

      {/* Name Modal */}
      {showNameModal && (
        <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">What&apos;s your name?</h2>
            <p className="modal-subtitle">
              This will be shown to other participants in the meeting.
            </p>
            <input
              className="modal-input"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={handleModalKeyDown}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="modal-btn-secondary"
                onClick={() => setShowNameModal(false)}
              >
                Cancel
              </button>
              <button
                id="enter-room-btn"
                className="modal-btn-primary"
                onClick={handleEnterRoom}
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
