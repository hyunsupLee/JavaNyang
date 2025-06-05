import './Login.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate(); 
  const { user, session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('로그인 실패: ' + error.message);
      setIsSubmitting(false);
    } else {
      const { data: userInfo, error: userInfoError } = await supabase
        .from('user_info')
        .select('name')
        .eq('uid', data.user.id)
        .single();

      if (userInfoError) {
        console.error('사용자 이름 조회 오류:', userInfoError);
        sessionStorage.setItem("welcomeMessage", email);
      } else {
        sessionStorage.setItem("welcomeMessage", userInfo.name);
      }

      navigate('/');
      window.location.reload(); // ✅ 로그인 성공 후 새로고침
    }
  };

  const handleOAuthLogin = async (provider) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/JavaNyang/login`,
          queryParams: {
            prompt: 'consent',
          },
        },
      });

      if (error) {
        alert(`${provider} 로그인 오류: ${error.message}`);
        console.error(`${provider} 로그인 오류:`, error);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert(`${provider} 로그인 중 오류가 발생했습니다.`);
      console.error(`${provider} 로그인 오류:`, error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div id='create_user2' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div id='create_user2'>
      <div id='login_left'>
        <p className='sign_up2'>Welcome 자바냥</p>
        <img src="./img_loginCat.png" alt="loginCat" />
      </div>
      <div id='login_right'>

        {/* ✅ form 시작 */}
        <form onSubmit={handleLogin} className='signup_form'>
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
            <button 
              className='submit_btn' 
              type='submit' 
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
            <button 
              className='submit_btn' 
              type='button'
              onClick={() => navigate('/join')}
            >
              회원가입
            </button>
          </div>
        </form>
        {/* ✅ form 끝 */}

        <div className='google2'>
          <button 
            type='button' 
            className='google2-btn'
            onClick={() => handleOAuthLogin('google')}
            disabled={isSubmitting}
          >
            <img src="./ico_google.png" alt="Google" />
            {isSubmitting ? '로그인 중...' : 'Google로 로그인'}
          </button>
        </div>

        <div className='git2'>
          <button 
            type='button' 
            className='git2-btn'
            onClick={() => handleOAuthLogin('github')}
            disabled={isSubmitting}
          >
            <img src="./ico_github.png" alt="GitHub" />
            {isSubmitting ? '로그인 중...' : 'GitHub로 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
