import { Link } from "react-router-dom";
import quizslide from "./mainSlide.svg";
import { Container, Button, Row, Col } from "react-bootstrap";
import "./Home.css";

export default function Home() {
  return (
    <Container className="min-vh-100 d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <h2 className="fw-bold display-5 mb-3">
        자바냥에서는 <br className="d-md-none" />
        <span className="text-dark">5분마다 인생이 바뀐다</span>
      </h2>
      <p className="text-purple fw-semibold fs-5 mb-4">
        모든 Java 퀴즈를 ∞ 무제한으로
      </p>

      <div className="slider-wrapper">
        <div className="slider-track">
          <img src={quizslide} alt="퀴즈 슬라이드 1" className="slide-img" />
          <img src={quizslide} alt="퀴즈 슬라이드 2" className="slide-img" />
        </div>
      </div>

      <Link to="/quiz">
        <Button
          className="btn-purple px-4 py-2 mt-4"
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
