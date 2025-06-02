import './Join.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { Button } from 'react-bootstrap';

function Join() {
  // 페이지 제목 설정
  useEffect(() => {
    document.title = '자바냥 | 회원가입';
  }, []);

  const navigate = useNavigate();

  // 회원가입 폼 입력 필드들
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 로딩 상태와 전체 메시지
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // 실시간 유효성 검사 결과를 표시하기 위한 error state들
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 이메일 형식이 올바른지 검사하는 함수
  const validateEmail = (email) => {
    if (email.length === 0) return '';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '올바른 이메일 형식을 입력해주세요.';
    }
    return '';
  };

  // 비밀번호 길이가 적절한지 검사하는 함수
  const validatePassword = (pwd) => {
    if (pwd.length === 0) return '';
    if (pwd.length < 6) return '6~16자 이상의 비밀번호를 입력해주세요.';
    if (pwd.length > 16) return '비밀번호는 16자 이하로 입력해주세요.';
    return '';
  };

  // 비밀번호와 비밀번호 확인이 일치하는지 검사하는 함수
  const validateConfirmPassword = (confirmPwd, originalPwd) => {
    if (confirmPwd.length === 0) return '';
    
    if (confirmPwd !== originalPwd) {
      return '비밀번호가 일치하지 않습니다.';
    }
    return '';
  };

  // 이메일 입력 시 실시간으로 형식 검사만 실행
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // 이메일 형식 검사만 수행 (중복 검사는 제거)
    const formatError = validateEmail(newEmail);
    setEmailError(formatError);
  };

  // 비밀번호 입력 시 실시간으로 유효성 검사 실행
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // 비밀번호 길이 검사
    const error = validatePassword(newPassword);
    setPasswordError(error);
    
    // 비밀번호 확인 필드도 다시 검사
    if (confirmPassword.length > 0) {
      const confirmError = validateConfirmPassword(confirmPassword, newPassword);
      setConfirmPasswordError(confirmError);
    }
  };

  // 비밀번호 확인 입력 시 일치 여부 검사
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // 원본 비밀번호와 일치하는지 검사
    const error = validateConfirmPassword(newConfirmPassword, password);
    setConfirmPasswordError(error);
  };

  // 모든 입력 필드와 에러 메시지 초기화
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  // 회원가입 버튼 클릭 시 실행되는 함수
  const handleSignUp = async (e) => {
    e.preventDefault();

    // 제출 전 최종 유효성 검사
    const emailErr = validateEmail(email);
    const pwdError = validatePassword(password);
    const confirmPwdError = validateConfirmPassword(confirmPassword, password);
    
    // 에러가 있으면 해당 에러 표시하고 종료
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }
    if (confirmPwdError) {
      setConfirmPasswordError(confirmPwdError);
      return;
    }

    setLoading(true);
    setMessage('');

    try { 
      // Supabase를 통해 회원가입 요청
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        // 에러 메시지 한국어로 변환 (여기서 중복 이메일 검사됨)
        let errorMessage = error.message;
        if (error.message.includes('User already registered') || 
            error.message.includes('already registered')) {
          errorMessage = '이미 회원가입된 이메일은 사용할 수 없습니다.';
          setEmailError(errorMessage); // 이메일 필드에 직접 에러 표시
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '올바르지 않은 이메일 형식입니다.';
          setEmailError(errorMessage);
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
        }
        setMessage(`오류: ${errorMessage}`);
      } else {
        // 회원가입 성공 처리
        setMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        resetForm(); // 폼 초기화
        console.log('회원가입 성공:', data.user);

        // *** 여기에 한 줄만 추가 ***
        sessionStorage.setItem('welcomeMessage', email);

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setMessage('회원가입 중 오류가 발생했습니다.');
      console.error('회원가입 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // GitHub으로 회원가입/로그인 처리
  const handleGitHubSignUp = async () => {
    setMessage('GitHub 로그인 중...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setMessage(`GitHub 로그인 오류: ${error.message}`);
        console.error('GitHub 로그인 오류:', error);
      }
    } catch (error) {
      setMessage('GitHub 로그인 중 오류가 발생했습니다.');
      console.error('GitHub 로그인 오류:', error);
    }
  };

  return (
    <div id='create_user'>
      <p className='sign_up'>회원가입</p>
      <p className='slogan'>Java 학습의 새로운 시작, 자바냥과 함께하세요!</p>
      
      {/* GitHub 로그인 버튼 */}
      <div className='google'>
        <button 
          type='button' 
          className='google-btn'
          onClick={handleGitHubSignUp}
          disabled={loading}
        >
          <img src="./ico_github.png" alt="GitHub" />
          GitHub로 회원가입
        </button>
      </div>
      
      {/* 회원가입 폼 */}
      <form onSubmit={handleSignUp} className='signup_form'>
        {/* 이메일 입력 */}
        <div className='email'>
          <label>Email</label>
          <input 
            type='email' 
            placeholder='이메일을 입력하세요'
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
          />
          <div className="error-container">
            {emailError && (
              <div className="input-error-message">
                {emailError}
              </div>
            )}
          </div>
        </div>
        
        {/* 비밀번호 입력 */}
        <div className='pw'>
          <label>Password</label>
          <input 
            type='password' 
            placeholder='비밀번호를 입력하세요 (8-16자)'
            value={password}
            onChange={handlePasswordChange}
            required
            disabled={loading}
          />
          <div className="error-container">
            {passwordError && (
              <div className="input-error-message">
                {passwordError}
              </div>
            )}
          </div>
        </div>
        
        {/* 비밀번호 확인 입력 */}
        <div className='pw_check'>
          <label>Password Check</label>
          <input 
            type='password' 
            placeholder='비밀번호 확인' 
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            disabled={loading}
          />
          <div className="error-container">
            {confirmPasswordError && (
              <div className="input-error-message">
                {confirmPasswordError}
              </div>
            )}
          </div>
        </div>
        
        {/* 회원가입 버튼 */}
        <button 
          type='submit' 
          className='create_btn' 
          disabled={loading || emailError || passwordError || confirmPasswordError}
        >
          {loading ? '처리 중...' : 'Sign up'}
        </button>
      </form>
      
      {/* 상태 메시지 표시 */}
      {message && (
        <div className={`message ${message.includes('오류') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      {/* 로그인 페이지 이동 링크 */}
      <div className="login-link">
        이미 계정이 있으신가요? 
        <button 
            className='login_btn' 
            type='button'
            onClick={() => navigate('/login')}
          >
          로그인하기
        </button>
      </div>
      
    </div>
  );
}

export default Join;
