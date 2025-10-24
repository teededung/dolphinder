import React from "react";
import { type Dev } from "../data/loadDevs";
import ProfileAvatar from "./shared/ProfileAvatar";
import { Github, Linkedin, Globe, ExternalLink } from "lucide-react";

type Props = {
  dev: Dev;
};

export default function DeveloperModalCard({ dev }: Props) {
  const openNew = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <ProfileAvatar
        src={dev.avatar}
        name={dev.name}
        username={dev.username}
        size={96}
        className="rounded-full border-4 border-white/20 shadow-lg"
      />
      <div className="text-center">
        <div className="text-xl font-semibold">{dev.name}</div>
        <div className="text-sm text-white/70">@{dev.username}</div>
      </div>
      {dev.bio && (
        <p className="max-w-md text-center text-sm text-white/80">{dev.bio}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-sm font-medium hover:bg-white/20"
          onClick={() => openNew(dev.github)}
        >
          <span className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</span>
        </button>
        {dev.linkedin && (
          <button
            className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-sm font-medium hover:bg-white/20"
            onClick={() => openNew(dev.linkedin)}
          >
            <span className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</span>
          </button>
        )}
        {dev.website && (
          <button
            className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-sm font-medium hover:bg-white/20"
            onClick={() => openNew(dev.website)}
          >
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</span>
          </button>
        )}
      </div>
      <div className="mt-1 flex w-full justify-center">
        <button
          className="cursor-pointer rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 text-sm font-semibold hover:from-purple-600 hover:to-blue-600"
          onClick={() => openNew(`/${dev.username}`)}
        >
          <span className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> View profile</span>
        </button>
      </div>
    </div>
  );
}


