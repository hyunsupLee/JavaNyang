import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PersonFill,
  BoxArrowRight,
  People,
  ListUl,
  XCircleFill,
} from "react-bootstrap-icons";
import logo from "../assets/logo_black.svg";
import "./Header.css";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../config/SupabaseClient";

const bucketPath = import.meta.env.VITE_SUPABASE_STORAGE_URL;

export default function Header() {
  const [showQuizSubMenu, setShowQuizSubMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [profimg, setProfImg] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 780);

  const location = useLocation();
  const navigate = useNavigate();
  const role = useRef(0);
  const auth = useAuth();

  useEffect(() => {
    const handleResize = () => {
      //console.log("handleResize.......");
      if (window.innerWidth > 850 && isMenuOpen) {
        setIsMenuOpen(false);
      }
      setIsMobile(window.innerWidth <= 850);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [window.innerWidth]);

  useEffect(() => {
    if (auth.session) {
      let proimgPath = auth.userInfo?.profimg.startsWith("http")
        ? auth.userInfo?.profimg
        : bucketPath + auth.userInfo?.profimg;
      role.current = auth.userInfo?.role;
      setUser(auth.user);
      setProfImg(proimgPath);
      setUsername(
        auth.userInfo?.name || auth.userInfo?.email?.split("@")[0] || "사용자"
      );
    } else {
      role.current = 0;
      setUser(null);
      setProfImg("");
      setUsername("");
    }

    if (location.pathname.startsWith("/quiz")) {
      setShowQuizSubMenu(true);
    } else {
      setShowQuizSubMenu(false);
    }
    return () => {
      setShowQuizSubMenu(false);
    };
  }, [location.pathname, auth]);

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

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const menuItems = [
    { label: "퀴즈", path: "/quizlist" },
    { label: "나만의퀴즈", path: "/myquizlist" },
    { label: "랭킹", path: "/rank" },
    { label: "실시간 채팅", path: "/chat" },
  ];

  const adminItems = [
    { label: "회원관리", path: "/adminMembers" },
    { label: "퀴즈관리", path: "/adminQuizs" },
  ];

  const quizSubItems = [
    { label: "변수·상수", path: "/quizlist/const" },
    { label: "연산자", path: "/quizlist/operator" },
    { label: "배열", path: "/quizlist/array" },
    { label: "function", path: "/quizlist/function" },
    { label: "제어문", path: "/quizlist/control" },
    { label: "클래스", path: "/quizlist/class" },
    { label: "상속·추상화", path: "/quizlist/extends" },
    { label: "제네릭·람다식", path: "/quizlist/generic" },
  ];

  return (
    <>
      <div
        className={`header ${
          user && role.current > 1 ? "header-bg-admin" : ""
        }`}
      >
        <div className="header-box">
          <Link to="/" className="header-logo">
            <img src={logo} alt="logo" />
          </Link>

          {isMobile ? (
            <div className="hamburger" onClick={toggleMenu}>
              <ListUl size={30} />
            </div>
          ) : (
            <>
              <nav className="header-nav">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`header-menu-item ${
                      location.pathname.startsWith(item.path) ? "active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {role.current > 1 &&
                  adminItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`header-menu-item ${
                        location.pathname.startsWith(item.path) ? "active" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
              </nav>
              <div className="header-space"></div>
              <div className="user_nav_box">
                {profimg && (
                  <img src={profimg} alt="profile" className="top-avatar" />
                )}
                {user ? (
                  <>
                    <Link
                      to="/myPage"
                      onClick={toggleMenu}
                      className="header_text_link"
                    >
                      {username}님
                    </Link>
                    <button onClick={handleLogout} className="modal-logout">
                      <BoxArrowRight size={20} className="me-2" /> logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={toggleMenu}
                      className="header_text_link"
                    >
                      <PersonFill size={20} /> login
                    </Link>
                    <Link
                      to="/join"
                      onClick={toggleMenu}
                      className="header_text_link"
                    >
                      <People size={20} /> join
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isMobile && isMenuOpen && (
        <div className="modal-backdrop" onClick={toggleMenu}>
          <div
            className="modal-content slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-profile">
              {profimg && (
                <img src={profimg} alt="profile" className="modal-avatar" />
              )}
              {user ? (
                <>
                  <Link
                    to="/myPage"
                    onClick={toggleMenu}
                    className="header_text_link"
                  >
                    {username}님
                  </Link>
                  <button onClick={handleLogout} className="modal-logout">
                    <BoxArrowRight size={20} className="me-2" /> logout
                  </button>
                </>
              ) : (
                <div
                  style={{ display: "flex", gap: "20px", alignItems: "center" }}
                >
                  <Link
                    to="/login"
                    onClick={toggleMenu}
                    className="header_text_link"
                  >
                    <PersonFill size={20} /> login
                  </Link>
                  <Link
                    to="/join"
                    onClick={toggleMenu}
                    className="header_text_link"
                  >
                    <People size={20} /> join
                  </Link>
                </div>
              )}
            </div>

            <hr className="modal-divider" />

            <nav className="modal-nav">
              {menuItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={toggleMenu}>
                  {item.label}
                </Link>
              ))}

              {role.current > 1 &&
                adminItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={toggleMenu}>
                    {item.label}
                  </Link>
                ))}
            </nav>
            <div style={{ color: "white", width: "100%", textAlign: "center" }}>
              <XCircleFill
                size={30}
                onClick={toggleMenu}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {showQuizSubMenu && (
        <>
          <div className="header-quiz-submenu-wrapper">
            <nav>
              {quizSubItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`quiz-submenu-item ${
                    location.pathname.startsWith(item.path) ? "active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
