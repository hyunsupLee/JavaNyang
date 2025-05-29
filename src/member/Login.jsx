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
  const [isSubmitting, setIsSubmitting] = useState(false); // 로그인 버튼 로딩 상태만 따로

  // 세션이 존재하면 홈으로 이동
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // 이메일/비밀번호 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('로그인 실패: ' + error.message);
      setIsSubmitting(false);
    }
    // 로그인 성공 시 Context가 자동으로 갱신되므로 따로 navigate할 필요 없음
  };

  // 구글 로그인
  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/JavaNyang/login`,
          queryParams: {
            prompt: 'consent',
          },
        },
      });

      if (error) {
        alert(`구글 로그인 오류: ${error.message}`);
        console.error('구글 로그인 오류:', error);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert('구글 로그인 중 오류가 발생했습니다.');
      console.error('구글 로그인 오류:', error);
      setIsSubmitting(false);
    }
  };

  // GitHub 로그인
  const handleGitHubSignUp = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/JavaNyang/login`,
          queryParams: {
            prompt: 'consent',
          },
        },
      });

      if (error) {
        alert(`GitHub 로그인 오류: ${error.message}`);
        console.error('GitHub 로그인 오류:', error);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert('GitHub 로그인 중 오류가 발생했습니다.');
      console.error('GitHub 로그인 오류:', error);
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
            onClick={handleLogin}
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

        <div className='google2'>
          <button 
            type='button' 
            className='google2-btn'
            onClick={handleGoogleSignUp}
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
            onClick={handleGitHubSignUp}
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
