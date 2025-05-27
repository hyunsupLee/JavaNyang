import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../member/supabaseClient";
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

export default function Quiz() {
  const { qid } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sameLevelQuizzes, setSameLevelQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      if (!qid) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("quiz_list")
        .select("*")
        .eq("qid", Number(qid))
        .single();

      if (error) {
        console.error("퀴즈 불러오기 실패:", error.message);
        setQuiz(null);
        setLoading(false);
        return;
      }

      setQuiz(data);
      setTimeLeft(data.timer || 30);

      const { data: levelData, error: levelError } = await supabase
        .from("quiz_list")
        .select("*")
        .eq("level", data.level)
        .order("qid", { ascending: true });

      if (levelError) {
        console.error("같은 난이도 문제 불러오기 실패:", levelError.message);
        setSameLevelQuizzes([]);
      } else {
        setSameLevelQuizzes(levelData || []);
      }

      setLoading(false);
    }

    fetchQuiz();
  }, [qid]);

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

  const handleSubmit = () => {
    if (!quiz) return;
    setIsSubmitted(true);
    setIsCorrect(selectedOption === quiz.correct - 1);
  };

  const handleNextQuiz = () => {
    if (!quiz || sameLevelQuizzes.length === 0) {
      console.log("퀴즈 또는 문제 리스트가 없습니다.");
      return;
    }

    const currentIndex = sameLevelQuizzes.findIndex(
      (q) => String(q.qid) === String(quiz.qid)
    );
    console.log("현재 문제 인덱스:", currentIndex);

    if (currentIndex === -1) {
      alert("현재 문제를 찾을 수 없습니다.");
      return;
    }

    const nextQuiz = sameLevelQuizzes[currentIndex + 1];
    console.log("다음 문제:", nextQuiz);

    if (nextQuiz) {
      console.log("네비게이트:", nextQuiz.qid);
      navigate(`/quiz/detail/${nextQuiz.qid}`);
    } else {
      alert("마지막 문제입니다.");
    }
  };

  if (loading) {
    return (
      <div
        className="quiz-container"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        로딩중...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        className="quiz-container"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "red",
        }}
      >
        문제를 불러올 수 없습니다.
      </div>
    );
  }

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
