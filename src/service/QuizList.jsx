import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../member/supabaseClient";
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

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  if (loading) return <div className="layout-frame">로딩중...</div>;
  if (error) return <div className="layout-frame">에러 발생: {error}</div>;
  if (quizzes.length === 0)
    return <div className="layout-frame">퀴즈가 없습니다.</div>;

  return (
    <div className="layout-frame">
      <div className="quiz-list-container">
        <h2>{categoryId ? `${categoryKorName} 문제들` : "전체 퀴즈 리스트"}</h2>
        <br />

        <div className="level-buttons">
          <button onClick={() => setSelectedLevel(0)}>전체</button>
          <button onClick={() => setSelectedLevel(1)}>초급</button>
          <button onClick={() => setSelectedLevel(2)}>중급</button>
          <button onClick={() => setSelectedLevel(3)}>고급</button>
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
