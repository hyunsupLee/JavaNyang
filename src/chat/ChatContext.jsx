import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';

const ChatContext = createContext({});

const ChatProvider = ({ children }) => {
  const { user, userInfo, displayName, formatEmailToUsername  } = useAuth();
  
  // 상태관리
  const [messages, setMessages] = useState([]);
  const [userInfoCache, setUserInfoCache] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false); // 🆕 읽지 않은 메시지 알림
  
  // Ref
  const myChannelRef = useRef(null);
  const scrollRef = useRef();
  // 👇 사용자명 - AuthContext의 displayName 사용
  const userName = displayName;


  // 사용자 관련
  // const userName = userInfo?.name || formatEmailToUsername(user?.email) || '사용자';

  // 🆕 강제로 맨 아래로 스크롤 + 알림 제거
  const forceScrollToBottom = () => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setHasUnreadMessages(false);
    setShouldAutoScroll(true); // 다시 자동 스크롤 모드로
  }
};
  // 1. 스크롤 관련 함수들 추가 (forceScrollToBottom 함수 근처에)
const isScrolledToBottom = () => {
  if (!scrollRef.current) return true;
  
  const element = scrollRef.current;
  const threshold = 100; // 100px로 여유값 증가
  
  const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
  
  return isAtBottom;
};

const handleScroll = () => {
  const atBottom = isScrolledToBottom();
  
  if (atBottom) {
    setHasUnreadMessages(false);
  }
};





  // 사용자 정보 조회 및 캐시
  const getUserInfo = async (uid) => {
    if (userInfoCache[uid]) return userInfoCache[uid];

    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) throw error;

      setUserInfoCache(prev => ({ ...prev, [uid]: data }));
      return data;
    } catch (error) {
      return null;
    }
  };

  const getUserProfileImage = (uid) => {
    return userInfoCache[uid]?.profimg || null;
  };

  // 답장 관련 함수들
  const setReplyMessage = (message) => setReplyingTo(message);
  const cancelReply = () => setReplyingTo(null);

  // 이모지 반응 함수
  const toggleReaction = async (messageId, emoji) => {
    try {
      const { data: currentMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('cid', messageId)
        .single();

      if (fetchError) throw fetchError;

      const currentReactions = currentMessage.reactions || {};
      const userId = user.id;
      let updatedReactions = { ...currentReactions };

      Object.keys(updatedReactions).forEach(existingEmoji => {
        if (updatedReactions[existingEmoji]) {
          updatedReactions[existingEmoji] = updatedReactions[existingEmoji].filter(
            reaction => reaction.userId !== userId
          );
          
          if (updatedReactions[existingEmoji].length === 0) {
            delete updatedReactions[existingEmoji];
          }
        }
      });

      const userAlreadyReacted = (currentReactions[emoji] || [])
        .some(reaction => reaction.userId === userId);

      if (!userAlreadyReacted) {
        updatedReactions[emoji] = [
          ...(updatedReactions[emoji] || []),
          {
            userId,
            userName,
            timestamp: new Date().toISOString()
          }
        ];
      }

      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions: updatedReactions })
        .eq('cid', messageId);

      if (updateError) throw updateError;

      setMessages(prevMessages => {
        const messageIndex = prevMessages.findIndex(msg => msg.cid === messageId);
        if (messageIndex === -1) return prevMessages;
        
        const newMessages = [...prevMessages];
        newMessages[messageIndex] = { 
          ...newMessages[messageIndex], 
          reactions: updatedReactions 
        };
        return newMessages;
      });
    } catch (error) {
      setError({ message: '반응 처리에 실패했습니다.' });
    }
  };

  // 메시지 전송
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    try {
      const messageData = {
        message: messageText.trim(),
        user_name: userName,
        reactions: {},
        ...(replyingTo && { reply_to_message_id: replyingTo.cid })
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) throw error;
      
      setReplyingTo(null);
      setShouldAutoScroll(true); // 내 메시지는 스크롤됨
      
    } catch (error) {
      setError({ message: '메시지 전송에 실패했습니다.' });
      throw error;
    }
  };

  // 스크롤 함수
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  
  // 🆕 새 메시지 수신 처리 (초기 로드 후에만 알림)
const handleNewMessage = async (payload) => {
  if (payload.new.uid && !userInfoCache[payload.new.uid]) {
    await getUserInfo(payload.new.uid);
  }
  
  const isMyMessage = payload.new.uid === user?.id;
  
  // 🆕 메시지 추가 **전**에 스크롤 위치 미리 체크
  const wasAtBottom = isScrolledToBottom();
  
  // 메시지 추가
  setMessages(prevMessages => [...prevMessages, payload.new]);
  
  if (isMyMessage) {
    // 내 메시지면 항상 스크롤
    setShouldAutoScroll(true);
    setHasUnreadMessages(false);
  } else {
    // 상대방 메시지일 때
    if (!loading) { // 초기 로드 중이 아닐 때만
      if (wasAtBottom) {
        // 맨 아래에 있었으면 자동 스크롤
        setShouldAutoScroll(true);
        setHasUnreadMessages(false);
      } else {
        // 맨 아래가 아니었으면 알림만 표시
        setHasUnreadMessages(true);
        setShouldAutoScroll(false);
      }
    } else {
      // 초기 로드 중이면 스크롤
      setShouldAutoScroll(true);
    }
  }
};

  // 메시지 업데이트 처리 (반응 변경 시)
  const handleMessageUpdate = async (payload) => {
    setMessages(prevMessages => {
      const messageIndex = prevMessages.findIndex(msg => msg.cid === payload.new.cid);
      if (messageIndex === -1) return prevMessages;
      
      const newMessages = [...prevMessages];
      newMessages[messageIndex] = payload.new;
      return newMessages;
    });
  };

  // 초기 메시지 로드
  const getInitialMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("cid", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data?.length > 0) {
        const uniqueUids = [...new Set(data.map(msg => msg.uid).filter(Boolean))];
        const userInfoPromises = uniqueUids
          .filter(uid => !userInfoCache[uid])
          .map(uid => getUserInfo(uid));
        
        await Promise.all(userInfoPromises);
      }
      
      setMessages(data?.reverse() || []);
      
    } catch (error) {
      setError({ message: '메시지를 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 메시지 로드 + 실시간 구독
  const getMessagesAndSubscribe = async () => {
    await getInitialMessages();

    if (!myChannelRef.current) {
      myChannelRef.current = supabase
        .channel("chat-realtime")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "chat_messages"
        }, handleNewMessage)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages"
        }, handleMessageUpdate)
        .subscribe((status) => {
          console.log('상태:', status);
          if (status === 'CHANNEL_ERROR') {
            setError({ message: '실시간 연결에 문제가 있습니다.' });
          }
        });
    }
  };

  // 이펙트 훅
  useEffect(() => {
    if (user && userInfo) {
      getMessagesAndSubscribe();
    }
    return () => {
      if (myChannelRef.current) {
        supabase.removeChannel(myChannelRef.current);
        myChannelRef.current = null;
      }
    };
  }, [user, userInfo]);

useEffect(() => {
  const scrollElement = scrollRef.current;
  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }
}, []);

// Al~ 파일에서 구현
// useEffect(() => {
//   if (shouldAutoScroll && scrollRef.current && !loading) {
//     setTimeout(() => {
//       scrollToBottom();
//       setHasUnreadMessages(false);
//     }, 100); // 약간의 딜레이 추가
//   }
// }, [messages, shouldAutoScroll, loading]);

  // Context Value
  const contextValue = {
    // 상태
    messages,
    loading,
    error,
    userName,
    user,
    userInfoCache,
    replyingTo,
    shouldAutoScroll,
    scrollRef,
    hasUnreadMessages,
    
    // 함수들
    sendMessage,
    toggleReaction,
    setReplyMessage,
    cancelReply,
    getUserProfileImage,
    scrollToBottom,
    forceScrollToBottom,
    formatEmailToUsername
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// 커스텀 훅
const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat은 ChatProvider 내에서 사용해야 합니다');
  }
  return context;
};

export { ChatProvider, useChat };