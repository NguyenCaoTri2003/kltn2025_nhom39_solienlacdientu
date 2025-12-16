"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { StatCard } from "./types";

interface StatCardsProps {
  cards: StatCard[];
  loading: boolean;
}

export function StatCards({ cards, loading }: StatCardsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 ${card.hoverBorder} ${card.hoverBg}`}
            onClick={() => router.push(card.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {loading ? (
                  <span className="inline-block h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  card.value.toLocaleString("vi-VN")
                )}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

