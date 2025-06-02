// 환경 변수에서 스토리지 베이스 URL 가져오기
const storageBaseUrl = import.meta.env.VITE_SUPABASE_STORAGE_URL

// 상대 경로를 절대 경로로 변환하는 함수
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/JavaNyang/default-avatar.png'
  
  // 이미 절대 경로면 그대로 반환
  if (imagePath.startsWith('http')) return imagePath
  
  // 상대 경로면 베이스 URL과 합치기
  return `${storageBaseUrl}/${imagePath}`
}

// 절대 경로에서 상대 경로만 추출하는 함수
export const extractRelativePath = (fullUrl) => {
  if (!fullUrl) return null
  
  if (fullUrl.includes('/storage/v1/object/public/profile-image/')) {
    const parts = fullUrl.split('/storage/v1/object/public/profile-image/')
    return parts[1] || fullUrl
  }
  
  return fullUrl
}