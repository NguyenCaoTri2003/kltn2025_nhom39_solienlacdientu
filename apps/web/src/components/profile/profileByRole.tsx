"use client";

import React from "react";
import CommonInfoForm, { BasicUserInfo } from "./profile_Component/CommonInfoForm";
import StudentInfoForm from "./profile_Component/StudentInfoForm";
import ParentInfoForm, { ParentEntry } from "./profile_Component/ParentInfoForm";
import ChildrenInfoForm, { ChildEntry } from "./profile_Component/ChildrenInfoForm";
import LecturerInfoForm from "./profile_Component/LecturerInfoForm";

type UserBasic = {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  citizen_id_card?: string | null;
  address?: string | null;
  ethnic?: string | null;
  role?: string;
};

type StudentRel = {
  student?: {
    academic_status?: string;
    academic_year?: string;
    student_code?: string;
    classes?: {
      name?: string;
      majors?: { faculties?: { name?: string } };
    };
    class?: {
      name?: string;
      majors?: { faculties?: { name?: string } };
    };
  };
};

type AnyUser = UserBasic & StudentRel & {
  parents?: ParentEntry[];
  children?: ChildEntry[];
  lecturer?: {
    lecturer_code?: string | null;
    academic_rank?: string | null;
    faculties?: { id?: number; name?: string | null } | null;
  };
};

export default function ProfileByRole({ user }: { user: AnyUser }) {
  const basic: BasicUserInfo = {
    id: user.id,
    full_name: user.full_name,
    phone: user.phone ?? null,
    email: user.email ?? null,
    citizen_id_card: user.citizen_id_card ?? null,
    address: user.address ?? null,
    ethnic: user.ethnic ?? null,
  };

  return (
    <div className="flex flex-col gap-6">
      <CommonInfoForm user={basic} />
      {user.role === "student" && user.student && (
        <StudentInfoForm studentData={user} />
      )}
      {user.role === "student" && user.parents?.length ? (
        <ParentInfoForm parents={user.parents} />
      ) : null}
      {user.children?.length ? (
        <ChildrenInfoForm childrenList={user.children} />
      ) : null}
      {/* {user.role === "lecturer" && user.lecturer ? (
        <LecturerInfoForm lecturer={user.lecturer} />
      ) : null} */}
    </div>
  );
}


