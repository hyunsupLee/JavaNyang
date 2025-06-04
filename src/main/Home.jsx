import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import quizslide from "./mainSlide.svg";
import { Container, Button } from "react-bootstrap";
import "./Home.css";
import { hasAttendedToday, attendToday } from "./AttendToday";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const message = "You Can Enjoy Unlimited Java quiz";
  const [displayedText, setDisplayedText] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const indexRef = useRef(0);
  const auth = useAuth();

  // 자동 출석 등록
  const [attended, setAttended] = useState(false);
  useEffect(() => {
    const attcheck = async () => {
      if (auth.session && !attended) {
        let isAttend = await hasAttendedToday();
        console.log("오늘 출석여부 : ", isAttend);
        setAttended(isAttend);
        if (!isAttend) attendClick();
      }
    };
    attcheck();
  }, []);

  const attendClick = async () => {
    if (attended) return;
    console.log("attendClick..", attended);
    await attendToday();
    setAttended(true);
  };

  //

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = indexRef.current;
      if (currentIndex < message.length) {
        setDisplayedText((prev) => prev + message[currentIndex]);
        indexRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sessionMsg = sessionStorage.getItem("welcomeMessage");
    if (sessionMsg) {
      setWelcomeMessage(`${sessionMsg}님, 환영합니다! 🎉`);
      sessionStorage.removeItem("welcomeMessage");
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setWelcomeMessage(""), 1000);
      }, 3000);
    }
  }, []);

  return (
    <Container
      fluid
      className="p-0 d-flex flex-column align-items-center justify-content-center text-center"
    >
      {welcomeMessage && (
        <div className={`welcome-banner ${fadeOut ? "fade-out" : ""}`}>
          {welcomeMessage}
        </div>
      )}

      {/* <button
        onClick={attendClick}
        disabled={attended}
        className={`px-4 py-2 rounded ${
          attended ? "bg-primary" : "bg-primary hover:bg-green-600"
        } text-white`}
      >
        {attended ? "오늘 출석 완료" : "출석하기"}
      </button> */}

      <h4 className="fw-bold mt-5">자바냥 에서는</h4>
      <h2 className="fw-bold display-5 mb-3">5분마다 인생이 바뀐다</h2>
      <h4 className="typewriter mb-3">{displayedText}</h4>

      <div className="slider-wrapper">
        <div className="slider-track">
          <img src={quizslide} alt="퀴즈 슬라이드 1" className="slide-img" />
          <img src={quizslide} alt="퀴즈 슬라이드 2" className="slide-img" />
        </div>
      </div>

      <Link to="/quizlist" style={{ paddingBottom: "150px" }}>
        <Button
          className="btn-purple px-4 py-2 mt-4 mb-5"
          size="lg"
          style={{
            backgroundColor: "#9663E8",
            borderColor: "#9663E8",
            width: "415px",
          }}
        >
          모든 Java 퀴즈 풀러가기
        </Button>
      </Link>
    </Container>
  );
}
