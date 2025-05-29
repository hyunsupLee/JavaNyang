// import "./App.css";
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Home from "./main/Home";
import Quiz from "./service/Quiz";
import QuizList from "./service/QuizList";
import Rank from "./service/Rank";

import RealTimeQuiz from "./realtime/RealTimeQuiz";

import MemberList from "./admin/MemberList";
import QuizManage from "./admin/QuizManage";
import QuizCreate from "./admin/QuizCreate";
import QuizEdit from "./admin/QuizEdit";


import Login from "./member/Login";
import Join from "./member/Join";
import MyEdit from './member/MyEdit';
import MyPage from './member/MyPage';

import Footer from "./components/Footer";
import Header from "./components/Header";

import { AuthProvider } from './contexts/AuthContext';

import NotFoundPage from "./components/NotFoundPage";

function App() {
  const location = useLocation();
  
  // 푸터를 숨길 페이지들
  const hideFooterPages = ['/join', '/login','/myEdit'];
  const shouldHideFooter = hideFooterPages.includes(location.pathname);

  return (
    <div>
      <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:caid" element={<QuizList />} />
        
        <Route path="/rank" element={<Rank />} />
        <Route path="/realtimequiz" element={<RealTimeQuiz />} />

        <Route path="/adminMembers" element={<MemberList />} />
        <Route path="/adminQuizs" element={<QuizManage />} />
        <Route path="/adminQuizs/create" element={<QuizCreate />} />
        <Route path="/adminQuizs/edit/:qid" element={<QuizEdit />} />

        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/myEdit" element={<MyEdit />} />
        <Route path="/myPage" element={<MyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {/* 조건부로 푸터 렌더링 */}
      {!shouldHideFooter && <Footer />}
      </AuthProvider>
    </div>
  );
}

export default App;