import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './FloatingChatButton.css';

// 올바른 경로로 수정 (components 폴더에서 상위 폴더의 Chat.jsx를 import)
import Chat from '../Chat';

// 리사이즈 가능한 채팅 팝업 컴포넌트
const ChatPopup = ({ onClose, onFullScreen, width, onResize }) => {
  const resizeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  // 리사이즈 핸들러
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div className="floating-chat-popup" style={{ width: `${width}px` }}>
      {/* 리사이즈 핸들 */}
      <div 
        className="floating-resize-handle"
        onMouseDown={handleMouseDown}
        ref={resizeRef}
      />
      
      <div className="floating-chat-header">
        <h3>실시간 채팅</h3>
        <div className="floating-chat-controls">
          <button 
            className="floating-fullscreen-btn" 
            onClick={onFullScreen}
            title="전체화면으로 보기"
          >
            <span className="floating-material-symbols-rounded">⛶</span>
          </button>
          <button 
            className="floating-close-btn" 
            onClick={onClose}
            title="닫기"
          >
            <span className="floating-material-symbols-rounded">✕</span>
          </button>
        </div>
      </div>
      
      {/* Chat.jsx 컴포넌트를 Error Boundary로 감싸기 */}
      <div className="floating-chat-content">
        <ErrorBoundary>
          {Chat ? <Chat /> : (
            <div className="floating-chat-error-fallback">
              <div className="floating-error-message">
                <h3>채팅 컴포넌트를 불러올 수 없습니다</h3>
                <p>Chat 컴포넌트가 존재하지 않거나 올바르지 않습니다.</p>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Error Boundary 컴포넌트 추가
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="floating-chat-error-fallback">
          <div className="floating-error-message">
            <h3>채팅을 불러오는 중 오류가 발생했습니다</h3>
            <p>잠시 후 다시 시도해주세요.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="floating-retry-button"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(400); // 초기 너비
  const navigate = useNavigate();
  const chatRef = useRef(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const handleFullScreen = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  const handleResize = (newWidth) => {
    setChatWidth(newWidth);
  };

  return (
    <>
      <div 
        className="floating-chat-button" 
        onClick={handleToggleChat}
      >
        💬
      </div>
      
      {isOpen && (
        <div className="floating-chat-popup-overlay">
          <div ref={chatRef} className="floating-chat-popup-container" style={{ width: `${chatWidth}px` }}>
            <ChatPopup 
              onClose={handleCloseChat} 
              onFullScreen={handleFullScreen}
              width={chatWidth}
              onResize={handleResize}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;