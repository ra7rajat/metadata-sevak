/**
 * SourceColumn - Renders a single news source's articles in a column.
 * @module components/SourceColumn
 */

import Image from 'next/image';
import NewsCard from '@/components/NewsCard';
import type { NewsSource } from '@/types';

interface SourceColumnProps {
  source: NewsSource;
}

export default function SourceColumn({ source }: SourceColumnProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Image
          src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=20`}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="rounded-sm"
          loading="lazy"
        />
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
          {source.name}
        </span>
        <span className="text-[10px] text-gray-500">
          {source.articles.length} article{source.articles.length !== 1 ? 's' : ''}
        </span>
      </div>
      {source.articles.map((article) => (
        <NewsCard key={article.url} article={article} />
      ))}
    </div>
  );
}