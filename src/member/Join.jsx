import './Join.css';
import React, { useState } from 'react';
import { supabase } from './SupabaseClient';

function Join() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      setMessage('8~16자 이상의 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try { 
      // Supabase로 회원가입 요청
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setMessage(`오류: ${error.message}`);
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          setMessage('회원가입이 완료되었습니다! 바로 로그인할 수 있습니다.');
        } else {
          setMessage('회원가입이 완료되었습니다!');
        }
        
        // 입력 필드 초기화
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // 여기서 메인 페이지로 이동하거나 다른 작업 수행 가능
        console.log('회원가입 성공:', data.user);
      }
    } catch (error) {
      setMessage('회원가입 중 오류가 발생했습니다.');
      console.error('회원가입 오류:', error);
    } finally {
      setLoading(false);
    }
  };

 // GitHub 로그인 함수
  const handleGitHubSignUp = async () => {
    setMessage('GitHub 로그인 중...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin // 현재 페이지로 리다이렉트
        }
      });
      
      if (error) {
        setMessage(`GitHub 로그인 오류: ${error.message}`);
        console.error('GitHub 로그인 오류:', error);
      }
      // 성공 시에는 페이지가 리다이렉트되므로 별도 처리 불필요
    } catch (error) {
      setMessage('GitHub 로그인 중 오류가 발생했습니다.');
      console.error('GitHub 로그인 오류:', error);
    }
  };

  return (
    <div id='create_user'>
      <p className='sign_up'>회원가입</p>
      <p className='slogan'>간단한 문구 자리, 우리 사이트 슬로건</p>
      
      <div className='google'>
        <button 
          type='button' 
          className='google-btn'
          onClick={handleGitHubSignUp}
        >
          <img></img>
          GitHub로 회원가입
        </button>
      </div>
      
      <form onSubmit={handleSignUp} className='signup_form'>
        <div className='email'>
          <label>Email</label>
          <input 
            type='email' 
            placeholder='이메일을 입력하세요'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className='pw'>
          <label>Password</label>
          <input 
            type='password' 
            placeholder='비밀번호를 입력하세요'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className='pw_check'>
          <label>Password Check</label>
          <input 
            type='password' 
            placeholder='비밀번호 확인' 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type='submit' className='submit_btn' disabled={loading}>
          {loading ? '처리 중...' : 'Sign up'}
        </button>
      </form>
      
      {/* 메시지 표시 */}
      {message && (
        <div className={`message ${message.includes('오류') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
    </div>
  );
}

export default Join;