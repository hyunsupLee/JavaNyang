import React from 'react';

function QuizForm({ formData, onChange, onSubmit, isSubmitting, submitMessage, isEdit = false }) {
  return (
    <div className='quiz-form-area'>
      {submitMessage && (
        <div className={`message ${submitMessage.includes('실패') ? 'error' : 'success'}`}>
          {submitMessage}
        </div>
      )}

      <h2>{isEdit ? '퀴즈 수정' : '퀴즈 등록'}</h2>

      <form className='admin-quiz-form' onSubmit={onSubmit}>
        {/* 카테고리 & 난이도 */}
        <div className='form-row'>
          <label>퀴즈 타입</label>
          <fieldset className='quiz-select'>
            <select name='category' value={formData.category} onChange={onChange} required>
              <option value='' disabled hidden>카테고리 선택</option>
              <option value='1'>변수∙상수</option>
              <option value='2'>연산자</option>
              <option value='3'>배열</option>
              <option value='4'>function</option>
              <option value='5'>제어문</option>
              <option value='6'>클래스</option>
              <option value='7'>상속∙추상화</option>
              <option value='8'>제네릭∙람다식</option>
            </select>

            <select name='level' value={formData.level} onChange={onChange} required>
              <option value='' disabled hidden>난이도 선택</option>
              <option value='1'>초급</option>
              <option value='2'>중급</option>
              <option value='3'>고급</option>
            </select>
          </fieldset>
        </div>

        {/* 제목 */}
        <div className='form-row'>
          <label htmlFor='quiz-title'>퀴즈 제목</label>
          <input type='text' id='quiz-title' name='quiz_title' value={formData.quiz_title} onChange={onChange} className='quiz-input' placeholder='제목을 입력하세요' required />
        </div>

        {/* 설명 */}
        <div className='form-row'>
          <label htmlFor='quiz-desc'>퀴즈 설명</label>
          <textarea id='quiz-desc' name='quiz_text' value={formData.quiz_text} onChange={onChange} className='quiz-input' rows='5' placeholder='설명을 입력하세요' required />
        </div>

        {/* 보기 및 정답 */}
        <div className='form-row'>
          <label>퀴즈 답안</label>
          <fieldset>
            <ul className='options-list'>
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className={`quiz-input ${isEdit ? 'readonly' : ''}`}>
                  <input type='text'
                    name={`option${i}`}
                    value={formData[`option${i}`]}
                    onChange={onChange}
                    placeholder='보기를 입력하세요'
                    readOnly={isEdit}
                    required />
                  <input type='radio'
                    name='correct'
                    value={i}
                    checked={parseInt(formData.correct) === i}
                    onChange={onChange}
                    disabled={isEdit}
                    required />
                </li>
              ))}
            </ul>
          </fieldset>
        </div>

        {/* 해설 */}
        <div className='form-row'>
          <label htmlFor='quiz-commentary'>퀴즈 해설</label>
          <textarea id='quiz-commentary'
            name='desc'
            value={formData.desc}
            onChange={onChange}
            className='quiz-input'
            rows='3'
            placeholder='해설을 입력하세요'
          />
        </div>
        <div className='form-row btn-area'>
          <button type='submit' disabled={isSubmitting} className='admin-quiz-btn'>
            {isEdit ? '수정 완료' : '퀴즈 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuizForm;
