import React, { useEffect, useState } from "react";
import { loadDevelopers, type Dev } from "../data/loadDevs";
import ProfileAvatar from "@/components/shared/ProfileAvatar";

const DeveloperShowcase: React.FC = () => {
  const [developers, setDevelopers] = useState<Dev[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const devs = await loadDevelopers();
        setDevelopers(devs);
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
      <div className="flex min-h-[400px] items-center justify-center">
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
          The on-chain developer directory & showcases
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
            className="group animate-fade-in flex transform cursor-pointer flex-col items-center rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-blue-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20 md:p-4"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
            onClick={() => window.open(`/${dev.username}`, "_blank")}
          >
            {/* Avatar */}
            <div className="relative mb-3">
              <ProfileAvatar
                src={dev.avatar}
                name={dev.name}
                username={dev.username}
                className="h-12 w-12 md:h-16 md:w-16"
              />
              <div className="absolute -right-1 -bottom-1 h-4 w-4 animate-pulse rounded-full border-2 border-white/20 bg-green-400"></div>
            </div>

            {/* Info */}
            <div className="text-center">
              <h3 className="mb-1 w-full truncate text-sm font-semibold transition-colors group-hover:text-blue-300 md:text-base">
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
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
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
          <a
            href="/developers"
            className="inline-flex transform items-center rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-blue-600 hover:shadow-xl"
          >
            View All Developers
            <svg
              className="ml-2 h-4 w-4"
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
          </a>
          <a
            href="/community"
            className="inline-flex transform items-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
          >
            Join Community
            <svg
              className="ml-2 h-4 w-4"
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
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeveloperShowcase;

