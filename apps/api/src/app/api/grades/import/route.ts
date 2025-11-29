import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabase } from "@packages/data/supabaseClient";


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


      const scoreTypes = [] as any[];


      const regularScores = String(row.score_type_regular || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
      regularScores.forEach(v => scoreTypes.push({ key: "regular", value: v }));


      const practiceScores = String(row.score_type_practice || "").split(/[,;]/).map(s => s.trim()).filter(Boolean);
      practiceScores.forEach(v => scoreTypes.push({ key: "practice", value: v }));


      const midterm = row.score_type_midterm;
      if (midterm !== undefined && midterm !== null && midterm !== "") scoreTypes.push({ key: "midterm", value: midterm });


      const final = row.score_type_final;
      if (final !== undefined && final !== null && final !== "") scoreTypes.push({ key: "final", value: final });


      for (const item of scoreTypes) {
        if (item.value !== undefined && item.value !== null && item.value !== "") {
          await supabase.from("grades").insert({
            enrollment_id: enrollmentId,
            practice_enrollment_id: practiceEnrollmentId,
            score_type: item.key,
            score: Number(item.value),
          });
        }
      }


      await supabase.from("grade_summary").insert({
        enrollment_id: enrollmentId,
        total_score: row.total_score,
        gpa4: row.gpa4,
        letter_grade: row.letter_grade,
        classification: row.classification,
        passed: row.passed === "true" || row.passed === true,
        note: row.note || null,
      });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}