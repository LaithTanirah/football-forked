import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { teamsApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PitchBoard, SquadSlot } from '@/components/PitchBoard';
import { PlayerPicker } from '@/components/PlayerPicker';
import { Loader2, RotateCcw } from 'lucide-react';
import { useLocaleStore } from '@/store/localeStore';
import { cn } from '@/lib/utils';
import { formations5, formations6, getFormationById, getDefaultFormation, Formation } from '@/lib/formations';

interface SquadTabProps {
  teamId: string;
  members: Array<{
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
  }>;
  captainId: string;
  currentUserId: string | null;
}

export function SquadTab({ teamId, members, captainId, currentUserId }: SquadTabProps) {
  const { t, i18n } = useTranslation();
  const { locale } = useLocaleStore();
  const isRTL = locale === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isCaptain = currentUserId === captainId;

  // Fetch squad
  const { data: squadData, isLoading } = useQuery({
    queryKey: ['team-squad', teamId],
    queryFn: () => teamsApi.getSquad(teamId),
    enabled: !!teamId,
  });

  const savedSquad = squadData?.data.data;

  // Local state
  const [mode, setMode] = useState<5 | 6>(savedSquad?.mode || 5);
  const [formationId, setFormationId] = useState<string>(
    savedSquad?.formationId || getDefaultFormation(savedSquad?.mode || 5).id
  );
  const [slots, setSlots] = useState<SquadSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current formation
  const currentFormation = useMemo(() => {
    const formation = getFormationById(formationId);
    if (!formation || formation.mode !== mode) {
      return getDefaultFormation(mode);
    }
    return formation;
  }, [formationId, mode]);

  // Available formations for current mode
  const availableFormations = useMemo(() => {
    return mode === 5 ? formations5 : formations6;
  }, [mode]);

  // Initialize slots from saved squad or defaults
  useEffect(() => {
    if (savedSquad && savedSquad.slots && savedSquad.formationId) {
      const formation = getFormationById(savedSquad.formationId);
      if (formation && formation.mode === savedSquad.mode) {
        // Map saved slots to formation slots
        const slotsWithPlayers: SquadSlot[] = formation.slots.map((formationSlot) => {
          const savedSlot = savedSquad.slots.find((s: any) => s.slotKey === formationSlot.key);
          const playerId = savedSlot?.playerId || null;
          const player = playerId
            ? members.find((m) => m.user?.id === playerId)?.user
            : undefined;

          return {
            slotKey: formationSlot.key,
            role: formationSlot.role,
            x: formationSlot.x,
            y: formationSlot.y,
            label: formationSlot.label,
            playerId,
            player: player ? { id: player.id, name: player.name, username: player.username } : undefined,
          };
        });
        setSlots(slotsWithPlayers);
        setMode(savedSquad.mode);
        setFormationId(savedSquad.formationId);
      } else {
        // Formation mismatch, use default
        initializeSlots(getDefaultFormation(savedSquad.mode || 5));
      }
    } else {
      // Initialize with empty slots
      initializeSlots(getDefaultFormation(mode));
    }
  }, [savedSquad, members]);

  const initializeSlots = (formation: Formation) => {
    setSlots(
      formation.slots.map((s) => ({
        slotKey: s.key,
        role: s.role,
        x: s.x,
        y: s.y,
        label: s.label,
        playerId: null,
      }))
    );
  };

  // Handle mode change
  const handleModeChange = (newMode: 5 | 6) => {
    if (!isCaptain) return;
    if (newMode === mode) return;

    // Remap players by role
    const newFormation = getDefaultFormation(newMode);
    remapPlayersToFormation(newFormation);
    setMode(newMode);
    setFormationId(newFormation.id);
    setActiveSlot(null);
  };

  // Handle formation change
  const handleFormationChange = (newFormationId: string) => {
    if (!isCaptain) return;
    const newFormation = getFormationById(newFormationId);
    if (!newFormation || newFormation.mode !== mode) return;

    remapPlayersToFormation(newFormation);
    setFormationId(newFormationId);
    setActiveSlot(null);
  };

  // Remap players when formation changes
  const remapPlayersToFormation = (newFormation: Formation) => {
    setSlots((prevSlots) => {
      // Group current players by role
      const playersByRole: Record<string, Array<{ slot: SquadSlot; playerId: string; player: any }>> = {
        GK: [],
        DEF: [],
        MID: [],
        ATT: [],
      };

      prevSlots.forEach((slot) => {
        if (slot.playerId && slot.player) {
          const role = slot.role;
          if (playersByRole[role]) {
            playersByRole[role].push({
              slot,
              playerId: slot.playerId,
              player: slot.player,
            });
          }
        }
      });

      // Sort by x position (left to right)
      Object.keys(playersByRole).forEach((role) => {
        playersByRole[role].sort((a, b) => a.slot.x - b.slot.x);
      });

      // Map to new formation slots
      const newSlots: SquadSlot[] = newFormation.slots.map((formationSlot) => {
        const rolePlayers = playersByRole[formationSlot.role] || [];
        const assignedPlayer = rolePlayers.shift(); // Take first available player for this role

        return {
          slotKey: formationSlot.key,
          role: formationSlot.role,
          x: formationSlot.x,
          y: formationSlot.y,
          label: formationSlot.label,
          playerId: assignedPlayer?.playerId || null,
          player: assignedPlayer?.player || undefined,
        };
      });

      return newSlots;
    });
  };

  // Get assigned player IDs
  const assignedPlayerIds = useMemo(
    () => new Set(slots.filter((s) => s.playerId).map((s) => s.playerId!)),
    [slots]
  );

  // Get bench players (team members not in squad)
  const benchPlayers = useMemo(() => {
    return members.filter(
      (m) => m.user && !assignedPlayerIds.has(m.user.id)
    );
  }, [members, assignedPlayerIds]);

  // Save squad mutation
  const saveSquadMutation = useMutation({
    mutationFn: (squadData: { mode: 5 | 6; formationId: string; slots: Array<{ slotKey: string; playerId: string | null }> }) =>
      teamsApi.updateSquad(teamId, squadData),
    onSuccess: () => {
      toast({
        title: t('teams.squadSavedSuccess'),
        description: t('teams.squadSavedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['team-squad', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('teams.squadSavedError'),
        variant: 'destructive',
      });
    },
  });

  const handleSelectSlot = (slotKey: string) => {
    if (!isCaptain) return;
    setActiveSlot(slotKey);
  };

  const handleSelectPlayer = (playerId: string) => {
    if (!isCaptain || !activeSlot) return;

    // Check if player is already assigned
    if (assignedPlayerIds.has(playerId)) {
      toast({
        title: t('teams.playerAlreadyInSquad'),
        description: t('teams.playerAlreadyInSquad'),
        variant: 'destructive',
      });
      return;
    }

    // Find player data
    const player = members.find((m) => m.user?.id === playerId)?.user;
    if (!player) return;

    // Update slot
    setSlots((prev) =>
      prev.map((s) =>
        s.slotKey === activeSlot
          ? {
              ...s,
              playerId,
              player: { id: player.id, name: player.name, username: player.username },
            }
          : s
      )
    );

    setActiveSlot(null);
    setSearchQuery('');
  };

  const handleRemovePlayer = (slotKey: string) => {
    if (!isCaptain) return;
    setSlots((prev) =>
      prev.map((s) => (s.slotKey === slotKey ? { ...s, playerId: null, player: undefined } : s))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isCaptain) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromSlotKey = active.id as string;
    const toSlotKey = over.id as string;

    setSlots((prev) => {
      const fromSlot = prev.find((s) => s.slotKey === fromSlotKey);
      const toSlot = prev.find((s) => s.slotKey === toSlotKey);

      if (!fromSlot || !toSlot || !fromSlot.playerId) return prev;

      // If both slots have players, swap them
      if (toSlot.playerId) {
        return prev.map((s) => {
          if (s.slotKey === fromSlotKey) {
            return {
              ...s,
              playerId: toSlot.playerId,
              player: toSlot.player,
            };
          }
          if (s.slotKey === toSlotKey) {
            return {
              ...s,
              playerId: fromSlot.playerId,
              player: fromSlot.player,
            };
          }
          return s;
        });
      } else {
        // Move player to empty slot
        return prev.map((s) => {
          if (s.slotKey === fromSlotKey) {
            return {
              ...s,
              playerId: null,
              player: undefined,
            };
          }
          if (s.slotKey === toSlotKey) {
            return {
              ...s,
              playerId: fromSlot.playerId,
              player: fromSlot.player,
            };
          }
          return s;
        });
      }
    });
  };

  const handleSave = () => {
    if (!isCaptain) return;

    const squadData = {
      mode,
      formationId,
      slots: slots.map((s) => ({
        slotKey: s.slotKey,
        playerId: s.playerId,
      })),
    };

    saveSquadMutation.mutate(squadData);
  };

  const handleReset = () => {
    if (!isCaptain) return;
    initializeSlots(currentFormation);
    setActiveSlot(null);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector & Formation Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teams.formation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle - Fixed with buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 5 ? 'default' : 'outline'}
              onClick={() => handleModeChange(5)}
              disabled={!isCaptain}
              className="flex-1"
            >
              {t('teams.fiveASide')}
            </Button>
            <Button
              type="button"
              variant={mode === 6 ? 'default' : 'outline'}
              onClick={() => handleModeChange(6)}
              disabled={!isCaptain}
              className="flex-1"
            >
              {t('teams.sixASide')}
            </Button>
          </div>

          {/* Formation Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('teams.selectFormation')}</label>
            <Select
              value={formationId}
              onValueChange={handleFormationChange}
              disabled={!isCaptain}
            >
              <SelectTrigger>
                <SelectValue>
                  {currentFormation.name[i18n.language as 'en' | 'ar']}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableFormations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.name[i18n.language as 'en' | 'ar']}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Pitch + Controls */}
      <div className={cn('grid gap-6', 'lg:grid-cols-2')}>
        {/* Pitch Board */}
        <Card>
          <CardContent className="pt-6">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <PitchBoard
                formation={currentFormation}
                slots={slots}
                activeSlot={activeSlot}
                isCaptain={isCaptain}
                captainId={captainId}
                onSelectSlot={handleSelectSlot}
                onRemovePlayer={handleRemovePlayer}
              />
            </DndContext>
          </CardContent>
        </Card>

        {/* Player Picker + Bench */}
        <Card>
          <CardHeader>
            <CardTitle>{t('teams.players')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PlayerPicker
              members={members}
              assignedPlayerIds={assignedPlayerIds}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectPlayer={handleSelectPlayer}
              activeSlot={activeSlot}
              isCaptain={isCaptain}
            />

            {/* Bench / Unassigned Players */}
            {benchPlayers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('teams.bench')}</h3>
                <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                  {benchPlayers.map((member) => {
                    if (!member.user) return null;
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
                          'flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent/50',
                          isCaptain && activeSlot && 'cursor-pointer',
                          !isCaptain && 'cursor-not-allowed opacity-60'
                        )}
                        onClick={() => isCaptain && activeSlot && handleSelectPlayer(member.user!.id)}
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{member.user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">@{member.user.username}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isCaptain && (
        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saveSquadMutation.isPending}>
            {saveSquadMutation.isPending ? (
              <>
                <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ml-2' : 'mr-2')} />
                {t('common.loading')}
              </>
            ) : (
              t('teams.saveSquad')
            )}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
            {t('teams.resetSquad')}
          </Button>
        </div>
      )}
    </div>
  );
}
