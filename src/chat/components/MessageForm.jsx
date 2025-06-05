import React, { useState, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { useChat } from '../ChatContext';
import '../Chat.css';

function MessageForm({ onSendMessage }) {
  const { replyingTo, cancelReply } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  // 이메일에서 @ 앞부분만 추출하는 함수
  const formatUserName = (name) => {
    if (!name) return '사용자';
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    return name;
  };

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

  // 답장 미리보기 컴포넌트
  const ReplyPreview = () => {
    if (!replyingTo) return null;

    return (
      <div className="reply-preview">
        <div className="reply-preview-content">
          <span className="reply-preview-label">↩️ {formatUserName(replyingTo.user_name)}님에게 답장</span>
          <p className="reply-preview-text">
            {replyingTo.message.length > 100 
              ? replyingTo.message.substring(0, 100) + '...' 
              : replyingTo.message}
          </p>
        </div>
        <button 
          onClick={cancelReply} 
          className="cancel-reply"
          type="button"
          title="답장 취소"
        >
          ✕
        </button>
      </div>
    );
  };
  
  return (
    <div className="message-input-area">
      {/* 답장 미리보기 */}
      <ReplyPreview />
      
      <form onSubmit={handleSendMessage} className="message-form">
        <textarea
          ref={textareaRef}
          className="form-control message-textarea"
          placeholder={
            replyingTo 
              ? `${formatUserName(replyingTo.user_name)}님에게 답장... (Shift+Enter로 줄바꿈)`
              : "메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          }
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