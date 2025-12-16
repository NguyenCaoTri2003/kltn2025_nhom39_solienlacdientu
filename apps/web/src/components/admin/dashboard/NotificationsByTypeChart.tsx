"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { COLORS } from "./constants";

interface NotificationsByTypeChartProps {
  data: { type: string; count: number }[];
  loading: boolean;
}

export function NotificationsByTypeChart({ data, loading }: NotificationsByTypeChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Thông báo theo loại</CardTitle>
        <CardDescription className="text-muted-foreground">
          Phân bố thông báo theo loại người gửi
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
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} thông báo`,
                  props.payload.type || "Khác"
                ]}
              />
              <Legend />
              <Bar dataKey="count" name="Số thông báo" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
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

