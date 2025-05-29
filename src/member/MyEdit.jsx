import React, { useState, useRef, useEffect } from 'react';
import './MyEdit.css';
import { supabase } from '../config/SupabaseClient';
import { getImageUrl, extractRelativePath } from '../utils/imageUtils';

export default function MyEdit() {
    useEffect(() => {
        document.title = '자바냥 | 프로필 수정';
    }, []);
    
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        getCurrentUser();
        loadProfileFromSupabase();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('세션 변화 감지:', event, session);
                
                if (event === 'SIGNED_OUT' || !session) {
                    // 프로필 로딩 상태 초기화
                    setUser(null);
                    setName('');
                    setPassword('');
                    setImage(null);
                    setProfileLoaded(false);
                    
                    console.log('로그아웃 감지 - 상태 초기화 완료');
                } else if (event === 'SIGNED_IN' && session) {
                    setUser(session.user);
                    loadProfileFromSupabase();
                }
                setLoading(false);
            }
        );
        
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    };

    // 프로필 로딩 완료 후 상태 업데이트
    const loadProfileFromSupabase = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setProfileLoaded(true);
                return;
            }

            const { data } = await supabase
                .from('user_info')
                .select('name, profimg')
                .eq('uid', user.id)
                .single();

            if (data) {
                if (data.name) setName(data.name);
                if (data.profimg && data.profimg !== '/JavaNyang/default-avatar.png') {
                    setImage(getImageUrl(data.profimg));
                } else {
                    setImage('/JavaNyang/default-avatar.png');
                }
            } else {
                setImage('/JavaNyang/default-avatar.png');
            }
        } catch (error) {
            console.error('프로필 로드 실패:', error);
            // 오류 발생 시에도 기본 이미지 설정
            setImage('/JavaNyang/default-avatar.png');
        } finally {
            setProfileLoaded(true);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 유효성 검사
            if(file.size > 5 * 1024 *1024){
                alert('이미지 크기는 5MB 이하로 업로드해주세요')
                return;
            }
            // 이미지 타입 확인
            if(!file.type.startsWith('image/')){
                alert('이미지 파일만 업로드 가능합니다.')
                return;
            }

            setUploading(true);

            // 미리보기 설정
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);

            if (user) {
                try {
                    // 현재 저장된 이미지 경로 가져오기
                    const { data: currentData } = await supabase
                        .from('user_info')
                        .select('profimg')
                        .eq('uid', user.id)
                        .single();

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                    // 기존 이미지 삭제(기본 이미지가 아닌 경우)
                    if(currentData?.profimg &&
                        currentData.profimg !== '/JavaNyang/default-avatar.png' &&
                        !currentData.profimg.startsWith('/JavaNyang/')){
                            console.log('삭제할 이미지: ', currentData.profimg);

                            const { error:deleteError } = await supabase.storage
                                .from('profile-image')
                                .remove([currentData.profimg]);

                            if(deleteError) {
                                console.log('기존 이미지 삭제 실패: ', deleteError.message);
                            } else {
                                console.log('기존 이미지 삭제 성공');
                            }
                        }

                    // 새 이미지 업로드
                    const { error: uploadError } = await supabase.storage
                        .from('profile-image')
                        .upload(fileName, file);

                    if (!uploadError) {
                        const { data } = supabase.storage
                            .from('profile-image')
                            .getPublicUrl(fileName);

                        // 미리보기용으로 전체 url 설정
                        setImage(data.publicUrl);

                        //db에는 상대 경로로 저장(이름 수정 ㄴㄴ)
                        const relativePath = extractRelativePath(data.publicUrl);

                        const { error: updateError } = await supabase
                            .from('user_info')
                            .update({profimg: relativePath }) // 이미지만 올라감
                            .eq('uid', user.id);

                        if (updateError) {
                            console.log('이미지 DB 업데이트 실패:', updateError.message);
                            alert('이미지 업로드에 실패했습니다.');
                        } else {
                            console.log('Supabase Storage 업로드 성공');
                        }
                    }
                } catch (error) {
                    console.log('Supabase Storage 업로드 실패:', error.message);
                }
            }

            setUploading(false);
        }
    };

    const handleClickUpload = () => {
        if (uploading) return;
        fileInputRef.current.click();
    };

    const handleSave = async () => {
    if (!user) return;

    try {
        console.log('현재 사용자 ID:', user.id);
        
        // 이름만 업데이트 (이미지는 이미 저장됨)
        const { error } = await supabase
            .from('user_info')
            .update({ name: name })
            .eq('uid', user.id);

        if (error) {
            console.log('이름 저장 실패:', error.message);
            alert('프로필 저장에 실패했습니다.');
            return; // 실패 시 중단
        }

        // 비밀번호 변경 (입력된 경우만)
        if (password && password.trim()) {
            const { error: passwordError } = await supabase.auth.updateUser({
                password: password
            });
            
            if (passwordError) {
                console.log('비밀번호 변경 실패:', passwordError.message);
                alert('이름은 저장되었지만 비밀번호 변경에 실패했습니다.');
                return;
            }
        }

        console.log('모든 정보 저장 성공');
        alert('프로필 정보가 저장되었습니다.');

    } catch (error) {
        console.log('저장 중 오류:', error.message);
        alert('저장 중 오류가 발생했습니다.');
    }
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
                {/* 프로필 로딩이 완료된 후에만 이미지 표시 */}
                {profileLoaded && (
                    <img
                        src={image || '/JavaNyang/default-avatar.png'}
                        alt="프로필"
                        className="profile-image"
                        onError={(e) => {
                            e.target.src = '/JavaNyang/default-avatar.png';
                        }}
                    />
                )}
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