import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import "./quizList.css";

// 카테고리 맵: id와 한국어 이름 함께 관리
const categoryMap = {
  const: { id: 1, name: "상수" },
  operator: { id: 2, name: "연산자" },
  array: { id: 3, name: "배열" },
  function: { id: 4, name: "함수" },
  control: { id: 5, name: "제어문" },
  class: { id: 6, name: "클래스" },
  extends: { id: 7, name: "상속" },
  generic: { id: 8, name: "제네릭" },
};

export default function QuizList() {
  const { categoryPath } = useParams(); // URL 파라미터
  const isValidCategory = Object.prototype.hasOwnProperty.call(
    categoryMap,
    categoryPath
  );
  const categoryId = isValidCategory ? categoryMap[categoryPath].id : null;
  const categoryKorName = isValidCategory
    ? categoryMap[categoryPath].name
    : "전체";

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(0); // 0: 전체, 1~3: 난이도
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      let query = supabase
        .from("quiz_list")
        .select("*")
        .order("qid", { ascending: true });

      if (categoryId !== null) {
        query = query.eq("category", categoryId);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setQuizzes([]);
      } else {
        setQuizzes(data);
      }

      setLoading(false);
    }

    fetchQuizzes();
  }, [categoryId]);

  const filteredQuizzes =
    selectedLevel === 0
      ? quizzes
      : quizzes.filter((quiz) => quiz.level === selectedLevel);

  // 🟣 여기부터 새로 추가되는 부분!
  const searchedQuizzes = filteredQuizzes.filter((quiz) =>
    quiz.quiz_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(searchedQuizzes.length / itemsPerPage);
  const paginatedQuizzes = searchedQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  if (loading) {
    return (
      <div className="layout-frame">
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
      </div>
    );
  }

  if (error) return <div className="layout-frame">에러 발생: {error}</div>;
  if (quizzes.length === 0)
    return <div className="layout-frame">퀴즈가 없습니다.</div>;

  return (
    <div className="layout-frame">
      <div className="quiz-list-container">
        <h5> 퀴즈 </h5>
        <h2>{categoryId ? `${categoryKorName} ` : "전체 퀴즈 리스트"}</h2>
        <br />

        <div className="level-buttons">
          <button
            onClick={() => setSelectedLevel(0)}
            className={selectedLevel === 0 ? "active" : ""}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedLevel(1)}
            className={selectedLevel === 1 ? "active" : ""}
          >
            초급
          </button>
          <button
            onClick={() => setSelectedLevel(2)}
            className={selectedLevel === 2 ? "active" : ""}
          >
            중급
          </button>
          <button
            onClick={() => setSelectedLevel(3)}
            className={selectedLevel === 3 ? "active" : ""}
          >
            고급
          </button>
        </div>
        <div className="search-box">
          <div className="search-input-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.9 20.3L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.146 15.371 4.888 14.113C3.62933 12.8543 3 11.3167 3 9.5C3 7.68333 3.62933 6.14567 4.888 4.887C6.146 3.629 7.68333 3 9.5 3C11.3167 3 12.8543 3.629 14.113 4.887C15.371 6.14567 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L20.325 18.925C20.5083 19.1083 20.6 19.3333 20.6 19.6C20.6 19.8667 20.5 20.1 20.3 20.3C20.1167 20.4833 19.8833 20.575 19.6 20.575C19.3167 20.575 19.0833 20.4833 18.9 20.3ZM9.5 14C10.75 14 11.8127 13.5627 12.688 12.688C13.5627 11.8127 14 10.75 14 9.5C14 8.25 13.5627 7.18733 12.688 6.312C11.8127 5.43733 10.75 5 9.5 5C8.25 5 7.18733 5.43733 6.312 6.312C5.43733 7.18733 5 8.25 5 9.5C5 10.75 5.43733 11.8127 6.312 12.688C7.18733 13.5627 8.25 14 9.5 14Z"
                fill="#9663E8"
              />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="검색어 입력"
              value={searchTerm} // 현재 상태값 바인딩
              onChange={(e) => setSearchTerm(e.target.value)} // 입력값 변경 시 상태 업데이트
            />
          </div>
        </div>

        <table className="quiz-table">
          <thead>
            <tr>
              <th>문제</th>
              <th>제목</th>
              <th>설명</th>
              <th>맞힌 사람</th>
              <th>제출</th>
              <th>정답률</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuizzes.map((quiz, index) => (
              <tr
                key={quiz.qid}
                onClick={() => navigate(`/quiz/detail/${quiz.qid}`)}
              >
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{quiz.quiz_title}</td>
                <td>{quiz.quiz_text}</td>
                <td>{quiz.correct_count}</td>
                <td>{quiz.submit_count}</td>
                <td>
                  {quiz.submit_count > 0
                    ? ((quiz.correct_count / quiz.submit_count) * 100).toFixed(
                        2
                      ) + "%"
                    : "0%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
        />
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, goToPage }) {
  const createPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  const pageNumbers = createPageNumbers();

  return (
    <div className="pagination">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {"<"}
      </button>
      {pageNumbers.map((p, i) =>
        p === "..." ? (
          <span key={i} className="ellipsis">
            ...
          </span>
        ) : (
          <button
            key={i}
            className={p === currentPage ? "active" : ""}
            onClick={() => goToPage(p)}
          >
            <span className="btn-num">{p}</span>
          </button>
        )
      )}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {">"}
      </button>
    </div>
  );
}
