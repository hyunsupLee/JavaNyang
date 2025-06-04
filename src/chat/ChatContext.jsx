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

   // 이메일에서 @ 앞부분만 추출하는 함수
  const formatEmailToUsername = (email) => {
    if (!email) return '사용자';
    if (email.includes('@')) {
      return email.split('@')[0];
    }
    return email;
  };

  // const userName = userInfo?.name || user?.email || '사용자';
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
    
    setMessages(prevMessages => [...prevMessages, payload.new]);
  };

  // 초기 메시지 로드
  const getInitialMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
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
        .subscribe((status) => {
          console.log('구독 상태:', status);
          if (status === 'CHANNEL_ERROR') {
            setError({ message: '실시간 연결에 문제가 있습니다.' });
          }
        });
    }
  };

  // 메시지 전송
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    if (!user) {
      setError({ message: '로그인이 필요합니다.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          message: messageText.trim(),
          user_name: userName,
          message_type: 'text'
        }]);

      if (error) throw error;
      
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
        scrollRef: { current: null },
        scrollToBottom: () => {},
        getUserProfileImage: () => null,
        userInfoCache: {},
        clearError: () => {},
        toKoreaTime: () => new Date()
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
      getUserProfileImage,
      scrollRef,
      scrollToBottom,
      clearError,
      toKoreaTime
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