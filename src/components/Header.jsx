import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PersonFill, BasketFill } from "react-bootstrap-icons";
import logo from "../assets/logo_black.svg";

export default function Header() {
  return (
    <Navbar className="bg-light" data-bs-theme="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="text-dark fw-bold fs-3">
          <img src={logo} width={80} alt="logo" />
        </Navbar.Brand>

        <Nav className="me-auto">
          <Nav.Link as={Link} to="/">
            Home
          </Nav.Link>
          <Nav.Link as={Link} to="/quiz">
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
          <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
            <PersonFill size={20} className="me-2" />
            로그인
          </Nav.Link>
          <Nav.Link as={Link} to="/join" className="d-flex align-items-center">
            <BasketFill size={20} className="me-2" />
            회원가입
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
