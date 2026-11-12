import { Bitcoin, Code, Landmark, TrendingUp, type LucideIcon } from "lucide-react";
import type { Topic } from "@/data/types";

/** One thin line icon per topic (see STYLE.md → Icons). */
const ICONS: Record<Topic, LucideIcon> = {
  stocks: TrendingUp,
  crypto: Bitcoin,
  programming: Code,
  economy: Landmark,
};

export default function TopicIcon({ topic, size = 16 }: { topic: Topic; size?: number }) {
  const Icon = ICONS[topic];
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}
