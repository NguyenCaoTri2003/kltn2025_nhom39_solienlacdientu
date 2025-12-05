// import { NextResponse } from "next/server";
// import * as XLSX from "xlsx";
// import { supabase } from "@packages/data/supabaseClient";


// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;
//     if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });


//     const buffer = Buffer.from(await file.arrayBuffer());
//     const workbook = XLSX.read(buffer, { type: "buffer" });
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows: any[] = XLSX.utils.sheet_to_json(sheet);


//     for (const row of rows) {
//       const enrollmentId = row.enrollment_id;
//       const practiceEnrollmentId = row.practice_enrollment_id || null;


//       const scoreTypes = [] as any[];


//       const regularScores = String(row.score_type_regular || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
//       regularScores.forEach(v => scoreTypes.push({ key: "regular", value: v }));


//       const practiceScores = String(row.score_type_practice || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
//       practiceScores.forEach(v => scoreTypes.push({ key: "practice", value: v }));


//       const midterm = row.score_type_midterm;
//       if (midterm !== undefined && midterm !== null && midterm !== "") scoreTypes.push({ key: "midterm", value: midterm });


//       const final = row.score_type_final;
//       if (final !== undefined && final !== null && final !== "") scoreTypes.push({ key: "final", value: final });


//       for (const item of scoreTypes) {
//         if (item.value !== undefined && item.value !== null && item.value !== "") {
//           await supabase.from("grades").insert({
//             enrollment_id: enrollmentId,
//             practice_enrollment_id: practiceEnrollmentId,
//             score_type: item.key,
//             score: Number(item.value),
//           });
//         }
//       }


//       await supabase.from("grade_summary").insert({
//         enrollment_id: enrollmentId,
//         total_score: row.total_score,
//         gpa4: row.gpa4,
//         letter_grade: row.letter_grade,
//         classification: row.classification,
//         passed: row.passed === "true" || row.passed === true,
//         note: row.note || null,
//       });
//     }


//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ error: String(error) }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabase } from "@packages/data/supabaseClient";

function mapScoreToGrade(score: number) {
  if (score >= 9) return { gpa4: 4.0, letter_grade: "A+", classification: "Excellent" };
  if (score >= 8.5) return { gpa4: 3.8, letter_grade: "A", classification: "Very_Good" };
  if (score >= 8.0) return { gpa4: 3.5, letter_grade: "B+", classification: "Good" };
  if (score >= 7.0) return { gpa4: 3.0, letter_grade: "B", classification: "Good" };
  if (score >= 6.0) return { gpa4: 2.5, letter_grade: "C+", classification: "Average" };
  if (score >= 5.5) return { gpa4: 2.0, letter_grade: "C", classification: "Average" };
  if (score >= 5.0) return { gpa4: 1.5, letter_grade: "D+", classification: "Weak" };
  if (score >= 4.0) return { gpa4: 1.0, letter_grade: "D", classification: "Weak" };
  return { gpa4: 0, letter_grade: "F", classification: "Poor" };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of rows) {
      const enrollmentId = row.enrollment_id;
      const practiceEnrollmentId = row.practice_enrollment_id || null;

      const scoreTypes: { key: string; value: number }[] = [];

      // Điểm lý thuyết
      const regularScores = String(row.score_type_regular || "")
        .split(/[,;]/)
        .map(s => parseFloat(s.trim()))
        .filter(s => !isNaN(s));
      regularScores.forEach(v => scoreTypes.push({ key: "regular", value: v }));

      // Điểm thực hành
      const practiceScores = String(row.score_type_practice || "")
        .split(/[,;]/)
        .map(s => parseFloat(s.trim()))
        .filter(s => !isNaN(s));
      practiceScores.forEach(v => scoreTypes.push({ key: "practice", value: v }));

      // Điểm giữa kỳ
      const midterm = parseFloat(row.score_type_midterm);
      if (!isNaN(midterm)) scoreTypes.push({ key: "midterm", value: midterm });

      // Điểm cuối kỳ
      const final = parseFloat(row.score_type_final);
      if (!isNaN(final)) scoreTypes.push({ key: "final", value: final });

      // Chèn vào bảng grades
      for (const item of scoreTypes) {
        await supabase.from("grades").insert({
          enrollment_id: enrollmentId,
          practice_enrollment_id: item.key === "practice" ? practiceEnrollmentId : null,
          score_type: item.key,
          score: item.value,
        });
      }

      // Tính trung bình lý thuyết + thực hành
      const allTheoryPractice = [...regularScores, ...practiceScores];
      const avgTheoryPractice = allTheoryPractice.length
        ? allTheoryPractice.reduce((a, b) => a + b, 0) / allTheoryPractice.length
        : 0;

      // Tính tổng điểm
      const totalScore = ((avgTheoryPractice * 20) + ((isNaN(midterm) ? 0 : midterm) * 30) + ((isNaN(final) ? 0 : final) * 50)) / 100;


      // Lấy gpa4, letter_grade, classification
      const grade = mapScoreToGrade(totalScore);

      // Chèn vào bảng grade_summary
      await supabase.from("grade_summary").insert({
        enrollment_id: enrollmentId,
        total_score: totalScore,
        gpa4: grade.gpa4,
        letter_grade: grade.letter_grade,
        classification: grade.classification,
        passed: totalScore >= 4,
        note: null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
