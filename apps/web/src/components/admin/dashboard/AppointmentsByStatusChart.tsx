"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { COLORS } from "./constants";

interface AppointmentsByStatusChartProps {
  data: { status: string; count: number }[];
  loading: boolean;
}

export function AppointmentsByStatusChart({ data, loading }: AppointmentsByStatusChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Lịch hẹn theo trạng thái</CardTitle>
        <CardDescription className="text-muted-foreground">
          Phân bố lịch hẹn theo trạng thái
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} lịch hẹn`,
                  props.payload.status || "Khác"
                ]}
              />
              <Legend />
              <Bar dataKey="count" name="Số lịch hẹn" fill={COLORS.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Không có dữ liệu
          </div>
        )}
      </CardContent>
    </Card>
  );
}

