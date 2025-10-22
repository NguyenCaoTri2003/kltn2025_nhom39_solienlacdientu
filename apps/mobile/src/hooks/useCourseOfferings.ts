// import { useEffect, useState } from "react";
// import { fetchSemesters, getCurrentSemester } from "../services/semesterService";
// import {
//   fetchOfferingsBySemester,
//   fetchOfferingDetail,
// } from "../services/offeringService";

// export function useCourseOfferings(studentYear?: string) {
//   const [loading, setLoading] = useState(true);
//   const [semesters, setSemesters] = useState<any[]>([]);
//   const [semester, setSemester] = useState<any>(null);
//   const [offerings, setOfferings] = useState<any[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   async function loadOfferingsBySemester(semesterId: number) {
//     try {
//       setLoading(true);
//       setError(null);
//       const offerings = await fetchOfferingsBySemester(semesterId);

//       if (offerings.length === 0) {
//         setOfferings([]);
//         setLoading(false);
//         return;
//       }

//       const detailed = await Promise.all(
//         offerings.map(async (o) => {
//           const detail = await fetchOfferingDetail(o.id);
//           return { ...o, detail };
//         })
//       );

//       setOfferings(detailed);
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function initialize() {
//     try {
//       setLoading(true);

//       // 🔹 Nếu có chuỗi dạng "2021 - 2022", tách lấy phần năm đầu
//       let fromYear: number | undefined = undefined;
//       if (studentYear) {
//         const match = studentYear.match(/(\d{4})/); // Lấy số đầu tiên trong chuỗi
//         if (match) fromYear = Number(match[1]);
//       }

//       const semesters = await fetchSemesters(fromYear);
//       setSemesters(semesters);

//       const current = getCurrentSemester(semesters);
//       if (current) {
//         setSemester(current);
//         await loadOfferingsBySemester(current.id);
//       } else {
//         setError("Không tìm thấy học kỳ hiện tại.");
//       }
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     initialize();
//   }, [studentYear]);

//   return {
//     semesters,
//     semester,
//     setSemester,
//     offerings,
//     loading,
//     error,
//     loadOfferingsBySemester,
//   };
// }

import { useEffect, useState } from "react";
import { fetchSemesters, getCurrentSemester } from "../services/semesterService";
import {
  fetchOfferingsBySemester,
  fetchOfferingDetail,
} from "../services/offeringService";

/**
 * Hook lấy học phần theo học kỳ và niên khóa
 * @param studentYear Niên khóa (VD: "2021 - 2022")
 * @param studentId ID sinh viên (hoặc con)
 */
export function useCourseOfferings(studentYear?: string, studentId?: number) {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadOfferingsBySemester(semesterId: number) {
    if (!semesterId) return;

    try {
      setLoading(true);
      setError(null);

      // 🔹 Truyền student_id (nếu có)
      const offerings = await fetchOfferingsBySemester(semesterId, studentId);

      if (offerings.length === 0) {
        setOfferings([]);
        return;
      }

      // 🔹 Lấy chi tiết từng học phần
      const detailed = await Promise.all(
        offerings.map(async (o: any) => {
          const detail = await fetchOfferingDetail(o.id, studentId);
          return { ...o, detail };
        })
      );

      setOfferings(detailed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function initialize() {
    try {
      setLoading(true);

      // 🔹 Nếu có chuỗi dạng "2021 - 2022", tách lấy phần năm đầu
      let fromYear: number | undefined = undefined;
      if (studentYear) {
        const match = studentYear.match(/(\d{4})/);
        if (match) fromYear = Number(match[1]);
      }

      const semesters = await fetchSemesters(fromYear);
      setSemesters(semesters);

      const current = getCurrentSemester(semesters);
      if (current) {
        setSemester(current);
        await loadOfferingsBySemester(current.id);
      } else {
        setError("Không tìm thấy học kỳ hiện tại.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Khởi tạo lại khi studentYear hoặc studentId thay đổi
  useEffect(() => {
    initialize();
  }, [studentYear, studentId]);

  return {
    semesters,
    semester,
    setSemester,
    offerings,
    loading,
    error,
    loadOfferingsBySemester,
  };
}
