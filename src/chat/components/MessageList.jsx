import React from 'react';
import Message from './Message';
import '../Chat.css';

function MessageList({ 
  messages, 
  userName, 
  user, 
  getUserProfileImage, 
  scrollRef 
}) {
  // 이메일에서 @ 앞부분만 추출하는 함수
  const formatUserName = (name) => {
    if (!name) return '사용자';
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    return name;
  };

  // 날짜 포맷팅 (YYYY년 M월 D일 요일)
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));

    const year = koreaTime.getFullYear();
    const month = koreaTime.getMonth() + 1;
    const day = koreaTime.getDate();

    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[koreaTime.getDay()];

    return `${year}년 ${month}월 ${day}일 ${weekday}`;
  };

  // 같은 날인지 확인하는 함수
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const korea1 = new Date(d1.getTime() + (9 * 60 * 60 * 1000));
    const korea2 = new Date(d2.getTime() + (9 * 60 * 60 * 1000));

    return korea1.getFullYear() === korea2.getFullYear() &&
      korea1.getMonth() === korea2.getMonth() &&
      korea1.getDate() === korea2.getDate();
  };

  // 연속 메시지인지 확인하는 함수 (카카오톡 스타일)
  const isConsecutiveMessage = (currentMsg, prevMsg) => {
    if (!prevMsg) return false;
    
    // 같은 사용자인지 확인
    const sameUser = currentMsg.uid === prevMsg.uid || 
                     currentMsg.user_name === prevMsg.user_name;
    
    // 시간 차이가 5분 이내인지 확인
    const currentTime = new Date(currentMsg.created_at);
    const prevTime = new Date(prevMsg.created_at);
    const timeDiff = (currentTime - prevTime) / 1000 / 60; // 분 단위
    
    return sameUser && timeDiff <= 5;
  };

  // 메시지를 날짜별로 그룹화하고 연속 메시지 처리
  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = message.created_at;
      const prevMessage = index > 0 ? messages[index - 1] : null;

      // 첫 번째 메시지이거나 날짜가 다르면 날짜 헤더 추가
      if (index === 0 || !isSameDay(currentDate, messageDate)) {
        grouped.push({
          type: 'date-header',
          date: messageDate,
          id: `date-${messageDate}`
        });
        currentDate = messageDate;
      }

      // 연속 메시지 여부 확인
      const isConsecutive = isConsecutiveMessage(message, prevMessage);

      // 메시지 추가
      grouped.push({
        type: 'message',
        data: {
          ...message,
          user_name: formatUserName(message.user_name)
        },
        isConsecutive: isConsecutive,
        id: message.cid || `temp-${index}`
      });
    });

    return grouped;
  };

  // 메시지 그룹화 실행
  const groupedItems = groupMessagesByDate(messages);

  return (
    <div
      className="chat-messages"
      style={{ height: window.innerHeight - 205 }}
      ref={scrollRef}
    >
      {/* 메시지가 없을 때 */}
      {messages.length === 0 && (
        <div className="no-messages">
          <p>아직 메시지가 없습니다.</p>
          <p>첫 번째 메시지를 보내보세요! 💬</p>
        </div>
      )}

      {/* 날짜별로 그룹화된 메시지 목록 */}
      {groupedItems.map((item) => {
        if (item.type === 'date-header') {
          return (
            <div key={item.id} className="date-header">
              <div className="date-line">
                <span className="date-text">
                  {formatDate(item.date)}
                </span>
              </div>
            </div>
          );
        }

        // 메시지 렌더링
        const message = item.data;
        const isMyMessage = message.user_name === formatUserName(userName) || message.uid === user?.id;

        return (
          <Message
            key={item.id}
            message={message}
            isMyMessage={isMyMessage}
            userName={formatUserName(userName)}
            user={user}
            getUserProfileImage={getUserProfileImage}
            showAvatar={!item.isConsecutive} // 연속 메시지면 아바타 숨김
            showUsername={!item.isConsecutive} // 연속 메시지면 사용자명 숨김
          />
        );
      })}
    </div>
  );
}

export default MessageList;