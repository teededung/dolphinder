import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { ProjectWithDeveloper } from '@/lib/showcase';

interface FilterSidebarProps {
  projects: ProjectWithDeveloper[];
  searchQuery: string;
  selectedTags: string[];
  selectedStatus: string[];
  sortBy: string;
  onSearchChange: (query: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusChange: (status: string[]) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

export default function FilterSidebar({
  projects,
  searchQuery,
  selectedTags,
  selectedStatus,
  sortBy,
  onSearchChange,
  onTagsChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
}: FilterSidebarProps) {
  // Extract unique tags from all projects
  const allTags = Array.from(
    new Set(projects.flatMap(p => p.tags || []))
  ).sort();

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleStatusToggle = (status: string) => {
    if (selectedStatus.includes(status)) {
      onStatusChange(selectedStatus.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatus, status]);
    }
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedStatus.length > 0 || sortBy !== 'newest';

  return (
    <div className="w-full lg:w-64 space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-white/80 mb-2 block">
          Search Projects
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Project name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="text-sm font-medium text-white/80 mb-3 block">
            Tags ({selectedTags.length > 0 ? selectedTags.length : 'All'})
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allTags.map(tag => (
              <label
                key={tag}
                className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded border-white/20 bg-white/5 text-white focus:ring-white/50"
                />
                <span className="text-sm text-white/70">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <label className="text-sm font-medium text-white/80 mb-3 block">
          Status
        </label>
        <div className="space-y-2">
          {['active', 'completed', 'in-progress'].map(status => (
            <label
              key={status}
              className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedStatus.includes(status)}
                onChange={() => handleStatusToggle(status)}
                className="rounded border-white/20 bg-white/5 text-white focus:ring-white/50"
              />
              <span className="text-sm text-white/70 capitalize">{status.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-white/80 mb-3 block">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}

      {/* Results Count */}
      <div className="text-sm text-white/60 pt-4 border-t border-white/10">
        {projects.length} project{projects.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

