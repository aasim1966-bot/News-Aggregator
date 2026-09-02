import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Globe,
  Briefcase,
  TrendingUp,
  Trophy,
  Flame,
  Coins,
  ShieldAlert,
  Cpu,
  Atom,
  HeartPulse,
  Leaf,
  Activity,
  Landmark,
  PenTool,
  BookOpen,
} from 'lucide-react';
import { CategoryType } from '../types';

interface CategoryBarProps {
  categories: CategoryType[];
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'latest' | 'sources' | 'quick';
  onSortChange: (sort: 'latest' | 'sources' | 'quick') => void;
  categoryCounts?: Record<string, number>;
  selectedOpinionJournal?: string | null;
  onSelectOpinionJournal?: (journal: string | null) => void;
}

export const OPINION_JOURNALS = [
  { id: 'all', label: 'All Leading Journals', searchKey: '' },
  { id: 'dawn', label: 'Dawn', searchKey: 'Dawn' },
  { id: 'the-news', label: 'The News', searchKey: 'The News' },
  { id: 'tribune', label: 'Express Tribune', searchKey: 'Tribune' },
  { id: 'wapo', label: 'Washington Post', searchKey: 'Washington Post' },
  { id: 'guardian', label: 'The Guardian', searchKey: 'Guardian' },
  { id: 'nyt', label: 'New York Times', searchKey: 'New York Times' },
  { id: 'wsj', label: 'Wall Street Journal', searchKey: 'Wall Street Journal' },
  { id: 'bloomberg', label: 'Bloomberg', searchKey: 'Bloomberg' },
  { id: 'project-syndicate', label: 'Project Syndicate', searchKey: 'Project Syndicate' },
  { id: 'ft', label: 'Financial Times', searchKey: 'Financial Times' },
];

const getCategoryIcon = (cat: CategoryType) => {
  switch (cat) {
    case 'All':
      return <Globe className="w-3.5 h-3.5" />;
    case 'Opinion':
      return <PenTool className="w-3.5 h-3.5 text-purple-600" />;
    case 'Pakistan':
      return <Landmark className="w-3.5 h-3.5 text-emerald-500" />;
    case 'Business':
      return <Briefcase className="w-3.5 h-3.5" />;
    case 'Finance':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'Cricket':
      return <Trophy className="w-3.5 h-3.5" />;
    case 'Football':
      return <Activity className="w-3.5 h-3.5" />;
    case 'Oil & Energy':
      return <Flame className="w-3.5 h-3.5" />;
    case 'Gold & Commodities':
      return <Coins className="w-3.5 h-3.5" />;
    case 'Conflict Zones':
      return <ShieldAlert className="w-3.5 h-3.5" />;
    case 'World':
      return <Globe className="w-3.5 h-3.5" />;
    case 'Technology':
      return <Cpu className="w-3.5 h-3.5" />;
    case 'Science':
      return <Atom className="w-3.5 h-3.5" />;
    case 'Health':
      return <HeartPulse className="w-3.5 h-3.5" />;
    case 'Climate':
      return <Leaf className="w-3.5 h-3.5" />;
    default:
      return <Globe className="w-3.5 h-3.5" />;
  }
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categoryCounts,
  selectedOpinionJournal = null,
  onSelectOpinionJournal,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        {/* Category horizontal scrolling pills with icons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm ring-2 ring-stone-900 ring-offset-1'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                }`}
              >
                <span className={isSelected ? 'text-amber-400' : 'text-stone-500'}>
                  {getCategoryIcon(cat)}
                </span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Sort controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search news, topics, sources..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 shrink-0 shadow-2xs">
            <SlidersHorizontal className="w-3 h-3 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest Stories</option>
              <option value="sources">Most Multi-Sourced</option>
              <option value="quick">Quick Reads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dedicated Opinion Journal Filter Bar when Opinion is selected */}
      {selectedCategory === 'Opinion' && onSelectOpinionJournal && (
        <div className="pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-900 shrink-0 mr-1 bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
            <BookOpen className="w-3 h-3 text-purple-600" />
            <span>Leading Journals:</span>
          </div>
          {OPINION_JOURNALS.map((journal) => {
            const isCurrent =
              (!selectedOpinionJournal && journal.searchKey === '') ||
              selectedOpinionJournal === journal.searchKey;

            return (
              <button
                key={journal.id}
                onClick={() => onSelectOpinionJournal(journal.searchKey || null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-900 text-white font-semibold shadow-xs ring-1 ring-purple-900'
                    : 'bg-purple-50/70 border border-purple-200/80 text-purple-900 hover:bg-purple-100'
                }`}
              >
                {journal.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
