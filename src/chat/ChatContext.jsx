import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';

const ChatContext = createContext({});

const ChatProvider = ({ children }) => {
  const { user, userInfo } = useAuth();
  
  const myChannelRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [userInfoCache, setUserInfoCache] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);

   // 이메일에서 @ 앞부분만 추출하는 함수
  const formatEmailToUsername = (email) => {
    if (!email) return '사용자';
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return email;
  };

  const userName = userInfo?.name || formatEmailToUsername(user?.email) || '사용자';
  const scrollRef = useRef();

  // 시간대 변환 함수
  const toKoreaTime = (timestamp) => {
    const date = new Date(timestamp);
    return new Date(date.getTime() + (9 * 60 * 60 * 1000));
  };

  const clearError = () => setError(null);

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
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  };

  // 답장 설정 함수
  const setReplyMessage = (message) => {
    setReplyingTo(message);
  };

  // 답장 취소 함수
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // 이모지 반응 토글 함수 (한 사용자당 하나의 반응만 허용)
  const toggleReaction = async (messageId, emoji) => {
    if (!user) {
      setError({ message: '로그인이 필요합니다.' });
      return;
    }

    try {
      // 이모지 반응은 자동 스크롤 하지 않음
      setShouldAutoScroll(false);

      // 현재 메시지의 reactions 가져오기
      const { data: currentMessage, error: fetchError } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('cid', messageId)
        .single();

      if (fetchError) throw fetchError;

      const currentReactions = currentMessage.reactions || {};
      const userId = user.id;

      // 새로운 반응 객체 생성
      let updatedReactions = { ...currentReactions };

      // 먼저 해당 사용자의 모든 기존 반응을 제거
      Object.keys(updatedReactions).forEach(existingEmoji => {
        if (updatedReactions[existingEmoji]) {
          updatedReactions[existingEmoji] = updatedReactions[existingEmoji].filter(
            reaction => reaction.userId !== userId
          );
          
          // 빈 배열이면 해당 이모지 키 삭제
          if (updatedReactions[existingEmoji].length === 0) {
            delete updatedReactions[existingEmoji];
          }
        }
      });

      // 현재 선택한 이모지에 사용자가 이미 반응했는지 확인
      const currentEmojiReactions = currentReactions[emoji] || [];
      const userAlreadyReacted = currentEmojiReactions.some(reaction => reaction.userId === userId);

      // 만약 이미 같은 이모지에 반응했다면 제거만 하고 끝
      // 다른 이모지에 반응했거나 반응이 없었다면 새 반응 추가
      if (!userAlreadyReacted) {
        // 새로운 이모지 반응 추가
        updatedReactions[emoji] = [
          ...(updatedReactions[emoji] || []),
          {
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString()
          }
        ];
      }

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions: updatedReactions })
        .eq('cid', messageId);

      if (updateError) throw updateError;

      // 로컬 메시지 상태 업데이트 (실시간 구독이 있지만 즉시 반영을 위해)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.cid === messageId 
            ? { ...msg, reactions: updatedReactions }
            : msg
        )
      );

      // 잠시 후 자동 스크롤 다시 활성화
      setTimeout(() => setShouldAutoScroll(true), 500);

    } catch (error) {
      console.error('반응 처리 실패:', error);
      setError({ message: '반응 처리에 실패했습니다.' });
      setShouldAutoScroll(true);
    }
  };

  // 초기화
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

  // 새 메시지 수신 처리
  const handleNewMessage = async (payload) => {
    if (payload.new.uid && !userInfoCache[payload.new.uid]) {
      await getUserInfo(payload.new.uid);
    }
    
    // 새 메시지는 자동 스크롤 활성화
    setShouldAutoScroll(true);
    setMessages(prevMessages => [...prevMessages, payload.new]);
  };

  // 메시지 업데이트 처리 (반응 변경 시)
  const handleMessageUpdate = async (payload) => {
    // 메시지 업데이트는 자동 스크롤 하지 않음
    setShouldAutoScroll(false);
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.cid === payload.new.cid ? payload.new : msg
      )
    );
    // 잠시 후 자동 스크롤 다시 활성화
    setTimeout(() => setShouldAutoScroll(true), 500);
  };

  // 초기 메시지 로드
  const getInitialMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*") // reactions와 reply_to_message_id가 기본으로 포함됨
        .order("cid", { ascending: false })
        .limit(50);

      if (error) throw error;

      // 사용자 정보들 병렬 로드
      if (data?.length > 0) {
        const uniqueUids = [...new Set(data.map(msg => msg.uid).filter(uid => uid))];
        const userInfoPromises = uniqueUids.map(uid => 
          !userInfoCache[uid] ? getUserInfo(uid) : null
        );
        await Promise.all(userInfoPromises);
      }
      
      setMessages((data || []).reverse());
      
    } catch (error) {
      console.error('메시지 로드 에러:', error);
      setError({ message: '메시지를 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 메시지 로드 + 실시간 구독
  const getMessagesAndSubscribe = async () => {
    clearError();
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
          console.log('구독 상태:', status);
          if (status === 'CHANNEL_ERROR') {
            setError({ message: '실시간 연결에 문제가 있습니다.' });
          }
        });
    }
  };

  // 텍스트 메시지 전송
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    if (!user) {
      setError({ message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const messageData = {
        message: messageText.trim(),
        user_name: userName,
        message_type: 'text',
        reactions: {}
      };

      // 답장인 경우 원본 메시지 ID 추가
      if (replyingTo) {
        messageData.reply_to_message_id = replyingTo.cid;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) throw error;
      
      // 답장 상태 초기화
      setReplyingTo(null);
      // 새 메시지 전송 시 자동 스크롤 활성화
      setShouldAutoScroll(true);
      
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setError({ message: '메시지 전송에 실패했습니다.' });
      throw error;
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getUserProfileImage = (uid) => {
    return userInfoCache[uid]?.profimg || null;
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <ChatContext.Provider value={{
        messages: [],
        loading: false,
        error: { message: '로그인 후 채팅을 이용할 수 있습니다.' },
        userName: '',
        sendMessage: () => {},
        toggleReaction: () => {},
        setReplyMessage: () => {},
        cancelReply: () => {},
        replyingTo: null,
        scrollRef: { current: null },
        scrollToBottom: () => {},
        getUserProfileImage: () => null,
        userInfoCache: {},
        clearError: () => {},
        toKoreaTime: () => new Date(),
        shouldAutoScroll: true
      }}>
        {children}
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider value={{
      messages,
      loading,
      error,
      userName,
      user,
      userInfoCache,
      sendMessage,
      toggleReaction,
      setReplyMessage,
      cancelReply,
      replyingTo,
      getUserProfileImage,
      scrollRef,
      scrollToBottom,
      clearError,
      toKoreaTime,
      shouldAutoScroll
    }}>
      {children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat은 ChatProvider 내에서 사용해야 합니다');
  }
  return context;
};

export { ChatProvider, useChat };