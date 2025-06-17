import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/SupabaseClient";
import "./QuizList.css";

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
  const { categoryPath } = useParams();
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
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [solvedQuizIds, setSolvedQuizIds] = useState([]); // 푼 문제 ID 목록

  const [sortBy, setSortBy] = useState("번호순");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // 로그인한 유저의 푼 문제 목록 가져오기
  useEffect(() => {
    async function fetchSolvedQuizIds() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSolvedQuizIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("score_board")
        .select("qid")
        .eq("uid", user.id);

      if (error) {
        console.error("score_board 조회 에러:", error.message);
        setSolvedQuizIds([]);
      } else {
        setSolvedQuizIds(data.map((item) => item.qid));
      }
    }
    fetchSolvedQuizIds();
  }, []);

  // 퀴즈 및 제출/맞힌 사람 수 가져오기
  useEffect(() => {
    async function fetchQuizzesWithStats() {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      // quiz_list 기본 데이터 쿼리
      let quizQuery = supabase.from("quiz_list").select("*");
      if (categoryId !== null) {
        quizQuery = quizQuery.eq("category", categoryId);
      }
      quizQuery = quizQuery.order("qid", { ascending: false });

      const { data: quizData, error: quizError } = await quizQuery;

      if (quizError) {
        setError(quizError.message);
        setQuizzes([]);
        setLoading(false);
        return;
      }

      if (!quizData || quizData.length === 0) {
        setQuizzes([]);
        setLoading(false);
        return;
      }

      // score_board에서 퀴즈별 제출, 맞힌 사람 수 집계
      // qid별로 제출 수, 맞힌 수 계산 (correct=true인 수)
      let scoreQuery = supabase
        .from("score_board")
        .select("qid, correct", { count: "exact" });

      if (categoryId !== null) {
        // 카테고리 필터가 있으면, 해당 퀴즈 qid 목록에 한정
        // 퀴즈 ID 배열 뽑기
        const quizIds = quizData.map((quiz) => quiz.qid);
        scoreQuery = scoreQuery.in("qid", quizIds);
      }

      const { data: scoreData, error: scoreError } = await scoreQuery;

      if (scoreError) {
        console.error("score_board 집계 오류:", scoreError.message);
      }

      const submitCountMap = {}; // qid -> 제출횟수
      const correctCountMap = {}; // qid -> 맞힌 사람 수

      if (scoreData) {
        scoreData.forEach(({ qid, correct }) => {
          if (!submitCountMap[qid]) submitCountMap[qid] = 0;
          if (!correctCountMap[qid]) correctCountMap[qid] = 0;

          submitCountMap[qid]++;
          if (correct === true) correctCountMap[qid]++;
        });
      }

      // 3) quizData에 맞힌 사람, 제출 칸 데이터 합치기
      const quizzesWithStats = quizData.map((quiz) => ({
        ...quiz,
        submit_count: submitCountMap[quiz.qid] || 0,
        correct_count: correctCountMap[quiz.qid] || 0,
      }));

      setQuizzes(quizzesWithStats);
      setLoading(false);
    }

    fetchQuizzesWithStats();
  }, [categoryId]);

  const filteredQuizzes =
    selectedLevel === 0
      ? quizzes
      : quizzes.filter((quiz) => quiz.level === selectedLevel);

  const searchedQuizzes = filteredQuizzes.filter((quiz) =>
    quiz.quiz_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortQuizzes = (quizzes) => {
    const sorted = [...quizzes];

    switch (sortBy) {
      case "번호순":
        return sorted.sort((a, b) => b.user_qid - a.user_qid);
      case "제출순":
        return sorted.sort((a, b) => b.submit_count - a.submit_count);
      case "정답률순":
        return sorted.sort((a, b) => {
          const aRate =
            a.submit_count > 0 ? a.correct_count / a.submit_count : 0;
          const bRate =
            b.submit_count > 0 ? b.correct_count / b.submit_count : 0;
          return bRate - aRate;
        });
      default:
        return sorted;
    }
  };

  const sortedQuizzes = sortQuizzes(searchedQuizzes);

  const totalPages = Math.ceil(sortedQuizzes.length / itemsPerPage);
  const paginatedQuizzes = sortedQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleSortSelect = (option) => {
    setSortBy(option);
    setShowSortDropdown(false);
    setCurrentPage(1);
  };

  // 로딩 상태
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

  // 에러 발생 시
  if (error) return <div className="layout-frame">에러 발생: {error}</div>;

  // 퀴즈가 없을 때
  if (quizzes.length === 0)
    return <div className="layout-frame">퀴즈가 없습니다.</div>;

  return (
    <div className="layout-frame">
      <div className="quiz-list-container">
        <h5>퀴즈</h5>
        <h2>{categoryId ? `${categoryKorName} 퀴즈` : "전체 퀴즈 리스트"}</h2>
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

        <div className="qsearch-box">
          <div className="sort-dropdown-container">
            <button
              className="sort-dropdown-button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              {sortBy}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  marginLeft: "8px",
                  transform: showSortDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showSortDropdown && (
              <div className="sort-dropdown-menu">
                <div
                  className={`sort-dropdown-item ${
                    sortBy === "번호순" ? "active" : ""
                  }`}
                  onClick={() => handleSortSelect("번호순")}
                >
                  번호순
                </div>
                <div
                  className={`sort-dropdown-item ${
                    sortBy === "제출순" ? "active" : ""
                  }`}
                  onClick={() => handleSortSelect("제출순")}
                >
                  제출순
                </div>
                <div
                  className={`sort-dropdown-item ${
                    sortBy === "정답률순" ? "active" : ""
                  }`}
                  onClick={() => handleSortSelect("정답률순")}
                >
                  정답률순
                </div>
              </div>
            )}
          </div>

          <div className="qsearch-input-wrapper">
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
              className="qsearch-input"
              placeholder="검색어 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 퀴즈 테이블 */}
        <table className="quiz-table">
          <thead>
            <tr>
              <th style={{ width: "62px" }}>문제</th>
              <th style={{ width: "174px" }}>제목</th>
              <th style={{ width: "750px" }}>설명</th>
              <th style={{ width: "108px" }}>맞힌 사람</th>
              <th style={{ width: "62px" }}>제출</th>
              <th style={{ width: "66px" }}>정답률</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuizzes.map((quiz, index) => (
              <tr
                key={quiz.qid}
                onClick={() => navigate(`/quiz/${quiz.qid}`)}
                className={solvedQuizIds.includes(quiz.qid) ? "solved" : ""}
                style={{ cursor: "pointer" }}
              >
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{quiz.quiz_title}</td>
                <td>
                  <div className="quiz-text">{quiz.quiz_text}</div>
                </td>

                <td>{quiz.correct_count}</td>
                <td>{quiz.submit_count}</td>
                <td>
                  {quiz.submit_count > 0
                    ? ((quiz.correct_count / quiz.submit_count) * 100).toFixed(
                        1
                      ) + "%"
                    : "-"}
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

  const pages = createPageNumbers();

  return (
    <div className="pagination">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={"ellipsis" + idx} className="ellipsis">
            ...
          </span>
        ) : (
          <button
            key={page}
            className={page === currentPage ? "active" : ""}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
}
