"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileByRole, { AnyUser } from "./profileByRole";
import EditProfileModal, { SubmitPayload } from "./profile_Component/EditProfileModal";
import ProfileHeader from "./profile_Component/ProfileHeader";

export default function ProfilePage() {
    const [user, setUser] = useState<AnyUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                if (!raw || !token) return;
                const me = JSON.parse(raw);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/detail/${me.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
                const data = await res.json();
                if (res.ok) setUser(data);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const handleSubmitEdit = async (payload: SubmitPayload) => {
        if (!user) return;
        try {
            setSubmitting(true);
            const token = typeof document !== "undefined"
                ? (document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1] || localStorage.getItem("token"))
                : null;
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
            const userPayload = {
                phone: payload.phone,
                email: payload.email,
                address: payload.address,
            };
            const studentPayload = user.role === "student" ? { contact_address: payload.contact_address } : undefined;
            const res = await fetch(`${apiBase}/api/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user: userPayload, ...(studentPayload ? { student: studentPayload } : {}) }),
            });
            const updated = await res.json();
            if (!res.ok) throw new Error(updated?.error || "Cập nhật thất bại");
            setUser((prev) => {
                if (!prev) return updated;
                const merged = { ...prev, ...updated };

                merged.phone = updated.phone ?? userPayload.phone ?? prev.phone;
                merged.email = updated.email ?? userPayload.email ?? prev.email;
                merged.address = updated.address ?? userPayload.address ?? prev.address;
                if (merged.student) {
                    merged.student = {
                        ...prev.student,
                        ...updated.student,
                        contact_address: updated.student?.contact_address ?? studentPayload?.contact_address ?? prev.student?.contact_address,
                    };
                }
                return merged;
            });
            toast.success("Cập nhật thông tin thành công");
            setEditing(false);
        } catch (e) {
            console.error(e);
            toast.error("Không thể cập nhật thông tin. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#f7f8fa] p-10">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8">
                    {loading ? (
                        <div className="text-gray-500">Đang tải...</div>
                    ) : user ? (
                        <>
                            <ProfileHeader
                                avatar_url={user.avatar_url}
                                displayName={user.full_name}
                                role={user.role}
                                academic_rank={user.lecturer?.academic_rank ?? user.academic_rank ?? undefined}
                                faculty_name={user.lecturer?.faculties?.name ?? user.faculty_name ?? undefined}
                                initial={user.full_name?.[0] ?? "?"}
                                userId={user.id}
                                onEdit={() => setEditing(true)}
                            />
                            <ProfileByRole user={user} />
                            <EditProfileModal
                                open={editing}
                                onClose={() => setEditing(false)}
                                submitting={submitting}
                                role={user.role}
                                initial={{
                                    phone: user.phone ?? "",
                                    email: user.email ?? "",
                                    address: user.address ?? "",
                                    contact_address: user.student?.contact_address ?? "",
                                }}
                                onSubmit={(data) => handleSubmitEdit({
                                    phone: data.phone ?? "",
                                    email: data.email ?? "",
                                    address: data.address ?? "",
                                    contact_address: data.contact_address ?? "",
                                })}
                            />
                        </>
                    ) : (
                        <div className="text-gray-500">Không có dữ liệu người dùng</div>
                    )}
             
                </div>
            </div>
        </div>
    )
}


