import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocaleStore } from '@/store/localeStore';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    city?: string;
  };
}

interface PlayerPickerProps {
  members: TeamMember[];
  assignedPlayerIds: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectPlayer: (playerId: string) => void;
  activeSlot: string | null;
  isCaptain: boolean;
}

export function PlayerPicker({
  members,
  assignedPlayerIds,
  searchQuery,
  onSearchChange,
  onSelectPlayer,
  activeSlot,
  isCaptain,
}: PlayerPickerProps) {
  const { t, i18n } = useTranslation();
  const { locale } = useLocaleStore();
  const isRTL = locale === 'ar';

  // Filter and prioritize players
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show unassigned players first, then all players
      const unassigned = members.filter(
        (m) => m.user && !assignedPlayerIds.has(m.user.id)
      );
      const assigned = members.filter(
        (m) => m.user && assignedPlayerIds.has(m.user.id)
      );
      return [...unassigned, ...assigned];
    }

    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.user &&
        (m.user.name.toLowerCase().includes(query) ||
          m.user.username.toLowerCase().includes(query))
    );
  }, [members, assignedPlayerIds, searchQuery]);

  const handlePlayerClick = (playerId: string) => {
    if (!isCaptain || !activeSlot) return;
    onSelectPlayer(playerId);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
            isRTL ? 'right-3' : 'left-3'
          )}
        />
        <Input
          placeholder={t('teams.addPlayerToSlot')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={!isCaptain || !activeSlot}
          className={cn('h-11', isRTL ? 'pr-9' : 'pl-9')}
        />
      </div>

      {/* Active Slot Indicator */}
      {activeSlot && isCaptain ? (
        <div className="rounded-lg border bg-primary/5 p-3 text-sm">
          <p className="font-medium text-primary">
            {t('teams.selectSlotFirst')} → {activeSlot}
          </p>
        </div>
      ) : !isCaptain ? (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          <p>{t('teams.onlyCaptainCanEdit')}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          <p>{t('teams.selectSlotFirst')}</p>
        </div>
      )}

      {/* Players List */}
      <div className="max-h-[400px] space-y-2 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>{t('teams.noSearchResults')}</p>
          </div>
        ) : (
          filteredPlayers.map((member) => {
            if (!member.user) return null;

            const isAssigned = assignedPlayerIds.has(member.user.id);
            const isOwner = member.role === 'OWNER' || member.role === 'CAPTAIN';
            const initials = member.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={member.user.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-colors',
                  isAssigned
                    ? 'bg-muted/50 opacity-60'
                    : isCaptain && activeSlot
                      ? 'cursor-pointer bg-card hover:bg-accent/50'
                      : 'bg-card',
                  !isCaptain && 'cursor-not-allowed opacity-60'
                )}
                onClick={() => handlePlayerClick(member.user!.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.user.name}</p>
                      {isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          {t('teams.captain')}
                        </Badge>
                      )}
                      {isAssigned && (
                        <Badge variant="outline" className="text-xs">
                          {t('teams.added')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{member.user.username}
                    </p>
                  </div>
                </div>
                {isAssigned && (
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

