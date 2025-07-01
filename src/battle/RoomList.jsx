import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './RoomList.css';

const RoomList = () => {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();

  // ===== 상태 관리 =====
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  // ===== 컴포넌트 초기화 =====
  useEffect(() => {
    document.title = '자바냥 | 실시간 대전';

    if (user) {
      loadRooms();
      subscribeToRooms();
    }

    return () => {
      // 구독 해제는 컴포넌트 언마운트 시 자동으로 처리됨
    };
  }, [user]);

  // ===== 방 목록 로드 =====
  const loadRooms = async () => {
    try {
      setLoading(true);

      const { data: roomsData, error } = await supabase
        .from('battle_rooms')
        .select(`
          *,
          participant_count:room_participants(count)
        `)
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('방 목록 로드 오류:', error);
        return;
      }

      // 참가자 수 정보 추가
      const roomsWithCount = await Promise.all(
        roomsData.map(async (room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.room_id)
            .eq('is_online', true);

          return {
            ...room,
            participant_count: count || 0
          };
        })
      );

      setRooms(roomsWithCount);
    } catch (error) {
      console.error('방 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== 실시간 구독 =====
  const subscribeToRooms = () => {
    const channelName = `room-changes-${Date.now()}`; // 고유한 채널명

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'battle_rooms'
      }, handleRoomChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_participants'
      }, handleParticipantChange)
      .subscribe((status) => {
        console.log(`Room List 구독 상태: ${status}`);
      });

    return () => supabase.removeChannel(channel);
  };

  // ===== 실시간 이벤트 처리 =====
  const handleRoomChange = (payload) => {
    console.log('방 변경 감지:', payload);
    loadRooms();
  };

  const handleParticipantChange = (payload) => {
    console.log('참가자 변경 감지:', payload);
    loadRooms();
  };

  // ===== 방 만들기 =====
  const createRoom = async () => {
    if (!roomName.trim()) {
      alert('방 이름을 입력해주세요!');
      return;
    }

    if (creating) return;

    try {
      setCreating(true);

      // 방 생성
      const { data: newRoom, error: roomError } = await supabase
        .from('battle_rooms')
        .insert([{
          room_name: roomName.trim(),
          host_uid: user.id,
          host_name: displayName,
          status: 'waiting'
        }])
        .select()
        .single();

      if (roomError) {
        console.error('방 생성 오류:', roomError);
        alert('방 생성에 실패했습니다.');
        return;
      }

      // 방장을 참가자로 추가
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert([{
          room_id: newRoom.room_id,
          uid: user.id,
          user_name: displayName,
          role: 'host',
          is_ready: true, // 방장만 자동 준비 완료
          score: 0,
          is_online: true
        }]);

      if (participantError) {
        console.error('참가자 추가 오류:', participantError);
      }

      // 생성된 방으로 이동
      navigate(`/battle/room/${newRoom.room_id}`);

    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setRoomName('');
    }
  };

  // ===== 방 참가하기 =====
  const joinRoom = async (roomId, currentCount) => {
    if (currentCount >= 2) {
      alert('방이 가득 찼습니다!');
      return;
    }

    try {
      // 이미 참가중인지 확인
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('uid', user.id)
        .single();

      if (existingParticipant) {
        // 이미 참가중이면 바로 방으로 이동
        navigate(`/battle/room/${roomId}`);
        return;
      }

      // 새로 참가
      const { error } = await supabase
        .from('room_participants')
        .insert([{
          room_id: roomId,
          uid: user.id,
          user_name: displayName,
          role: 'player',
          is_ready: false, // 명확히 false로 설정
          score: 0,
          is_online: true
        }]);

      if (error) {
        console.error('방 참가 오류:', error);
        alert('방 참가에 실패했습니다.');
        return;
      }

      // 방으로 이동
      navigate(`/battle/room/${roomId}`);

    } catch (error) {
      console.error('방 참가 실패:', error);
      alert('방 참가 중 오류가 발생했습니다.');
    }
  };

  // ===== 로그인 확인 =====
  if (!user) {
    return (
      <div className="room-list-container">
        <div className="login-required">
          <h2>로그인이 필요합니다</h2>
          <p>실시간 대전에 참여하려면 로그인해주세요.</p>
          <button onClick={() => navigate('/login')}>로그인하러 가기</button>
        </div>
      </div>
    );
  }

  // ===== 렌더링 =====
  return (
    <div className="room-list-container">
      {/* 헤더 */}
      <div className="room-list-header">
        <h1>🔥 실시간 대전</h1>
        <button
          className="create-room-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + 방 만들기
        </button>
      </div>

      {/* 방 목록 */}
      <div className="rooms-grid">
        {loading ? (
          <div className="loading-container">
            <p>방 목록을 불러오는 중...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
            <p>현재 대전 방이 없습니다.</p>
            <p>새로운 방을 만들어보세요! 🎯</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.room_id} className="room-card">
              <div className="room-header">
                <h3>{room.room_name}</h3>
                <span className={`room-status ${room.status}`}>
                  {room.status === 'waiting' ? '대기중' :
                    room.status === 'playing' ? '게임중' : '투표중'}
                </span>
              </div>

              <div className="room-info">
                <p className="room-host">👑 방장: {room.host_name}</p>
                <p className="room-participants">
                  👥 참가자: {room.participant_count}/2
                </p>
                <p className="room-time">
                  ⏰ 생성: {
                    new Date(new Date(room.created_at).getTime() + 9 * 60 * 60 * 1000)
                      .toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                  }
                </p>
              </div>

              <div className="room-actions">
                {room.status === 'waiting' ? (
                  <button
                    className="join-btn"
                    onClick={() => joinRoom(room.room_id, room.participant_count)}
                    disabled={room.participant_count >= 2}
                  >
                    {room.participant_count >= 2 ? '방 가득참' : '참가하기'}
                  </button>
                ) : (
                  <button className="spectate-btn" disabled>
                    관전하기 (준비중)
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 방 만들기 모달 */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-room-modal">
            <h3>새 방 만들기</h3>
            <div className="modal-content">
              <label>방 이름</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="방 이름을 입력하세요"
                maxLength={50}
                onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              />
              <p className="modal-hint">* 최대 2명까지 참가 가능합니다</p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setRoomName('');
                }}
              >
                취소
              </button>
              <button
                className="confirm-btn"
                onClick={createRoom}
                disabled={creating || !roomName.trim()}
              >
                {creating ? '생성중...' : '방 만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;