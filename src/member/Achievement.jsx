import './Achievement.css';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Achievement() {
  // AuthContext에서 사용자 정보 가져오기
  const { user, userInfo, loading: authLoading } = useAuth();

  const [achievements, setAchievements] = useState([]);
  const [allAchievementsData, setAllAchievementsData] = useState(null); // 전체 데이터 캐시
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const dataFetched = useRef(false); // 데이터 가져왔는지 확인용

  // 업적 유형에 따른 이모지 반환 함수
  const getTypeEmoji = (type) => {
    switch (type) {
      case 'attendance':
        return '🔥';
      case 'correct':
        return '🎯';
      case 'level':
        return '🌟';
      default:
        return '';
    }
  };

  // 로그인하지 않은 경우
  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  // 업적 데이터 가져오기 함수 (최초 1회만)
  const fetchAllAchievements = async () => {
    try {
      setLoading(true);

      // 1. 모든 업적 가져오기
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('id');

      if (achievementsError) throw achievementsError;

      // 2. 현재 사용자가 달성한 업적들 가져오기
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, achieved_at')
        .eq('uid', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // 3. 달성한 업적 ID 배열 만들기
      const achievedIds = userAchievements.map(ua => ua.achievement_id);

      // 4. 업적 목록에 달성 여부 추가
      const achievementsWithStatus = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          is_achieved: achievedIds.includes(achievement.id),
          achieved_at: userAchievement?.achieved_at || null
        };
      });

      // 전체 데이터 캐시에 저장
      setAllAchievementsData(achievementsWithStatus);
      // 현재 필터에 맞게 표시
      applyFilter(achievementsWithStatus, statusFilter);
      setError(null);
      dataFetched.current = true;
    } catch (err) {
      console.error('업적 데이터 가져오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용 함수
  const applyFilter = (data, filter) => {
    let filteredAchievements = data;
    if (filter === 'achieved') {
      filteredAchievements = data.filter(a => a.is_achieved);
    } else if (filter === 'not_achieved') {
      filteredAchievements = data.filter(a => !a.is_achieved);
    }
    setAchievements(filteredAchievements);
  };

  // 필터 변경 함수 (로딩 없이 즉시 필터링)
  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    if (allAchievementsData) {
      applyFilter(allAchievementsData, filter);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기 (최초 1회만)
  useEffect(() => {
    if (user && !dataFetched.current) {
      fetchAllAchievements();
    } else if (user && allAchievementsData) {
      // 이미 데이터가 있으면 현재 필터 적용만
      applyFilter(allAchievementsData, statusFilter);
    }
  }, [user]);

  // 인증 로딩 중
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // 데이터 로딩 중 (최초 로딩만)
  if (loading && !dataFetched.current) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error) {
    return <div className="error-message">에러 발생: {error}</div>;
  }

  return (
    <main id='achievement'>
      <Link to='/myPage' className='back-btn'>
        <span className='material-symbols-rounded'>keyboard_arrow_left</span>
        마이페이지로
      </Link>
      <h2 className='mb-5'><span>{userInfo?.name}</span> 님의 업적 목록</h2>
      {/* 업적 상태 필터 버튼들 */}
      <div className='achieve-btn-area mb-5'>
        <button
          className={statusFilter === 'all' ? 'active' : ''}
          onClick={() => handleFilterChange('all')}>전체</button>
        <button
          className={statusFilter === 'achieved' ? 'active' : ''}
          onClick={() => handleFilterChange('achieved')}>달성</button>
        <button
          className={statusFilter === 'not_achieved' ? 'active' : ''}
          onClick={() => handleFilterChange('not_achieved')}>미달성</button>
      </div>
      <div className='achieve-area'>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-item ${achievement.is_achieved ? 'achieved' : ''}`}
            >
              <div className='achievement-icon'>{getTypeEmoji(achievement.type)}</div>
              <div className='achievement-content'>
                <h3 className='achievement-title'>{achievement.title}</h3>
                <p className='achievement-description'>{achievement.description}</p>

                {achievement.is_achieved && achievement.achieved_at && (
                  <p className='achieved-date'>
                    {new Date(achievement.achieved_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className='no-data'>
            {statusFilter === 'all' && '업적이 없습니다.'}
            {statusFilter === 'achieved' && '달성한 업적이 없습니다.'}
            {statusFilter === 'not_achieved' && '미달성 업적이 없습니다.'}
          </p>
        )}
      </div>
    </main>
  );
}
