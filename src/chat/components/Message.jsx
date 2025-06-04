import React from 'react';
import { getImageUrl } from '../../utils/imageUtils';

function Message({ 
  message,              // 메시지 데이터
  isMyMessage,          // 내 메시지인지 여부  
  userName,             // 현재 사용자명
  user,                 // 현재 사용자 정보
  getUserProfileImage,   // 프로필 이미지 함수
  showAvatar = true,    // 아바타 표시 여부 (연속 메시지 처리용)
  showUsername = true   // 사용자명 표시 여부 (연속 메시지 처리용)
}) {
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

  // 이메일에서 @ 앞부분만 추출하는 함수
  const formatUserName = (name) => {
    if (!name) return '사용자';
    
    // 이메일 형태인지 확인 (@ 포함여부)
    if (name.includes('@')) {
      return name.split('@')[0]; // @ 앞부분만 반환
    }
    
    return name; // 이메일이 아니면 그대로 반환
  };

  // 프로필 이미지 가져오기
  const getProfileImage = (message) => {
    if (message.user_name === userName || message.uid === user?.id) {
      return null;
    }
    const profileImg = getUserProfileImage(message.uid);
    return getImageUrl(profileImg);
  };

  const profileImage = getProfileImage(message);

  return (
    <div className={`message-bubble ${isMyMessage ? 'my-message' : 'other-message'}`}>
      {/* 프로필 이미지 (상대방일 때만, 연속 메시지가 아닐 때만) */}
      {!isMyMessage && (
        <div className="message-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
          <img
            src={profileImage}
            alt={`${formatUserName(message.user_name)} 프로필`}
            className="avatar-image"
            onError={(e) => { e.target.src = getImageUrl(null); }}
          />
        </div>
      )}

      <div className="message-wrapper">
        {/* 사용자 이름 (상대방이고, 연속 메시지가 아닐 때만) */}
        {!isMyMessage && showUsername && (
          <div className="message-username">
            {formatUserName(message.user_name)}
          </div>
        )}

        {/* 메시지 내용과 시간을 담는 컨테이너 */}
        <div className="message-content-wrapper">
          <div className={`message-content ${isMyMessage ? 'my-content' : 'other-content'}`}>
            <div className="message-text">
              {message.message}
            </div>
          </div>
          
          {/* 시간은 메시지 옆에 표시 (카카오톡 스타일) */}
          <div className="message-time">
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;