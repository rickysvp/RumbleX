import { Player, FeedEvent } from '../store/types';
import { useGameStore } from '../store/gameStore';
import { skillEngine } from './skillEngine';
import { itemEngine } from './itemEngine';
import { narrativeEngine } from './narrativeEngine';

export const simulationEngine = {
  generateCombatEvent: () => {
    const state = useGameStore.getState();
    const { players, playerEliminated, addFeedEvent } = state;

    const alivePlayers = players.filter(p => p.status === 'alive');
    if (alivePlayers.length < 2) return;

    // 1. Pick Attacker
    const attackerOptions = alivePlayers.map(p => ({
        player: p,
        weight: p.strategy === 'go_loud' ? 1.3 : (p.strategy === 'lay_low' ? 0.6 : 1.0)
    }));
    const totalWeight = attackerOptions.reduce((acc, o) => acc + o.weight, 0);
    let r = Math.random() * totalWeight;
    let attacker: Player = alivePlayers[0];
    for (const opt of attackerOptions) {
        r -= opt.weight;
        if (r <= 0) { attacker = opt.player; break; }
    }

    // 2. Chaos Mode check
    if (attacker.strategy === 'chaos_mode' && Math.random() < 0.2) {
        simulationEngine.handleChaosEvent(alivePlayers, addFeedEvent);
        return;
    }

    // 3. Resolve Items (can redirect or trigger multi-kills)
    let targetId: string | null = null;
    let killCreditId: string = attacker.id;
    let skillToCredit: SkillId | null = attacker.skill;
    let itemToCredit: ItemId | null = attacker.item;

    if (attacker.item === 'drama_bomb') {
      // Drama Bomb logic: kills 1-3 random players?
      const count = Math.floor(Math.random() * 3) + 1;
      const victims = [...alivePlayers]
        .filter(p => p.id !== attacker.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, count);

      victims.forEach(v => {
        playerEliminated(attacker.id, v.id, v.mon * 0.9, null, 'drama_bomb');
      });
      return;
    }

    // Standard Combat flow
    const targets = alivePlayers.filter(p => p.id !== attacker.id);
    let target = targets[Math.floor(Math.random() * targets.length)];

    // Resolve Counter-Items first (Act Natural, Uno Reverse)
    if (target.item === 'act_natural' && Math.random() < 0.4) {
      // Countered! Target gets the kill on attacker
      playerEliminated(target.id, attacker.id, attacker.mon * 0.9, null, 'act_natural');
      return;
    }

    // Resolve Skill
    const skillRes = skillEngine.resolveSkill(attacker.skill, attacker, target, players);
    if (skillRes.success && skillRes.modifiedTarget) {
        target = skillRes.modifiedTarget;
    }

    // Check for No U (Reversal) - 30% chance if target has skill
    if (target.skill === 'no_u' && Math.random() < 0.3) {
      playerEliminated(target.id, attacker.id, attacker.mon * 0.9, 'no_u', null);
      return;
    }

    // Resolve Item
    const itemRes = itemEngine.resolveItem(attacker.item, attacker, target, players);
    if (itemRes.success && itemRes.redirectTarget) {
        target = itemRes.redirectTarget;
    }

    // 4. Outcome Resolution
    let successChance = 0.5;
    if (attacker.skill === 'one_tap') successChance = 1.0;
    
    if (Math.random() < successChance) {
        playerEliminated(killCreditId, target.id, target.mon * 0.9, skillToCredit, itemToCredit);
    } else {
        addFeedEvent({
            timestamp: 600 - state.timeRemaining,
            type: 'ability',
            text: `${attacker.handle} targeted ${target.handle} but missed the opportunity.`,
            attacker: attacker.handle,
            target: target.handle,
            monAmount: 0,
            skillUsed: attacker.skill,
            itemUsed: attacker.item
        });
    }
  },

  handleChaosEvent: (alivePlayers: Player[], addFeedEvent: any) => {
    const eventType = Math.random() < 0.5 ? 'redistribution' : 'loot_drop';
    
    if (eventType === 'redistribution') {
      const victim = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const amount = victim.mon * 0.1;
      // In a real impl, we'd distribute this, for MVP just system feed
      addFeedEvent({
        timestamp: 0,
        type: 'system',
        text: `CHAOS: MON REDISTRIBUTION triggered. ${victim.handle} lost ${amount.toFixed(1)} MON.`,
        attacker: null,
        target: victim.handle,
        monAmount: amount,
        skillUsed: null,
        itemUsed: null
      });
    } else {
      addFeedEvent({
        timestamp: 0,
        type: 'system',
        text: `CHAOS: EXTRA LOOT DROP! Prize pool increased.`,
        attacker: null,
        target: null,
        monAmount: 0.5,
        skillUsed: null,
        itemUsed: null
      });
    }
  }
};
