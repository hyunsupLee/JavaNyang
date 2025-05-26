import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../member/supabaseClient"; // 본인 경로에 맞게 수정
import "./quiz.css";

function HeaderBar({ timeLeft }) {
  const navigate = useNavigate();

  return (
    <div className="header-bar">
      {/* 가장 위: 뒤로가기 버튼 */}
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate("/quiz")}>
          &lt; 문제 목록으로
        </button>
      </div>

      {/* 문제 타이틀 왼쪽, 타이머 오른쪽 */}
      <div className="header-row">
        <div className="question-title-1">문제풀기</div>

        <div className="timer-bar-group">
          <div className="timer-progress">
            <div
              className="timer-fill"
              style={{ width: `${timeLeft * 3}px` }}
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
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);

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
    }

    fetchQuiz();
  }, [qid]);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // 시간 다 되면 자동 제출
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSubmit = () => {
    if (!quiz) return;
    setIsSubmitted(true);
    setIsCorrect(selectedOption === quiz.correct - 1);
  };

  if (!quiz) return <div>퀴즈를 불러오는 중입니다...</div>;

  const options = [quiz.option1, quiz.option2, quiz.option3, quiz.option4];

  return (
    <div className="quiz-container">
      <HeaderBar timeLeft={timeLeft} />

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
      <SubmitButton
        onClick={handleSubmit}
        disabled={isSubmitted || selectedOption === null}
      />

      {isSubmitted && (
        <div className="feedback">
          {isCorrect ? "✅ 정답입니다!" : "❌ 틀렸습니다."}
        </div>
      )}
    </div>
  );
}
