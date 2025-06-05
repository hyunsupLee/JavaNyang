import React from "react";
import { useNavigate  } from "react-router-dom";
import './FloatingChatButton.css';

const FloatingChatButton = () => {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate('/chat');
  };

  return(
    <div className="floating-chat-button" onClick={handleChatClick}>
      💬
    </div>
  );
};

export default FloatingChatButton;