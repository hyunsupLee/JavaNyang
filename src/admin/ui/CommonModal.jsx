import React from 'react';

const CommonModal = ({
  type = 'delete',
  isOpen = false,
  onCancel,
  onConfirm,
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
      title: '퀴즈 수정',
      message: '수정',
      confirmText: '수정',
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
          <span>{preset.message}</span>하시겠습니까?
        </p>
        <div className="modal-footer">
          <button className="modal-btn modal-cancel-btn" onClick={onCancel}>취소</button>
          <button className="modal-btn modal-confirm-btn" onClick={onConfirm}>{preset.confirmText}</button>
        </div>
      </div>
      <div className="modal-overlay" onClick={onCancel}></div>
    </div>
  );
};

export default CommonModal;