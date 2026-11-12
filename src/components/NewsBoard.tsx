"use client";

import { useState } from "react";
import type { NewsItem, Topic } from "@/data/types";
import { TOPICS } from "@/data/types";
import NewsCard from "./NewsCard";
import TopicIcon from "./TopicIcon";

/**
 * Topic tabs + the 3+2 layout: three large top stories,
 * then two compact secondary stories underneath (like a newspaper front page).
 */
export default function NewsBoard({ items }: { items: NewsItem[] }) {
  const [topic, setTopic] = useState<Topic>("stocks");

  const stories = items.filter((item) => item.topic === topic);
  const top = stories.filter((item) => item.importance === "top");
  const secondary = stories.filter((item) => item.importance === "secondary");

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      {/* Tabs scroll horizontally on small screens instead of wrapping (scrollbar hidden). */}
      <div
        role="tablist"
        aria-label="News topics"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {TOPICS.map(({ id, label }) => {
          const selected = id === topic;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTopic(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-fg bg-fg text-bg"
                  : "border-line-strong text-body hover:bg-fg/5"
              }`}
            >
              <TopicIcon topic={id} />
              {label}
            </button>
          );
        })}
      </div>

      {/* key={topic} remounts the grid so the fade-in replays when switching topics.
          items-start: expanding one card must not stretch its neighbors. */}
      <div key={topic} role="tabpanel" className="mt-8 space-y-4">
        <div className="grid items-start gap-4 md:grid-cols-3">
          {top.map((item, i) => (
            <NewsCard key={item.id} item={item} index={i} />
          ))}
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2">
          {secondary.map((item, i) => (
            <NewsCard key={item.id} item={item} index={top.length + i} />
          ))}
        </div>
      </div>
    </section>
  );
}
