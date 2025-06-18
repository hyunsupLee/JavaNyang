import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './BattleRoom.css';

const BattleRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, displayName } = useAuth();

  // 상태
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [gameResults, setGameResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [myAnswer, setMyAnswer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // ref
  const channelRef = useRef(null);
  const timerRef = useRef(null);
  const roomRef = useRef(null);

  // room 상태 변경 시 ref 업데이트
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // 파생 상태
  const isHost = room?.host_uid === user?.id;
  const gameStatus = room?.status || 'waiting';
  const currentRound = room?.current_round || 0;
  const totalRounds = room?.total_rounds || 5;
  const myParticipant = participants.find(p => p.uid === user?.id);
  const playersReady = participants.filter(p => p.role !== 'host').every(p => p.is_ready);
  const canStartGame = participants.length === 2 && playersReady;

  // 모든 참가자가 답을 선택했는지 확인
  const allPlayersAnswered = participants.length === 2 &&
    participants.every(p => roundAnswers.some(a => a.uid === p.uid));

  // 점수 계산 함수
  const calculateFinalScores = useCallback(async () => {
    try {
      for (const participant of participants) {
        const { data: userAnswers } = await supabase
          .from('round_answers')
          .select('is_correct')
          .eq('room_id', roomId)
          .eq('uid', participant.uid);

        const correctCount = userAnswers?.filter(a => a.is_correct).length || 0;
        const finalScore = correctCount * 20;

        await supabase
          .from('room_participants')
          .update({ score: finalScore })
          .eq('room_id', roomId)
          .eq('uid', participant.uid);
      }
    } catch (e) {
      console.error('점수 계산 오류', e);
    }
  }, [participants, roomId]);

  // nextRound - 호스트만 실행
  const nextRound = useCallback(async () => {
    if (!isHost) return;

    try {
      if (currentRound >= totalRounds) {
        await calculateFinalScores();

        // result 상태로 변경
        setTimeout(async () => {
          await supabase
            .from('battle_rooms')
            .update({ status: 'result' })
            .eq('room_id', roomId);
        }, 3000);

      } else {
        const { data: quizzes } = await supabase.from('quiz_list').select('qid');
        if (!quizzes?.length) return;
        const random = quizzes[Math.floor(Math.random() * quizzes.length)];

        const newStartTime = new Date().toISOString();

        const { error } = await supabase
          .from('battle_rooms')
          .update({
            current_round: currentRound + 1,
            current_question_id: random.qid,
            question_start_time: newStartTime
          })
          .eq('room_id', roomId);

        if (error) {
          console.error('라운드 업데이트 실패:', error);
        }
      }
    } catch (e) {
      console.error('다음 라운드 오류', e);
    }
  }, [isHost, currentRound, totalRounds, roomId, calculateFinalScores]);

  // 타이머 - ref를 사용한 안전한 방식
  useEffect(() => {
    if (gameStatus !== 'playing' || !isTimerRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // 기존 타이머가 있으면 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 타이머 정리
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsTimerRunning(false);

          // 호스트만 다음 라운드
          if (isHost) {
            nextRound();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, gameStatus, isHost, nextRound]);

  // 타이머 시작 함수
  const startTimer = useCallback((maxTime = 30) => {
    setTimeLeft(maxTime);
    setIsTimerRunning(true);
  }, []);

  // 게임 상태 변경 감지 - 타이머 시작
  useEffect(() => {
    if (gameStatus === 'playing' && room?.question_start_time && !isTimerRunning) {
      const startTime = new Date(room.question_start_time).getTime();
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);

      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsTimerRunning(true);
      } else if (isHost) {
        nextRound();
      }
    }
  }, [gameStatus, room?.question_start_time, isTimerRunning, isHost, nextRound]);

  // 초기화 & 구독
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // 방 정보 로드
        const { data: roomData, error: roomErr } = await supabase
          .from('battle_rooms')
          .select('*')
          .eq('room_id', roomId)
          .single();

        if (roomErr || !roomData) {
          alert('존재하지 않는 방입니다.');
          navigate('/roomList');
          return;
        }
        if (!isMounted) return;
        setRoom(roomData);

        // 참가자 목록 로드
        await loadParticipants();

        // 게임 중이면 문제·답안 로드
        if (roomData.status === 'playing') {
          if (roomData.current_question_id) {
            await loadCurrentQuestion(roomData.current_question_id);
            await loadRoundAnswers(roomData.current_round);
          }
        }

        // 결과 상태면 게임 결과 로드
        if (roomData.status === 'result') {
          await loadGameResults();
        }

        // 실시간 구독
        subscribeRealtime();
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsTimerRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, roomId]);

  // 퀴즈 변경 감지
  useEffect(() => {
    if (gameStatus === 'playing' && room?.current_question_id) {
      loadCurrentQuestion(room.current_question_id);
      loadRoundAnswers(room.current_round);
      setMyAnswer(null);
    }
  }, [room?.current_question_id]);

  // 자동 다음 라운드: 모두 답 제출 시
  useEffect(() => {
    if (gameStatus === 'playing' && isHost && allPlayersAnswered && participants.length === 2) {
      const timeout = setTimeout(() => {
        nextRound();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [roundAnswers, participants, gameStatus, isHost, nextRound, allPlayersAnswered, currentRound]);

  // 데이터 로드 함수들
  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_online', true);

      if (error) {
        console.error('참가자 로드 실패:', error);
        return;
      }

      const sortedParticipants = (data || []).sort((a, b) => {
        if (a.role === 'host') return -1;
        if (b.role === 'host') return 1;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      setParticipants(sortedParticipants);
    } catch (e) {
      console.error('참가자 로드 오류', e);
    }
  };

  const loadCurrentQuestion = async (qid) => {
    try {
      const { data } = await supabase
        .from('quiz_list')
        .select('*')
        .eq('qid', qid)
        .single();
      if (data) setCurrentQuiz(data);
    } catch (e) {
      console.error('문제 로드 오류', e);
    }
  };

  const loadRoundAnswers = async (roundNumber) => {
    try {
      const { data, error } = await supabase
        .from('round_answers')
        .select('*')
        .eq('room_id', roomId)
        .eq('round_number', roundNumber);

      if (error) {
        console.error('답안 로드 오류:', error);
        return;
      }

      setRoundAnswers(data || []);
    } catch (e) {
      console.error('답안 로드 오류', e);
    }
  };

  const loadGameResults = async () => {
    try {
      const { data } = await supabase
        .from('room_participants')
        .select('uid,user_name,score')
        .eq('room_id', roomId)
        .order('score', { ascending: false });
      setGameResults(data || []);
    } catch (e) {
      console.error('게임 결과 로드 오류', e);
    }
  };

  // 실시간 구독
  const subscribeRealtime = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`room-${roomId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'battle_rooms' },
        payload => {
          const updated = payload.new;
          if (updated.room_id !== Number(roomId)) return;

          setRoom(prevRoom => {
            // 게임 시작 시 모든 유저에게 타이머 시작
            if (prevRoom?.status !== 'playing' && updated.status === 'playing') {
              setTimeout(() => {
                startTimer(30);
              }, 100);
            }

            // 라운드 변경 시 모든 유저에게 타이머 재시작
            if (prevRoom?.current_round !== updated.current_round && updated.status === 'playing') {
              if (updated.current_question_id) {
                loadCurrentQuestion(updated.current_question_id);
                loadRoundAnswers(updated.current_round);
              }
              setTimeout(() => {
                setIsTimerRunning(false);
                startTimer(30);
              }, 200);
            }

            return updated;
          });

          // result 상태 처리
          if (updated.status === 'result') {
            setIsTimerRunning(false);
            loadGameResults();
          }
          if (updated.status === 'finished') {
            navigate('/roomList');
          }
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants' },
        () => {
          loadParticipants();
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'round_answers' },
        (payload) => {
          const newAnswer = payload.new;
          const currentRoom = roomRef.current;
          if (newAnswer && newAnswer.room_id === Number(roomId) && newAnswer.round_number === currentRoom?.current_round) {
            loadRoundAnswers(currentRoom.current_round);
          }
        })
      .subscribe();

    channelRef.current = channel;
  };

  // 액션 핸들러
  const toggleReady = async () => {
    if (isHost || !myParticipant) return;
    try {
      await supabase
        .from('room_participants')
        .update({ is_ready: !myParticipant.is_ready })
        .eq('room_id', roomId)
        .eq('uid', user.id);
    } catch (e) {
      console.error('준비 상태 토글 오류', e);
    }
  };

  const startGame = async () => {
    if (!isHost || !canStartGame) return;
    try {
      const { data: quizzes } = await supabase.from('quiz_list').select('qid');
      if (!quizzes?.length) return;

      const random = quizzes[Math.floor(Math.random() * quizzes.length)];
      const startTime = new Date().toISOString();

      await supabase
        .from('battle_rooms')
        .update({
          status: 'playing',
          current_round: 1,
          current_question_id: random.qid,
          question_start_time: startTime
        })
        .eq('room_id', roomId);

      startTimer(30);
    } catch (e) {
      console.error('게임 시작 오류', e);
    }
  };

  const submitAnswer = async (answerNum) => {
    if (gameStatus !== 'playing' || myAnswer !== null) return;
    setMyAnswer(answerNum);

    try {
      const questionStartTime = new Date(room.question_start_time).getTime();
      const responseTime = Math.max(0, Date.now() - questionStartTime);

      const answerData = {
        room_id: Number(roomId),
        round_number: currentRound,
        uid: user.id,
        user_name: displayName,
        question_id: currentQuiz.qid,
        selected_answer: answerNum,
        is_correct: answerNum === currentQuiz.correct,
        response_time_ms: responseTime
      };

      const { error } = await supabase
        .from('round_answers')
        .insert([answerData]);

      if (error) {
        console.error('답안 제출 실패:', error);
        setMyAnswer(null);
        return;
      }

      await updateRealtimeScore();

    } catch (e) {
      console.error('답안 제출 오류', e);
      setMyAnswer(null);
    }
  };

  // 실시간 점수 업데이트 함수
  const updateRealtimeScore = async () => {
    try {
      const { data: myAnswers } = await supabase
        .from('round_answers')
        .select('is_correct')
        .eq('room_id', roomId)
        .eq('uid', user.id);

      const myCorrectCount = myAnswers?.filter(a => a.is_correct).length || 0;
      const myScore = myCorrectCount * 20;

      await supabase
        .from('room_participants')
        .update({ score: myScore })
        .eq('room_id', roomId)
        .eq('uid', user.id);

    } catch (e) {
      console.error('실시간 점수 업데이트 오류:', e);
    }
  };

  const leaveRoom = async () => {
    try {
      if (isHost) {
        await supabase
          .from('battle_rooms')
          .update({ status: 'finished' })
          .eq('room_id', roomId);
      } else {
        await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', roomId)
          .eq('uid', user.id);
      }
      navigate('/roomList');
    } catch (e) {
      console.error('방 나가기 오류', e);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 한국 시간 포맷팅
  const formatKoreaTime = (timestamp) => {
    const date = new Date(timestamp);
    const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));

    const year = koreaTime.getFullYear();
    const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getDate()).padStart(2, '0');
    const hours = String(koreaTime.getHours()).padStart(2, '0');
    const minutes = String(koreaTime.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // 렌더링
  if (!user) return (
    <div className="battle-room-container">
      <div className="error-message">
        <h2>로그인이 필요합니다</h2>
        <button onClick={() => navigate('/login')}>로그인하러 가기</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="battle-room-container">
      <div className="loading-container">
        <p>방 정보를 불러오는 중...</p>
      </div>
    </div>
  );

  if (!room) return (
    <div className="battle-room-container">
      <div className="error-message">
        <h2>방을 찾을 수 없습니다</h2>
        <button onClick={() => navigate('/roomList')}>방 목록으로 돌아가기</button>
      </div>
    </div>
  );

  return (
    <div className="battle-room-container">
      {/* 헤더 */}
      <div className="room-header">
        <div className="room-info">
          <h1>🏠 {room.room_name}</h1>
          <p>방장: {room.host_name} {isHost && '(나)'}</p>
          <p>생성시간: {formatKoreaTime(room.created_at)}</p>
        </div>
        <div className="room-actions">
          <button className="leave-btn" onClick={leaveRoom}>나가기</button>
        </div>
      </div>

      {/* 대기실 */}
      {gameStatus === 'waiting' && (
        <div className="waiting-room">
          <div className="participants-section">
            <h3>참가자 ({participants.length}/2)</h3>
            <div className="participants-list">
              {participants.map(p => (
                <div key={p.uid} className="participant-card">
                  <span>
                    {p.user_name}
                    {p.role === 'host' ? ' 👑' : ''}
                    {p.uid === user.id ? ' (나)' : ''}
                  </span>
                  <span className={p.is_ready ? 'ready-status ready' : 'ready-status not-ready'}>
                    {p.is_ready ? '✅ 준비완료' : '❌ 준비중'}
                  </span>
                </div>
              ))}
              {participants.length < 2 && (
                <div className="waiting-slot"><p>다른 플레이어를 기다리는 중...</p></div>
              )}
            </div>
          </div>
          <div className="game-controls">
            {!isHost && myParticipant && (
              <button
                className={`ready-btn ${myParticipant.is_ready ? 'ready' : ''}`}
                onClick={toggleReady}
              >
                {myParticipant.is_ready ? '준비 취소' : '준비 완료'}
              </button>
            )}
            {isHost && (
              <button
                className="start-btn"
                onClick={startGame}
                disabled={!canStartGame}
              >
                {canStartGame ? '게임 시작! (5문제 2분30초)' : '준비 중...'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 게임 진행 */}
      {gameStatus === 'playing' && currentQuiz && (
        <div className="game-room">
          <div className="game-status">
            <h3>라운드 {currentRound}/{totalRounds}</h3>
            <div className="timer">⏰ {formatTime(timeLeft)} ({isTimerRunning ? '진행중' : '정지'})</div>
            <div className="scores">
              {participants.map(p => {
                return (
                  <div key={p.uid} className="score-item">
                    <span>{p.user_name}{p.role === 'host' ? ' 👑' : ''}</span>
                    <span>{p.score || 0}점</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="question-section">
            <h2>{currentQuiz.quiz_title}</h2>
            <p>{currentQuiz.quiz_text}</p>
            <div className="options">
              {[1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  className={`option-btn ${myAnswer === i ? 'selected' : ''}`}
                  onClick={() => submitAnswer(i)}
                  disabled={myAnswer !== null}
                >
                  {i}. {currentQuiz[`option${i}`]}
                </button>
              ))}
            </div>
            {myAnswer !== null && (
              <p className="answer-submitted">✅ 답안이 제출되었습니다!</p>
            )}
          </div>

          <div className="answers-status">
            <h4>답안 제출 현황</h4>
            {participants.map(p => {
              const ans = roundAnswers.find(a => a.uid === p.uid);
              return (
                <div key={p.uid} className="answer-status-item">
                  <span>{p.user_name}</span>
                  <span>{ans ? `${ans.selected_answer}번 제출` : '입력 중...'}</span>
                </div>
              );
            })}
            {allPlayersAnswered && (
              <p className="all-answered">🎉 모든 참가자가 답을 선택했습니다! 곧 다음 문제로 넘어갑니다.</p>
            )}
          </div>

          {/* 호스트 전용 컨트롤 */}
          {isHost && (
            <div className="host-controls">
              <button onClick={nextRound} className="next-btn">
                다음 문제로 강제 이동
              </button>
            </div>
          )}
        </div>
      )}

      {/* 게임 결과 */}
      {gameStatus === 'result' && (
        <div className="game-completed">
          <h2>🎉 게임 완료!</h2>
          <div className="final-scores">
            {gameResults.map((r, idx) => (
              <div key={r.uid} className={`result-item rank-${idx + 1}`}>
                <span className="rank">
                  {idx === 0 ? '🏆 1등' : idx === 1 ? '🥈 2등' : '🥉 3등'}
                </span>
                <span className="name">{r.user_name}</span>
                <span className="score">{r.score}점</span>
              </div>
            ))}
          </div>
          
          <div className="game-end-actions">
            <button
              className="exit-game-btn"
              onClick={() => navigate('/roomList')}
            >
              방 목록으로 나가기
            </button>

            {isHost && (
              <button
                className="close-room-btn"
                onClick={async () => {
                  await supabase
                    .from('battle_rooms')
                    .update({ status: 'finished' })
                    .eq('room_id', roomId);
                }}
              >
                방 완전히 닫기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleRoom;