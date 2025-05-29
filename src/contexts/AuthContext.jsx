import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "../config/SupabaseClient";
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null); // 사용자 정보 상태 추가

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getSessionAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // 사용자 추가 정보 불러오기
        const { data, error } = await supabase
          .from('user_info')
          .select('*')
          .eq('uid', session.user.id)
          .single();

        if (!error) {
          setUserInfo(data);

          const path = location.pathname.toLowerCase();
           // 관리자 페이지 접근 제어
          if (path.startsWith('/admin')) {
            if (data.role === 2) {
              const quizPaths = [
                '/adminquizs'
              ];
              const allowed = quizPaths.some(quizPath => path === quizPath || path.startsWith(quizPath + '/'));
              if (!allowed) {
                alert('레벨 2는 퀴즈 관리 페이지만 접근할 수 있습니다.');
                navigate('/');
                return;
              }
            } else if (data.role < 2) {
              alert('접근 권한이 없습니다.');
              navigate('/');
              return;
            }
          }
        }
      } else {
  setUserInfo(null);
  const path = location.pathname.toLowerCase();
  const allowedPaths = ['/', '/home', '/login', '/join'];

  if (!allowedPaths.includes(path)) {
    setTimeout(() => {
      navigate('/home');
    }, 0);
  }
}

      setLoading(false);
    };
    getSessionAndUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const value = { session, user, userInfo, loading }; // userInfo 포함
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
