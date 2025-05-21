import "./App.css";
import { Routes, Route } from "react-router-dom"; // ✅ 수정된 부분
import TopNavi from "./template/uiux/TopNavi";
import NotFoundPage from "./template/uiux/NotFoundPage";
import Footer from "./template/uiux/Footer";
import HomePage from "./template/home/HomePage";
import QuizPage from "./quiz/QuizPage";
import RankPage from "./rank/RankPage";
import RealTimeQuizPage from "./realtime/RealTimeQuizPage";
import LoginPage from "./member/LoginPage";
import JoinPage from "./member/JoinPage";
import AdminMembersPage from "./admin/AdminMembersPage";
import AdminQuizsPage from "./admin/AdminQuizsPage";

function App() {
  return (
    <div>
      <TopNavi />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/:caid" element={<QuizPage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/realtimequiz" element={<RealTimeQuizPage />} />
        <Route path="/adminMembers" element={<AdminMembersPage />} />
        <Route path="/adminQuizs" element={<AdminQuizsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
