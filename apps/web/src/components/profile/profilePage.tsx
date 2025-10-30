"use client"

import { useEffect, useState } from "react";
import ProfileByRole from "./profileByRole";
import ProfileHeader from "./profile_Component/ProfileHeader";

export default function ProfilePage() {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

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
                                academic_rank={user.lecturer?.academic_rank || user.academic_rank}
                                faculty_name={user.lecturer?.faculties?.name || user.faculty_name}
                                initial={user.full_name?.[0] ?? "?"}
                            />
                            <ProfileByRole user={user} />
                        </>
                    ) : (
                        <div className="text-gray-500">Không có dữ liệu người dùng</div>
                    )}
                    {/* <div className="flex justify-end gap-3 mt-6">
                        <button className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
                            Hủy
                        </button>
                        <button className="px-5 py-2 bg-[#4e73df] text-white rounded-lg hover:bg-[#3a5ed7] transition">
                            Lưu
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    )
}


