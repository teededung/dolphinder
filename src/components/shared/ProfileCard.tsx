import { Github, Linkedin, Globe, Database, Check } from 'lucide-react';
import { Button } from '../ui/button';
import CopyButton from './CopyButton';
import EditButton from './profile/EditButton';
import { ProfileAvatar } from './ProfileAvatar';
import WalrusBadge from './WalrusBadge';

type ProfileCardProps = {
  variant: 'onchain' | 'offchain';
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  walletAddress?: string;
  isVerified?: boolean;
  showEditButton?: boolean;
  isOwner?: boolean;
};

export default function ProfileCard({
  variant,
  name,
  username,
  avatar,
  bio,
  github,
  linkedin,
  website,
  walletAddress,
  isVerified,
  showEditButton,
  isOwner,
}: ProfileCardProps) {
  return (
    <div className="relative space-y-3">
      {showEditButton && (
        <div className="absolute top-0 right-0 z-10">
          <EditButton />
        </div>
      )}
      {/* Badges */}
      {(variant === 'onchain' || (variant === 'offchain' && isOwner)) && (
        <div className="flex justify-center gap-2">
          {variant === 'onchain' && <WalrusBadge variant="onchain" size="md" />}
          {variant === 'offchain' && isOwner && <WalrusBadge variant="offchain" size="md" />}
          {variant === 'onchain' && isVerified === true && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
              <Check className="h-4 w-4" />
              Verified
            </span>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center">
        <ProfileAvatar
          src={avatar}
          name={name || username || 'User'}
          username={username}
          className="border-4 border-white/20 shadow"
          size={160}
        />
      </div>

      {/* Name + username */}
      {name && <div className="text-2xl font-semibold">{name}</div>}
      {username && <p className="text-xl text-white/60">@{username}</p>}
      {bio && <p className="text-white/70 mb-8 leading-relaxed">{bio}</p>}

      {/* Social Links */}
      {(github || linkedin || website) && (
        <div className="flex justify-center space-x-4 mb-8">
          {github && (
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 hover:scale-105"
              onClick={() => window.open(github, '_blank')}
            >
              <Github className="w-5 h-5" />
              GitHub
            </Button>
          )}
          {linkedin && (
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 hover:scale-105"
              onClick={() => window.open(linkedin, '_blank')}
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </Button>
          )}
          {website && (
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 hover:scale-105"
              onClick={() => window.open(website, '_blank')}
            >
              <Globe className="w-5 h-5" />
              Website
            </Button>
          )}
        </div>
      )}

      {/* Wallet Address */}
      {walletAddress && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-2">Wallet Address</h3>
          <div className="flex items-center justify-between gap-3 bg-black/20 rounded-lg p-3">
            <code className="font-mono text-sm text-white/70 break-all">{walletAddress}</code>
            <CopyButton
              originText={walletAddress}
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}


