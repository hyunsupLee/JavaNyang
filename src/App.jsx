import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./main/Home";
import QuizPage from "./service/Quiz";
import QuizList from "./service/QuizList";
import Rank from "./service/Rank";
import RealTimeQuiz from "./realtime/RealTimeQuiz";
import MemberList from "./admin/MemberList";
import QuizManage from "./admin/QuizManage";
import Login from "./member/Login";
import Join from "./member/Join";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NotFoundPage from "./components/NotFoundPage";

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:categoryPath" element={<QuizList />} />
        <Route path="/quiz" element={<QuizList />} />
        <Route path="/quiz/detail/:qid" element={<QuizPage />} />
        <Route path="/rank" element={<Rank />} />
        <Route path="/realtimequiz" element={<RealTimeQuiz />} />
        <Route path="/adminMembers" element={<MemberList />} />
        <Route path="/adminQuizs" element={<QuizManage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
