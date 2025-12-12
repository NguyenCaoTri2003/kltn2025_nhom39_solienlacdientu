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
import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
  isValidStudentCode,
  isValidLecturerCode,
  isValidOccupation,
  isValidAcademicYear,
  isValidPlaceOrContactAddress,
} from "@packages/utils/Regex";

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
    training_level?: string; // bachelor | master | phd
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
  onValidityChange?: (isValid: boolean) => void;
}

type ClassItem = { id: number; class_code: string };
type FacultyItem = { id: number; name: string };

declare const process: { env: Record<string, string | undefined> };

export function AddSingleUserForm({ role, onChange, onValidityChange }: AddSingleUserFormProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | undefined>();

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentErrors, setParentErrors] = useState<Array<Record<string, string>>>([]);


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
  const [trainingLevel, setTrainingLevel] = useState("bachelor");
  const [academicYear, setAcademicYear] = useState("");

  // Lecturer 
  const [lecturerCode, setLecturerCode] = useState("");
  const [academicRank, setAcademicRank] = useState("");

  // Parent 
  const [occupation, setOccupation] = useState("");
  const [childStudentId, setChildStudentId] = useState("");
  const [relationship, setRelationship] = useState("");

  // parent subforms cho student (max 2)
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

  // Validation functions
  const validateField = (name: string, value: string) => {
    let message = "";

    switch (name) {
      case "fullName":
        if (!value.trim()) message = "Vui lòng không để trống họ và tên";
        else if (!isValidFullName(value)) message = "Họ và tên không hợp lệ (tối đa 128 ký tự)";
        break;
      case "email":
        if (value && !isValidEmail(value)) message = "Email không hợp lệ (tối đa 255 ký tự)";
        break;
      case "phone":
        if (value && !isValidPhone(value)) message = "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
        break;
      case "citizenId":
        if (value && !isValidCitizenId(value)) message = "CCCD không hợp lệ (chỉ số, từ 9 đến 20 ký tự)";
        break;
      case "address":
        if (value && !isValidAddress(value)) message = "Địa chỉ không hợp lệ (tối đa 255 ký tự)";
        break;
      case "ethnic":
        if (value && !isValidEthnic(value)) message = "Dân tộc không hợp lệ (tối đa 20 ký tự)";
        break;
      case "studentCode":
        if (!value.trim()) message = "Vui lòng không để trống mã sinh viên";
        else if (!isValidStudentCode(value)) message = "Mã sinh viên không hợp lệ (chữ, số, gạch dưới, tối đa 20 ký tự)";
        break;
      case "lecturerCode":
        if (!value.trim()) message = "Vui lòng không để trống mã giảng viên";
        else if (!isValidLecturerCode(value)) message = "Mã giảng viên không hợp lệ (chữ, số, gạch dưới, tối đa 20 ký tự)";
        break;
      case "occupation":
        if (value && !isValidOccupation(value)) message = "Nghề nghiệp không hợp lệ (tối đa 100 ký tự)";
        break;
      case "academicYear":
        if (!value.trim()) message = "Vui lòng không để trống niên khóa";
        else if (!isValidAcademicYear(value)) message = "Niên khóa không hợp lệ (VD: 2024-2025, 4-20 ký tự)";
        break;
      case "placeOfBirth":
        if (value && !isValidPlaceOrContactAddress(value)) message = "Nơi sinh không hợp lệ (tối đa 255 ký tự)";
        break;
      case "contactAddress":
        if (value && !isValidPlaceOrContactAddress(value)) message = "Địa chỉ liên lạc không hợp lệ (tối đa 255 ký tự)";
        break;
    }
    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }));
  };

  const validateParentField = (idx: number, name: keyof ParentForm, value: string) => {
    let message = "";
    switch (name) {
      case "full_name":
        if (value && !isValidFullName(value)) message = "Họ và tên không hợp lệ (tối đa 128 ký tự)";
        break;
      case "email":
        if (value && !isValidEmail(value)) message = "Email không hợp lệ (tối đa 255 ký tự)";
        break;
      case "phone":
        if (value && !isValidPhone(value)) message = "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
        break;
      case "citizen_id_card":
        if (value && !isValidCitizenId(value)) message = "CCCD không hợp lệ (chỉ số, từ 9 đến 20 ký tự)";
        break;
      case "address":
        if (value && !isValidAddress(value)) message = "Địa chỉ không hợp lệ (tối đa 255 ký tự)";
        break;
      case "ethnic":
        if (value && !isValidEthnic(value)) message = "Dân tộc không hợp lệ (tối đa 20 ký tự)";
        break;
      case "occupation":
        if (value && !isValidOccupation(value)) message = "Nghề nghiệp không hợp lệ (tối đa 100 ký tự)";
        break;
      default:
        message = "";
    }
    setParentErrors((prev) => {
      const next = [...prev];
      if (!next[idx]) next[idx] = {};
      next[idx] = { ...next[idx], [name]: message };
      return next;
    });
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        // Lấy danh sach lop cho sinh vien
        if (role === "student") {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/api/classes`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` }
          });
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
    // Reset all fields and errors when role changes to prevent cross-role impact
    setErrors({});
    setParentErrors([]);
    setSelectedClassId(undefined);
    setSelectedFacultyId(undefined);
    setFullName("");
    setEmail("");
    setPhone("");
    setCitizenId("");
    setAddress("");
    setEthnic("");
    setStudentCode("");
    setDateOfBirth("");
    setPlaceOfBirth("");
    setContactAddress("");
    setTypeOfTraining("regular");
    setTrainingLevel("bachelor");
    setAcademicYear("");
    setLecturerCode("");
    setAcademicRank("");
    setOccupation("");
    setChildStudentId("");
    setRelationship("");
    setParentForms([]);
  }, [role]);

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

  // Notify parent about validity whenever error states change
  useEffect(() => {
    // Only consider errors relevant to current role
    const mainFieldKeysByRole: Record<RoleType, string[]> = {
      student: [
        "fullName",
        "email",
        "phone",
        "citizenId",
        "address",
        "ethnic",
        "studentCode",
        "placeOfBirth",
        "contactAddress",
        "academicYear",
      ],
      lecturer: [
        "fullName",
        "email",
        "phone",
        "citizenId",
        "address",
        "ethnic",
        "lecturerCode",
      ],
      parent: [
        "fullName",
        "email",
        "phone",
        "citizenId",
        "address",
        "ethnic",
        "occupation",
      ],
      admin: [
        "fullName",
        "email",
        "phone",
        "citizenId",
        "address",
        "ethnic",
      ],
    };

    const keys = mainFieldKeysByRole[role] || [];
    const hasMainErrors = keys.some((k) => !!errors[k]);

    // Parent subforms only apply for student role
    const hasParentErrors =
      role === "student" && parentErrors.some((pe) => pe && Object.values(pe).some((v) => !!v));

    onValidityChange?.(!(hasMainErrors || hasParentErrors));
  }, [errors, parentErrors, onValidityChange, role]);


  switch (role) {
    case "student":
      return (
        <div className="space-y-2">
          <Label>Họ và tên<p className="text-red-500">*</p></Label>
          <Input maxLength={128} placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => { setFullName(e.target.value); validateField("fullName", e.target.value); }} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          <Label>Mã sinh viên<p className="text-red-500">*</p></Label>
          <Input maxLength={20} placeholder="Nhập mã sinh viên..." value={studentCode} onChange={(e) => { setStudentCode(e.target.value); validateField("studentCode", e.target.value); }} />
          {errors.studentCode && <p className="text-sm text-red-500">{errors.studentCode}</p>}
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
          <Input maxLength={255} placeholder="Nhập nơi sinh..." value={placeOfBirth} onChange={(e) => { setPlaceOfBirth(e.target.value); validateField("placeOfBirth", e.target.value); }} />
          {errors.placeOfBirth && <p className="text-sm text-red-500">{errors.placeOfBirth}</p>}
          <Label>Địa chỉ liên lạc</Label>
          <Input maxLength={255} placeholder="Nhập địa chỉ liên lạc..." value={contactAddress} onChange={(e) => { setContactAddress(e.target.value); validateField("contactAddress", e.target.value); }} />
          {errors.contactAddress && <p className="text-sm text-red-500">{errors.contactAddress}</p>}
          <Label>Email</Label>
          <Input maxLength={100} placeholder="Nhập email..." value={email} onChange={(e) => { setEmail(e.target.value); validateField("email", e.target.value); }} />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          <Label>Số điện thoại</Label>
          <Input maxLength={11} placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => { setPhone(e.target.value); validateField("phone", e.target.value); }} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          <Label>CCCD</Label>
          <Input maxLength={20} placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => { setCitizenId(e.target.value); validateField("citizenId", e.target.value); }} />
          {errors.citizenId && <p className="text-sm text-red-500">{errors.citizenId}</p>}
          <Label>Địa chỉ</Label>
          <Input maxLength={255} placeholder="Nhập địa chỉ..." value={address} onChange={(e) => { setAddress(e.target.value); validateField("address", e.target.value); }} />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          <Label>Dân tộc</Label>
          <Input maxLength={20} placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => { setEthnic(e.target.value); validateField("ethnic", e.target.value); }} />
          {errors.ethnic && <p className="text-sm text-red-500">{errors.ethnic}</p>}
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
          <Label>Trình độ đào tạo</Label>
          <Select value={trainingLevel} onValueChange={(v: string) => setTrainingLevel(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn trình độ đào tạo" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <SelectItem value="bachelor">Cử nhân</SelectItem>
              <SelectItem value="master">Thạc sĩ</SelectItem>
              <SelectItem value="phd">Tiến sĩ</SelectItem>
            </SelectContent>
          </Select>

          <Label>Niên khoá</Label>
          <Input maxLength={20} placeholder="Nhập niên khoá..." value={academicYear} onChange={(e) => { setAcademicYear(e.target.value); validateField("academicYear", e.target.value); }} />
          {errors.academicYear && <p className="text-sm text-red-500">{errors.academicYear}</p>}
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
                <Input maxLength={128} placeholder="Nhập họ và tên..." value={pf.full_name} onChange={(e) => { updateParentForm(idx, { full_name: e.target.value }); validateParentField(idx, "full_name", e.target.value); }} />
                {parentErrors[idx]?.full_name && <p className="text-sm text-red-500">{parentErrors[idx]?.full_name}</p>}
                <Label>Nghề nghiệp</Label>
                <Input maxLength={100} placeholder="Nhập nghề nghiệp..." value={pf.occupation} onChange={(e) => { updateParentForm(idx, { occupation: e.target.value }); validateParentField(idx, "occupation", e.target.value); }} />
                {parentErrors[idx]?.occupation && <p className="text-sm text-red-500">{parentErrors[idx]?.occupation}</p>}
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
                <Input maxLength={100} placeholder="Nhập email..." value={pf.email} onChange={(e) => { updateParentForm(idx, { email: e.target.value }); validateParentField(idx, "email", e.target.value); }} />
                {parentErrors[idx]?.email && <p className="text-sm text-red-500">{parentErrors[idx]?.email}</p>}
                <Label>Số điện thoại</Label>
                <Input maxLength={11} placeholder="Nhập số điện thoại..." value={pf.phone} onChange={(e) => { updateParentForm(idx, { phone: e.target.value }); validateParentField(idx, "phone", e.target.value); }} />
                {parentErrors[idx]?.phone && <p className="text-sm text-red-500">{parentErrors[idx]?.phone}</p>}
                <Label>CCCD</Label>
                <Input maxLength={20} placeholder="Nhập CCCD..." value={pf.citizen_id_card} onChange={(e) => { updateParentForm(idx, { citizen_id_card: e.target.value }); validateParentField(idx, "citizen_id_card", e.target.value); }} />
                {parentErrors[idx]?.citizen_id_card && <p className="text-sm text-red-500">{parentErrors[idx]?.citizen_id_card}</p>}
                <Label>Địa chỉ</Label>
                <Input maxLength={255} placeholder="Nhập địa chỉ..." value={pf.address} onChange={(e) => { updateParentForm(idx, { address: e.target.value }); validateParentField(idx, "address", e.target.value); }} />
                {parentErrors[idx]?.address && <p className="text-sm text-red-500">{parentErrors[idx]?.address}</p>}
                <Label>Dân tộc</Label>
                <Input maxLength={20} placeholder="Nhập dân tộc..." value={pf.ethnic} onChange={(e) => { updateParentForm(idx, { ethnic: e.target.value }); validateParentField(idx, "ethnic", e.target.value); }} />
                {parentErrors[idx]?.ethnic && <p className="text-sm text-red-500">{parentErrors[idx]?.ethnic}</p>}
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
          <Input maxLength={128} placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => { setFullName(e.target.value); validateField("fullName", e.target.value); }} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          <Label>Mã giảng viên</Label>
          <Input maxLength={20} placeholder="Nhập mã giảng viên..." value={lecturerCode} onChange={(e) => { setLecturerCode(e.target.value); validateField("lecturerCode", e.target.value); }} />
          {errors.lecturerCode && <p className="text-sm text-red-500">{errors.lecturerCode}</p>}
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
          <Input maxLength={100} placeholder="Nhập email..." value={email} onChange={(e) => { setEmail(e.target.value); validateField("email", e.target.value); }} />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          <Label>Số điện thoại</Label>
          <Input maxLength={11} placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => { setPhone(e.target.value); validateField("phone", e.target.value); }} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          <Label>CCCD</Label>
          <Input maxLength={20} placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => { setCitizenId(e.target.value); validateField("citizenId", e.target.value); }} />
          {errors.citizenId && <p className="text-sm text-red-500">{errors.citizenId}</p>}
          <Label>Địa chỉ</Label>
          <Input maxLength={255} placeholder="Nhập địa chỉ..." value={address} onChange={(e) => { setAddress(e.target.value); validateField("address", e.target.value); }} />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          <Label>Dân tộc</Label>
          <Input maxLength={20} placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => { setEthnic(e.target.value); validateField("ethnic", e.target.value); }} />
          {errors.ethnic && <p className="text-sm text-red-500">{errors.ethnic}</p>}
        </div>
      );

    case "parent":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input maxLength={128} placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => { setFullName(e.target.value); validateField("fullName", e.target.value); }} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          <Label>Nghề nghiệp</Label>
          <Input maxLength={100} placeholder="Nhập nghề nghiệp..." value={occupation} onChange={(e) => { setOccupation(e.target.value); validateField("occupation", e.target.value); }} />
          {errors.occupation && <p className="text-sm text-red-500">{errors.occupation}</p>}
          <Label>ID sinh viên con</Label>
          <Input maxLength={100} placeholder="Nhập ID sinh viên con..." value={childStudentId} onChange={(e) => { setChildStudentId(e.target.value); validateField("childStudentId", e.target.value); }} />
          {errors.childStudentId && <p className="text-sm text-red-500">{errors.childStudentId}</p>}
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
          <Input maxLength={100} placeholder="Nhập email..." value={email} onChange={(e) => { setEmail(e.target.value); validateField("email", e.target.value); }} />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          <Label>Số điện thoại</Label>
          <Input maxLength={11} placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => { setPhone(e.target.value); validateField("phone", e.target.value); }} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          <Label>CCCD</Label>
          <Input maxLength={20} placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => { setCitizenId(e.target.value); validateField("citizenId", e.target.value); }} />
          {errors.citizenId && <p className="text-sm text-red-500">{errors.citizenId}</p>}
          <Label>Địa chỉ</Label>
          <Input maxLength={255} placeholder="Nhập địa chỉ..." value={address} onChange={(e) => { setAddress(e.target.value); validateField("address", e.target.value); }} />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          <Label>Dân tộc</Label>
          <Input maxLength={20} placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => { setEthnic(e.target.value); validateField("ethnic", e.target.value); }} />
          {errors.ethnic && <p className="text-sm text-red-500">{errors.ethnic}</p>}
        </div>
      );

    case "admin":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input maxLength={128} placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => { setFullName(e.target.value); validateField("fullName", e.target.value); }} />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          <Label>Email</Label>
          <Input maxLength={100} placeholder="Nhập email..." value={email} onChange={(e) => { setEmail(e.target.value); validateField("email", e.target.value); }} />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          <Label>Số điện thoại</Label>
          <Input maxLength={11} placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => { setPhone(e.target.value); validateField("phone", e.target.value); }} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          <Label>CCCD</Label>
          <Input maxLength={20} placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => { setCitizenId(e.target.value); validateField("citizenId", e.target.value); }} />
          {errors.citizenId && <p className="text-sm text-red-500">{errors.citizenId}</p>}
          <Label>Địa chỉ</Label>
          <Input maxLength={255} placeholder="Nhập địa chỉ..." value={address} onChange={(e) => { setAddress(e.target.value); validateField("address", e.target.value); }} />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          <Label>Dân tộc</Label>
          <Input maxLength={20} placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => { setEthnic(e.target.value); validateField("ethnic", e.target.value); }} />
          {errors.ethnic && <p className="text-sm text-red-500">{errors.ethnic}</p>}
        </div>
      );
  }
}
