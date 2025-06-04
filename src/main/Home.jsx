import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import quizslide from "./mainSlide.svg";
import { Container, Button } from "react-bootstrap";
import "./Home.css";

export default function Home() {
  const message = "You Can Enjoy Unlimited Java quiz";
  const [displayedText, setDisplayedText] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fadeOut, setFadeOut] = useState(false);
  const indexRef = useRef(0);

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
