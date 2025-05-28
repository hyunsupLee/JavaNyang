import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../member/supabaseClient';
import QuizForm from './QuizForm';

function QuizCreate() {
  const navigate = useNavigate();

  // 입력 폼 초기화
  const [formData, setFormData] = useState({
    category: '',
    level: '',
    quiz_title: '',
    quiz_text: '',
    hint: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // 입력 변경 핸들러 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // 데이터 유효성 검사
      const requiredFields = ['category', 'level', 'quiz_title', 'quiz_text', 'hint', 'option1', 'option2', 'option3', 'option4', 'correct'];

      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error('필수 필드를 모두 입력해주세요.');
        }
      }

      // Supabase에 저장할 데이터 구성
      const quizData = {
        ...formData,
        category: parseInt(formData.category),
        level: parseInt(formData.level),
        correct: parseInt(formData.correct),
      };

      // Supabase에 데이터 삽입
      const { error } = await supabase
        .from('quiz_list')
        .insert([quizData])
        .select();

      if (error) {
        throw error;
      }

      // 성공 메시지 설정
      setSubmitMessage('퀴즈가 성공적으로 등록되었습니다!');

      // 폼 리셋
      setFormData({
        category: '',
        level: '',
        quiz_title: '',
        quiz_text: '',
        hint: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct: null,
      });

      // 일정 시간 후 퀴즈 목록으로 이동 
      setTimeout(() => navigate('/adminQuizs'), 1000);

    } catch (error) {
      console.error('퀴즈 등록 실패:', error);
      setSubmitMessage(`등록 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main id='admin'>
      {/* 제출 메시지 표시 */}
      {submitMessage && (
        <div className={`message ${submitMessage.includes('실패') ? 'error' : 'success'}`}>
          {submitMessage}
        </div>
      )}
      <Link to='/adminQuizs' className='back-btn'>
        <span className='material-symbols-rounded'>keyboard_arrow_left</span>퀴즈 목록으로
      </Link>
      <QuizForm
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitMessage={submitMessage}
      />
    </main>
  );
}

export default QuizCreate;