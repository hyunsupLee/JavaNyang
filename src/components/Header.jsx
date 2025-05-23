import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { PersonFill, BasketFill } from "react-bootstrap-icons";
import logo from "../assets/logo_black.svg";

export default function Header() {
  const [showQuizSubMenu, setShowQuizSubMenu] = useState(false);
  const location = useLocation();

  // 퀴즈 메뉴 클릭 핸들러
  const handleQuizClick = (e) => {
    e.preventDefault(); // 링크 이동 막고
    setShowQuizSubMenu((prev) => !prev); // 토글
  };

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <Navbar className="bg-light" data-bs-theme="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="text-dark fw-bold fs-3">
            {/* <Nav.Link as={Link} to="/"> */}
              <img src={logo} width={80} alt="logo" />
            {/* </Nav.Link> */}
          </Navbar.Brand>

          <Nav className="me-auto">
            <Nav.Link href="#" onClick={handleQuizClick}>
              퀴즈
            </Nav.Link>

            <Nav.Link as={Link} to="/rank">
              랭킹
            </Nav.Link>
            <Nav.Link as={Link} to="/realtimequiz">
              실시간대전
            </Nav.Link>
            <Nav.Link as={Link} to="/adminMembers">
              회원관리
            </Nav.Link>
            <Nav.Link as={Link} to="/adminQuizs">
              퀴즈관리
            </Nav.Link>
          </Nav>

          <Nav>
            <Nav.Link
              as={Link}
              to="/login"
              className="d-flex align-items-center"
            >
              <PersonFill size={20} className="me-2" />
              로그인
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/join"
              className="d-flex align-items-center"
            >
              <BasketFill size={20} className="me-2" />
              회원가입
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {/* 퀴즈 서브 메뉴 */}
      {showQuizSubMenu && (
        <div style={{ backgroundColor: "#D0B7F3", padding: "10px 0" }}>
          <Container>
            <Nav className="justify-content-center gap-4">
              <Nav.Link as={Link} to="/quiz/const">
                변수·상수
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/operator">
                연산자
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/array">
                배열
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/function">
                function
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/control">
                제어문
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/class">
                클래스
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/extends">
                상속·추상화
              </Nav.Link>
              <Nav.Link as={Link} to="/quiz/generic">
                제네릭·람다식
              </Nav.Link>
            </Nav>
          </Container>
        </div>
      )}
    </>
  );
}
