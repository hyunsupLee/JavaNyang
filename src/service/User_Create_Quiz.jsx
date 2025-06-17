import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/SupabaseClient";
import "./User_Create_Quiz.css";

function AlertModal({ message, onClose }) {
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
        <button className="alert-button" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}

const User_Create_Quiz = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [navigateAfterAlert, setNavigateAfterAlert] = useState(false);

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const [formData, setFormData] = useState({
    quiz_title: "",
    quiz_text: "",
    desc: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correct: 1,
    level: 1,
    category: 1,
    timer: 30,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 1, name: "변수 상수" },
    { id: 2, name: "연산자" },
    { id: 3, name: "배열" },
    { id: 4, name: "function" },
    { id: 5, name: "제어문" },
    { id: 6, name: "클래스" },
    { id: 7, name: "상속 추상화" },
    { id: 8, name: "제네릭 람다식" },
  ];

  const levels = [
    { id: 1, name: "초급" },
    { id: 2, name: "중급" },
    { id: 3, name: "고급" },
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleAlertClose = () => {
    setShowAlert(false);
    if (navigateAfterAlert) {
      navigate(
        `/myquizlist?category=${formData.category}&level=${formData.level}`
      );
    }
  };
  const handleSubmit = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      showCustomAlert("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const {
      quiz_title,
      quiz_text,
      desc,
      option1,
      option2,
      option3,
      option4,
      correct,
      level,
      category,
      timer,
    } = formData;

    if (
      !quiz_title.trim() ||
      !quiz_text.trim() ||
      !option1.trim() ||
      !option2.trim() ||
      !option3.trim() ||
      !option4.trim()
    ) {
      showCustomAlert("모든 항목을 입력해주세요.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("user_quiz_list").insert([
      {
        quiz_title,
        quiz_text,
        desc,
        option1,
        option2,
        option3,
        option4,
        correct,
        level,
        category,
        timer,
        uid: user.id,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("퀴즈 등록 실패:", error.message);
      showCustomAlert("퀴즈 등록에 실패했습니다. 콘솔을 확인하세요.");
    } else {
      setNavigateAfterAlert(true);
      showCustomAlert("퀴즈가 등록되었습니다!");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="qheader">
          <button className="back-button" onClick={handleBack}>
            &lt; 문제 목록으로
          </button>
        </div>

        <h1 className="main-title">퀴즈 등록</h1>

        <div className="form-group">
          <div className="form-row">
            <label className="label">퀴즈 타입</label>
            <div className="button-group">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`select-btn ${
                    formData.category === category.id ? "selected" : ""
                  }`}
                  onClick={() => handleInputChange("category", category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="label">난이도</label>
            <div className="button-group">
              {levels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`select-btn ${
                    formData.level === level.id ? "selected" : ""
                  }`}
                  onClick={() => handleInputChange("level", level.id)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="label">제한시간 (초)</label>
            <select
              value={formData.timer}
              onChange={(e) =>
                handleInputChange("timer", parseInt(e.target.value))
              }
              className="select-timer"
            >
              <option value={30}>30초</option>
              <option value={60}>60초</option>
              <option value={90}>90초</option>
            </select>
          </div>

          <div className="form-row">
            <label className="label">퀴즈 제목</label>
            <input
              type="text"
              value={formData.quiz_title}
              onChange={(e) => handleInputChange("quiz_title", e.target.value)}
              placeholder="제목을 입력하세요"
              className="inputTitle"
            />
          </div>

          <div className="form-row">
            <label className="label">퀴즈 설명</label>
            <textarea
              value={formData.quiz_text}
              onChange={(e) => handleInputChange("quiz_text", e.target.value)}
              placeholder="설명을 입력하세요"
              rows={4}
              className="input-textarea"
            />
          </div>

          <div className="form-row">
            <label className="label">퀴즈 답안</label>
            <div className="options-list">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="option-item">
                  <input
                    type="text"
                    value={formData[`option${num}`]}
                    onChange={(e) =>
                      handleInputChange(`option${num}`, e.target.value)
                    }
                    placeholder="보기를 입력하세요"
                    className="input-text option-text"
                  />
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={formData.correct === num}
                    onChange={() => handleInputChange("correct", num)}
                    className="radio-input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="label">퀴즈 해설</label>
            <textarea
              value={formData.desc}
              onChange={(e) => handleInputChange("desc", e.target.value)}
              placeholder="해설을 입력하세요"
              rows={4}
              className="input-textarea"
            />
          </div>

          <div className="form-row submit-row">
            <button
              onClick={handleSubmit}
              className="submit-button"
              type="button"
              disabled={loading}
            >
              {loading ? "등록 중..." : "퀴즈 등록"}
            </button>
          </div>
        </div>
      </div>

      {showAlert && (
        <AlertModal message={alertMessage} onClose={handleAlertClose} />
      )}
    </div>
  );
};

export default User_Create_Quiz;
