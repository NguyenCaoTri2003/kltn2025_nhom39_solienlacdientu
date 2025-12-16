"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { COLORS } from "./constants";

interface WarningsByLevelChartProps {
  data: { level: string; count: number }[];
  loading: boolean;
}

export function WarningsByLevelChart({ data, loading }: WarningsByLevelChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Cảnh cáo theo mức độ</CardTitle>
        <CardDescription className="text-muted-foreground">
          Phân bố cảnh cáo học tập theo mức độ
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
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} cảnh cáo`,
                  props.payload.level || "Khác"
                ]}
              />
              <Legend />
              <Bar dataKey="count" name="Số cảnh cáo" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
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

