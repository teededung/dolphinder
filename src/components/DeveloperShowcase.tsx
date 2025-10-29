import React, { useEffect, useState } from "react";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import { Button } from "./ui/button";

interface Dev {
  name: string;
  username: string;
  avatar?: string;
  github: string;
  linkedin?: string;
  website?: string;
  bio?: string;
  slushWallet?: string;
  walrusBlobId?: string | null;
}

const DeveloperShowcase: React.FC = () => {
  const [developers, setDevelopers] = useState<Dev[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        // Fetch from API endpoint that gets data from Supabase
        const response = await fetch('/api/developers/list');
        if (response.ok) {
          const devs = await response.json();
          setDevelopers(devs);
        }
      } catch (error) {
        console.error("Error loading developers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  // Auto-rotate through developers
  useEffect(() => {
    if (developers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % developers.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [developers.length]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-purple-400"></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-blue-400"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-indigo-400"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <p className="mt-4 text-sm text-white/60">Loading developer profiles...</p>
      </div>
    );
  }

  if (!loading && developers.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <svg
          className="mb-4 h-16 w-16 text-white/20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-lg text-white/80">No developers found</p>
        <p className="mt-2 text-sm text-white/60">Check back later for amazing developers!</p>
      </div>
    );
  }

  const visibleDevelopers = developers.slice(currentIndex, currentIndex + 6);
  if (visibleDevelopers.length < 6) {
    visibleDevelopers.push(
      ...developers.slice(0, 6 - visibleDevelopers.length)
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Header */}
      <div className="mb-8 text-center md:mb-12">
        <h1 className="mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
          Dolphinder Nation
        </h1>
        <p className="mb-2 text-lg text-white/80 md:text-xl">
          The onchain developer directory & showcases
        </p>
        <p className="text-white/60">
          {developers.length} talented developers and counting...
        </p>
      </div>

      {/* Developer Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {visibleDevelopers.map((dev, index) => (
          <div
            key={`${dev.username}-${currentIndex}-${index}`}
            className={`group animate-fade-in relative flex transform cursor-pointer flex-col items-center rounded-xl border p-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-lg md:p-4 ${
              dev.walrusBlobId
                ? "border-emerald-400/30 bg-emerald-400/5 hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:shadow-emerald-500/20"
                : "border-white/10 bg-white/5 hover:border-blue-400/30 hover:bg-white/10 hover:shadow-blue-500/20"
            }`}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
            onClick={() => window.open(`/${dev.username}`, "_blank")}
          >
            {/* Onchain Badge */}
            {dev.walrusBlobId && (
              <div className="absolute right-1 top-1 z-10">
                <div className="flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-400/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  <img src="/walrus-token.svg" alt="Walrus" className="h-2.5 w-2.5" />
                  <span className="hidden md:inline">Walrus</span>
                </div>
              </div>
            )}

            {/* Avatar */}
            <div className="relative mb-3">
              <ProfileAvatar
                src={dev.avatar}
                name={dev.name}
                username={dev.username}
                className="h-12 w-12 md:h-16 md:w-16"
              />
              <div className={`absolute -right-1 -bottom-1 h-4 w-4 animate-pulse rounded-full border-2 border-white/20 ${
                dev.walrusBlobId ? "bg-emerald-400" : "bg-green-400"
              }`}></div>
            </div>

            {/* Info */}
            <div className="text-center">
              <h3 className={`mb-1 w-full truncate text-sm font-semibold transition-colors md:text-base ${
                dev.walrusBlobId ? "group-hover:text-emerald-300" : "group-hover:text-blue-300"
              }`}>
                {dev.name}
              </h3>
              <p className="w-full truncate text-xs text-white/60">
                @{dev.username}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="mb-8 flex justify-center space-x-2">
        {Array.from({ length: Math.ceil(developers.length / 6) }).map(
          (_, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-2 w-2 rounded-full p-0 transition-all duration-300 ${
                Math.floor(currentIndex / 6) === index
                  ? "w-6 bg-blue-400"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              onClick={() => setCurrentIndex(index * 6)}
            />
          )
        )}
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-4 md:flex-row">
          <Button
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl"
            onClick={() => window.location.href = '/developers'}
          >
            View All Developers
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            onClick={() => window.location.href = '/community'}
          >
            Join Community
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperShowcase;

