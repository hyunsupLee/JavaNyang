import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import { useChat } from '../ChatContext';

function Message({ 
  message, isMyMessage, userName, user,
  getUserProfileImage, showAvatar = true, showUsername = true   
}) {
  const { toggleReaction, setReplyMessage, messages, formatEmailToUsername } = useChat();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const availableEmojis = ['👍', '👎', '😏', '🥱', '😢', '🤬'];

  // 시간 포맷팅 (HH:MM) 
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return koreaTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 프로필 이미지 가져오기
  const getProfileImage = (message) => {
    if (message.user_name === userName || message.uid === user?.id) {
      return null;
    }
    const profileImg = getUserProfileImage(message.uid);
    return getImageUrl(profileImg);
  };

  // 답장할 원본 메시지 찾기
  const findOriginalMessage = (replyToId) => {
    return messages.find(msg => msg.cid === replyToId);
  };

  // 원본 메시지 위치 최상단으로
  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
      
      messageElement.classList.add('message-highlight');
      
      setTimeout(() => {
        messageElement.classList.remove('message-highlight');
      }, 1200);
    }
  };

  const handleEmojiClick = (emoji) => {
    toggleReaction(message.cid, emoji);
    setShowEmojiPicker(false);
  };

  // 답장된 메시지 표시 컴포넌트
  const ReplyToMessage = ({ replyToId }) => {
    if (!replyToId) return null;
    
    const originalMessage = findOriginalMessage(replyToId);
    if (!originalMessage) {
      return (
        <div className="reply-to-message">
          <div className="reply-indicator"></div>
          <div className="reply-content">
            <span className="reply-user">삭제된 메시지</span>
            <span className="reply-text">이 메시지는 더 이상 사용할 수 없습니다.</span>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="reply-to-message clickable" 
        onClick={() => scrollToMessage(originalMessage.cid)}
        title="원본 메시지로 이동"
      >
        <div className="reply-indicator"></div>
        <div className="reply-content">
          <span className="reply-user">{formatEmailToUsername(originalMessage.user_name)}</span>
          <span className="reply-text">
            {originalMessage.message.length > 50 
              ? originalMessage.message.substring(0, 50) + '...' 
              : originalMessage.message}
          </span>
        </div>
      </div>
    );
  };

  // 반응 표시 컴포넌트
  const ReactionDisplay = ({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
      <div className="reaction-display">
        {Object.entries(reactions).map(([emoji, reactionList]) => {
          if (!reactionList || reactionList.length === 0) return null;
          
          const count = reactionList.length;
          const userReacted = reactionList.some(reaction => reaction.userId === user?.id);
          const reactorNames = reactionList.map(r => formatEmailToUsername(r.userName)).join(', ');
          
          return (
            <button
              key={emoji}
              className={`reaction-item ${userReacted ? 'user-reacted' : ''}`}
              onClick={() => handleEmojiClick(emoji)}
              title={`${reactorNames}님이 반응했습니다`}
            >
              {emoji} {count}
            </button>
          );
        })}
      </div>
    );
  };

  // 이모지 선택기 컴포넌트
  const EmojiPicker = () => {
    if (!showEmojiPicker) return null;

    return (
      <div className="emoji-picker">
        {availableEmojis.map(emoji => (
          <button
            key={emoji}
            className="emoji-option"
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };
  const profileImage = getProfileImage(message);

  return (
    <div 
      className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}
      data-message-id={message.cid}
    >
      {/* 프로필 이미지 (상대방일 때만, 연속 메시지가 아닐 때만) */}
      {!isMyMessage && (
        <div className="message-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
          <img
            src={profileImage}
            alt={`${formatEmailToUsername(message.user_name)} 프로필`}
            className="avatar-image"
            onError={(e) => { e.target.src = getImageUrl(null); }}
          />
        </div>
      )}

      <div className="message-wrapper">
        {/* 사용자 이름 (상대방이고, 연속 메시지가 아닐 때만) */}
        {!isMyMessage && showUsername && (
          <div className="message-username">
            {formatEmailToUsername(message.user_name)}
          </div>
        )}

        {/* 메시지 내용과 시간을 담는 컨테이너 */}
        <div className="message-content-wrapper">
          <div className={`message-content ${isMyMessage ? 'my-content' : 'other-content'}`}>
            {/* 답장된 메시지 표시 */}
            <ReplyToMessage replyToId={message.reply_to_message_id} />
            
            <div className="message-text">
              {message.message}
            </div>
          </div>
          
          {/* 이모지 반응 추가 버튼 - 말풍선 바깥에 */}
          <div className="message-actions">
            <button 
              className="emoji-add-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="반응 추가"
            >
              👍
            </button>
            <button 
              className="reply-button"
              onClick={() => setReplyMessage(message)}
              title="답장"
            >
              ↩️ 
            </button>
            <EmojiPicker />
          </div>
          
          {/* 시간은 메시지 옆에 표시 */}
          <div className="message-time">
            {formatTime(message.created_at)}
          </div>
        </div>

        {/* 반응 표시 */}
        <ReactionDisplay reactions={message.reactions} />
      </div>
    </div>
  );
}

export default Message;