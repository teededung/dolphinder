import { Github, Linkedin, Globe, Copy } from 'lucide-react';
import { Button } from '../ui/button';

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
}: ProfileCardProps) {
  return (
    <div className="space-y-3">
      {/* Badges */}
      <div className="flex justify-center gap-2">
        {variant === 'onchain' ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-sm text-sky-300">
              <img src="/sui-sui-logo.svg" alt="Sui" className="h-4 w-4" />
              On-chain
            </span>
            {isVerified === true && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-7 9.5a.75.75 0 01-1.127.075l-3.5-3.5a.75.75 0 011.06-1.06l2.894 2.893 6.48-8.788a.75.75 0 011.05-.172z" clipRule="evenodd" /></svg>
                Verified
              </span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-sm text-orange-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3.5 4.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5Zm2 1V14h9V5.5h-9Z"/></svg>
            Off-chain
          </span>
        )}
      </div>

      {/* Avatar */}
      {avatar && (
        <div className="flex justify-center">
          <img
            src={avatar}
            alt={name || username || 'avatar'}
            className="h-40 w-40 rounded-full object-cover border-4 border-white/20 shadow"
          />
        </div>
      )}

      {/* Not verified alert for onchain */}
      {variant === 'onchain' && isVerified === false && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-200">
          On-chain profile found, but the profile is not verified.
        </div>
      )}

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
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
            <code className="font-mono text-sm text-white/70 break-all">{walletAddress}</code>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-3"
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4 text-white/60" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


