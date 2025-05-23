import './Login.css';
import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 세션 확인 및 로그인 상태 유지
  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 세션 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 로그인 함수
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('로그아웃 실패: ' + error.message);
    }
  };

  // 로딩 중일 때
  if (loading) {
    return <div>로딩 중...</div>;
  }

  // 로그인된 상태일 때
  if (session) {
    return (
      <div id='create_user2'>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>환영합니다, {session.user.email}님!</h2>
          <p>로그인이 완료되었습니다.</p>
          <button onClick={handleLogout} className='submit_btn'>
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 로그인 화면
  return (
    <div id='create_user2'>
      <div id='login_left'>
        <p className='sign_up2'>Welcome 자바냥</p>
        <img></img>
      </div>
      <div id='login_right'>
        <div className='email'>
          <label>Email</label>
          <input 
            type='email' 
            placeholder='google@gmail.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='pw2'>
          <label>Password</label>
          <input 
            type='password' 
            placeholder='********'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className='LS'>
          <button className='submit_btn' type='submit' onClick={handleLogin}>
            Login
          </button>
          <button className='submit_btn' type='submit'>Sign up</button>
        </div>
        <div className='google2'>
          <img></img>
          <a href='#'>Use Goolgle account</a>
        </div>
        <div className='git2'>
          <img></img>
          <a href='#'>Use Git account</a>
        </div>
      </div>
    </div>
  );
}

export default App;