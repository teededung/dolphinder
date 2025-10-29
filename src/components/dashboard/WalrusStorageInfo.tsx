import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Download, GitCompare } from 'lucide-react';
import type { WalrusBlobMetadata } from '../../lib/walrus-metadata';
import { getSuiscanObjectUrl, getWalrusAggregatorUrl } from '../../lib/blockchain-utils';
import type { Developer } from '../../lib/auth';
import CompareWalrusModal from './CompareWalrusModal';

interface WalrusStorageInfoProps {
  blobMetadata: WalrusBlobMetadata;
  devId: string;
  walrusBlobId: string;
  blobObjectId: string;
  developer: Developer;
}

export default function WalrusStorageInfo({
  blobMetadata,
  devId,
  walrusBlobId,
  blobObjectId,
  developer,
}: WalrusStorageInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const storageDuration = blobMetadata.storage
    ? blobMetadata.storage.end_epoch - blobMetadata.storage.start_epoch
    : 0;

  return (
    <div className="border-t border-white/10 pt-4">
      {/* Collapsible Storage Info */}
      {blobMetadata?.storage && (
        <div className="mb-3 overflow-hidden rounded-lg border border-emerald-400/20 bg-emerald-500/5">
          {/* Header - Always visible */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full cursor-pointer items-center justify-between p-3 text-left transition-colors hover:bg-emerald-500/10"
          >
            <div className="flex items-center gap-2">
              <img
                src="/walrus-token.svg"
                alt="Walrus"
                className="h-4 w-4"
              />
              <span className="text-xs font-semibold text-emerald-300">
                Storage Info
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400">
                ✓ Active
              </span>
              {isOpen ? (
                <ChevronUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-emerald-400" />
              )}
            </div>
          </button>

          {/* Collapsible Content */}
          {isOpen && (
            <div className="border-t border-emerald-400/10 p-3 pt-2">
              <div className="space-y-1.5 text-[11px] text-white/70">
                {blobMetadata.registered_epoch && (
                  <div className="flex justify-between">
                    <span>Registered:</span>
                    <span className="font-mono text-white/90">
                      Epoch {blobMetadata.registered_epoch}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Storage Period:</span>
                  <span className="font-mono text-white/90">
                    Epoch {blobMetadata.storage.start_epoch} → {blobMetadata.storage.end_epoch}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-white/90">
                    {storageDuration} epochs (~{storageDuration} days)
                  </span>
                </div>
                {blobMetadata.storage.storage_size && (
                  <div className="flex justify-between">
                    <span>Storage Size:</span>
                    <span className="font-mono text-white/90">
                      {Math.round(blobMetadata.storage.storage_size / 1024)} KB
                    </span>
                  </div>
                )}

                {/* Compare Button */}
                <div className="mt-3 border-t border-emerald-400/10 pt-3">
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    Compare to Walrus Onchain
                  </button>
                </div>

                {/* External Links */}
                <div className="mt-3 space-y-1.5 border-t border-emerald-400/10 pt-2">
                  <div className="group flex items-center justify-between">
                    <span className="text-white/60">Dev Profile:</span>
                    <a
                      href={getSuiscanObjectUrl(devId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <span>Suiscan</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {blobObjectId && (
                    <div className="group flex items-center justify-between">
                      <span className="text-white/60">Blob Storage:</span>
                      <a
                        href={getSuiscanObjectUrl(blobObjectId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                      >
                        <span>Suiscan</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}

                  <div className="group flex items-center justify-between">
                    <span className="text-white/60">Blob Data:</span>
                    <a
                      href={getWalrusAggregatorUrl(walrusBlobId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <span>Download</span>
                      <Download className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show message if epoch info unavailable */}
      {!blobMetadata?.storage && (
        <div className="mb-3 rounded-md bg-gray-500/10 p-3 text-xs text-gray-400">
          <p>⏳ Storage info unavailable</p>
          <p className="mt-1 text-[10px]">
            Re-push your profile to update storage metadata.
          </p>
        </div>
      )}

      {/* Compare Modal */}
      <CompareWalrusModal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        walrusBlobId={walrusBlobId}
        blobObjectId={blobObjectId}
        developer={developer}
      />
    </div>
  );
}

