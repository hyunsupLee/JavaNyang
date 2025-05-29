import "./admin.css";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import CommonModal from "./ui/CommonModal";

// 상수 정의
const CATEGORY_MAP = {
  '*': '전체',
  '1': '변수∙상수',
  '2': '연산자',
  '3': '배열',
  '4': 'function',
  '5': '제어문',
  '6': '클래스',
  '7': '상속∙추상화',
  '8': '제네릭∙람다식'
};

const LEVEL_MAP = {
  '*': '전체',
  '1': 'Lv.1',
  '2': 'Lv.2',
  '3': 'Lv.3',
  '4': 'Lv.4'
};

const DEFAULT_PARAMS = {
  keyword: '',
  category: '*',
  level: '*'
};

const MODAL_TYPES = {
  DELETE: 'delete',
  DELETE_CHECKED: 'deleteChecked'
};

function QuizManage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL 파라미터 파싱
  const parsedParams = useMemo(() => ({
    keyword: searchParams.get('keyword') || DEFAULT_PARAMS.keyword,
    category: searchParams.get('category') || DEFAULT_PARAMS.category,
    level: searchParams.get('level') || DEFAULT_PARAMS.level
  }), [searchParams]);

  // 상태 관리
  const [searchKeyword, setSearchKeyword] = useState('');
  const [category, setCategory] = useState('*');
  const [level, setLevel] = useState('*');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [deleteTargetQid, setDeleteTargetQid] = useState(null);
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 페이지네이션 관련 계산
  const totalPages = Math.ceil(quizList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuizList = quizList.slice(startIndex, endIndex);
  const currentPageQuizIds = currentQuizList.map(q => q.qid);

  // 현재 페이지의 모든 아이템이 선택되었는지 확인
  const isAllCurrentPageSelected = currentPageQuizIds.length > 0 &&
    currentPageQuizIds.every(qid => selectedQuizIds.includes(qid));

  // 헬퍼 함수들
  const resetFilters = useCallback(() => {
    setSearchKeyword(DEFAULT_PARAMS.keyword);
    setCategory(DEFAULT_PARAMS.category);
    setLevel(DEFAULT_PARAMS.level);
  }, []);

  const setFiltersFromParams = useCallback(() => {
    setSearchKeyword(parsedParams.keyword);
    setCategory(parsedParams.category);
    setLevel(parsedParams.level);
  }, [parsedParams]);

  const handleAuthError = useCallback((message = '로그인이 필요합니다.') => {
    alert(message);
    navigate('/login');
  }, [navigate]);

  const handleAccessError = useCallback((message = '접근 권한이 없습니다.') => {
    alert(message);
    navigate('/');
  }, [navigate]);

  // API 호출 함수
  const makeApiRequest = useCallback(async (action, additionalData = {}) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('SESSION_ERROR');
    }

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/quiz-manage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        ...additionalData
      })
    });

    const result = await response.json();

    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        throw new Error('ACCESS_DENIED');
      }
      throw new Error(result.error || '서버 오류가 발생했습니다.');
    }

    return result;
  }, []);

  // 초기 데이터 로드
  const initializeQuizManage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await makeApiRequest('get_quiz_list', {
        keyword: parsedParams.keyword,
        category: parsedParams.category,
        level: parsedParams.level
      });

      setUserInfo(result.userInfo);
      setQuizList(result.quizList);
    } catch (err) {
      console.error('초기화 오류:', err.message);

      if (err.message === 'SESSION_ERROR') {
        handleAuthError();
        return;
      }

      if (err.message === 'ACCESS_DENIED') {
        handleAccessError();
        return;
      }

      setError(err.message);
      navigate("../error");
    } finally {
      setLoading(false);
    }
  }, [parsedParams, makeApiRequest, handleAuthError, handleAccessError, navigate]);

  // 검색 및 필터 핸들러
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    handleClearSelection();
    setSearchParams({
      keyword: searchKeyword,
      category,
      level
    });
  }, [searchKeyword, category, level, setSearchParams]);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  // 모달 관련 핸들러
  const openDeleteModal = useCallback((qid) => {
    setDeleteTargetQid(qid);
    setModalType(MODAL_TYPES.DELETE);
  }, []);

  const openDeleteCheckedModal = useCallback(() => {
    if (selectedQuizIds.length === 0) {
      alert("삭제할 퀴즈를 선택해주세요.");
      return;
    }
    setModalType(MODAL_TYPES.DELETE_CHECKED);
  }, [selectedQuizIds.length]);

  const closeModal = useCallback(() => {
    setModalType(null);
    setDeleteTargetQid(null);
  }, []);

  // 삭제 관련 핸들러
  const handleDeleteQuiz = useCallback(async () => {
    if (!deleteTargetQid) return;

    try {
      await makeApiRequest('delete', {
        quiz: { qid: deleteTargetQid }
      });

      setQuizList(prev => prev.filter(q => q.qid !== deleteTargetQid));
      alert("삭제되었습니다.");
      closeModal();
    } catch (err) {
      console.error("삭제 오류:", err.message);

      if (err.message === 'SESSION_ERROR') {
        handleAuthError("세션이 만료되었습니다.");
        return;
      }

      alert("삭제 중 오류가 발생했습니다.");
      closeModal();
    }
  }, [deleteTargetQid, makeApiRequest, closeModal, handleAuthError]);

  const confirmDeleteChecked = useCallback(async () => {
    try {
      const deletePromises = selectedQuizIds.map(qid =>
        makeApiRequest('delete', { quiz: { qid } })
      );

      const results = await Promise.allSettled(deletePromises);
      const failedDeletes = [];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedDeletes.push(selectedQuizIds[index]);
        }
      });

      const successfullyDeleted = selectedQuizIds.filter(id => !failedDeletes.includes(id));
      setQuizList(prev => prev.filter(q => !successfullyDeleted.includes(q.qid)));
      setSelectedQuizIds([]);

      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length}개 퀴즈 삭제에 실패했습니다.`);
      }
      alert(`${successfullyDeleted.length}개 퀴즈가 삭제되었습니다.`);
    } catch (err) {
      console.error("선택 삭제 오류:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      closeModal();
    }
  }, [selectedQuizIds, makeApiRequest, closeModal]);

  // 체크박스 관련 핸들러
  const handleCheckboxChange = useCallback((qid) => {
    setSelectedQuizIds(prev =>
      prev.includes(qid)
        ? prev.filter(id => id !== qid)
        : [...prev, qid]
    );
  }, []);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      // 현재 페이지의 모든 퀴즈 ID를 선택 목록에 추가
      setSelectedQuizIds(prev => {
        const newIds = currentPageQuizIds.filter(qid => !prev.includes(qid));
        return [...prev, ...newIds];
      });
    } else {
      // 현재 페이지의 모든 퀴즈 ID를 선택 목록에서 제거
      setSelectedQuizIds(prev =>
        prev.filter(qid => !currentPageQuizIds.includes(qid))
      );
    }
  }, [currentPageQuizIds]);

  // 선택 취소 핸들러
  const handleClearSelection = useCallback(() => {
    setSelectedQuizIds([]);
  }, []);

  // 페이지네이션 핸들러
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // 수정 페이지로 이동
  const handleEditQuiz = useCallback((qid) => {
    navigate(`/adminQuizs/edit/${qid}`);
  }, [navigate]);

  // 초기화 useEffect
  useEffect(() => {
    document.title = '자바냥 | 퀴즈관리';

    const hasParams = searchParams.has('keyword') || searchParams.has('category') || searchParams.has('level');
    if (!hasParams) {
      resetFilters();
    } else {
      setFiltersFromParams();
    }

    // 검색 조건이 변경되면 페이지를 1로 리셋
    setCurrentPage(1);
    initializeQuizManage();
  }, [searchParams, resetFilters, setFiltersFromParams, initializeQuizManage]);

  // 렌더링 헬퍼 함수들
  const SearchSummary = useMemo(() => {
    const { keyword, category: cat, level: lv } = parsedParams;

    if (!keyword && cat === '*' && lv === '*') return null;

    return (
      <div className="search-summary">
        <strong>{keyword ? `'${keyword}' 검색 결과` : '전체 결과'}</strong>
        <span> | 카테고리: {CATEGORY_MAP[cat]}</span>
        <span> | 난이도: {LEVEL_MAP[lv]}</span>
        <span> | 총 {quizList.length}개</span>
      </div>
    );
  }, [parsedParams, quizList.length]);

  const FilterOptions = ({ map, currentValue, onChange, name }) => {
    const options = [["*", "전체"], ...Object.entries(map).filter(([k]) => k !== "*")];

    return options.map(([value, label]) => (
      <label key={value}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={currentValue === value}
          onChange={(e) => onChange(e.target.value)}
        />
        {label}
      </label>
    ));
  };

  const QuizItem = ({ quiz }) => (
    <li key={quiz.qid} id={quiz.qid} className="admin-item">
      <span className="checkbox">
        <input
          type="checkbox"
          name="itemCheckbox"
          checked={selectedQuizIds.includes(quiz.qid)}
          onChange={() => handleCheckboxChange(quiz.qid)}
        />
      </span>
      <span className="category">{quiz.category_text || '이름 없음'}</span>
      <span className="level">{quiz.level ? `Lv.${quiz.level}` : ''}</span>
      <span className="title">{quiz.quiz_title || '이름 없음'}</span>
      <span className="text" title={quiz.quiz_text || '이름 없음'}>
        {quiz.quiz_text || '이름 없음'}
      </span>
      <span className="accuracy">
        {quiz.accuracy == null ? '-' : `${quiz.accuracy}%`}
      </span>
      <span className="list-btn-wrap">
        <button type="button" className="edit" onClick={() => handleEditQuiz(quiz.qid)}>
          <span className="material-symbols-rounded">edit</span>
        </button>
        <button type="button" className="delete" onClick={() => openDeleteModal(quiz.qid)}>
          <span className="material-symbols-rounded">delete</span>
        </button>
      </span>
    </li>
  );

  // 페이지네이션 컴포넌트
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (

      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <span className="material-symbols-rounded">chevron_left</span>
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="pagination-dots">...</span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          )
        ))}

        <button
          className="pagination-btn"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <span className="material-symbols-rounded">chevron_right</span>
        </button>

        {/* <div className="pagination-info">
          {startIndex + 1}-{Math.min(endIndex, quizList.length)} of {quizList.length}
        </div> */}
      </div>
    );
  };

  // 로딩 및 에러 상태 처리
  if (loading) return <p className="admin-loading">로딩 중...</p>;
  if (error) return <p>오류: {error}</p>;

  return (
    <main id="admin">
      {/* 삭제 확인 모달 */}
      <CommonModal
        type={modalType}
        isOpen={modalType !== null}
        onCancel={closeModal}
        onConfirm={
          modalType === MODAL_TYPES.DELETE
            ? handleDeleteQuiz
            : modalType === MODAL_TYPES.DELETE_CHECKED
              ? confirmDeleteChecked
              : null
        }
      />

      {/* 상단 버튼 영역 */}
      <div className="quiz-toolbar-fixed">
        <div className="tool-wrap">
          <Link to="/adminQuizs/create" className="quiz-create-btn">
            <span className="material-symbols-rounded">add</span>
            퀴즈 등록
          </Link>
          {selectedQuizIds.length > 0 && (
            <div className="checked-toolbar">
              <button onClick={openDeleteCheckedModal} className="quiz-delete-btn">
                <span className="material-symbols-rounded">delete</span>
                선택 삭제 ({selectedQuizIds.length})
              </button>
              <button onClick={handleClearSelection} className="quiz-clear-btn">
                <span className="material-symbols-rounded">clear</span>
                선택 취소
              </button>
            </div>
          )}
        </div>
      </div>
      {/* 메인 헤더 영역 */}
      <div className="header-top">
        <h2 className="page-title">
          <span className="material-symbols-rounded fs-3">Assignment</span>
          자바냥 퀴즈 관리
        </h2>
        <span className="text-muted">총 {quizList.length} 문제</span>
      </div>
      {/* 검색 영역 */}
      <div className="admin-search-area">
        {SearchSummary}

        <form onSubmit={handleSearchSubmit}>
          <div className="search-controls">
            <div className="search-box">
              <span className="material-symbols-rounded">search</span>
              <input
                type="text"
                name="searchKeyword"
                placeholder="검색어를 입력해주세요"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              검색
            </button>
          </div>

          <div className="search-filter">
            <button
              type="button"
              className="filter-btn"
              onClick={toggleFilterPanel}
            >
              검색 조건
              <span className="material-symbols-rounded">
                {isFilterOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>
          </div>

          <div className={`filter-panel ${isFilterOpen ? "open" : "closed"}`}>
            <fieldset>
              <legend>카테고리</legend>
              <div className="radio-group">
                <FilterOptions
                  map={CATEGORY_MAP}
                  currentValue={category}
                  onChange={setCategory}
                  name="category"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>난이도</legend>
              <div className="radio-group">
                <FilterOptions
                  map={LEVEL_MAP}
                  currentValue={level}
                  onChange={setLevel}
                  name="level"
                />
              </div>
            </fieldset>

            <div className="panel-btn-wrap">
              {/* <button type="button" className="filter-btn">초기화</button> */}
              <button type="submit" className="filter-btn">
                적용
              </button>
              <button type="submit" className="filter-btn">적용</button>
            </div>
          </div>
        </form>
      </div>

      {/* 퀴즈 목록 영역 */}
      <div className="admin-list-area">
        <div className="admin-quiz-list">
          <div className="admin-header">
            <span className="checkbox">
              <input
                type="checkbox"
                name="headerCheckbox"
                onChange={handleSelectAll}
                checked={isAllCurrentPageSelected}
              />
            </span>
            <span className="category">카테고리</span>
            <span className="level">난이도</span>
            <span className="title">제목</span>
            <span className="text">설명</span>
            <span className="accuracy">정답률</span>
            <span className="list-btn-wrap">
              <span className="edit">수정</span>
              <span className="delete">삭제</span>
            </span>
          </div>

          <ul className="admin-list">
            {currentQuizList.length > 0
              ? currentQuizList.map((quiz) => (
                <QuizItem key={quiz.qid} quiz={quiz} />
              ))
              : <li>데이터가 없습니다.</li>
            }
          </ul>
        </div>

        {/* 페이지네이션 */}
        <Pagination />
      </div>
    </main>
  );
}

export default QuizManage;
