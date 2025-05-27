import { Container, Row, Col } from "react-bootstrap";
import logo from "../assets/logo_white.svg";
import { Link } from "react-router-dom";

//import "./Footer.css"; // 추가로 스타일링이 필요할 경우

export default function Footer() {
  return (
    <footer
      className="bg-dark text-light py-5 border-top"
      style={{ height: "100px", minHeight: "300px" }}
    >
      <Container>
        <Row>
          <Col md={6} className="mb-3">
            <img src={logo} className="mb-3" alt="logo" />
            {/* {{import.meta.env.BASE_URL}/} */}
            <p>
              자바냥은 예비 개발자들이 Java 프로그래밍을 학습하고
              <br />
              실력을 향상시킬 수 있는 온라인 학습 플랫폼입니다.
            </p>
          </Col>
          <Col md={3} className="mb-3">
            <h5>서비스</h5>
            <ul className="list-unstyled">
              <li>
                <Link
                  to="/quiz"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  퀴즈
                </Link>
              </li>
              <li>
                <Link
                  to="/rank"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  랭킹
                </Link>
              </li>
              <li>
                <Link
                  to="/myPage"
                  style={{ color: "white", textDecoration: "none" }}
                >
                  마이페이지
                </Link>
              </li>
            </ul>
          </Col>
          <Col md={3} className="mb-3">
            <h5>문의</h5>
            <ul className="list-unstyled">
              <li>FAQ</li>
              <li>고객센터</li>
              <li>개인정보처리방침</li>
            </ul>
          </Col>
        </Row>
        <hr className="border-light" />
        <p className="text-center mb-0">© 2025 자바냥. All rights reserved.</p>
      </Container>
    </footer>
  );
}
