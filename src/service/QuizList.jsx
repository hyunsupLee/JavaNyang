import React, { useEffect, useState } from "react";
import { supabase } from "../member/supabaseClient"; // 경로 확인

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quiz_list")
        .select("*")
        .order("qid", { ascending: true });
      if (error) {
        setError(error.message);
        setQuizzes([]);
      } else {
        setQuizzes(data);
      }
      setLoading(false);
    }
    fetchQuizzes();
  }, []);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>에러 발생: {error}</div>;
  if (quizzes.length === 0) return <div>퀴즈가 없습니다.</div>;

  return (
    <div>
      <h2>퀴즈 리스트</h2>
      <ul>
        {quizzes.map((quiz) => (
          <li key={quiz.qid}>
            <strong>{quiz.quiz_title}</strong> - {quiz.quiz_text}
          </li>
        ))}
      </ul>
    </div>
  );
}
