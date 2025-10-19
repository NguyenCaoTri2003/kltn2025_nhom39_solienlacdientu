"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type RoleType = "student" | "lecturer" | "parent" | "admin";

export type SingleFormData = {
  user: {
    full_name: string;
    role: RoleType;
    email?: string;
    phone?: string;
    address?: string;
    citizen_id_card?: string;
    ethnic?: string;
  };
  student?: {
    student_code?: string;
    class_id?: number;
    date_of_birth?: string; // yyyy-MM-dd
    place_of_birth?: string;
    contact_address?: string;
    type_of_training?: string; // regular | advanced 
    training_level?: string;
    academic_year?: string;
  };
  lecturer?: {
    lecturer_code?: string;
    faculty_id?: number;
    academic_rank?: string;
  };
  parent?: {
    occupation?: string;
  };
  student_parent?: {
    student_id?: number;
    relationship?: string; // father|mother|guardian
  };
  // For role "student": collect up to two parent candidates to be created separately after student creation
  parent_candidates?: Array<{
    user: {
      full_name: string;
      email?: string;
      phone?: string;
      address?: string;
      citizen_id_card?: string;
      ethnic?: string;
    };
    parent: { occupation?: string };
    relationship?: string; // father|mother|guardian
  }>;
};

interface AddSingleUserFormProps {
  role: RoleType;
  onChange?: (data: SingleFormData) => void;
}

type ClassItem = { id: number; class_code: string };
type FacultyItem = { id: number; name: string };

declare const process: { env: Record<string, string | undefined> };

export function AddSingleUserForm({ role, onChange }: AddSingleUserFormProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | undefined>();

  // user 
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [address, setAddress] = useState("");
  const [ethnic, setEthnic] = useState("");

  // Student 
  const [studentCode, setStudentCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [typeOfTraining, setTypeOfTraining] = useState("regular");
  const [trainingLevel] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  // Lecturer 
  const [lecturerCode, setLecturerCode] = useState("");
  const [academicRank, setAcademicRank] = useState("");

  // Parent 
  const [occupation, setOccupation] = useState("");
  const [childStudentId, setChildStudentId] = useState(""); 
  const [relationship, setRelationship] = useState("");

  // Parent subforms for student role (max 2)
  type ParentForm = {
    full_name: string;
    email: string;
    phone: string;
    citizen_id_card: string;
    address: string;
    ethnic: string;
    occupation: string;
    relationship: string; // father|mother|guardian
  };
  const [parentForms, setParentForms] = useState<ParentForm[]>([]);
  const addParentForm = () => {
    if (parentForms.length >= 2) return;
    setParentForms((prev) => [
      ...prev,
      {
        full_name: "",
        email: "",
        phone: "",
        citizen_id_card: "",
        address: "",
        ethnic: "",
        occupation: "",
        relationship: "",
      },
    ]);
  };
  const removeParentForm = (idx: number) => {
    setParentForms((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateParentForm = (idx: number, patch: Partial<ParentForm>) => {
    setParentForms((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        // Lấy danh sach lop cho sinh vien
        if (role === "student") {
          const res = await fetch(`${API_BASE}/api/classes`, { credentials: "include" });
          const data: { data?: Array<{ id: number; class_code: string }> } = await res
            .json()
            .catch(() => ({} as { data?: Array<{ id: number; class_code: string }> }));
          if (!ignore && res.ok && Array.isArray(data?.data)) {
            const items: ClassItem[] = data.data.map((c) => ({ id: c.id, class_code: c.class_code }));
            setClasses(items);
          }
        }
        // Lấy danh sach khoa cho giảng viên
        if (role === "lecturer") {
          const resF = await fetch(`${API_BASE}/api/faculties`, { credentials: "include" });
          const dataF: { data?: Array<{ id: number; name: string }> } = await resF
            .json()
            .catch(() => ({} as { data?: Array<{ id: number; name: string }> }));
          if (!ignore && resF.ok && Array.isArray(dataF?.data)) {
            const items: FacultyItem[] = dataF.data.map((f) => ({ id: f.id, name: f.name }));
            setFaculties(items);
          }
        }
      } catch {
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [role, API_BASE]);


  useEffect(() => {
    const payload: SingleFormData = {
      user: {
        full_name: fullName,
        role,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        citizen_id_card: citizenId || undefined,
        ethnic: ethnic || undefined,
      },
    };
    if (role === "student") {
      payload.student = {
        student_code: studentCode || undefined,
        class_id: selectedClassId,
        date_of_birth: dateOfBirth || undefined,
        place_of_birth: placeOfBirth || undefined,
        contact_address: contactAddress || undefined,
        type_of_training: typeOfTraining || undefined,
        training_level: trainingLevel || undefined,
        academic_year: academicYear || undefined,
      };
    } else if (role === "lecturer") {
      payload.lecturer = {
        lecturer_code: lecturerCode || undefined,
        faculty_id: selectedFacultyId,
        academic_rank: academicRank || undefined,
      };
    } else if (role === "parent") {
      payload.parent = { occupation: occupation || undefined };
      payload.student_parent = {
        student_id: childStudentId ? Number(childStudentId) : undefined,
        relationship: relationship || undefined,
      };
    }
    if (role === "student") {
      payload.parent_candidates = parentForms.map((f) => ({
        user: {
          full_name: f.full_name,
          email: f.email || undefined,
          phone: f.phone || undefined,
          address: f.address || undefined,
          citizen_id_card: f.citizen_id_card || undefined,
          ethnic: f.ethnic || undefined,
        },
        parent: { occupation: f.occupation || undefined },
        relationship: f.relationship || undefined,
      }));
    }
    onChange?.(payload);
  }, [
    role,
    fullName,
    email,
    phone,
    citizenId,
    address,
    ethnic,
    studentCode,
    selectedClassId,
    dateOfBirth,
    placeOfBirth,
    contactAddress,
    typeOfTraining,
    trainingLevel,
    academicYear,
    lecturerCode,
    selectedFacultyId,
    academicRank,
    occupation,
    childStudentId,
    relationship,
    parentForms,
    onChange,
  ]);


  switch (role) {
    case "student":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Label>Mã sinh viên</Label>
          <Input placeholder="Nhập mã sinh viên..." value={studentCode} onChange={(e) => setStudentCode(e.target.value)} />
          <Label>Lớp</Label>
          <Select
            value={selectedClassId ? String(selectedClassId) : ""}
            onValueChange={(v: string) => setSelectedClassId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-60">
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.class_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>Ngày sinh</Label>
          <Input type="date" placeholder="Nhập ngày sinh..." value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          <Label>Nơi sinh</Label>
          <Input placeholder="Nhập nơi sinh..." value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
          <Label>Địa chỉ liên lạc</Label>
          <Input placeholder="Nhập địa chỉ liên lạc..." value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
          <Label>Hình thức đào tạo</Label>
          <Select value={typeOfTraining} onValueChange={(v: string) => setTypeOfTraining(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn hình thức đào tạo" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <SelectItem value="regular">Đại trà</SelectItem>
              <SelectItem value="advanced">Chất lượng cao</SelectItem>
            </SelectContent>
          </Select>
          <Label>Niên khoá</Label>
          <Input placeholder="Nhập niên khoá..." value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          <div className="space-y-3 mt-4 p-2 border border-gray-200 rounded">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Thông tin phụ huynh</p>
            </div>
            {parentForms.map((pf, idx) => (
              <div key={idx} className="space-y-2 p-2 border rounded">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Phụ huynh #{idx + 1}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeParentForm(idx)}>Xóa</Button>
                </div>
                <Label>Họ và tên</Label>
                <Input placeholder="Nhập họ và tên..." value={pf.full_name} onChange={(e) => updateParentForm(idx, { full_name: e.target.value })} />
                <Label>Nghề nghiệp</Label>
                <Input placeholder="Nhập nghề nghiệp..." value={pf.occupation} onChange={(e) => updateParentForm(idx, { occupation: e.target.value })} />
                <Label>Mối quan hệ</Label>
                <Select value={pf.relationship} onValueChange={(v: string) => updateParentForm(idx, { relationship: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mối quan hệ" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="father">Cha</SelectItem>
                    <SelectItem value="mother">Mẹ</SelectItem>
                    <SelectItem value="guardian">Người giám hộ</SelectItem>
                  </SelectContent>
                </Select>
                <Label>Email</Label>
                <Input placeholder="Nhập email..." value={pf.email} onChange={(e) => updateParentForm(idx, { email: e.target.value })} />
                <Label>Số điện thoại</Label>
                <Input placeholder="Nhập số điện thoại..." value={pf.phone} onChange={(e) => updateParentForm(idx, { phone: e.target.value })} />
                <Label>CCCD</Label>
                <Input placeholder="Nhập CCCD..." value={pf.citizen_id_card} onChange={(e) => updateParentForm(idx, { citizen_id_card: e.target.value })} />
                <Label>Địa chỉ</Label>
                <Input placeholder="Nhập địa chỉ..." value={pf.address} onChange={(e) => updateParentForm(idx, { address: e.target.value })} />
                <Label>Dân tộc</Label>
                <Input placeholder="Nhập dân tộc..." value={pf.ethnic} onChange={(e) => updateParentForm(idx, { ethnic: e.target.value })} />
              </div>
            ))}
            <div className="flex justify-end">
              {/* btn thêm from phụ huynh (thêm tối da 2 form) */}
              <Button type="button" size="sm" onClick={addParentForm} disabled={parentForms.length >= 2}>+</Button>
            </div>
          </div>
          


        </div>
      );

    case "lecturer":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Label>Mã giảng viên</Label>
          <Input placeholder="Nhập mã giảng viên..." value={lecturerCode} onChange={(e) => setLecturerCode(e.target.value)} />
          <Label>Khoa</Label>
          <Select
            value={selectedFacultyId ? String(selectedFacultyId) : ""}
            onValueChange={(v: string) => setSelectedFacultyId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn Khoa" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-60">
              {faculties.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>Học hàm</Label>
          <Select value={academicRank} onValueChange={(v: string) => setAcademicRank(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học hàm" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <SelectItem value="master">Thạc sĩ</SelectItem>
              <SelectItem value="doctor">Tiến sĩ</SelectItem>
              <SelectItem value="associate_professor">Phó giáo sư</SelectItem>
              <SelectItem value="professor">Giáo sư</SelectItem>
            </SelectContent>
          </Select>
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
        </div>
      );

    case "parent":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Label>Nghề nghiệp</Label>
          <Input placeholder="Nhập nghề nghiệp..." value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          <Label>ID sinh viên con</Label>
          <Input placeholder="Nhập ID sinh viên con..." value={childStudentId} onChange={(e) => setChildStudentId(e.target.value)} />
          <Label>Mối quan hệ</Label>
          <Select value={relationship} onValueChange={(v: string) => setRelationship(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn mối quan hệ" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <SelectItem value="father">Cha</SelectItem>
              <SelectItem value="mother">Mẹ</SelectItem>
              <SelectItem value="guardian">Người giám hộ</SelectItem>
            </SelectContent>
          </Select>
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
        </div>
      );

    case "admin":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
        </div>
      );
  }
}
