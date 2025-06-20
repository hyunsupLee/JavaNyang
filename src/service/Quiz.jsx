import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/SupabaseClient";
import "./Quiz.css";

const categoryNameMap = {
  const: "상수",
  operator: "연산자",
  array: "예시 배열",
  function: "함수",
  control: "제어문",
  class: "클래스",
  extends: "상속",
  generic: "제네릭",
};

const categoryMapReverse = {
  1: "const",
  2: "operator",
  3: "array",
  4: "function",
  5: "control",
  6: "class",
  7: "extends",
  8: "generic",
};

const levelMap = {
  1: "초급",
  2: "중급",
  3: "고급",
};

function HeaderBar({ timeLeft, maxTime, category }) {
  const navigate = useNavigate();

  const handleBack = () => {
    const categoryPath = categoryMapReverse[category];
    if (categoryPath) {
      navigate(`/quizlist/${categoryPath}`);
    } else {
      navigate(`/quizlist`);
    }
  };

  return (
    <div className="header-bar">
      <div className="top-bar">
        <button className="back-button" onClick={handleBack}>
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
          <span className="qtimer">
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
    <div className="qquestion-section">
      <h2 className="question-title">{title}</h2>
      <p className="question-text">{question}</p>
    </div>
  );
}

function SubmitButton({ onClick, disabled }) {
  return (
    <div className="submit-button-container">
      <button className="qsubmit-button" onClick={onClick} disabled={disabled}>
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

function AlertModal({
  message,
  onClose,
  showNextButton = false,
  onNext,
  nextButtonText = "다음 단계로",
}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // 오버레이 클릭으로 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="alert-overlay" onClick={handleOverlayClick}>
      <div className="alert-box">
        <div className="alert-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="29"
            viewBox="0 0 32 29"
            fill="none"
          >
            <path
              d="M11.5648 22.6704L28.5549 0.775056C28.9558 0.258352 29.4236 0 29.9582 0C30.4928 0 30.9605 0.258352 31.3615 0.775056C31.7624 1.29176 31.9629 1.90578 31.9629 2.6171C31.9629 3.32843 31.7624 3.94159 31.3615 4.45657L12.9681 28.2249C12.5672 28.7416 12.0994 29 11.5648 29C11.0302 29 10.5624 28.7416 10.1615 28.2249L1.54118 17.1158C1.14023 16.5991 0.947778 15.986 0.963816 15.2763C0.979854 14.5667 1.18901 13.9527 1.59129 13.4343C1.99358 12.9159 2.47003 12.6575 3.02066 12.6592C3.5713 12.661 4.04708 12.9193 4.44803 13.4343L11.5648 22.6704Z"
              fill="#C0A1F1"
            />
          </svg>
        </div>
        <p className="alert-message">{message}</p>
        <div
          className="alert-button-group"
          style={{ display: "flex", gap: "10px", justifyContent: "center" }}
        >
          <button className="alert-button" onClick={onClose}>
            퀴즈 목록으로 가기
          </button>
          {showNextButton && (
            <button className="alert-button" onClick={onNext}>
              {nextButtonText}
            </button>
          )}
        </div>
      </div>
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

  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [nextButtonText, setNextButtonText] = useState("");
  const [nextButtonAction, setNextButtonAction] = useState(null);

  const showCustomAlert = (
    message,
    hasNextButton = false,
    buttonText = "다음 단계로",
    buttonAction = null
  ) => {
    setAlertMessage(message);
    setShowNextButton(hasNextButton);
    setNextButtonText(buttonText);
    setNextButtonAction(buttonAction ? () => buttonAction : null);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    // 퀴즈 목록으로 이동
    const categoryPath = categoryMapReverse[quiz?.category];
    if (categoryPath) {
      navigate(`/quizlist/${categoryPath}`);
    } else {
      navigate(`/quizlist`);
    }
  };

  const handleNextLevel = () => {
    if (nextButtonAction) {
      nextButtonAction();
    }
    setShowAlert(false);
  };

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
      if (!qid) {
        setQuiz(null);
        return;
      }

      const numericQid = Number(qid);
      if (isNaN(numericQid)) {
        console.error("유효하지 않은 qid:", qid);
        setQuiz(null);
        return;
      }

      const { data, error } = await supabase
        .from("quiz_list")
        .select("*")
        .eq("qid", numericQid)
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
      showCustomAlert("옵션을 선택해주세요.");
      return;
    }

    setIsSubmitted(true);

    // 정답 여부 판정 (quiz.correct는 1-based index, selectedOption은 0-based index)
    const correctAnswer = selectedOption === quiz.correct - 1;
    setIsCorrect(correctAnswer);

    if (!uid) {
      showCustomAlert("로그인 후 문제를 풀어주세요.");
      return;
    }

    const payload = {
      qid: Number(quiz.qid),
      uid: uid,
      correct: correctAnswer,
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

      // 결과 저장
      const { data, error: insertError } = await supabase
        .from("score_board")
        .insert([payload]);

      if (insertError) {
        console.error("결과 저장 중 오류:", insertError);
        showCustomAlert("결과 저장 중 오류가 발생했습니다.");
      } else {
        console.log("결과 저장 성공!", data);
      }
    } catch (err) {
      console.error("예외 발생:", err);
      showCustomAlert("오류가 발생했습니다.");
    }
  };

  // 다음 난이도의 첫 번째 문제로 이동하는 함수
  const moveToNextLevel = async (nextLevel) => {
    if (!quiz) return;

    try {
      // 같은 카테고리의 다음 난이도 문제 중 첫 번째 문제 찾기
      const { data: nextLevelQuizzes, error } = await supabase
        .from("quiz_list")
        .select("qid")
        .eq("category", quiz.category)
        .eq("level", nextLevel)
        .order("qid", { ascending: true })
        .limit(1);

      if (error) {
        console.error("다음 난이도 문제 찾기 실패:", error);
        return;
      }

      if (nextLevelQuizzes && nextLevelQuizzes.length > 0) {
        navigate(`/quiz/${nextLevelQuizzes[0].qid}`);
      } else {
        const categoryPath = categoryMapReverse[quiz.category];
        navigate(`/quizlist/${categoryPath}`);
      }
    } catch (err) {
      console.error("다음 난이도 이동 중 오류:", err);
    }
  };

  const handleNextQuiz = () => {
    if (!quiz || sameLevelCategoryQuizzes.length === 0) return;

    const currentQid = Number(quiz.qid);

    // 아직 풀지 않은 퀴즈들 필터링
    const unsolvedQuizzes = sameLevelCategoryQuizzes
      .filter((q) => !solvedQids.includes(Number(q.qid)))
      .map((q) => Number(q.qid))
      .sort((a, b) => a - b);

    // 다음 문제 찾기
    const nextQid = unsolvedQuizzes.find((qid) => qid > currentQid);
    if (nextQid !== undefined) {
      navigate(`/quiz/${nextQid}`);
      return;
    }

    // 이전 문제 찾기
    const prevQid = [...unsolvedQuizzes]
      .reverse()
      .find((qid) => qid < currentQid);
    if (prevQid !== undefined) {
      navigate(`/quiz/${prevQid}`);
      return;
    }

    // 여기는 마지막 문제를 푼 경우만 실행됨
    const categoryPath = categoryMapReverse[quiz.category];
    const categoryName = categoryNameMap[categoryPath] || "해당 카테고리";
    const levelName = levelMap[quiz.level] || "해당 난이도";
    const currentLevel = quiz.level;

    // 난이도별 다음 단계 버튼 설정
    if (currentLevel === 1) {
      // 초급 완료 - 중급으로 이동
      showCustomAlert(
        `${categoryName}의 ${levelName} 단계를 모두 푸셨습니다!`,
        true,
        "중급 문제 가기",
        () => moveToNextLevel(2)
      );
    } else if (currentLevel === 2) {
      // 중급 완료 - 고급으로 이동
      showCustomAlert(
        `${categoryName}의 ${levelName} 단계를 모두 푸셨습니다!`,
        true,
        "고급 문제 가기",
        () => moveToNextLevel(3)
      );
    } else {
      // 고급 완료 - 다음 단계 버튼 없음
      showCustomAlert(`${categoryName}의 ${levelName} 단계를 모두 푸셨습니다!`);
    }
  };

  if (!quiz)
    return (
      <div
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

  const options = [quiz.option1, quiz.option2, quiz.option3, quiz.option4];

  return (
    <div className="quiz-container">
      <HeaderBar
        timeLeft={timeLeft}
        maxTime={quiz.timer || 30}
        category={quiz.category}
      />

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
      {showAlert && (
        <AlertModal
          message={alertMessage}
          onClose={closeAlert}
          showNextButton={showNextButton}
          onNext={handleNextLevel}
          nextButtonText={nextButtonText}
        />
      )}

      {isSubmitted && (
        <>
          <div className="feedback">
            {isCorrect ? "정답입니다!" : "땡! 틀렸습니다."}
          </div>

          <div className="explanation-section">
            <div> </div>
            <p>{quiz.desc || "해설이 없습니다."}</p>
          </div>

          <div
            className="submit-button-container"
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            {isCorrect ? (
              <button className="qsubmit-button" onClick={handleNextQuiz}>
                다음 문제 풀기
              </button>
            ) : (
              <>
                <button
                  className="qsubmit-button"
                  onClick={() => {
                    setSelectedOption(null);
                    setIsSubmitted(false);
                    setIsCorrect(null);
                    setTimeLeft(quiz.timer || 30);
                  }}
                >
                  다시 풀어보기
                </button>
                <button className="qsubmit-button" onClick={handleNextQuiz}>
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
