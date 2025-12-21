import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { User, Crown, X, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Formation } from '@/lib/formations';

export interface SquadSlot {
  slotKey: string;
  role: 'GK' | 'DEF' | 'MID' | 'ATT';
  x: number;
  y: number;
  label: { en: string; ar: string };
  playerId: string | null;
  player?: {
    id: string;
    name: string;
    username?: string;
  };
}

interface PitchBoardProps {
  formation: Formation;
  slots: SquadSlot[];
  activeSlot: string | null;
  isCaptain: boolean;
  captainId?: string;
  onSelectSlot: (slotKey: string) => void;
  onRemovePlayer: (slotKey: string) => void;
  onSwap?: (fromSlot: string, toSlot: string) => void;
}

interface PlayerChipProps {
  slot: SquadSlot;
  isActive: boolean;
  isCaptain: boolean;
  captainId?: string;
  isDragging?: boolean;
  onRemove: () => void;
  onSelect: () => void;
}

function EmptySlot({ slotKey, isActive, isCaptain, onSelect, x, y }: { slotKey: string; isActive: boolean; isCaptain: boolean; onSelect: () => void; x: number; y: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotKey,
    disabled: !isCaptain,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 transition-all',
        isActive && 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2',
        isOver && 'border-primary bg-primary/20',
        isCaptain && 'cursor-pointer hover:bg-muted/50',
        !isCaptain && 'opacity-60'
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={isCaptain ? onSelect : undefined}
    >
      <User className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

function PlayerChip({ slot, isActive, isCaptain, captainId, isDragging, onRemove, onSelect }: PlayerChipProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isRTL = locale === 'ar';

  if (!slot.playerId || !slot.player) {
    return (
      <EmptySlot
        slotKey={slot.slotKey}
        isActive={isActive}
        isCaptain={isCaptain}
        onSelect={onSelect}
        x={slot.x}
        y={slot.y}
      />
    );
  }

  const isTeamCaptain = captainId && slot.player?.id === captainId;
  const initials = slot.player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'group absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 bg-card shadow-sm transition-all',
        isActive && 'border-primary ring-2 ring-primary ring-offset-2',
        isDragging && 'opacity-50',
        isCaptain && 'cursor-grab hover:shadow-md active:cursor-grabbing'
      )}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={isCaptain ? onSelect : undefined}
    >
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
          {initials}
        </div>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
        <p className="max-w-[80px] truncate text-[10px] font-medium text-foreground">
          {slot.player.name}
        </p>
      </div>
      {isTeamCaptain && (
        <Badge
          variant="secondary"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0"
        >
          <Crown className="h-3 w-3" />
        </Badge>
      )}
      {isCaptain && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function SortablePlayerChip(props: PlayerChipProps & { id: string; captainId?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    disabled: !props.isCaptain || !props.slot.playerId, // Only draggable if has player and is captain
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerChip {...props} captainId={props.captainId} isDragging={isDragging} />
    </div>
  );
}

export function PitchBoard({
  formation,
  slots,
  activeSlot,
  isCaptain,
  captainId,
  onSelectSlot,
  onRemovePlayer,
}: PitchBoardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isRTL = locale === 'ar';

  return (
    <div className="relative w-full">
      {/* Pitch Background */}
      <div className="relative rounded-2xl border-2 bg-gradient-to-b from-green-500/10 via-green-400/5 to-green-500/10 p-6 shadow-lg dark:from-green-600/20 dark:via-green-500/10 dark:to-green-600/20">
        {/* Center Circle */}
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-400/30" />

        {/* Penalty Areas */}
        <div className="absolute bottom-4 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-t-full border-2 border-green-400/30" />
        <div className="absolute top-4 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-b-full border-2 border-green-400/30" />

        {/* Formation Layout - Absolute positioning */}
        <div className="relative h-[400px] w-full">
          {slots.map((slot) => {
            if (slot.playerId) {
              return (
                <SortablePlayerChip
                  key={slot.slotKey}
                  id={slot.slotKey}
                  slot={slot}
                  isActive={activeSlot === slot.slotKey}
                  isCaptain={isCaptain}
                  captainId={captainId}
                  onSelect={() => onSelectSlot(slot.slotKey)}
                  onRemove={() => onRemovePlayer(slot.slotKey)}
                />
              );
            } else {
              return (
                <EmptySlot
                  key={slot.slotKey}
                  slotKey={slot.slotKey}
                  isActive={activeSlot === slot.slotKey}
                  isCaptain={isCaptain}
                  onSelect={() => onSelectSlot(slot.slotKey)}
                  x={slot.x}
                  y={slot.y}
                />
              );
            }
          })}
        </div>
      </div>

      {/* Lock indicator for non-captains */}
      {!isCaptain && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>{t('teams.onlyCaptainCanEdit')}</span>
        </div>
      )}
    </div>
  );
}
