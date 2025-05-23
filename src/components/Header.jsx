import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { PersonFill, BasketFill } from "react-bootstrap-icons";
import logo from "../assets/logo_black.svg";

export default function Header() {
  const [showQuizSubMenu, setShowQuizSubMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log("location.pathname : ", location.pathname);
    if (location.pathname.startsWith("/quiz")) {
      setShowQuizSubMenu(true);
    } else {
      setShowQuizSubMenu(false);
    }
    return () => {
      setShowQuizSubMenu(false);
    };
  }, [location.pathname]);

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <Navbar className="bg-light" data-bs-theme="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="me-5">
            <img src={logo} width={80} alt="logo" />
          </Navbar.Brand>

          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/quiz"
              className={`me-4 topmenu-item ${
                location.pathname.startsWith("/quiz") ? "active" : ""
              }`}
            >
              퀴즈
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/rank"
              className={`me-4 topmenu-item ${
                location.pathname.startsWith("/rank") ? "active" : ""
              }`}
            >
              랭킹
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/realtimequiz"
              className={`me-4 topmenu-item ${
                location.pathname.startsWith("/realtimequiz") ? "active" : ""
              }`}
            >
              실시간대전
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/adminMembers"
              className={`me-4 topmenu-item ${
                location.pathname.startsWith("/adminMembers") ? "active" : ""
              }`}
            >
              회원관리
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/adminQuizs"
              className={`topmenu-item ${
                location.pathname.startsWith("/adminQuizs") ? "active" : ""
              }`}
            >
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
        <div className="header-quiz-submenu-wrapper">
          <Container>
            <Nav className="justify-content-center gap-4">
              {[
                { label: "변수·상수", path: "/quiz/const" },
                { label: "연산자", path: "/quiz/operator" },
                { label: "배열", path: "/quiz/array" },
                { label: "function", path: "/quiz/function" },
                { label: "제어문", path: "/quiz/control" },
                { label: "클래스", path: "/quiz/class" },
                { label: "상속·추상화", path: "/quiz/extends" },
                { label: "제네릭·람다식", path: "/quiz/generic" },
              ].map((item) => (
                <Nav.Link
                  as={Link}
                  to={item.path}
                  key={item.path}
                  className={`text-black quiz-submenu-item ${
                    location.pathname.startsWith(item.path) ? "active" : ""
                  }`}
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Container>
        </div>
      )}
    </>
  );
}
