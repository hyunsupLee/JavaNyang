import React, { useState, useEffect } from "react";
import { Search, Person, ChevronUp, ChevronDown } from "react-bootstrap-icons";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/SupabaseClient';
import './admin.css';

const requiredExp = (level) => {
  return level * 500;
};

const calculateLevelByExperience = (exp) => {
  return Math.floor(exp / 500) + 1; // 0 경험치도 1레벨부터 시작
};

const MemberList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("name"); // 검색 조건 추가
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const { data: userInfo, error: userError } = await supabase
        .from("user_info")
        .select("role")
        .eq("uid", user.id)
        .single();

      if (userError || !userInfo || userInfo.role < 2) {
        alert("접근 권한이 없습니다.");
        navigate("/");
        return;
      }

      await fetchUsers();
      setLoading(false);
    };

    checkAccess();
  }, [navigate]);

  const calculateUserStats = async (uid) => {
    const { data, error } = await supabase
      .from("score_board")
      .select("reward, correct")
      .eq("uid", uid);

    if (error || !data) {
      console.error(`통계 로딩 실패 (uid: ${uid}):`, error);
      return { totalExperience: 0, totalProblems: 0, accuracy: 0 };
    }

    const totalProblems = data.length;
    const totalExperience = data.reduce((sum, d) => sum + (d.reward || 0), 0);
    const correctCount = data.filter((d) => d.correct === true).length;
    const accuracy =
      totalProblems > 0 ? Math.round((correctCount / totalProblems) * 100) : 0;

    return { totalExperience, totalProblems, accuracy };
  };

  const getProfileImageUrl = (profimg) => {
    if (!profimg) return null;
    if (profimg.startsWith("http")) return profimg;

    try {
      const { data } = supabase.storage
        .from("profile-image")
        .getPublicUrl(profimg);
      return data?.publicUrl || null;
    } catch {
      return null;
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_info")
        .select("*")
        .eq("role", 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedUsers = await Promise.all(
        data.map(async (user) => {
          const stats = await calculateUserStats(user.uid);
          const profileImageUrl = getProfileImageUrl(user.profimg);
          return {
            ...user,
            totalExperience: stats.totalExperience,
            calculatedTotalProblems: stats.totalProblems,
            calculatedAccuracy: stats.accuracy,
            profileImageUrl,
          };
        })
      );

      setUsers(enrichedUsers);
      setFilteredUsers(enrichedUsers);
    } catch (error) {
      console.error("사용자 목록 가져오기 실패:", error);
    }
  };

  const handleImageError = (userId) => {
    setImageLoadErrors((prev) => new Set([...prev, userId]));
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.trim().toLowerCase();
      const filtered = users.filter((user) => {
        switch (searchFilter) {
          case "name":
            return user.name?.toLowerCase().includes(term);
          case "email":
            return user.email?.toLowerCase().includes(term);
          case "ranking":
            return user.ranking?.toString().includes(term);
          default:
            return (
              user.name?.toLowerCase().includes(term) ||
              user.email?.toLowerCase().includes(term)
            );
        }
      });
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, searchFilter, users]);

  useEffect(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "ranking":
          aValue = a.ranking ?? 999999;
          bValue = b.ranking ?? 999999;
          break;
        case "level":
          aValue = calculateLevelByExperience(a.totalExperience || 0);
          bValue = calculateLevelByExperience(b.totalExperience || 0);
          break;
        case "experience":
          aValue = a.totalExperience || 0;
          bValue = b.totalExperience || 0;
          break;
        case "solved_problems":
          aValue = a.calculatedTotalProblems || 0;
          bValue = b.calculatedTotalProblems || 0;
          break;
        case "accuracy":
          aValue = a.calculatedAccuracy || 0;
          bValue = b.calculatedAccuracy || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sorted);
  }, [sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

  const renderUserAvatar = (user) => {
    const hasImage = user.profileImageUrl && !imageLoadErrors.has(user.id);
    return (
      <div className="user-avatar">
        {hasImage ? (
          <img
            src={user.profileImageUrl}
            alt={`${user.name || "사용자"} 프로필`}
            className="avatar-image"
            onError={() => handleImageError(user.id)}
          />
        ) : (
          <div className="avatar-fallback">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="member-list-container">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="member-list-container">
      <div className="member-list-wrapper">
        <div className="member-list-header">
          <div className="header-top">
            <h1 className="page-title">
              <Person size={28} /> 자바냥 사용자 관리
            </h1>
            <div className="user-count">
              총 {filteredUsers.length}명의 사용자
            </div>
          </div>
          <div className="search-area">
            <div className="search-input-wrapper">
              <Search size={20} />
              <input
                type="text"
                placeholder={
                  searchFilter === "name"
                    ? "이름으로 검색하세요"
                    : searchFilter === "email"
                    ? "이메일로 검색하세요"
                    : searchFilter === "ranking"
                    ? "랭킹으로 검색하세요"
                    : "검색하세요"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-filter"
            >
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="ranking">랭킹</option>
            </select>
          </div>
        </div>

        <div className="member-table-container">
          <table className="member-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>
                  이름 {renderSortIcon("name")}
                </th>
                <th onClick={() => handleSort("email")}>
                  이메일 {renderSortIcon("email")}
                </th>
                <th onClick={() => handleSort("level")}>
                  레벨 {renderSortIcon("level")}
                </th>
                <th onClick={() => handleSort("ranking")}>
                  랭킹 {renderSortIcon("ranking")}
                </th>
                <th onClick={() => handleSort("experience")}>
                  경험치 {renderSortIcon("experience")}
                </th>
                <th onClick={() => handleSort("solved_problems")}>
                  푼 문제 {renderSortIcon("solved_problems")}
                </th>
                <th onClick={() => handleSort("accuracy")}>
                  정답률 {renderSortIcon("accuracy")}
                </th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, index) => {
                const levelNum = calculateLevelByExperience(
                  user.totalExperience || 0
                );
                const neededXP = requiredExp(levelNum);
                return (
                  <tr
                    key={user.uid || user.id}
                    className={index % 2 === 0 ? "even-row" : "odd-row"}
                  >
                    <td
                      className="user-info-cell"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {renderUserAvatar(user)}
                      <div style={{ marginLeft: "10px" }}>
                        <span style={{ fontWeight: "bold" }}>
                          {user.name || "이름 없음"}
                        </span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="level-badge">{`Lv ${levelNum}`}</span>
                      <br />
                      <small style={{ fontSize: "0.75em", color: "#666" }}>
                        필요 XP: {neededXP.toLocaleString()}
                      </small>
                    </td>
                    <td>{user.ranking || "-"}</td>
                    <td>{user.totalExperience?.toLocaleString() || 0}</td>
                    <td>{user.calculatedTotalProblems || 0}</td>
                    <td>{user.calculatedAccuracy || 0}%</td>
                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`pagination-btn ${
                page === currentPage ? "active" : ""
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberList;
