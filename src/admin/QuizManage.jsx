import "./ui/admin.css";

const QuizManage = () => {

  return (
    <div>
      {/* 검색 영역 */}
      <div className="serach-area">
        {/* 검색 창 */}
        <div className="search-input">
          <input type="text" name="" id="" placeholder={`검색`} />
          <button type="button" id={`{}-search-btn`} className="search-button">검색</button>
        </div>
        {/* 검색 조건 */}
        <div className="search-filter">
          <button type="button" id="{}-filter-btn" className="filter-button">검색 조건</button>
        </div>
      </div>
      {/* 리스트 */}
      <div className="admin-list-area">
        <div></div>
      </div>
    </div>
  );
}

export default QuizManage;