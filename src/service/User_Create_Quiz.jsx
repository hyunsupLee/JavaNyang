import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/SupabaseClient";
import "./User_Create_Quiz.css";

const User_Create_Quiz = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

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
      showCustomAlert("퀴즈가 등록되었습니다!");
      navigate(`/myquizlist?category=${category}&level=${level}`);
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

      {/* ✅ alert 박스 추가 */}
      {showAlert && (
        <div className="alert-overlay">
          <div className="alert-box">
            <div className="alert-icon">
              {/* 예시 아이콘 (⚠️ SVG나 이미지로 교체 가능) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.07 19h13.86c1.1 0 2.07-.9 2.07-2V7c0-1.1-.97-2-2.07-2H5.07C3.97 5 3 5.9 3 7v10c0 1.1.97 2 2.07 2z"
                />
              </svg>
            </div>
            <p className="alert-message">{alertMessage}</p>
            <button
              className="alert-button"
              onClick={() => setShowAlert(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default User_Create_Quiz;
