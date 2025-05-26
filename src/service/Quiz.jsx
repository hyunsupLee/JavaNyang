import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../member/supabaseClient"; // 본인 경로에 맞게 수정
import "./quiz.css";

function HeaderBar({ timeLeft }) {
  const navigate = useNavigate();

  return (
    <div className="header-bar">
      <button className="back-button" onClick={() => navigate("/quiz")}>
        &lt; 문제 목록으로
      </button>
      <div className="header-right">
        <span className="timer">⏰ {String(timeLeft).padStart(2, "0")}초</span>
        {/* 난이도는 나중에 데이터에 따라 바꿀 수 있어요 */}
        <span className="difficulty">쉬움</span>
      </div>
    </div>
  );
}

function ProgressBar({ timeLeft, totalTime }) {
  const percentage = (timeLeft / totalTime) * 100;
  const isTimeUp = timeLeft === 0;

  return (
    <div className="progress-bar-container">
      <div
        className={`progress-bar-fill ${isTimeUp ? "empty" : ""}`}
        style={{ width: isTimeUp ? "100%" : `${percentage}%` }}
      ></div>
    </div>
  );
}

function QuestionSection({ title, question, hint }) {
  return (
    <div className="question-section">
      <h2 className="question-title">{title}</h2>
      <p className="question-text">{question}</p>
      {hint && <p className="hint">힌트: {hint}</p>}
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
    // 정답 번호는 1~4일 가능성에 맞춰 -1 해줌
    setIsCorrect(selectedOption === quiz.correct - 1);
  };

  if (!quiz) return <div>퀴즈를 불러오는 중입니다...</div>;

  const options = [quiz.option1, quiz.option2, quiz.option3, quiz.option4];

  return (
    <div className="quiz-container">
      <HeaderBar timeLeft={timeLeft} />
      <ProgressBar timeLeft={timeLeft} totalTime={quiz.timer || 30} />
      <QuestionSection
        title={quiz.quiz_title}
        question={quiz.quiz_text}
        hint={quiz.hint}
      />
      <OptionList
        options={options}
        selected={selectedOption}
        correctIndex={quiz.correct - 1} // 인덱스 맞춤
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
