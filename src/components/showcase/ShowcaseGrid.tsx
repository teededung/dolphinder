import { useState, useMemo } from 'react';
import FilterSidebar from './FilterSidebar';
import ProjectListItem from './ProjectListItem';
import ProjectModal from './ProjectModal';
import type { ProjectWithDeveloper } from '@/lib/showcase';

interface ShowcaseGridProps {
  projects: ProjectWithDeveloper[];
}

export default function ShowcaseGrid({ projects: initialProjects }: ShowcaseGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [modalProject, setModalProject] = useState<ProjectWithDeveloper | null>(null);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...initialProjects];

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Filter by status
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(p => 
        selectedStatus.includes(p.status)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [initialProjects, searchQuery, selectedTags, selectedStatus, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedStatus([]);
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold md:text-5xl mb-2">
            Project Showcase
          </h1>
          <p className="text-xl text-white/80">
            Discover amazing projects from our developers
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <FilterSidebar
              projects={initialProjects}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
              selectedStatus={selectedStatus}
              sortBy={sortBy}
              onSearchChange={setSearchQuery}
              onTagsChange={setSelectedTags}
              onStatusChange={setSelectedStatus}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Projects List */}
          <div className="flex-1 space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/60 text-lg mb-2">No projects found</p>
                <p className="text-white/40 text-sm">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  onClick={() => setModalProject(project)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ProjectModal
        project={modalProject}
        isOpen={!!modalProject}
        onClose={() => setModalProject(null)}
      />
    </div>
  );
}

