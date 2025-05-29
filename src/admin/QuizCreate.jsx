import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import QuizForm from './ui/QuizForm';
import CommonModal from './ui/CommonModal';

const RESET_FORM = {
  category: '',
  level: '',
  quiz_title: '',
  quiz_text: '',
  hint: undefined,
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correct: null,
};

const REQUIRED_FIELDS = [
  'category', 'level', 'quiz_title', 'quiz_text',
  'option1', 'option2', 'option3', 'option4', 'correct',
];

const MODAL_TYPES = {
  SUBMIT: 'create'
};

function QuizCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(RESET_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [modalType, setModalType] = useState(null);

  // 입력 변경 핸들러 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 모달 관련 핸들러
  const openSubmitModal = () => {
    // 필수 필드 검증
    for (const field of REQUIRED_FIELDS) {
      if (!formData[field]) {
        setSubmitMessage('필수 필드를 모두 입력해주세요.');
        return;
      }
    }
    setModalType(MODAL_TYPES.SUBMIT);
  };

  const closeModal = () => {
    setModalType(null);
  };

  // 폼 제출 핸들러 (모달에서 확인 후 실행)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    openSubmitModal();
  };

  // 실제 퀴즈 등록 처리
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');
    closeModal();

    try {
      const quizData = {
        ...formData,
        category: Number(formData.category),
        level: Number(formData.level),
        correct: Number(formData.correct),
      };

      const { error } = await supabase
        .from('quiz_list')
        .insert([quizData])
        .select();

      if (error) {
        throw error;
      }

      setSubmitMessage('퀴즈가 성공적으로 등록되었습니다!');

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
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>퀴즈를 등록 중입니다...</p>
        </div>
      )}
      {/* 등록 확인 모달 */}
      <CommonModal
        type={modalType}
        isOpen={modalType !== null}
        onCancel={closeModal}
        onConfirm={modalType === MODAL_TYPES.SUBMIT ? handleConfirmSubmit : null}
      />

      {/* 제출 메시지 */}
      {submitMessage && (
        <div className={`message ${submitMessage.includes('실패') ? 'error' : 'success'}`}>
          {submitMessage}
        </div>
      )}

      <Link to='/adminQuizs' className='back-btn'>
        <span className='material-symbols-rounded'>keyboard_arrow_left</span>
        퀴즈 목록으로
      </Link>

      <QuizForm
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitMessage={submitMessage}
      />
    </main>
  );
}

export default QuizCreate;