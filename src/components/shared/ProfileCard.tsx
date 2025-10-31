import { Github, Linkedin, Globe, Database, Check, Send, Briefcase, Award, ExternalLink, Star, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';
import CopyButton from './CopyButton';
import EditButton from './profile/EditButton';
import { ProfileAvatar } from './ProfileAvatar';
import WalrusBadge from './WalrusBadge';
import ProjectImageGrid from './ProjectImageGrid';
import LightboxDialog from './LightboxDialog';
import type { Project } from '../../types/project';
import type { Certificate } from '../../types/certificate';
import { QRCodeSVG } from 'qrcode.react';

type ProfileCardProps = {
  variant: 'onchain' | 'offchain';
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  entry?: string; // Level/Role
  github?: string;
  linkedin?: string;
  telegram?: string;
  website?: string;
  walletAddress?: string;
  isVerified?: boolean;
  projects?: Project[];
  certificates?: Certificate[];
  showEditButton?: boolean;
  isOwner?: boolean;
};

export default function ProfileCard({
  variant,
  name,
  username,
  avatar,
  bio,
  entry,
  github,
  linkedin,
  telegram,
  website,
  walletAddress,
  isVerified,
  projects,
  certificates,
  showEditButton,
  isOwner,
}: ProfileCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showWalletQR, setShowWalletQR] = useState(false);

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };
  return (
    <div className="relative space-y-6">
      {/* Top Right Corner - Edit Button and Badges */}
      <div className="absolute top-0 right-0 z-10 flex items-start gap-2">
        {/* Walrus Badge */}
        {(variant === 'onchain' || (variant === 'offchain' && isOwner)) && (
          <>
            {variant === 'onchain' && <WalrusBadge variant="onchain" size="md" />}
            {variant === 'offchain' && isOwner && <WalrusBadge variant="offchain" size="md" />}
          </>
        )}
        {/* Edit Button */}
        {showEditButton && <EditButton />}
      </div>

      {/* Main Profile Section - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column - Avatar */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-4">
          <ProfileAvatar
            src={avatar}
            name={name || username || 'User'}
            username={username}
            hasWalrus={variant === 'onchain'}
            className="border-4 border-white/20 shadow-2xl"
            size={200}
          />

          {/* Verified Badge below avatar */}
          {variant === 'onchain' && isVerified === true && (
            <div className="w-full max-w-[200px]">
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300 w-full">
                <Check className="h-4 w-4" />
                Verified
              </span>
            </div>
          )}

          {/* Wallet Address - Compact Card */}
          {walletAddress && (
            <div className="relative w-full max-w-[200px]">
              <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-none"
                  onClick={() => setShowWalletQR(!showWalletQR)}
                  title="Click to view QR code"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src="/sui-logo.svg" 
                      alt="Sui wallet" 
                      className="h-4 w-4 shrink-0 object-contain"
                    />
                    <span className="text-xs font-mono text-white/70 truncate">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                  {showWalletQR ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/60 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/60 shrink-0" />
                  )}
                </Button>
              </div>
              
              {/* Absolute Dropdown for QR Code */}
              {showWalletQR && (
                <div className="w-64 bg-black/50 absolute top-full left-0 right-0 mt-2 rounded-lg border border-white/20 shadow-2xl shadow-black/50 p-4 space-y-3 z-20 animate-slideDown">
                  {/* QR Code */}
                  <div className="flex justify-center bg-white p-3 rounded-lg">
                    <QRCodeSVG
                      value={walletAddress}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  {/* Wallet Address Text with Copy */}
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                    <code className="font-mono text-xs text-white/90 break-all flex-1">{walletAddress}</code>
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
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="lg:col-span-8 space-y-6 text-left">
          {/* Name + username */}
          <div className="space-y-2">
            {name && <h1 className="text-4xl lg:text-5xl font-bold text-white">{name}</h1>}
            <div className="flex items-center gap-3 flex-wrap">
              {username && <p className="text-xl text-white/60">@{username}</p>}
              {/* Level/Role Badge */}
              {entry && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1.5 text-sm text-blue-300">
                  <Briefcase className="h-3.5 w-3.5" />
                  {entry}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-white/80 text-lg leading-relaxed max-w-3xl">{bio}</p>
          )}

          {/* Social Links */}
          {(github || linkedin || telegram || website) && (
            <div className="flex flex-wrap gap-3">
              {github && (
                <Button
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 transition-all"
                  onClick={() => window.open(github, '_blank')}
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </Button>
              )}
              {linkedin && (
                <Button
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 transition-all"
                  onClick={() => window.open(linkedin, '_blank')}
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </Button>
              )}
              {telegram && (
                <Button
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 transition-all"
                  onClick={() => window.open(
                    telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace(/^@/, '')}`,
                    '_blank'
                  )}
                >
                  <Send className="w-5 h-5" />
                  Telegram
                </Button>
              )}
              {website && (
                <Button
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 transition-all"
                  onClick={() => window.open(website, '_blank')}
                >
                  <Globe className="w-5 h-5" />
                  Website
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
            <Briefcase className="h-4 w-4" />
            Projects ({projects.length})
          </h3>
          <div className="space-y-4">
            {projects.map((project, index) => {
              // Handle both old format (simple object) and new format (Project type)
              const isNewFormat = 'id' in project || 'tags' in project || 'status' in project;
              const projectName = project.name || '';
              const projectDescription = project.description || '';
              const repoUrl = isNewFormat ? (project as Project).repoUrl : undefined;
              const demoUrl = isNewFormat ? (project as Project).demoUrl : undefined;
              const images = isNewFormat ? ((project as Project).images || []) : [];
              const tags = isNewFormat ? (project as Project).tags : (project as any).technologies || [];
              const status = isNewFormat ? (project as Project).status : undefined;
              const featured = isNewFormat ? (project as Project).featured : false;
              const url = !isNewFormat ? (project as any).url : undefined;
              
              // Use images array (max 5 images)
              const allImages = (images || []).slice(0, 5);

              return (
                <div 
                  key={isNewFormat && 'id' in project ? project.id : index} 
                  className={`bg-black/20 rounded-lg p-4 border transition-all ${
                    featured ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/10' : 'border-white/5'
                  }`}
                >
                  {/* Header: Title, badges, and action buttons */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h4 className="font-semibold text-white truncate">{projectName}</h4>
                      {featured && (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
                      )}
                      {status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          status === 'active' ? 'bg-green-500/20 text-green-300' :
                          status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {status}
                        </span>
                      )}
                    </div>
                    {(repoUrl || demoUrl || url) && (
                      <div className="flex gap-1.5 shrink-0">
                        {repoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white"
                            onClick={() => window.open(repoUrl, '_blank')}
                            title="View Repository"
                          >
                            <Github className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {demoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white"
                            onClick={() => window.open(demoUrl, '_blank')}
                            title="View Demo"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!repoUrl && !demoUrl && url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white"
                            onClick={() => window.open(url!, '_blank')}
                            title="View Project"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {projectDescription && (
                    <p className="text-sm text-white/70 mb-3 leading-relaxed">{projectDescription}</p>
                  )}
                  
                  {/* Images Gallery - Unified Grid Layout */}
                  {allImages.length > 0 && (
                    <div className="mb-3">
                      <ProjectImageGrid
                        images={allImages}
                        projectName={projectName}
                        onImageClick={openLightbox}
                        getImageUrl={(img) => 
                          typeof img === 'string' 
                            ? img 
                            : (img.filename ? `/projects/${img.filename}` : null)
                        }
                        maxImages={5}
                        variant="default"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag: string, tagIndex: number) => (
                        <span
                          key={tagIndex}
                          className="inline-block rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-300 border border-blue-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificates Section */}
      {certificates && certificates.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-3">
            <Award className="h-4 w-4" />
            Certificates ({certificates.length})
          </h3>
          <div className="space-y-3">
            {certificates.map((cert, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 border border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{cert.name}</h4>
                    {cert.issuer && (
                      <p className="text-sm text-white/60 mt-0.5">{cert.issuer}</p>
                    )}
                    {cert.date && (
                      <p className="text-xs text-white/40 mt-0.5">{cert.date}</p>
                    )}
                  </div>
                  {cert.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-7 px-2 text-xs"
                      onClick={() => window.open(cert.url, '_blank')}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Dialog */}
      <LightboxDialog
        isOpen={lightboxOpen}
        imageSrc={lightboxSrc}
        onClose={() => setLightboxOpen(false)}
        altText="Project image preview"
      />
    </div>
  );
}


