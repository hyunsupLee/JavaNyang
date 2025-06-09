import './LearningHistory.css';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function LearningHistory() {
  // AuthContext에서 사용자 정보 가져오기
  const { user, userInfo, loading: authLoading } = useAuth();

  const [activities, setActivities] = useState([]);
  const [allActivitiesData, setAllActivitiesData] = useState(null); // 전체 데이터 캐시
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const dataFetched = useRef(false); // 데이터 가져왔는지 확인용

  const itemsPerPage = 20; // 페이지당 항목 수

  useEffect(() => {
    document.title = '자바냥 | 학습 활동';
  }, []);

  // 카테고리와 난이도 매핑
  const categoryNames = {
    1: '변수·상수', 2: '연산자', 3: '배열', 4: 'function',
    5: '제어문', 6: '클래스', 7: '상속·추상화', 8: '제네릭·람다식'
  };

  const levelNames = {
    1: '쉬움', 2: '중간', 3: '어려움', 4: '매우 어려움'
  };

  // 로그인하지 않은 경우
  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  // 학습 활동 데이터 가져오기 함수 (최초 1회만)
  const fetchAllActivities = async () => {
    try {
      setLoading(true);

      // 모든 학습 활동 데이터 가져오기
      const { data, error } = await supabase
        .from('score_board')
        .select(`
          sid,
          qid,
          correct,
          reward,
          created_at,
          quiz_list:qid (
            category,
            level,
            quiz_title
          )
        `)
        .eq('uid', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 데이터 가공
      const processedActivities = data.map((item) => ({
        id: item.sid,
        qid: item.qid,
        question: item.quiz_list?.quiz_title || `${categoryNames[item.quiz_list?.category] || 'Java'} 문제`,
        category: categoryNames[item.quiz_list?.category] || 'Java 기초 문법',
        difficulty: levelNames[item.quiz_list?.level] || '쉬움',
        status: item.correct ? 'correct' : 'wrong',
        reward: item.reward || 0,
        date: new Date(item.created_at).toLocaleDateString('ko-KR'),
        time: new Date(item.created_at).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        fullDate: new Date(item.created_at),
        categoryId: item.quiz_list?.category,
        levelId: item.quiz_list?.level
      }));

      // 전체 데이터 캐시에 저장
      setAllActivitiesData(processedActivities);
      // 현재 필터에 맞게 표시
      applyFilters(processedActivities);
      setError(null);
      dataFetched.current = true;
    } catch (err) {
      console.error('학습 활동 데이터 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용 함수
  const applyFilters = (data) => {
    let filteredActivities = [...data];

    // 카테고리 필터
    if (filterCategory !== 'all') {
      filteredActivities = filteredActivities.filter(
        activity => activity.categoryId === parseInt(filterCategory)
      );
    }

    // 난이도 필터
    if (filterDifficulty !== 'all') {
      filteredActivities = filteredActivities.filter(
        activity => activity.levelId === parseInt(filterDifficulty)
      );
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filteredActivities = filteredActivities.filter(
        activity => activity.status === filterStatus
      );
    }

    // 페이지네이션 계산
    const totalPagesCount = Math.ceil(filteredActivities.length / itemsPerPage);
    setTotalPages(totalPagesCount);

    // 현재 페이지에 맞는 데이터만 추출
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    setActivities(paginatedActivities);
  };

  // 필터 변경 함수 (로딩 없이 즉시 필터링)
  const handleFilterChange = (filterType, value) => {
    // 필터 변경 시 첫 페이지로 이동
    setCurrentPage(1);
    
    if (filterType === 'category') {
      setFilterCategory(value);
    } else if (filterType === 'difficulty') {
      setFilterDifficulty(value);
    } else if (filterType === 'status') {
      setFilterStatus(value);
    }
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilterCategory('all');
    setFilterDifficulty('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  // 페이지 변경 처리
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // 컴포넌트 마운트 시 데이터 가져오기 (최초 1회만)
  useEffect(() => {
    if (user && !dataFetched.current) {
      fetchAllActivities();
    }
  }, [user]);

  // 필터나 페이지 변경 시 데이터 재필터링
  useEffect(() => {
    if (allActivitiesData) {
      applyFilters(allActivitiesData);
    }
  }, [filterCategory, filterDifficulty, filterStatus, currentPage]);

  // 페이지네이션 컴포넌트
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="page-btn"
        >
          {'<<'}
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="page-btn"
        >
          {'<'}
        </button>

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`page-btn ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          {'>'}
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          {'>>'}
        </button>
      </div>
    );
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <main id='learning-history'>
        <div className="loading-container">
          <p>인증 정보 확인 중...</p>
        </div>
      </main>
    );
  }

  // 데이터 로딩 중 (최초 로딩만)
  if (loading && !dataFetched.current) {
    return (
      <main id='learning-history'>
        <div className="loading-container">
          <p>학습 활동을 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <main id='learning-history'>
        <div className="error-container">
          <p>에러 발생: {error}</p>
          <button onClick={fetchAllActivities}>다시 시도</button>
        </div>
      </main>
    );
  }

  return (
    <main id='learning-history'>
      <Link to='/myPage' className='back-btn'>
        <span className='material-symbols-rounded'>keyboard_arrow_left</span>
        마이페이지로
      </Link>
      <h2 className='mb-5'>
        <span>{userInfo?.name}</span> 님의 학습 활동
      </h2>
      
      {/* 필터 영역 */}
      <div className='filter-btn-area mb-5'>
        <div className='filter-section mb-3'>
          <div className='filter-group'>
            <label>카테고리:</label>
            <select
              value={filterCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">전체</option>
              {Object.entries(categoryNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className='filter-group'>
            <label>난이도:</label>
            <select
              value={filterDifficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="all">전체</option>
              {Object.entries(levelNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className='filter-group'>
            <label>결과:</label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="correct">정답</option>
              <option value="wrong">오답</option>
            </select>
          </div>
        </div>
        <button className="reset-btn" onClick={resetFilters}>
          필터 초기화
        </button>
      </div>

      {/* 활동 목록 */}
      <div className='activity-area'>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className='activity-item'>
              <div className="activity-main">
                <div className={`status-indicator ${activity.status}`}></div>
                <div className='activity-content'>
                  <h3 className='activity-question'>{activity.question}</h3>
                  <div className='activity-meta'>
                    <span className='activity-category'>{activity.category}</span>
                    <span className='activity-difficulty'>난이도: {activity.difficulty}</span>
                    <span className='activity-reward'>경험치: +{activity.reward}</span>
                  </div>
                </div>
              </div>
              <div className="activity-date-time">
                <div className="activity-date">{activity.date}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <p>
              {filterCategory === 'all' && filterDifficulty === 'all' && filterStatus === 'all' 
                ? '학습 활동이 없습니다.'
                : '필터 조건에 맞는 학습 활동이 없습니다.'
              }
            </p>
            <p>문제를 풀어보고 학습 기록을 만들어보세요!</p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination />
    </main>
  );
}