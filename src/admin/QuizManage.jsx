<<<<<<< HEAD
//import "./admin.css";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
=======
import "./admin.css";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../member/SupabaseClient';
>>>>>>> 7a1a59719045dd12630a0ed4459eb08717a7a389

function QuizManage() {
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = '자바냥 | 퀴즈관리';
    initializeQuizManage();
  }, []);

  // 엣지 함수를 통한 권한 확인 및 퀴즈 데이터 조회
  const initializeQuizManage = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
    
      // 현재 사용자 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
=======

      // 현재 사용자 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

>>>>>>> 7a1a59719045dd12630a0ed4459eb08717a7a389
      if (sessionError || !session) {
        navigate('../error');
        return;
      }
<<<<<<< HEAD
    
=======

>>>>>>> 7a1a59719045dd12630a0ed4459eb08717a7a389
      // 엣지 함수 호출 - 권한 확인과 퀴즈 데이터 조회를 함께 처리
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/quiz-manage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_quiz_list'
        })
      });
<<<<<<< HEAD
    
      const result = await response.json();
    
=======

      const result = await response.json();

>>>>>>> 7a1a59719045dd12630a0ed4459eb08717a7a389
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('../error');
          return;
        }
        throw new Error(result.error || '서버 오류가 발생했습니다.');
      }
<<<<<<< HEAD
    
      // 성공 시 데이터 설정
      setUserInfo(result.userInfo);
      setQuizList(result.quizList);
    
=======

      // 성공 시 데이터 설정
      setUserInfo(result.userInfo);
      setQuizList(result.quizList);

>>>>>>> 7a1a59719045dd12630a0ed4459eb08717a7a389
    } catch (err) {
      console.error('초기화 오류:', err.message);
      setError(err.message);
      navigate('../error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>오류: {error}</p>;

  return (
    <main id="admin">
      {/* 검색 영역 */}
      <div className="admin-search-area">
        <div className="search-input">
          <input type="text" placeholder="검색" />
          <button type="button" className="search-button">검색</button>
        </div>
        <div className="search-filter">
          <button type="button" className="filter-button">
            검색 조건
            <span className="material-symbols-rounded">keyboard_arrow_down</span>
          </button>
        </div>
      </div>
      {/* 리스트 영역 */}
      <div className="admin-list-area">
        <div className="admin-quiz-list">
          {/* 목록 상단 */}
          <div className="admin-header">
            <span className="checkbox"><input type="checkbox" name="" id="" /></span>
            <span className="category">카테고리</span>
            <span className="level">난이도</span>
            <span className="title">제목</span>
            <span className="text">설명</span>
            <span className="rate">정답률</span>
            <span className="btn-wrap">
              <span className="edit">수정</span>
              <span className="delete">삭제</span>
            </span>
          </div>
          {/* 목록 */}
          <ul className="admin-list">
            {quizList.length > 0 ? (
              quizList.map((quiz, index) => (
                <li key={index} id={quiz.qid} className="admin-item">
                  <span className="checkbox"><input type="checkbox" name="" id="" /></span>
                  <span className="category">{quiz.category || '이름 없음'}</span>
                  <span className="level">{'Lv.' + quiz.level || ''}</span>
                  <span className="title">{quiz.quiz_title || '이름 없음'}</span>
                  <span className="text" title={quiz.quiz_text || '이름 없음'}>{quiz.quiz_text || '이름 없음'}</span>
                  <span className="rate">{'정답률'}</span>
                  <span className="btn-wrap">
                    <button type="button" className="edit" onClick={() => handleEditQuiz(quiz.qid)}>
                      <span className="material-symbols-rounded">stylus</span>
                    </button>
                    <button type="button" className="delete" onClick={() => handleDeleteQuiz(quiz.qid)}>
                      <span className="material-symbols-rounded">delete</span>
                    </button>
                  </span>
                </li>
              ))
            ) : (
              <li>데이터가 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default QuizManage;