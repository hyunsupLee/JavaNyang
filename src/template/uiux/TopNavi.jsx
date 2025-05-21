import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PersonFill, BasketFill } from "react-bootstrap-icons";

export default function TopNavi() {
  return (
    <Navbar className="bg-primary" data-bs-theme="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="text-white fw-bold fs-3">
          JavaNyang
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
          <Nav.Link as={Link} to="/cart" className="d-flex align-items-center">
            <BasketFill size={20} className="me-2" />
            장바구니
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
