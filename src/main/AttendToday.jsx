import { supabase } from "../config/SupabaseClient";

export const attendToday = async () => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    console.log("로그인이 필요합니다.");
    return;
  }

  const { error } = await supabase.from("attendance").insert({
    uid: user.id,
    // attended_at은 default로 current_date가 적용됨
  });

  if (error) {
    if (error.code === "23505") {
      // unique violation
      console.log("이미 오늘 출석하셨습니다!");
    } else {
      console.error("출석 에러:", error);
      alert("출석 중 문제가 발생했어요.");
    }
  } else {
    console.log("출석 완료!");
  }
};

export const hasAttendedToday = async () => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("uid", user.id)
    .eq("attended_at", today);

  return data && data.length > 0;
};
