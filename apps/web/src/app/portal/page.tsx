import Navbar from "@/components/navbar";

export default function PortalPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-7xl text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Trang cổng thông tin sinh viên
                    </h1>
                </div>
            </div>
        </div>
    )
}
