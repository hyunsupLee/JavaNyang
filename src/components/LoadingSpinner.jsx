import { Spinner } from "react-bootstrap";

export default function LoadingSpinner() {
  return (
    <div
      id="loading-spinner"
      style={{
        height: "calc(100vh - 58px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner
        animation="border"
        role="status"
        style={{ color: "#E0D0F8" }}
      />
    </div>
  );
}
