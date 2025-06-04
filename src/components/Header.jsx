import { useEffect, useState, useRef } from "react";
import { Container, Nav, Navbar, Image } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PersonFill,
  BoxArrowRight,
  People,
  GearWide,
} from "react-bootstrap-icons";
import logo from "../assets/logo_black.svg";
import { supabase } from "../config/SupabaseClient";
import "./Header.css";
import { useAuth } from "../contexts/AuthContext";

//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//const bucketPath = `${supabaseUrl}/storage/v1/object/public/profile-image/`;
const bucketPath = import.meta.env.VITE_SUPABASE_STORAGE_URL;

export default function Header() {
  const [showQuizSubMenu, setShowQuizSubMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [profimg, setProfImg] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const role = useRef(0);

  // use Context session 관리로 인한 주석 처리
  // // 사용자 이름 가져오기
  // const loadUserName = async (userId) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("user_info")
  //       .select("name,email,profimg,role")
  //       .eq("uid", userId)
  //       .single();

  //     //console.log(data?.name, data?.email, data?.profimg, data?.role);
  //     if (error) {
  //       console.error("사용자 정보 로드 실패:", error);
  //       return;
  //     }

  //     let proimgPath = bucketPath + data.profimg;
  //     role.current = data?.role;
  //     setProfImg(proimgPath);
  //     setUsername(data?.name || user?.email?.split("@")[0] || "사용자");
  //   } catch (error) {
  //     console.error("사용자 이름 로드 중 오류:", error);
  //   }
  // };

  // useEffect(() => {
  //   // 초기 사용자 정보 가져오기
  //   const getInitialUser = async () => {
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();
  //     if (user) {
  //       setUser(user);
  //       loadUserName(user.id);
  //     }
  //   };

  //   getInitialUser();

  //   // 실시간 인증 상태 변경 감지
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (session) {
  //       setUser(session.user);
  //       loadUserName(session.user.id);
  //     } else {
  //       role.current = 0;
  //       setUser(null);
  //       setUsername("");
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      role.current = 0;
      setUser(null);
      setUsername("");
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  //console.log("Header 렌더링");
  const auth = useAuth();

  // 경로 변경에 따른 서브메뉴 표시/숨김
  useEffect(() => {
    if (auth.session) {
      // console.log("token : ", auth.session?.access_token);
      // console.log("profimg : ", auth.userInfo?.profimg);
      // console.log("name : ", auth.userInfo?.name);
      // console.log("email : ", auth.userInfo?.email);
      // console.log("role : ", auth.userInfo?.role);
      // console.log("user : ", auth.user.id);
      let proimgPath = bucketPath + auth.userInfo?.profimg;
      role.current = auth.userInfo?.role;
      setUser(auth.user);
      setProfImg(proimgPath);
      setUsername(
        auth.userInfo?.name || auth.userInfo?.email?.split("@")[0] || "사용자"
      );
    } else {
      //console.log("auth is null");
      role.current = 0;
      setUser(null);
      setProfImg("");
      setUsername("");
    }

    // console.log("location.pathname : ", location.pathname);
    if (location.pathname.startsWith("/quiz")) {
      setShowQuizSubMenu(true);
    } else {
      setShowQuizSubMenu(false);
    }
    return () => {
      setShowQuizSubMenu(false);
    };
  }, [location.pathname, auth]);

  return (
    <>
      {/* 상단 네비게이션 바 C0A1F1 */}
      <Navbar
        className={`${
          user && role.current > 1 ? "header-bg-admin" : "bg-light"
        }`}
        data-bs-theme="light"
        expand="lg"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="me-5">
            <img src={logo} width={80} alt="logo" />
          </Navbar.Brand>

          {role.current > 1}
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
              to="/chat"
              className={`me-4 topmenu-item ${
                location.pathname.startsWith("/chat") ? "active" : ""
              }`}
            >
              실시간 채팅
            </Nav.Link>

            {role.current > 1 && (
              <>
                <Nav.Link
                  as={Link}
                  to="/adminMembers"
                  className={`me-4 topmenu-item ${
                    location.pathname.startsWith("/adminMembers")
                      ? "active"
                      : ""
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
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                {profimg ? (
                  <Image
                    src={profimg}
                    roundedCircle
                    className="header-avatar mt-1"
                  />
                ) : null}

                <Nav.Link
                  as={Link}
                  to="/myPage"
                  className="d-flex align-items-center"
                >
                  {username}님
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/myEdit"
                  className="d-flex align-items-center"
                >
                  <GearWide size={18} className="me-2" />
                  프로필 수정
                </Nav.Link>
                <Nav.Link
                  onClick={handleLogout}
                  className="d-flex align-items-center"
                >
                  <div
                    style={{
                      border: "1px solid #8f8f8f",
                      padding: "3px 10px",
                      borderRadius: "5px",
                    }}
                  >
                    <BoxArrowRight size={20} className="me-2" />
                    logout
                  </div>
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  className="d-flex align-items-center"
                >
                  <PersonFill size={20} className="me-2" />
                  login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/join"
                  className="d-flex align-items-center"
                >
                  <People size={20} className="me-2" />
                  Join
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
