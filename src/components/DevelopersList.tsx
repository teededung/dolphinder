import { Github, Linkedin, Globe } from "lucide-react";
import { ProfileAvatar } from "./shared/ProfileAvatar";

interface DevelopersListProps {
  developers: Array<{
    name: string;
    username: string;
    avatar: string;
    bio: string;
    github: string;
    linkedin: string;
    telegram: string;
    website: string;
    slushWallet: string;
    entry: string;
    walrusBlobId: string | null;
  }>;
}

export default function DevelopersList({ developers }: DevelopersListProps) {
  // Sort developers: prioritize onchain profiles
  const sortedDevelopers = [...developers].sort((a, b) => {
    if (a.walrusBlobId && !b.walrusBlobId) return -1;
    if (!a.walrusBlobId && b.walrusBlobId) return 1;
    return 0;
  });

  return (
    <div>
      {/* Developer Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedDevelopers.map((dev) => (
          <div
            key={dev.username}
            className={`group relative block cursor-pointer rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              dev.walrusBlobId
                ? "border-emerald-400/30 bg-emerald-400/5 hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:shadow-emerald-500/20"
                : "border-white/10 bg-white/5 hover:border-blue-400/30 hover:bg-white/10 hover:shadow-blue-500/20"
            }`}
            onClick={() => (window.location.href = `/${dev.username}`)}
          >
            {/* Onchain Badge */}
            {dev.walrusBlobId && (
              <div className="absolute right-3 top-3 z-10">
                <div className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2 py-1 text-xs text-emerald-300">
                  <img src="/walrus-token.svg" alt="Walrus" className="h-3 w-3" loading="lazy" />
                  <span>Walrus</span>
                </div>
              </div>
            )}

            {/* Avatar */}
            <div className="mb-4 flex justify-center">
              <ProfileAvatar
                src={dev.avatar}
                name={dev.name}
                username={dev.username}
                className={`rounded-full border-3 transition-all duration-300 ${
                  dev.walrusBlobId
                    ? "border-emerald-400/50 group-hover:border-emerald-400/70"
                    : "border-white/20 group-hover:border-blue-400/50"
                }`}
                size={80}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <h3
                className={`mb-1 text-lg font-semibold transition-colors ${
                  dev.walrusBlobId ? "group-hover:text-emerald-300" : "group-hover:text-blue-300"
                }`}
              >
                {dev.name}
              </h3>
              <p className="mb-3 text-sm text-white/60">@{dev.username}</p>

              {dev.bio && <p className="mb-4 line-clamp-2 text-sm text-white/70">{dev.bio}</p>}

              {/* Social Links */}
              <div className="flex justify-center space-x-3 opacity-60 transition-opacity group-hover:opacity-100">
                <a
                  href={dev.github}
                  target="_blank"
                  className="text-white/60 transition-colors hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="h-4 w-4" />
                </a>
                {dev.linkedin && (
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    className="text-white/60 transition-colors hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {dev.website && (
                  <a
                    href={dev.website}
                    target="_blank"
                    className="text-white/60 transition-colors hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedDevelopers.length === 0 && (
        <div className="py-12 text-center text-white/60">
          No developers found.
        </div>
      )}
    </div>
  );
}

