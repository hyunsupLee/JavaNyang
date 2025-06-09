import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useChat } from './ChatContext';
import AlwaysScrollToBottom from './components/AlwaysScrollToBottom';
import MessageForm from './components/MessageForm';
import MessageList from './components/MessageList';
import './Chat.css';

function Chat() {
  const {
    messages,
    loading,
    error,
    userName,
    user,
    sendMessage,
    scrollRef,
    getUserProfileImage,
    hasUnreadMessages,
    forceScrollToBottom
  } = useChat();

  // 페이지 제목 설정
  useEffect(() => {
    document.title = '자바냥 | 실시간 채팅';
  }, []);

  // 로딩 중
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="chat-loading-container">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p className="mt-2">채팅을 불러오는 중입니다...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="chat-container">
        <AlwaysScrollToBottom />

        {/* 에러 메시지 */}
        {error && (
          <div className="chat-error-container" role="alert">
            <p>{error.message || error}</p>
          </div>
        )}

        {/* 채팅 메시지 영역 */}
        <MessageList
          messages={messages}
          userName={userName}
          user={user}
          getUserProfileImage={getUserProfileImage}
          scrollRef={scrollRef}
        />

        {/* 메시지 입력 영역 */}
        <MessageForm onSendMessage={sendMessage} />
      </Container>

      {/* 🆕 새 메시지 알림 버튼 - Container 밖으로 이동 */}
      {hasUnreadMessages && (
        <div className="new-message-notification">
          <button
            className="new-message-btn"
            onClick={forceScrollToBottom}
            aria-label="새로운 메시지로 이동"
          >
            ⬇️ 새로운 메시지
          </button>
        </div>
      )}
    </>
  );
}

export default Chat;