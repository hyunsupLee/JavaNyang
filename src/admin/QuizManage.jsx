import "./admin.css";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

const categoryMap = {
  "*": "전체",
  1: "변수∙상수",
  2: "연산자",
  3: "배열",
  4: "function",
  5: "제어문",
  6: "클래스",
  7: "상속∙추상화",
  8: "제네릭∙람다식",
};

const levelMap = {
  "*": "전체",
  1: "Lv.1",
  2: "Lv.2",
  3: "Lv.3",
  4: "Lv.4",
};

function QuizManage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedParams = useMemo(
    () => ({
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "*",
      level: searchParams.get("level") || "*",
    }),
    [searchParams]
  );

  const {
    keyword: paramKeyword,
    category: paramCategory,
    level: paramLevel,
  } = parsedParams;

  const [searchKeyword, setSearchKeyword] = useState("");
  const [category, setCategory] = useState("*");
  const [level, setLevel] = useState("*");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    document.title = "자바냥 | 퀴즈관리";

    const hasParams =
      searchParams.has("keyword") ||
      searchParams.has("category") ||
      searchParams.has("level");
    if (!hasParams) {
      setSearchKeyword("");
      setCategory("*");
      setLevel("*");
    } else {
      setSearchKeyword(paramKeyword);
      setCategory(paramCategory);
      setLevel(paramLevel);
    }

    initializeQuizManage();
  }, [searchParams]);

  const initializeQuizManage = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) return navigate("../error");

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/quiz-manage`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "get_quiz_list",
            keyword: paramKeyword,
            category: paramCategory,
            level: paramLevel,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        if ([401, 403].includes(response.status)) return navigate("../error");
        throw new Error(result.error || "서버 오류가 발생했습니다.");
      }

      setUserInfo(result.userInfo);
      setQuizList(result.quizList);
    } catch (err) {
      console.error("초기화 오류:", err.message);
      setError(err.message);
      navigate("../error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ keyword: searchKeyword, category, level });
  };

  const toggleFilterPanel = () => setIsFilterOpen((prev) => !prev);

  if (loading) return <p className="admin-loading">로딩 중...</p>;
  if (error) return <p>오류: {error}</p>;

  return (
    <main id="admin">
      <div className="admin-search-area">
        {(paramKeyword || paramCategory !== "*" || paramLevel !== "*") && (
          <div className="search-summary">
            <strong>
              {paramKeyword ? `'${paramKeyword}' 검색 결과` : "전체 결과"}
            </strong>
            <span> | 카테고리: {categoryMap[paramCategory]}</span>
            <span> | 난이도: {levelMap[paramLevel]}</span>
          </div>
        )}

        <form onSubmit={handleSearchSubmit}>
          <div className="search-controls">
            <div className="search-box">
              <span className="material-symbols-rounded">search</span>
              <input
                type="text"
                placeholder="검색어를 입력해주세요"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              검색
            </button>
          </div>
          <div className="search-filter">
            <button
              type="button"
              className="filter-btn"
              onClick={toggleFilterPanel}
            >
              검색 조건
              <span className="material-symbols-rounded">
                {isFilterOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>
          </div>
          <div className={`filter-panel ${isFilterOpen ? "open" : "closed"}`}>
            <fieldset>
              <legend>카테고리</legend>
              <div className="radio-group">
                {[
                  ["*", "전체"],
                  ...Object.entries(categoryMap).filter(([k]) => k !== "*"),
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="category"
                      value={value}
                      checked={category === value}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>난이도</legend>
              <div className="radio-group">
                {[
                  ["*", "전체"],
                  ...Object.entries(levelMap).filter(([k]) => k !== "*"),
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="level"
                      value={value}
                      checked={level === value}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="panel-btn-wrap">
              {/* <button type="button" className="filter-btn">초기화</button> */}
              <button type="submit" className="filter-btn">
                적용
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="admin-list-area">
        <div className="admin-quiz-list">
          <div className="admin-header">
            <span className="checkbox">
              <input type="checkbox" />
            </span>
            <span className="category">카테고리</span>
            <span className="level">난이도</span>
            <span className="title">제목</span>
            <span className="text">설명</span>
            <span className="accuracy">정답률</span>
            <span className="list-btn-wrap">
              <span className="edit">수정</span>
              <span className="delete">삭제</span>
            </span>
          </div>
          <ul className="admin-list">
            {quizList.length > 0 ? (
              quizList.map((quiz, index) => (
                <li key={index} id={quiz.qid} className="admin-item">
                  <span className="checkbox">
                    <input type="checkbox" />
                  </span>
                  <span className="category">
                    {quiz.category_text || "이름 없음"}
                  </span>
                  <span className="level">
                    {quiz.level ? `Lv.${quiz.level}` : ""}
                  </span>
                  <span className="title">
                    {quiz.quiz_title || "이름 없음"}
                  </span>
                  <span className="text" title={quiz.quiz_text || "이름 없음"}>
                    {quiz.quiz_text || "이름 없음"}
                  </span>
                  <span className="accuracy">
                    {quiz.accuracy === null || quiz.accuracy === undefined
                      ? "-"
                      : quiz.accuracy + "%"}
                  </span>
                  <span className="list-btn-wrap">
                    <button
                      type="button"
                      className="edit"
                      onClick={() => handleEditQuiz(quiz.qid)}
                    >
                      <span className="material-symbols-rounded">edit</span>
                    </button>
                    <button
                      type="button"
                      className="delete"
                      onClick={() => handleDeleteQuiz(quiz.qid)}
                    >
                      <span className="material-symbols-rounded">delete</span>
                    </button>
                  </span>
                </li>
              ))
            ) : (
              <li>데이터가 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default QuizManage;
