import React from 'react';

const CommonModal = ({
  type = 'delete',
  isOpen = false,
  onCancel,
  onConfirm,
  oneButton = false
}) => {
  if (!isOpen) return null;

  // 모달별 프리셋
  const modalPresets = {
    create: {
      icon: 'add',
      title: '퀴즈를',
      message: '생성',
      confirmText: '생성',
      className: ''
    },
    delete: {
      icon: 'delete',
      title: '해당 퀴즈를',
      message: '삭제',
      confirmText: '삭제',
      className: 'modal-delete'
    },
    deleteChecked: {
      icon: 'delete',
      title: '선택한 퀴즈를',
      message: '삭제',
      confirmText: '삭제',
      className: 'modal-delete'
    },
    edit: {
      icon: 'edit',
      title: '퀴즈를',
      message: '수정',
      confirmText: '수정',
      className: ''
    },
    check: {
      icon: 'check',
      title: '프로필이',
      message: '수정',
      confirmText: '확인',
      className: ''
    }

  };

  const preset = modalPresets[type] || modalPresets.delete;

  return (
    <div className={`modal-area ${preset.className}`}>
      <div className="modal-container">
        <span className="material-symbols-rounded modal-icon">{preset.icon}</span>
        <p className="modal-text">
          {preset.title} <br />
          <span>{preset.message}</span>
          {oneButton === false ?
            <>
              하시겠습니까?
            </>:
              <>되었습니다.</>
          }
        </p>
        <div className="modal-footer">
          {oneButton === false ?
            <>
              <button className="modal-btn modal-cancel-btn" onClick={onCancel}>취소</button>
              <button className="modal-btn modal-confirm-btn" onClick={onConfirm}>{preset.confirmText}</button>
            </>:
              <button className="modal-btn modal-confirm-btn" onClick={onConfirm}>{preset.confirmText}</button>
          }
        
          {/* <button className="modal-btn modal-cancel-btn" onClick={onCancel}>취소</button> */}
          {/* <button className="modal-btn modal-confirm-btn" onClick={onConfirm}>{preset.confirmText}</button> */}
        </div>
      </div>
      <div className="modal-overlay" onClick={onCancel}></div>
    </div>
  );
};

export default CommonModal;