import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import "./quiz.css";

function HeaderBar({ timeLeft, maxTime }) {
  const navigate = useNavigate();

  return (
    <div className="header-bar">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate("/quiz")}>
          &lt; 문제 목록으로
        </button>
      </div>
      <div className="header-row">
        <div className="question-title-1">문제풀기</div>
        <div className="timer-bar-group">
          <div className="timer-progress">
            <div
              className="timer-fill"
              style={{ width: `${(timeLeft / maxTime) * 100}%` }}
            ></div>
          </div>
          <span className="timer">
            타이머{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M7 3L17 3V7.2L12 12L7 7.2L7 3Z" fill="black" />
              <path
                d="M18 22V16H17.99L18 15.99L14 12L18 8L17.99 7.99H18L18 2H6V7.99H6.01L6 8L10 12L6 15.99L6.01 16H6V22H18ZM8 7.5V4H16V7.5L12 11.5L8 7.5ZM12 12.5L16 16.5V20H8V16.5L12 12.5Z"
                fill="black"
              />
            </svg>
            {String(timeLeft).padStart(2, "0")}초
          </span>
        </div>
      </div>
    </div>
  );
}

function DifficultyBadge({ level }) {
  const getLevelText = (level) => {
    switch (level) {
      case 1:
        return "초급";
      case 2:
        return "중급";
      case 3:
        return "고급";
      default:
        return "난이도 없음";
    }
  };

  return <span className="difficulty">{getLevelText(level)}</span>;
}

function QuestionSection({ title, question }) {
  return (
    <div className="question-section">
      <h2 className="question-title">{title}</h2>
      <p className="question-text">{question}</p>
    </div>
  );
}

function SubmitButton({ onClick, disabled }) {
  return (
    <div className="submit-button-container">
      <button className="submit-button" onClick={onClick} disabled={disabled}>
        정답 제출하기
      </button>
    </div>
  );
}

function OptionItem({
  text,
  selected,
  onClick,
  isCorrect,
  isSubmitted,
  isAnswer,
}) {
  let className = "option-item";

  if (isSubmitted) {
    if (isAnswer) {
      className += isCorrect ? " correct" : " incorrect";
    } else if (selected) {
      className += " selected";
    }
  } else if (selected) {
    className += " selected";
  }

  return (
    <div className={className} onClick={onClick}>
      {text}
    </div>
  );
}

function OptionList({
  options,
  selected,
  correctIndex,
  isSubmitted,
  onSelect,
}) {
  return (
    <div className="option-list">
      {options.map((text, idx) => (
        <OptionItem
          key={idx}
          text={text}
          selected={selected === idx}
          isSubmitted={isSubmitted}
          isCorrect={idx === correctIndex}
          isAnswer={selected === idx}
          onClick={() => {
            if (!isSubmitted) onSelect(idx);
          }}
        />
      ))}
    </div>
  );
}

export default function QuizPage() {
  const { qid } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sameLevelCategoryQuizzes, setSameLevelCategoryQuizzes] = useState([]);
  const [solvedQids, setSolvedQids] = useState([]);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    async function fetchUid() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUid(user.id);
    }
    fetchUid();
  }, []);

  useEffect(() => {
    async function fetchQuiz() {
      if (!qid) return;

      const { data, error } = await supabase
        .from("quiz_list")
        .select("*")
        .eq("qid", Number(qid))
        .single();

      if (error) {
        console.error("퀴즈 불러오기 실패:", error.message);
        setQuiz(null);
        return;
      }

      setQuiz(data);
      setTimeLeft(data.timer || 30);

      const { data: filteredData, error: filteredError } = await supabase
        .from("quiz_list")
        .select("*")
        .eq("level", data.level)
        .eq("category", data.category)
        .order("qid", { ascending: true });

      if (filteredError) {
        console.error(
          "레벨+카테고리 문제 불러오기 실패:",
          filteredError.message
        );
        setSameLevelCategoryQuizzes([]);
      } else {
        setSameLevelCategoryQuizzes(filteredData || []);
      }
    }

    fetchQuiz();
  }, [qid]);

  useEffect(() => {
    if (!uid) return;

    async function fetchSolvedQids() {
      const { data, error } = await supabase
        .from("score_board")
        .select("qid")
        .eq("uid", uid);

      if (error) {
        console.error("푼 문제 목록 불러오기 실패:", error.message);
        setSolvedQids([]);
        return;
      }

      setSolvedQids(data.map((item) => item.qid));
    }

    fetchSolvedQids();
  }, [uid, qid]);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  }, [qid]);

  const handleSubmit = async () => {
    if (!quiz) return;

    if (selectedOption === null) {
      alert("옵션을 선택해주세요.");
      return;
    }

    setIsSubmitted(true);

    // 정답 여부 판정 (quiz.correct는 1-based index, selectedOption은 0-based index)
    const correctAnswer = selectedOption === quiz.correct - 1;
    setIsCorrect(correctAnswer);

    if (!uid) {
      alert("로그인 후 문제를 풀어주세요.");
      return;
    }

    const payload = {
      qid: Number(quiz.qid), // bigint 숫자 타입
      uid: uid, // uuid string
      correct: correctAnswer, // boolean
      reward: correctAnswer ? Number(quiz.reward ?? 0) : 0, // bigint 숫자
    };

    console.log("제출할 데이터:", payload);

    try {
      // 중복 제출 방지 확인
      const { data: existing, error: existError } = await supabase
        .from("score_board")
        .select("sid")
        .eq("qid", payload.qid)
        .eq("uid", payload.uid)
        .limit(1)
        .maybeSingle();

      if (existError) {
        console.error("중복 확인 오류:", existError);
        return;
      }

      if (existing) {
        alert("이미 푼 문제입니다!");
        return;
      }

      // 결과 저장
      const { data, error: insertError } = await supabase
        .from("score_board")
        .insert([payload]);

      if (insertError) {
        console.error("결과 저장 중 오류:", insertError);
        alert("결과 저장 중 오류가 발생했습니다.");
      } else {
        console.log("결과 저장 성공!", data);
      }
    } catch (err) {
      console.error("예외 발생:", err);
      alert("오류가 발생했습니다.");
    }
  };

  const handleNextQuiz = () => {
    if (!quiz || sameLevelCategoryQuizzes.length === 0) return;

    const currentQid = Number(quiz.qid);
    const sortedQuizzes = [...sameLevelCategoryQuizzes].sort(
      (a, b) => Number(a.qid) - Number(b.qid)
    );

    const nextUnsolved = sortedQuizzes.find(
      (q) => Number(q.qid) > currentQid && !solvedQids.includes(Number(q.qid))
    );

    if (nextUnsolved) {
      navigate(`/quiz/detail/${nextUnsolved.qid}`);
      return;
    }

    const prevUnsolvedList = sortedQuizzes.filter(
      (q) => Number(q.qid) < currentQid && !solvedQids.includes(Number(q.qid))
    );

    if (prevUnsolvedList.length > 0) {
      const lastUnsolved = prevUnsolvedList[prevUnsolvedList.length - 1];
      navigate(`/quiz/detail/${lastUnsolved.qid}`);
      return;
    }

    alert("모든 문제를 다 푸셨습니다!");
  };

  if (!quiz) return <div>퀴즈를 불러오는 중입니다...</div>;

  const options = [quiz.option1, quiz.option2, quiz.option3, quiz.option4];

  return (
    <div className="quiz-container">
      <HeaderBar timeLeft={timeLeft} maxTime={quiz.timer || 30} />
      <div className="question-wrapper">
        <QuestionSection title={quiz.quiz_title} question={quiz.quiz_text} />
        <DifficultyBadge level={quiz.level} />
      </div>

      <OptionList
        options={options}
        selected={selectedOption}
        correctIndex={quiz.correct - 1}
        isSubmitted={isSubmitted}
        onSelect={setSelectedOption}
      />

      {!isSubmitted && (
        <SubmitButton
          onClick={handleSubmit}
          disabled={selectedOption === null}
        />
      )}

      {isSubmitted && (
        <>
          <div className="feedback">
            {isCorrect ? "✅ 정답입니다!" : "❌ 틀렸습니다."}
          </div>
          <div
            className="submit-button-container"
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            {isCorrect ? (
              <button className="submit-button" onClick={handleNextQuiz}>
                다음 문제 풀기
              </button>
            ) : (
              <>
                <button
                  className="submit-button"
                  onClick={() => {
                    setSelectedOption(null);
                    setIsSubmitted(false);
                    setIsCorrect(null);
                    setTimeLeft(quiz.timer || 30);
                  }}
                >
                  다시 풀어보기
                </button>
                <button className="submit-button" onClick={handleNextQuiz}>
                  다음 문제 풀기
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
