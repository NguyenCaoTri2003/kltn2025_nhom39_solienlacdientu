"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Users, CalendarDays, BookOpen, Clock, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import WeeklyScheduleList from "./weekly-schedule-list";

interface Offering {
  id: number;
  name: string;
  class_code: string;
  course_code?: string;
  semester_name?: string;
  year?: string;
  courses: {
    credit?: number;
  };
  student_count?: number;
  capacity?: number;
  registered?: number;
  schedule?: string;
  description?: string;
  status?: string;
  weekly_schedules?: {
    day_of_week: number;
    start_period: number;
    period_count: number;
    classroom?: string | null;
    building?: string | null;
    type: "lecture" | "practice" | string;
  }[];
}

interface GroupedOfferings {
  [yearSemester: string]: Offering[];
}

export default function OfferingsList() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offerings/lecturer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setOfferings(json.returnCode === 0 ? json.data : []);
      } catch (error) {
        console.error("Error fetching offerings:", error);
        setOfferings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  console.log(offerings);

  const grouped = useMemo(() => {
    const map: GroupedOfferings = {};
    offerings.forEach((o) => {
      const key = `${o.year || "Không rõ"} - ${o.semester_name || "Không rõ học kỳ"}`;
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [offerings]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (offerings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không có lớp học phần nào được phân công.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Object.entries(grouped)
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([key, list]) => (
          <section key={key}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{key}</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((o) => (
                <motion.div
                  key={o.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card
                    className="p-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card/95 to-card/70 shadow-md 
                    hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {o.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      Mã lớp: <span className="font-medium text-foreground">{o.class_code}</span>
                    </p>
                    {o.course_code && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Mã học phần:{" "}
                        <span className="font-medium text-foreground">{o.course_code}</span>
                      </p>
                    )}

                    <WeeklyScheduleList schedules={o.weekly_schedules} filterType="theory"/>

                    <div className="flex justify-between text-sm mt-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        {o.courses.credit || "?"} tín chỉ
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        {o.registered || 0}/{o.capacity || 0} SV
                      </div>
                    </div>

                    {o.description && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 text-primary mt-0.5" />
                        <span className="line-clamp-2">{o.description}</span>
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
