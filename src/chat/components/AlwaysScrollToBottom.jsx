import { useEffect, useRef } from 'react';
import { useChat } from '../ChatContext';

const AlwaysScrollToBottom = () => {
  const { messages, loading, scrollToBottom, shouldAutoScroll, user } = useChat();
  const isInitialLoad = useRef(true); // 초기 로드 체크
  const prevMessagesLength = useRef(0); // 이전 메시지 개수 추적
  // useRef: 값이 바뀌어도 컴포넌트 다시 렌더링x

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // 처음 로드일 때는 무조건 맨 아래로
      if (isInitialLoad.current) {
        setTimeout(scrollToBottom, 100);
        isInitialLoad.current = false;
        prevMessagesLength.current = messages.length;
        return;
      }

      // 🆕 메시지 개수가 증가했을 때만 스크롤 (새 메시지 추가)
      if (messages.length > prevMessagesLength.current) {
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.uid === user?.id;

        if (isMyMessage && shouldAutoScroll) {
          setTimeout(scrollToBottom, 100);
        }
        
        prevMessagesLength.current = messages.length;
      }
      // 메시지 개수가 같으면 업데이트(이모지 반응)이므로 스크롤 안 함
    }
  }, [messages.length, loading, scrollToBottom, shouldAutoScroll, user?.id]);

  return null;
};

export default AlwaysScrollToBottom;