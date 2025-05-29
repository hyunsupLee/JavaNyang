import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
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
  SUBMIT: 'edit'
};

function QuizEdit() {
  const navigate = useNavigate();
  const { qid } = useParams();

  // 입력 폼 초기화
  const [formData, setFormData] = useState(RESET_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [modalType, setModalType] = useState(null);

  // 퀴즈 데이터 불러오기
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('quiz_list')
          .select('*')
          .eq('qid', qid)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setFormData({
            category: data.category.toString(),
            level: data.level.toString(),
            quiz_title: data.quiz_title,
            quiz_text: data.quiz_text,
            hint: data.hint || '',
            option1: data.option1,
            option2: data.option2,
            option3: data.option3,
            option4: data.option4,
            correct: data.correct.toString(),
          });
        }
      } catch (error) {
        console.error('퀴즈 데이터 불러오기 실패:', error);
        setSubmitMessage(`데이터 불러오기 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (qid) {
      fetchQuizData();
    }
  }, [qid]);

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

  // 실제 퀴즈 수정 처리
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');
    closeModal();

    try {
      // Supabase에 업데이트할 데이터 구성
      const quizData = {
        ...formData,
        category: parseInt(formData.category),
        level: parseInt(formData.level),
        correct: parseInt(formData.correct),
      };

      // Supabase에서 데이터 업데이트
      const { data, error } = await supabase
        .from('quiz_list')
        .update(quizData)
        .eq('qid', qid)
        .select();

      if (error) {
        throw error;
      }

      // 성공 메시지 설정
      setSubmitMessage('퀴즈가 성공적으로 수정되었습니다!');

      // 일정 시간 후 퀴즈 목록으로 이동 
      setTimeout(() => navigate('/adminQuizs'), 1000);

    } catch (error) {
      console.error('퀴즈 수정 실패:', error);
      setSubmitMessage(`수정 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중일 때 표시
  if (isLoading) return <p className="admin-loading">로딩 중...</p>;

  return (
    <main id='admin'>
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>퀴즈를 수정 중입니다...</p>
        </div>
      )}

      {/* 수정 확인 모달 */}
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
        isEdit={true}
      />
    </main>
  );
}

export default QuizEdit;