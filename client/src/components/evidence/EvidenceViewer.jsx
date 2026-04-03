import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Music, AlertCircle } from 'lucide-react';
import { listEvidenceChunks, getEvidenceChunkStreamUrl } from '@/api/evidence.api';
import { Skeleton } from '@/components/ui';
import { useSocketStore } from '@/store/socketStore';

/**
 * EvidenceViewer — shows available audio chunks for a given SOS event.
 * Renders an <audio> player for each chunk streaming directly from the backend.
 *
 * @param {{ sosEventId: string, accessDenied?: boolean }} props
 */
const EvidenceViewer = ({ sosEventId, accessDenied = false }) => {
  const queryClient = useQueryClient();
  const { socket } = useSocketStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['evidence', sosEventId],
    queryFn:  () => listEvidenceChunks(sosEventId),
    enabled:  !!sosEventId && !accessDenied,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  useEffect(() => {
    if (!socket || !sosEventId) return;

    const handleNewChunk = (payload) => {
      if (payload.sosEventId === sosEventId) {
        queryClient.invalidateQueries({ queryKey: ['evidence', sosEventId] });
      }
    };

    socket.on('evidence:new-chunk', handleNewChunk);
    return () => {
      socket.off('evidence:new-chunk', handleNewChunk);
    };
  }, [socket, sosEventId, queryClient]);

  if (accessDenied) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Lock className="w-5 h-5 text-slate-400 shrink-0" />
        <p className="text-sm text-slate-500">
          Only guardians and admins can access evidence recordings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Could not load recordings for this event.</span>
      </div>
    );
  }

  const recordings = data?.recordings ?? [];

  if (recordings.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic py-2">
        No recordings available for this event.
      </p>
    );
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeRange = (chunkIndex, durationSecs = 30) => {
    const start = chunkIndex * durationSecs;
    const end   = start + durationSecs;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    return `${fmt(start)} – ${fmt(end)}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {recordings.map((rec) => (
        <div
          key={rec.id}
          className="flex flex-col gap-1.5 px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-[#E53E6D]" />
              <span className="text-xs font-semibold text-slate-700">
                Chunk {rec.chunk_index + 1}
              </span>
              <span className="text-xs text-slate-400">
                {formatTimeRange(rec.chunk_index, rec.duration_secs)}
              </span>
            </div>
            {rec.file_size && (
              <span className="text-[10px] text-slate-400">{formatBytes(rec.file_size)}</span>
            )}
          </div>
          <audio
            controls
            preload="none"
            className="w-full h-8 accent-[#E53E6D]"
            src={getEvidenceChunkStreamUrl(sosEventId, rec.id)}
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      ))}
    </div>
  );
};

export default EvidenceViewer;
