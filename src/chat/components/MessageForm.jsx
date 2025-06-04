import React, { useState, useRef } from 'react';
import { Button } from 'react-bootstrap';
import '../Chat.css';

function MessageForm({ onSendMessage }) {
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  // 메시지 전송
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(messageInput);
      setMessageInput('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (error) {
      console.error('전송 실패:', error);
    } finally {
      setSending(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  return (
    <div className="message-input-area">
      <form onSubmit={handleSendMessage} className="message-form">
        <textarea
          ref={textareaRef}
          className="form-control message-textarea"
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="2"
          disabled={sending}
          autoFocus
        />
        <Button 
          type="submit" 
          variant="primary"
          disabled={!messageInput.trim() || sending}
          className="send-button"
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            '전송'
          )}
        </Button>
      </form>
    </div>
  );
}

export default MessageForm;