'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ChatPanel({ messages, onSendMessage, onClose, currentUserId }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3 className="chat-header-title">
                    <MessageSquare size={18} />
                    In-call Messages
                </h3>
                <button className="chat-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <MessageSquare size={40} />
                        <p>No messages yet</p>
                        <p style={{ fontSize: '0.8rem' }}>
                            Messages are only visible during the call
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-message ${msg.senderId === currentUserId ? 'own' : ''
                                }`}
                        >
                            <div className="chat-message-header">
                                <span className="chat-message-sender">
                                    {msg.senderId === currentUserId ? 'You' : msg.userName}
                                </span>
                                <span className="chat-message-time">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            <div className="chat-message-bubble">{msg.message}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    ref={inputRef}
                    className="chat-input"
                    type="text"
                    placeholder="Send a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
