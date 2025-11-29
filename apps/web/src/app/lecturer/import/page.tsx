"use client";


import { useState } from "react";


export default function ImportGradesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  const onUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;


    const formData = new FormData();
    formData.append("file", file);


    setLoading(true);
    setMessage("");


    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grades/import`, {
      method: "POST",
      body: formData,
    });


    const data = await res.json();
    setLoading(false);


    if (data.success) setMessage("Import thành công!");
    else setMessage("Lỗi: " + data.error);
  };


  return (
    <div className="p-8 max-w-xl mx-auto bg-white shadow rounded-xl mt-10 border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Import điểm từ Excel</h1>


      <label className="block w-full cursor-pointer">
        <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition">
          <p className="text-gray-600">Chọn file Excel để upload</p>
          <p className="text-xs text-gray-400 mt-1">(.xlsx, .xls)</p>
        </div>
        <input type="file" accept=".xlsx,.xls" onChange={onUpload} className="hidden" />
      </label>


      {loading && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <span className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></span>
          <span>Đang xử lý dữ liệu...</span>
        </div>
      )}


      {message && (
        <p className={`mt-4 p-3 rounded ${message.includes("thành công") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message}
        </p>
      )}


      <div className="mt-6 text-sm text-gray-600">
        <p className="font-semibold mb-1">Cấu trúc file Excel mẫu:</p>
        <pre className="bg-gray-100 p-3 rounded-lg whitespace-pre-wrap text-xs border border-gray-200">
          {`enrollment_id practice_enrollment_id score_type_regular score_type_practice score_type_midterm score_type_final total_score gpa4 letter_grade classification passed`}
        </pre>
      </div>
    </div>
  );
}