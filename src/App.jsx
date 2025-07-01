import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./main/Home";
import Quiz from "./service/Quiz";
import QuizList from "./service/QuizList";
import Rank from "./service/Rank";
import Chat from "./chat/Chat";
import MyQuiz from "./service/MyQuiz";
import MyQuizList from "./service/MyQuizList";
import User_Create_Quiz from "./service/User_Create_Quiz";

import RoomList from "./battle/RoomList";
import BattleRoom from "./battle/BattleRoom";

import MemberList from "./admin/MemberList";
import QuizManage from "./admin/QuizManage";
import QuizCreate from "./admin/QuizCreate";
import QuizEdit from "./admin/QuizEdit";

import Login from "./member/Login";
import Join from "./member/Join";
import MyEdit from "./member/MyEdit";
import MyPage from "./member/MyPage";
import Achievement from "./member/Achievement";
import LearningHistory from "./member/LearningHistory";
import CreatedQuizList from "./member/CreatedQuizList";

import Footer from "./components/Footer";
import Header from "./components/Header";

import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./chat/ChatContext";
import FloatingChatButton from "./chat/components/FloatingChatButton";

import NotFoundPage from "./components/NotFoundPage";

function App() {
  const location = useLocation();

  // 푸터를 숨길 페이지들
  const hideFooterPages = ["/join", "/login", "/myEdit", "/chat", "/battleRoom"];
  const shouldHideFooter = hideFooterPages.includes(location.pathname);

  return (
    <div>
      <AuthProvider>
        <ChatProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz/:qid" element={<Quiz />} />
            <Route path="/quizlist/:categoryPath" element={<QuizList />} />
            <Route path="/quizlist" element={<QuizList />} />

            <Route path="/user_create_quiz" element={<User_Create_Quiz />} />

            <Route path="/myquiz/:user_qid" element={<MyQuiz />} />
            <Route path="/myquizlist/:categoryPath" element={<MyQuizList />} />
            <Route path="/myquizlist" element={<MyQuizList />} />

            <Route path="/rank" element={<Rank />} />
            <Route path="/roomList" element={<RoomList />} />
            <Route path="/battle/room/:roomId" element={<BattleRoom />} />
            <Route path="/chat" element={<Chat />} />

            <Route path="/adminMembers" element={<MemberList />} />
            <Route path="/adminQuizs" element={<QuizManage />} />
            <Route path="/adminQuizs/create" element={<QuizCreate />} />
            <Route path="/adminQuizs/edit/:qid" element={<QuizEdit />} />

            <Route path="/login" element={<Login />} />
            <Route path="/join" element={<Join />} />
            <Route path="/myEdit" element={<MyEdit />} />
            <Route path="/myPage" element={<MyPage />} />
            <Route path="/myPage/achievement" element={<Achievement />} />
            <Route
              path="/myPage/learningHistory"
              element={<LearningHistory />}
            />
            <Route path="/myPage/createdquiz" element={<CreatedQuizList />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          {/* 조건부로 푸터 렌더링 */}
          {!shouldHideFooter && <Footer />}

          {/* FloatingChatButton을 AuthProvider와 ChatProvider 안으로 이동 */}
          <FloatingChatButton />
        </ChatProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
