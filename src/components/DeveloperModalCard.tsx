import { type Dev } from "../data/loadDevs";
import ProfileAvatar from "./shared/ProfileAvatar";
import { Github, Linkedin, Globe, ExternalLink, Send } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
  dev: Dev;
};

export default function DeveloperModalCard({ dev }: Props) {
  const openLink = (url?: string) => {
    if (!url) return;
    window.location.href = url;
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
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/10 hover:bg-white/20"
          onClick={() => openLink(dev.github)}
        >
          <Github /> GitHub
        </Button>
        {dev.linkedin && (
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 hover:bg-white/20"
            onClick={() => openLink(dev.linkedin)}
          >
            <Linkedin /> LinkedIn
          </Button>
        )}
        {dev.telegram && (
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 hover:bg-white/20"
            onClick={() => openLink(dev.telegram)}
          >
            <Send /> Telegram
          </Button>
        )}
        {dev.website && (
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 hover:bg-white/20"
            onClick={() => openLink(dev.website)}
          >
            <Globe /> Website
          </Button>
        )}
      </div>
      <div className="mt-1 flex w-full justify-center">
        <Button
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          onClick={() => openLink(`/${dev.username}`)}
        >
          <ExternalLink /> View profile
        </Button>
      </div>
    </div>
  );
}


