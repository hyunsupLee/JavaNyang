import { useEffect } from 'react';
import { useChat } from '../ChatContext';

const AlwaysScrollToBottom = () => {
  const { messages, loading, scrollToBottom } = useChat();

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, loading, scrollToBottom]);

  return null; // UI 렌더링 없음
};

export default AlwaysScrollToBottom;