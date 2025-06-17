import { Link } from 'react-router-dom';

export default function MyQuizList() {
  const styles = {
    'backBtn': {
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      color: '#999'
    },
    'arrow':{
      color: '#999'
    }
  }
  return (
    <main id='my-quiz-list' className='quiz-list-container'>
      <Link to='/myPage' style={styles.backBtn}>
        <span className='material-symbols-rounded pr-1' style={styles.arrow}>keyboard_arrow_left</span>
        마이페이지로
      </Link>
      <h2>내가 만든 퀴즈</h2>
    </main>
  )
}