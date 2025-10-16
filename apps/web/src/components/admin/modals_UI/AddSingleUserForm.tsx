"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Shared validators
import {
  isValidFullName,
  isValidEmail,
  isValidPhone,
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

  // validators are imported at the module level

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
    onChange?.(payload);

    // Compute validity using Regex utils
    const trimmed = (v: string) => v.trim();
    const errors: Record<string, string> = {};

    // Common required
    if (!trimmed(fullName) || !isValidFullName(trimmed(fullName))) {
      errors.fullName = "Họ và tên không hợp lệ";
    }

    // Optional commons (validate only if provided)
    if (trimmed(email) && !isValidEmail(trimmed(email))) {
      errors.email = "Email không hợp lệ";
    }
    if (trimmed(phone) && !isValidPhone(trimmed(phone))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
    if (trimmed(citizenId) && !isValidCitizenId(trimmed(citizenId))) {
      errors.citizenId = "CCCD/CMND không hợp lệ";
    }
    if (trimmed(address) && !isValidAddress(trimmed(address))) {
      errors.address = "Địa chỉ không hợp lệ";
    }
    if (trimmed(ethnic) && !isValidEthnic(trimmed(ethnic))) {
      errors.ethnic = "Dân tộc không hợp lệ";
    }

    if (role === "student") {
      if (trimmed(studentCode) && !isValidStudentCode(trimmed(studentCode))) {
        errors.studentCode = "Mã sinh viên không hợp lệ";
      }
      if (trimmed(placeOfBirth) && !isValidPlaceOrContactAddress(trimmed(placeOfBirth))) {
        errors.placeOfBirth = "Nơi sinh không hợp lệ";
      }
      if (trimmed(contactAddress) && !isValidPlaceOrContactAddress(trimmed(contactAddress))) {
        errors.contactAddress = "Địa chỉ liên lạc không hợp lệ";
      }
      if (trimmed(academicYear) && !isValidAcademicYear(trimmed(academicYear))) {
        errors.academicYear = "Niên khoá không hợp lệ";
      }
    } else if (role === "lecturer") {
      if (trimmed(lecturerCode) && !isValidLecturerCode(trimmed(lecturerCode))) {
        errors.lecturerCode = "Mã giảng viên không hợp lệ";
      }
    } else if (role === "parent") {
      if (trimmed(occupation) && !isValidOccupation(trimmed(occupation))) {
        errors.occupation = "Nghề nghiệp không hợp lệ";
      }
      // Parent requires linking to a student and relationship
      if (!trimmed(childStudentId) || !/^\d+$/.test(trimmed(childStudentId))) {
        errors.childStudentId = "Vui lòng nhập ID sinh viên hợp lệ";
      }
      if (!trimmed(relationship)) {
        errors.relationship = "Vui lòng chọn mối quan hệ";
      }
    }

    const isValid = Object.keys(errors).length === 0;
    onValidityChange?.(isValid);
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
    onChange,
    onValidityChange,
  ]);


  switch (role) {
    case "student":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {!(fullName.trim() && isValidFullName(fullName.trim())) && (
            <p className="text-destructive text-xs">Họ và tên không hợp lệ</p>
          )}
          <Label>Mã sinh viên</Label>
          <Input placeholder="Nhập mã sinh viên..." value={studentCode} onChange={(e) => setStudentCode(e.target.value)} />
          {studentCode.trim() && !isValidStudentCode(studentCode.trim()) ? (
            <p className="text-destructive text-xs">Mã sinh viên không hợp lệ</p>
          ) : null}
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
          {placeOfBirth.trim() && !isValidPlaceOrContactAddress(placeOfBirth.trim()) ? (
            <p className="text-destructive text-xs">Nơi sinh không hợp lệ</p>
          ) : null}
          <Label>Địa chỉ liên lạc</Label>
          <Input placeholder="Nhập địa chỉ liên lạc..." value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
          {contactAddress.trim() && !isValidPlaceOrContactAddress(contactAddress.trim()) ? (
            <p className="text-destructive text-xs">Địa chỉ liên lạc không hợp lệ</p>
          ) : null}
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          {email.trim() && !isValidEmail(email.trim()) ? (
            <p className="text-destructive text-xs">Email không hợp lệ</p>
          ) : null}
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phone.trim() && !isValidPhone(phone.trim()) ? (
            <p className="text-destructive text-xs">Số điện thoại không hợp lệ</p>
          ) : null}
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          {citizenId.trim() && !isValidCitizenId(citizenId.trim()) ? (
            <p className="text-destructive text-xs">CCCD/CMND không hợp lệ</p>
          ) : null}
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          {address.trim() && !isValidAddress(address.trim()) ? (
            <p className="text-destructive text-xs">Địa chỉ không hợp lệ</p>
          ) : null}
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
          {ethnic.trim() && !isValidEthnic(ethnic.trim()) ? (
            <p className="text-destructive text-xs">Dân tộc không hợp lệ</p>
          ) : null}
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
        </div>
      );

    case "lecturer":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {!(fullName.trim() && isValidFullName(fullName.trim())) && (
            <p className="text-destructive text-xs">Họ và tên không hợp lệ</p>
          )}
          <Label>Mã giảng viên</Label>
          <Input placeholder="Nhập mã giảng viên..." value={lecturerCode} onChange={(e) => setLecturerCode(e.target.value)} />
          {lecturerCode.trim() && !isValidLecturerCode(lecturerCode.trim()) ? (
            <p className="text-destructive text-xs">Mã giảng viên không hợp lệ</p>
          ) : null}
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
          {email.trim() && !isValidEmail(email.trim()) ? (
            <p className="text-destructive text-xs">Email không hợp lệ</p>
          ) : null}
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phone.trim() && !isValidPhone(phone.trim()) ? (
            <p className="text-destructive text-xs">Số điện thoại không hợp lệ</p>
          ) : null}
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          {citizenId.trim() && !isValidCitizenId(citizenId.trim()) ? (
            <p className="text-destructive text-xs">CCCD/CMND không hợp lệ</p>
          ) : null}
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          {address.trim() && !isValidAddress(address.trim()) ? (
            <p className="text-destructive text-xs">Địa chỉ không hợp lệ</p>
          ) : null}
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
          {ethnic.trim() && !isValidEthnic(ethnic.trim()) ? (
            <p className="text-destructive text-xs">Dân tộc không hợp lệ</p>
          ) : null}
        </div>
      );

    case "parent":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {!(fullName.trim() && isValidFullName(fullName.trim())) && (
            <p className="text-destructive text-xs">Họ và tên không hợp lệ</p>
          )}
          <Label>Nghề nghiệp</Label>
          <Input placeholder="Nhập nghề nghiệp..." value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          {occupation.trim() && !isValidOccupation(occupation.trim()) ? (
            <p className="text-destructive text-xs">Nghề nghiệp không hợp lệ</p>
          ) : null}
          <Label>ID sinh viên con</Label>
          <Input placeholder="Nhập ID sinh viên con..." value={childStudentId} onChange={(e) => setChildStudentId(e.target.value)} />
          {/^\d+$/.test(childStudentId.trim()) ? null : (
            <p className="text-destructive text-xs">Vui lòng nhập số ID hợp lệ</p>
          )}
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
          {!(relationship.trim().length > 0) && (
            <p className="text-destructive text-xs">Vui lòng chọn mối quan hệ</p>
          )}
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          {email.trim() && !isValidEmail(email.trim()) ? (
            <p className="text-destructive text-xs">Email không hợp lệ</p>
          ) : null}
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phone.trim() && !isValidPhone(phone.trim()) ? (
            <p className="text-destructive text-xs">Số điện thoại không hợp lệ</p>
          ) : null}
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          {citizenId.trim() && !isValidCitizenId(citizenId.trim()) ? (
            <p className="text-destructive text-xs">CCCD/CMND không hợp lệ</p>
          ) : null}
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          {address.trim() && !isValidAddress(address.trim()) ? (
            <p className="text-destructive text-xs">Địa chỉ không hợp lệ</p>
          ) : null}
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
          {ethnic.trim() && !isValidEthnic(ethnic.trim()) ? (
            <p className="text-destructive text-xs">Dân tộc không hợp lệ</p>
          ) : null}
        </div>
      );

    case "admin":
      return (
        <div className="space-y-2">
          <Label>Họ và tên</Label>
          <Input placeholder="Nhập họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {!(fullName.trim() && isValidFullName(fullName.trim())) && (
            <p className="text-destructive text-xs">Họ và tên không hợp lệ</p>
          )}
          <Label>Email</Label>
          <Input placeholder="Nhập email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          {email.trim() && !isValidEmail(email.trim()) ? (
            <p className="text-destructive text-xs">Email không hợp lệ</p>
          ) : null}
          <Label>Số điện thoại</Label>
          <Input placeholder="Nhập số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          {phone.trim() && !isValidPhone(phone.trim()) ? (
            <p className="text-destructive text-xs">Số điện thoại không hợp lệ</p>
          ) : null}
          <Label>CCCD</Label>
          <Input placeholder="Nhập CCCD..." value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
          {citizenId.trim() && !isValidCitizenId(citizenId.trim()) ? (
            <p className="text-destructive text-xs">CCCD/CMND không hợp lệ</p>
          ) : null}
          <Label>Địa chỉ</Label>
          <Input placeholder="Nhập địa chỉ..." value={address} onChange={(e) => setAddress(e.target.value)} />
          {address.trim() && !isValidAddress(address.trim()) ? (
            <p className="text-destructive text-xs">Địa chỉ không hợp lệ</p>
          ) : null}
          <Label>Dân tộc</Label>
          <Input placeholder="Nhập dân tộc..." value={ethnic} onChange={(e) => setEthnic(e.target.value)} />
          {ethnic.trim() && !isValidEthnic(ethnic.trim()) ? (
            <p className="text-destructive text-xs">Dân tộc không hợp lệ</p>
          ) : null}
        </div>
      );
  }
}
