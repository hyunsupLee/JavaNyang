import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Image,
  ListGroup,
  Spinner,
} from "react-bootstrap";

import "./Rank.css";
import profimg from "../assets/default-avatar.png";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const bucketPath = `${supabaseUrl}/storage/v1/object/public/profile-image/`;

export default function Rank() {
  let barLimitHeight = 300.0;
  let scoreH = useRef(0);
  const [loading, setLoading] = useState(true);
  const [topRankers, setTopRankers] = useState([]);
  const [lowerRankers, setLowerRankers] = useState([]);
  const [rankType, setRankType] = useState("daily");

  const convertProfimgPath = useCallback((profPath) => {
    let convertPath = profPath.startsWith("http")
      ? profPath
      : bucketPath + profPath;
    return convertPath;
  }, []);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/get-rankings?type=${rankType}`
        );

        const data = await response.json();
        const top3Rander = data.top.slice(0, 3).map((item) => {
          item.profimg = convertProfimgPath(item.profimg);
          return item;
        });

        if (top3Rander[0]?.score) {
          scoreH.current = Math.ceil(
            barLimitHeight / parseInt(top3Rander[0].score)
          );
          console.log("scoreH: ", scoreH, parseInt(top3Rander[0].score));
        }

        setTopRankers(top3Rander);

        const lowerRander = data.top.slice(3).map((item) => {
          item.profimg = convertProfimgPath(item.profimg);
          return item;
        });

        setLowerRankers(lowerRander);
      } catch (error) {
        console.error("랭킹 데이터를 가져오는 중 오류 발생:", error);
      }
      setLoading(false);
    }

    fetchRanking();
  }, [rankType]);

  const handleRankChange = (type) => setRankType(type);

  return (
    <Container className="text-center py-5">
      <h2 className="fw-bold mb-4">랭킹</h2>

      <div className="mb-4">
        <button
          className={
            rankType === "daily" ? "ranking-btn active" : "ranking-btn"
          }
          onClick={() => handleRankChange("daily")}
        >
          어제의 랭킹
        </button>
        <button
          className={
            rankType === "weekly" ? "ranking-btn active" : "ranking-btn"
          }
          onClick={() => handleRankChange("weekly")}
        >
          지난주 랭킹
        </button>
        <button
          className={
            rankType === "monthly" ? "ranking-btn active" : "ranking-btn"
          }
          onClick={() => handleRankChange("monthly")}
        >
          지난달 랭킹
        </button>
      </div>

      {loading ? (
        <div className="my-5" style={{ height: "500px" }}>
          <Spinner
            animation="border"
            variant="primary"
            role="status"
            className="my-5"
          />
          <p className="mt-2">랭킹 데이터를 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          {topRankers.length > 0 && (
            <div className="celebration-box mb-5">
              🎉 <b>{topRankers[0].name} 님</b>이{" "}
              <b>{topRankers[0].score} 개의 문제</b>를 풀었습니다! 🎉
            </div>
          )}

          <Row className="align-items-end justify-content-center mb-5">
            {topRankers[1] && (
              <Col xs={4} md={3} className="ranking-col">
                <Image
                  src={topRankers[1].profimg || profimg}
                  roundedCircle
                  className="avatar mb-2"
                />
                <h5 className="text-secondary">🥈 {topRankers[1].name} 님</h5>
                <p className="text-muted">{topRankers[1].email}</p>
                <div
                  className="rank-bar bar-2"
                  style={{
                    height: `${topRankers[1].score * scoreH.current}px`,
                  }}
                >
                  {topRankers[1].score}
                </div>
              </Col>
            )}

            {topRankers[0] && (
              <Col xs={4} md={3} className="ranking-col">
                <Image
                  src={topRankers[0].profimg || profimg}
                  roundedCircle
                  className="avatar mb-2"
                />
                <h5 className="fw-bold text-dark">
                  🥇 {topRankers[0].name} 님
                </h5>
                <p className="text-muted">{topRankers[0].email}</p>
                <div
                  className="rank-bar bar-1"
                  style={{
                    height: `${topRankers[0].score * scoreH.current}px`,
                  }}
                >
                  {topRankers[0].score}
                </div>
              </Col>
            )}

            {topRankers[2] && (
              <Col xs={4} md={3} className="ranking-col">
                <Image
                  src={topRankers[2].profimg || profimg}
                  roundedCircle
                  className="avatar mb-2"
                />
                <h5 className="text-secondary">🥉 {topRankers[2].name} 님</h5>
                <p className="text-muted">{topRankers[2].email}</p>
                <div
                  className="rank-bar bar-3"
                  style={{
                    height: `${topRankers[2].score * scoreH.current}px`,
                  }}
                >
                  {topRankers[2].score}
                </div>
              </Col>
            )}
          </Row>

          <ListGroup className="ranking-list">
            {lowerRankers.map((user, idx) => (
              <ListGroup.Item key={idx} className="py-4">
                <Row className="align-items-center text-start">
                  <Col xs={1} className="fw-bold fs-4 text-center">
                    {user.rank}
                  </Col>
                  <Col xs={2}>
                    <Image
                      src={user.profimg || profimg}
                      roundedCircle
                      className={`list-avatar ${
                        user.highlight === "purple" ? "highlight-purple" : ""
                      }`}
                    />
                  </Col>
                  <Col xs={3} className="fw-semibold">
                    {user.name} 님
                  </Col>
                  <Col xs={4} className="text-muted">
                    {user.email}
                  </Col>
                  <Col xs={2} className="text-end text-muted fw-bold">
                    {user.score}개 <span className="fw-normal">푼 문제</span>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </Container>
  );
}
