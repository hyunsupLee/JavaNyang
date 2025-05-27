import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PersonFill, BasketFill, GearFill } from "react-bootstrap-icons";
import { supabase } from "../config/SupabaseClient";
import logo from "../assets/logo_black.svg";

export default function Header() {
  const [showQuizSubMenu, setShowQuizSubMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();

  // 사용자 이름 가져오기
  const loadUserName = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_info')
        .select('name')
        .eq('uid', userId)
        .single();

      if (error) {
        console.error('사용자 정보 로드 실패:', error);
        return;
      }

      setUsername(data?.name || user?.email?.split('@')[0] || '사용자');
    } catch (error) {
      console.error('사용자 이름 로드 중 오류:', error);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      setUser(null);
      setUsername("");
      navigate("/login");
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  useEffect(() => {
    // 초기 사용자 정보 가져오기
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadUserName(user.id);
      }
    };

    getInitialUser();

    // 실시간 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        loadUserName(session.user.id);
      } else {
        setUser(null);
        setUsername("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 경로 변경에 따른 서브메뉴 표시/숨김
  useEffect(() => {
    setShowQuizSubMenu(location.pathname.startsWith("/quiz"));
  }, [location.pathname]);

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <Navbar className="bg-light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="text-dark fw-bold fs-3">
            <img src={logo} width={80} alt="logo" />
          </Navbar.Brand>
          
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/quiz">퀴즈</Nav.Link>
            <Nav.Link as={Link} to="/rank">랭킹</Nav.Link>
            <Nav.Link as={Link} to="/realtimequiz">실시간대전</Nav.Link>
            <Nav.Link as={Link} to="/adminMembers">회원관리</Nav.Link>
            <Nav.Link as={Link} to="/adminQuizs">퀴즈관리</Nav.Link>
          </Nav>
          
          <Nav>
            {user ? (
              <>
                <Nav.Link as={Link} to="/myPage" className="d-flex align-items-center">
                  <PersonFill size={20} className="me-2" />
                  {username}님
                </Nav.Link>
                <Nav.Link as={Link} to="/profile/edit" className="d-flex align-items-center">
                  <GearFill size={20} className="me-2" />
                  프로필 수정
                </Nav.Link>
                <Nav.Link onClick={handleLogout} className="d-flex align-items-center">
                  <BasketFill size={20} className="me-2" />
                  로그아웃
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
                  <PersonFill size={20} className="me-2" />
                  로그인
                </Nav.Link>
                <Nav.Link as={Link} to="/join" className="d-flex align-items-center">
                  <BasketFill size={20} className="me-2" />
                  회원가입
                </Nav.Link>
              </>
            )}
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