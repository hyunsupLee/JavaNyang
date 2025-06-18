import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/SupabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import CommonModal from "../components/CommonModal";

const STYLES = {
  'backBtn': {
    textDecoration: 'none',
    display: 'inline-flex',
    color: '#999'
  },
  'arrow': {
    color: '#999'
  },
  'viewBtn': {
    padding: '4px 8px',
    border: '1px solid #9663e8',
    color: '#9663e8',
    borderRadius: '4px',
  },
  'delBtn': {
    padding: '4px 8px',
    border: '1px solid #ff4848',
    color: '#ff4848',
    borderRadius: '4px',
  }
}

const CATEGORY_MAP = {
  1: "변수・상수",
  2: "연산자",
  3: "배열",
  4: "function",
  5: "제어문",
  6: "클래스",
  7: "상속・추상화",
  8: "제네릭",
};

const LEVEL_MAP = {
  1: "초급",
  2: "중급",
  3: "고급",
};

const DELETE = 'delete';

export default function CreatedQuizList() {

  const navigate = useNavigate();

  const [modalType, setModalType] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null); // 삭제할 퀴즈 ID 저장

  // AuthContext에서 사용자 정보 가져오기
  const { user } = useAuth();

  // 상태 관리
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 내가 만든 퀴즈 데이터 가져오기
  useEffect(() => {
    const fetchMyCreatedQuizList = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_quiz_list')
          .select('*')
          .eq('uid', user.id)
          .order('created_at', { ascending: false }); // 최신순 정렬

        if (error) {
          throw error;
        }

        setQuizzes(data || []);
      } catch (err) {
        console.error('퀴즈 데이터 가져오기 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCreatedQuizList();
  }, [user?.id]);

  // 삭제 함수
  const handleDelete = async () => {
    if (!selectedQuizId) return;

    try {
      const { error } = await supabase
        .from('user_quiz_list')
        .delete()
        .eq('user_qid', selectedQuizId);

      if (error) throw error;

      // 성공적으로 삭제되면 UI에서도 제거
      setQuizzes(prev => prev.filter(q => q.user_qid !== selectedQuizId));

      // 모달 닫기 및 선택된 퀴즈 ID 초기화
      closeModal();

    } catch (err) {
      console.error('삭제 실패:', err.message);
      alert('퀴즈 삭제 중 오류가 발생했습니다.');
    }
  };

  // 모달 관련 핸들러
  const openModal = (user_qid) => {
    setSelectedQuizId(user_qid); // 삭제할 퀴즈 ID 설정
    setModalType(DELETE);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalType(null);
    setSelectedQuizId(null); // 선택된 퀴즈 ID 초기화
  };

  // 로딩 상태
  if (loading) return <LoadingSpinner />;

  // 에러 상태
  if (error) return;

  return (
    <main id='my-quiz-list' className='quiz-list-container' style={{ minHeight: 0 }}>
      <CommonModal
        type={modalType}
        isOpen={modalType !== null}
        onCancel={closeModal}
        onConfirm={handleDelete}
      />
      <div className='text-start'>
        <Link to='/myPage' style={STYLES.backBtn}>
          <span className='material-symbols-rounded pr-1' style={STYLES.arrow}>keyboard_arrow_left</span>
          마이페이지로
        </Link>
      </div>
      <h2 className='mb-5'>내가 만든 퀴즈</h2>

      {/* 퀴즈 테이블 */}
      {quizzes.length === 0 ? (
        <>
          <p style={{ color: '#999', padding: '30px 0' }}>아직 만든 퀴즈가 없습니다.</p>
          <div className="qsearch-create-button" style={{ margin: '0 auto' }}>
            <button onClick={() => navigate("/user_create_quiz")}>
              퀴즈 생성
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="qsearch-create-button" >
            <button onClick={() => navigate("/user_create_quiz")}>
              퀴즈 생성
            </button>
          </div>
          <table className='quiz-table'>
            <thead>
              <tr style={{ cursor: 'default' }}>
                <th style={{ width: '10%' }}>타입</th>
                <th style={{ width: '10%' }}>난이도</th>
                <th style={{ width: '30%' }}>제목</th>
                <th style={{ width: '40%' }}>설명</th>
                <th style={{ width: '10%' }}>확인</th>
                <th style={{ width: '10%' }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.user_qid} className='quiz-list' style={{ cursor: 'default' }}>
                  <td>{CATEGORY_MAP[quiz.category]}</td>
                  <td>{LEVEL_MAP[quiz.level]}</td>
                  <td>{quiz.quiz_title}</td>
                  <td>{quiz.quiz_text}</td>
                  <td><button type='button' style={STYLES.viewBtn} onClick={() => navigate(`/myquiz/${quiz.user_qid}`)}>문제 풀기</button></td>
                  <td><button type='button' style={STYLES.delBtn} onClick={() => openModal(quiz.user_qid)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  )
}