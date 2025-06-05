import { useEffect } from 'react';
import { useChat } from '../ChatContext';

const AlwaysScrollToBottom = () => {
  const { messages, loading, scrollToBottom, shouldAutoScroll } = useChat();

  // 새 메시지 시 자동 스크롤 (shouldAutoScroll이 true일 때만)
  useEffect(() => {
    if (messages.length > 0 && !loading && shouldAutoScroll) {
      setTimeout(scrollToBottom, 500);
    }
  }, [messages.length, loading, scrollToBottom, shouldAutoScroll]);

  return null; // UI 렌더링 없음
};

export default AlwaysScrollToBottom;