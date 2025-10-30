import { Github, Linkedin, Globe, Database, Check, Send, Briefcase, Award, ExternalLink, Star } from 'lucide-react';
import { Button } from '../ui/button';
import CopyButton from './CopyButton';
import EditButton from './profile/EditButton';
import { ProfileAvatar } from './ProfileAvatar';
import WalrusBadge from './WalrusBadge';
import type { Project } from '../../types/project';

type Certificate = {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
};

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
          hasWalrus={variant === 'onchain'}
          className="border-4 border-white/20 shadow"
          size={160}
        />
      </div>

      {/* Name + username */}
      {name && <div className="text-2xl font-semibold">{name}</div>}
      {username && <p className="text-xl text-white/60">@{username}</p>}
      
      {/* Level/Role Badge */}
      {entry && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1 text-sm text-blue-300">
            <Briefcase className="h-3.5 w-3.5" />
            {entry}
          </span>
        </div>
      )}
      
      {bio && <p className="text-white/70 mb-8 leading-relaxed">{bio}</p>}

      {/* Social Links */}
      {(github || linkedin || telegram || website) && (
        <div className="flex justify-center flex-wrap gap-2 mb-8">
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
          {telegram && (
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 hover:scale-105"
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
              className="bg-white/10 hover:bg-white/20 hover:scale-105"
              onClick={() => window.open(website, '_blank')}
            >
              <Globe className="w-5 h-5" />
              Website
            </Button>
          )}
        </div>
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-3">
            <Briefcase className="h-4 w-4" />
            Projects ({projects.length})
          </h3>
          <div className="space-y-3">
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
              
              // Use images array
              const allImages = images || [];

              return (
                <div 
                  key={isNewFormat && 'id' in project ? project.id : index} 
                  className={`bg-black/20 rounded-lg p-3 border ${
                    featured ? 'border-yellow-400/50' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{projectName}</h4>
                        {featured && (
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        )}
                        {status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === 'active' ? 'bg-green-500/20 text-green-300' :
                            status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {status}
                          </span>
                        )}
                      </div>
                      {projectDescription && (
                        <p className="text-sm text-white/60 mt-1">{projectDescription}</p>
                      )}
                      
                      {/* Project Images */}
                      {allImages.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {allImages.map((img: any, imgIdx: number) => {
                            // Support both old format (string) and new format (ProjectImage)
                            let imgSrc = '';
                            let hasQuiltPatch = false;
                            
                            if (typeof img === 'string') {
                              // Old format: direct path string
                              imgSrc = img;
                            } else {
                              // New format: ProjectImage with filename
                              hasQuiltPatch = !!img.quiltPatchId;
                              
                              // Reconstruct path from filename
                              if (img.filename) {
                                imgSrc = `/projects/${img.filename}`;
                              } else if (img.localPath) {
                                // Backward compatibility with old localPath field
                                imgSrc = img.localPath;
                              }
                            }
                            
                            // Skip rendering if no valid image source
                            if (!imgSrc) {
                              // Show placeholder for quilt-backed images without filename
                              if (hasQuiltPatch) {
                                return (
                                  <div key={imgIdx} className="relative">
                                    <div className="h-16 w-16 flex items-center justify-center rounded-md border border-white/10 bg-white/5">
                                      <span className="text-xs text-white/40">
                                        {img.metadata?.format?.toUpperCase() || 'IMG'}
                                      </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 text-white text-[8px] text-center py-0.5 rounded-b-md">
                                      Walrus
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }
                            
                            return (
                              <div key={imgIdx} className="relative">
                                <img
                                  src={imgSrc}
                                  alt={`${projectName} - Image ${imgIdx + 1}`}
                                  className="h-16 w-16 object-cover rounded-md border border-white/10"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                {hasQuiltPatch && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 text-white text-[8px] text-center py-0.5 rounded-b-md">
                                    Walrus
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tags.map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="inline-block rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {(repoUrl || demoUrl || url) && (
                        <div className="flex gap-2 mt-2">
                          {repoUrl && (
                            <a
                              href={repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Repo
                            </a>
                          )}
                          {demoUrl && (
                            <a
                              href={demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Demo
                            </a>
                          )}
                          {!repoUrl && !demoUrl && url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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


