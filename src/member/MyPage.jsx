import './MyPage.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../contexts/AuthContext'; // AuthContext 사용

// 레벨 계산 함수
const requiredExp = (level) => {
  return 500 * level;
};

const calculateLevelByExperience = (exp) => {
  let level = 1;
  while (requiredExp(level) <= exp) {
    level++;
  }
  return level;
};

// 현재 레벨에서 다음 레벨까지 필요한 경험치 계산
const getExpForCurrentLevel = (totalExp) => {
  const currentLevel = calculateLevelByExperience(totalExp);
  const currentLevelExp = currentLevel > 1 ? requiredExp(currentLevel - 1) : 0;
  const nextLevelExp = requiredExp(currentLevel);

  return {
    currentLevel,
    currentExp: totalExp - currentLevelExp,
    maxExp: nextLevelExp - currentLevelExp,
    totalExp
  };
};

function MyPage() {
  const navigate = useNavigate();

  // AuthContext에서 사용자 정보 가져오기
  const { user, session, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [image, setImage] = useState('/JavaNyang/default-avatar.png');
  const [userInfo, setUserInfo] = useState({
    level: 1,
    exp: 0,
    maxExp: 500,
    totalExp: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 동적 데이터 상태
  const [categoryStats, setCategoryStats] = useState([]);
  const [difficultyStats, setDifficultyStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalProblems: 0,
    totalCorrect: 0,
    accuracy: 0
  });

  // 수정된 사용자 통계 계산 (JOIN 사용)
  const calculateUserStats = async (uid) => {
    try {
      console.log('사용자 통계 계산 시작 - User ID:', uid);

      // score_board와 quiz_list를 JOIN해서 데이터 가져오기
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
        .eq('uid', uid);

      if (error) {
        console.error(`통계 로딩 실패 (uid: ${uid}):`, error);
        return {
          totalExperience: 0,
          totalProblems: 0,
          accuracy: 0,
          detailedData: []
        };
      }

      console.log('JOIN된 데이터:', data);

      const totalProblems = data.length;
      const totalExperience = data.reduce((sum, d) => sum + (d.reward || 0), 0);
      const correctCount = data.filter(d => d.correct === true).length;
      const accuracy = totalProblems > 0 ? Math.round((correctCount / totalProblems) * 100) : 0;

      // 상세 데이터 (카테고리, 레벨 정보 포함)
      const detailedData = data.map(item => ({
        ...item,
        category: item.quiz_list?.category,
        level: item.quiz_list?.level,
        quiz_title: item.quiz_list?.quiz_title
      }));

      console.log('계산된 통계:', {
        totalProblems,
        totalExperience,
        correctCount,
        accuracy
      });

      return {
        totalExperience,
        totalProblems,
        accuracy,
        detailedData
      };
    } catch (error) {
      console.error('사용자 통계 계산 오류:', error);
      return {
        totalExperience: 0,
        totalProblems: 0,
        accuracy: 0,
        detailedData: []
      };
    }
  };

  // 프로필 정보 불러오기 (AuthContext의 user 사용)
  const loadProfileFromSupabase = async () => {
    try {
      if (!user) {
        console.log('AuthContext에서 사용자 정보 없음');
        return;
      }

      console.log('프로필 정보 로드 시작 - User ID:', user.id);

      const { data, error } = await supabase
        .from('user_info')
        .select('name, profimg')
        .eq('uid', user.id)
        .single();

      if (error) {
        console.error('프로필 조회 오류:', error);
        // 에러가 있어도 기본값으로 설정
        setName(user.email || '사용자');
        setImage('/JavaNyang/default-avatar.png');
        return;
      }

      console.log('조회된 프로필 데이터:', data);

      // 이름 설정
      if (data?.name) {
        setName(data.name);
      } else {
        setName(user.email || '사용자');
      }

      // 이미지 설정 - 유틸 함수 사용
      if (data?.profimg) {
        const imageUrl = getImageUrl(data.profimg);
        console.log('설정될 이미지 URL:', imageUrl);
        setImage(imageUrl);
      } else {
        console.log('프로필 이미지 없음, 기본 이미지 사용');
        setImage('/JavaNyang/default-avatar.png');
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      // 에러 발생 시 기본값 설정
      setName(user?.email || '사용자');
      setImage('/JavaNyang/default-avatar.png');
    }
  };

  // quiz_list에서 전체 문제 수 조회
  const getAllQuizTotals = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_list')
        .select('qid, category, level');

      if (error) {
        console.error('전체 문제 수 조회 오류:', error);
        return { categoryTotals: {}, levelTotals: {} };
      }

      console.log('quiz_list에서 가져온 전체 데이터:', data);

      // 카테고리별, 레벨별 문제 개수 계산
      const categoryTotals = {};
      const levelTotals = {};

      data.forEach(item => {
        // 카테고리별 집계
        if (item.category) {
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + 1;
        }
        // 레벨별 집계
        if (item.level) {
          levelTotals[item.level] = (levelTotals[item.level] || 0) + 1;
        }
      });

      console.log('계산된 통계:', { categoryTotals, levelTotals });
      return { categoryTotals, levelTotals };
    } catch (error) {
      console.error('전체 통계 조회 오류:', error);
      return { categoryTotals: {}, levelTotals: {} };
    }
  };

  // 카테고리별 학습 현황 계산
  const calculateCategoryStats = (detailedData, categoryTotals) => {
    const categoryNames = {
      1: '변수·상수',
      2: '연산자',
      3: '배열',
      4: 'function',
      5: '제어문',
      6: '클래스',
      7: '상속·추상화',
      8: '제네릭·람다식'
    };

    return Object.keys(categoryNames).map(categoryId => {
      const categoryNum = parseInt(categoryId);

      // 해당 카테고리에서 정답인 문제 개수
      const correctCount = detailedData.filter(
        item => item.category === categoryNum && item.correct === true
      ).length;

      const totalCount = categoryTotals[categoryNum] || 0;

      return {
        name: categoryNames[categoryId],
        current: correctCount,
        total: totalCount,
        category: categoryNum
      };
    });
  };

  // 난이도별 현황 계산
  const calculateDifficultyStats = (detailedData, levelTotals) => {
    const levelNames = {
      1: '쉬움',
      2: '중간',
      3: '어려움',
      4: '매우 어려움'
    };

    return Object.keys(levelNames).map(levelId => {
      const levelNum = parseInt(levelId);

      // 해당 레벨에서 정답인 문제 개수
      const correctCount = detailedData.filter(
        item => item.level === levelNum && item.correct === true
      ).length;

      const totalCount = levelTotals[levelNum] || 0;
      const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

      return {
        level: levelNames[levelId],
        solved: correctCount,
        total: totalCount,
        percentage: percentage
      };
    });
  };

  // 최근 학습 활동 계산
  const calculateRecentActivities = (detailedData) => {
    const categoryNames = {
      1: '변수·상수', 2: '연산자', 3: '배열', 4: 'function',
      5: '제어문', 6: '클래스', 7: '상속·추상화', 8: '제네릭·람다식'
    };

    const levelNames = {
      1: '쉬움', 2: '중간', 3: '어려움', 4: '매우 어려움'
    };

    // 최근 3개 활동만 (날짜순 정렬)
    const recentData = detailedData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return recentData.map((item, index) => ({
      id: index + 1,
      question: item.quiz_title || `${categoryNames[item.category] || 'Java'} 문제`,
      category: categoryNames[item.category] || 'Java 기초 문법',
      difficulty: levelNames[item.level] || '쉬움',
      date: new Date(item.created_at).toLocaleDateString('ko-KR'),
      status: item.correct ? 'correct' : 'wrong'
    }));
  };

  // 모든 데이터를 불러오는 통합 함수
  const loadAllUserData = async () => {
    try {
      console.log('🔄 데이터 로드 시작');
      setLoading(true);
      setError(null);

      // AuthContext에서 가져온 user 사용
      if (!user) {
        console.log('AuthContext에서 사용자 정보 없음');
        setLoading(false);
        return;
      }

      console.log('AuthContext에서 가져온 사용자:', user.email, 'ID:', user.id);

      // 1. 프로필 정보 로드
      await loadProfileFromSupabase();

      // 2. 사용자 통계와 전체 통계를 병렬로 로드
      const [userStats, totals] = await Promise.all([
        calculateUserStats(user.id),
        getAllQuizTotals()
      ]);

      console.log('📈 로드된 사용자 통계:', userStats);
      console.log('📊 로드된 전체 통계:', totals);

      // 3. 레벨 정보 계산
      const levelInfo = getExpForCurrentLevel(userStats.totalExperience);
      setUserInfo({
        level: levelInfo.currentLevel,
        exp: levelInfo.currentExp,
        maxExp: levelInfo.maxExp,
        totalExp: levelInfo.totalExp
      });

      // 4. 전체 통계 설정
      setOverallStats({
        totalProblems: userStats.totalProblems,
        totalCorrect: Math.round(userStats.totalProblems * userStats.accuracy / 100),
        accuracy: userStats.accuracy
      });

      // 5. 카테고리별 통계 계산
      const categoryData = calculateCategoryStats(userStats.detailedData, totals.categoryTotals);
      setCategoryStats(categoryData);

      // 6. 난이도별 통계 계산
      const difficultyData = calculateDifficultyStats(userStats.detailedData, totals.levelTotals);
      setDifficultyStats(difficultyData);

      // 7. 최근 활동 계산
      const activityData = calculateRecentActivities(userStats.detailedData);
      setRecentActivities(activityData);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError('데이터를 불러오는데 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // AuthContext의 user가 변경될 때마다 데이터 로드
  useEffect(() => {
    if (!authLoading && user) {
      loadAllUserData();
    }
  }, [user, authLoading]);

  // 로그아웃 함수
  // const handleLogout = async () => {
  //   try {
  //     const { error } = await supabase.auth.signOut();
  //     if (error) {
  //       throw error;
  //     }
  //     navigate('/login');
  //   } catch (error) {
  //     console.error('로그아웃 오류:', error);
  //     alert('로그아웃에 실패했습니다.');
  //   }
  // };

  // 이미지 로드 에러 핸들링
  const handleImageError = (e) => {
    console.log('이미지 로드 실패, 기본 이미지로 변경');
    e.target.src = '/JavaNyang/default-avatar.png';
  };

  // AuthContext 로딩 중일 때
  if (authLoading) {
    return (
      <div className="mypage-container">
        <div className="loading-container">
          <p>인증 정보 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <div className="mypage-container">
        <div className="error-container">
          <p>로그인이 필요합니다.</p>
          <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중일 때
  if (loading) {
    return (
      <div className="mypage-container">
        <div className="loading-container">
          <p>사용자 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러가 있을 때
  if (error) {
    return (
      <div className="mypage-container">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadAllUserData}>다시 시도</button>
        </div>
      </div>
    );
  }

  // 최근 획득 업적 데이터 (하드코딩 유지)
  const recentAchievements = [
    {
      id: 1,
      title: '첫 번째 문제 해결',
      description: '첫 번째 Java 문제를 성공적으로 해결했습니다!',
      date: '2025.05.16',
      icon: '🎯'
    },
    {
      id: 2,
      title: '연속 학습 3일',
      description: '3일 연속으로 학습을 진행했습니다!',
      date: '2025.05.18',
      icon: '🔥'
    }
  ];

  // 프로그레스 바 계산 함수
  const getProgressPercentage = (current, total) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  // 레벨 프로그레스 바 계산
  const levelProgress = userInfo.maxExp > 0 ? (userInfo.exp / userInfo.maxExp) * 100 : 0;

  return (
    <div id="mypage-container">
      {/* 사용자 정보 상단 */}
      <div className='user-top'>
        <div className='user-info'>
          <img
            className='user-img'
            src={image}
            alt='유저이미지'
            onError={handleImageError}
            onLoad={() => console.log('이미지 로드 성공:', image)}
          />
          <div className='user-details'>
            <p className='user-name'>{name}<span>님</span></p>
            <p className='user-level'>레벨 {userInfo.level}</p>
          </div>
        </div>
        <div className='level-section'>
          <div className='level-bar-container'>
            <div
              className='level-bar-fill'
              style={{ width: `${levelProgress} %` }}
            ></div>
            <div className='level-bar-bg'></div>
          </div>
          <div className='level-text'>{userInfo.exp}/{userInfo.maxExp} <span>EXP</span></div>
        </div>
        <div>
          <button className='profile-edit-btn' onClick={() => navigate('/myEdit')}>
            프로필 수정
          </button>
        </div>
      </div>

      {/* 통계 중간 영역 */}
      <div className='stats-section'>
        {/* 카테고리별 학습 현황 - 수정된 버전 */}
        <div className='stats-card'>
          <p className='card-title'>카테고리별 학습 현황</p>
          <div className='category-list'>
            {categoryStats.length > 0 ? (
              categoryStats.map((category, index) => (
                <div key={index} className='category-item'>
                  <div className='category-info'>
                    <p className='category-name'>{category.name}</p>
                  </div>
                  <div
                    className='progress-bar-container'
                    data-score={`${category.current}/${category.total}`}
                  >
                    <div
                      className='progress-bar-fill'
                      style={{ width: `${getProgressPercentage(category.current, category.total)}%` }}
                    ></div>
                    <div className='progress-bar-bg'></div>
                  </div>
                </div>
              ))
            ) : (
              <p>학습 데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 난이도별 현황 - 수정된 버전 */}
        <div className='stats-card'>
          <p className='card-title'>난이도별 현황</p>
          <div className='difficulty-list'>
            {difficultyStats.length > 0 ? (
              difficultyStats.map((difficulty, index) => (
                <div key={index} className='difficulty-item'>
                  <div className='difficulty-info'>
                    <p className='difficulty-name'>{difficulty.level}</p>
                  </div>
                  <div
                    className='progress-bar-container'
                    data-score={`${difficulty.solved}/${difficulty.total} (${difficulty.percentage}%)`}
                  >
                    <div
                      className='progress-bar-fill'
                      style={{ width: `${difficulty.percentage}%` }}
                    ></div>
                    <div className='progress-bar-bg'></div>
                  </div>
                </div>
              ))
            ) : (
              <p>학습 데이터가 없습니다.</p>
            )}
          </div>

          {/* 정답률 원형 그래프 - 수정된 버전 */}
          <div className='accuracy-section'>
            <p className='accuracy-title'>정답률</p>
            <div className='accuracy-content'>
              <div className='accuracy-circle'>
                <div className='circle-progress'>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="10"
                      strokeDasharray={`${overallStats.accuracy * 2.83} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className='circle-text'>
                    <span className='percentage'>{overallStats.accuracy}%</span>
                  </div>
                </div>
              </div>
              <div className='total-stats'>
                <p className='total-questions'>총 문제: {overallStats.totalProblems}개</p>
                <div className='stats-breakdown'>
                  <span className='correct-count'>정답: {overallStats.totalCorrect}개</span>
                  <span className='wrong-count'>오답: {overallStats.totalProblems - overallStats.totalCorrect}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 활동 및 업적 하단 */}
      <div className='activity-section'>
        {/* 최근 학습 활동 */}
        <div className='activity-card'>
          <p className='card-title'>최근 학습 활동</p>
          <div className='activity-list'>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className='activity-item'>
                  <div className={`status-indicator ${activity.status}`}></div>
                  <div className='activity-content'>
                    <p className='activity-question'>{activity.question}</p>
                    <div className='activity-meta'>
                      <span className='activity-category'>{activity.category}</span>
                      <span className='activity-difficulty'>난이도: {activity.difficulty}</span>
                    </div>
                  </div>
                  <div className='activity-date'>{activity.date}</div>
                </div>
              ))
            ) : (
              <p>최근 학습 활동이 없습니다.</p>
            )}
          </div>
          <button className='view-more-btn'>모든 활동 보기</button>
        </div>

        {/* 최근 획득 업적 */}
        <div className='achievement-card'>
          <p className='card-title'>최근 획득 업적</p>
          <div className='achievement-list'>
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className='achievement-item'>
                <div className='achievement-icon'>{achievement.icon}</div>
                <div className='achievement-content'>
                  <p className='achievement-title'>{achievement.title}</p>
                  <p className='achievement-description'>{achievement.description}</p>
                  <span className='achievement-date'>{achievement.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button className='view-more-btn'>모든 업적 보기</button>
        </div>
      </div>
    </div>
  );
}

export default MyPage;