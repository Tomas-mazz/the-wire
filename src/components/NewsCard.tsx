"use client";

import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { NewsItem } from "@/data/types";
import { TOPICS } from "@/data/types";
import TopicIcon from "./TopicIcon";

// Always format in UTC so the server and browser render the same text.
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

interface NewsCardProps {
  item: NewsItem;
  /** Position in the list, used to stagger the fade-in animation. */
  index: number;
}

/**
 * A news story card. "Top" stories are large; "secondary" ones are compact.
 * "Read more" expands the card in place with a paragraph, 3 key points and the source link.
 */
export default function NewsCard({ item, index }: NewsCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const isTop = item.importance === "top";
  const topicLabel = TOPICS.find((t) => t.id === item.topic)?.label;

  return (
    <article
      style={{ animationDelay: `${index * 60}ms` }}
      className={`flex animate-fade-up flex-col border border-line bg-surface transition-colors hover:border-line-strong hover:bg-surface-hover ${
        isTop ? "rounded-3xl p-6" : "rounded-2xl p-5"
      }`}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium tracking-wider text-muted uppercase">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-body">
          <TopicIcon topic={item.topic} size={14} />
          {topicLabel}
        </span>
        <time dateTime={item.publishedAt}>{formatTime(item.publishedAt)}</time>
      </div>

      <h3
        className={`mt-4 leading-snug text-fg ${
          isTop ? "text-xl font-bold sm:text-2xl" : "text-base font-semibold sm:text-lg"
        }`}
      >
        {item.title}
      </h3>

      <p className={`mt-2 leading-relaxed text-body ${isTop ? "line-clamp-3" : "line-clamp-1"}`}>
        {item.summary}
      </p>

      {/* Expandable details: grid-rows 0fr → 1fr animates to the content's natural height. */}
      <div
        id={detailsId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 border-t border-line pt-4">
            <p className="leading-relaxed text-body">{item.details.paragraph}</p>
            <ul className="mt-3 space-y-1.5">
              {item.details.keyPoints.map((point) => (
                <li key={point} className="flex gap-2 text-body">
                  <span aria-hidden="true" className="text-muted">
                    —
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <a
              href={item.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-fg hover:underline"
            >
              Read on {item.source.name}
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xl border border-line-strong px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-fg/5"
      >
        {open ? "Show less" : "Read more"}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
    </article>
  );
}
