import React, { useState, useRef, useEffect } from 'react';
import './MyEdit.css';
import { supabase } from '../config/SupabaseClient';

export default function MyEdit() {
    // 페이지 제목 설정
  useEffect(() => {
    document.title = '자바냥 | 프로필 수정';
  }, []);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false); // 이미지 로딩 시 깜빡임
    const [user, setUser] = useState(null); // 사용자 정보 추가
    const [uploading, setUploading] = useState(false); // 업로드 상태 추가
    const [loading, setLoading] = useState(true); // 로딩 상태 추가
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        // Supabase 사용자 정보 가져오기
        getCurrentUser();
        loadProfileFromSupabase();

        // 추가: 실시간 세션 변화 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    (event, session) => {
                        console.log('세션 변화 감지:', event, session);
                        
                        if (event === 'SIGNED_OUT' || !session) {
                            // 로그아웃되면 상태 초기화
                            setUser(null);
                            setName('');
                            setPassword('');
                            setImage(null);
                            
                            // localStorage 삭제
                            localStorage.removeItem('profileName');
                            localStorage.removeItem('profilePassword');
                            localStorage.removeItem('profileImage');
                            
                            console.log('로그아웃 감지 - 상태 초기화 완료');
                        } else if (event === 'SIGNED_IN' && session) {
                            // 로그인되면 사용자 정보 업데이트
                            setUser(session.user);
                            loadProfileFromSupabase();
                        }
                        
                        setLoading(false); // 로딩 완료
                    }
                );
        
                // cleanup 함수에서 구독 해제
                return () => {
                    subscription.unsubscribe();
                };
    }, []);

    // 추가: 현재 로그인 사용자 정보 가져오기
    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
         setLoading(false); // 로딩 완료
    };

    // 추가: Supabase에서 프로필 정보 불러오기
    const loadProfileFromSupabase = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('user_info')
                .select('name, profimg')
                .eq('uid', user.id)
                .single();

            if (data) {
                if (data.name) setName(data.name);
                if (data.profimg && data.profimg !== '/JavaNyang/default-avatar.png') {
                setImage(data.profimg);
                }
            }
        } catch (error) {
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true); // 추가: 업로드 시작

            // 기존 localStorage 방식
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);

            // 추가: Supabase Storage 업로드
            if (user) {
                try {
                    // 파일 확장자 가져오기
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                    // 기존 이미지 삭제 (Supabase Storage에 있는 경우만)
                    if (image && image.includes('supabase')) {
                        const oldFileName = image.split('/').pop().split('?')[0];
                        await supabase.storage
                            .from('profile-image')
                            .remove([`${user.id}/${oldFileName}`]);
                    }

                    // 새 이미지 업로드
                    const { error: uploadError } = await supabase.storage
                        .from('profile-image')
                        .upload(fileName, file);

                    if (!uploadError) {
                        // 업로드된 이미지의 public URL 가져오기
                        const { data } = supabase.storage
                            .from('profile-image')
                            .getPublicUrl(fileName);

                        // Supabase URL로 이미지 설정
                        setImage(data.publicUrl);

                        // user_info 테이블에 이미지 URL 저장 (수정: update 사용)
                        const { error: updateError } = await supabase
                            .from('user_info')
                            .update({
                                name: name,
                                profimg: data.publicUrl
                            })
                            .eq('uid', user.id);

                        if (updateError) {
                            console.log('이미지 DB 업데이트 실패:', updateError.message);
                        } else {
                            console.log('Supabase Storage 업로드 성공!');
                        }
                    }
                } catch (error) {
                    console.log('Supabase Storage 업로드 실패:', error.message);
                }
            }

            setUploading(false); // 추가: 업로드 완료
        }
    };

    const handleClickUpload = () => {
        if (uploading) return; // 추가: 업로드 중일 때는 클릭 방지
        fileInputRef.current.click();
    };

    const handleSave = async () => {
        // 기존 localStorage 저장
        localStorage.setItem('profileName', name);
        localStorage.setItem('profilePassword', password);
        localStorage.setItem('profileImage', image);

        // 추가: Supabase에 저장 (수정: update 사용)
        if (user) {
            try {
                console.log('현재 사용자 ID:', user.id);
                console.log('저장할 데이터:', { name, profimg: image });

                const { error } = await supabase
                    .from('user_info')
                    .update({
                        name: name,
                        profimg: image
                    })
                    .eq('uid', user.id);

                if (error) {
                    console.log('Supabase 저장 실패:', error.message);
                } else {
                    console.log('Supabase 저장 성공!');
                }

                // 비밀번호 변경 (입력된 경우만)
                if (password && password.trim()) {
                    await supabase.auth.updateUser({
                        password: password
                    });
                }

            } catch (error) {
                console.log('Supabase 저장 실패:', error.message);
            }
        }

        alert("프로필 정보가 저장되었습니다.");
    };
        // 로딩 중일 때 표시
        if (loading) {
        return (
            <div className="edit-container">
                <p>로딩 중...</p>
            </div>
        );
    }

    // 로그인하지 않았을 때 표시
    if (!user) {
        return (
            <div className='edit-container'>
                <p>로그인이 필요합니다.</p>
            </div>
        );
    } 

    return (
        <div className="edit-container">
            <p className='sign_up3'>프로필 수정</p>

            <div className="profile-image-wrapper">
                <img
                    src={image}
                    alt="프로필"
                    className="profile-image"
                    onError={(e) => {
                        e.target.src = '/JavaNyang/default-avatar.png';
                        setImageLoaded(true);
                    }}
                />
            </div>

            <button
                className="edit-button"
                onClick={handleClickUpload}
                disabled={uploading}
            >
                {uploading ? '업로드중...' : '✏️ 수정'}
            </button>

            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
            />

            <div className="input-wrapper">
                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    placeholder="이름 입력"
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="input-wrapper">
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    placeholder="비밀번호 입력"
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button className="save-button" onClick={handleSave}>저장</button>
        </div>
    );
}