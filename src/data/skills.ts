import { SkillId } from '../store/types';

export const SKILLS: { id: SkillId, name: string, effect: string, price: number }[] = [
  { id: 'one_tap', name: 'ONE TAP', effect: 'Delete one problem instantly.', price: 0.15 },
  { id: 'bounty_rush', name: 'BOUNTY RUSH', effect: 'Auto-target the richest player.', price: 0.15 },
  { id: 'no_u', name: 'NO U', effect: 'Reverse an incoming kill.', price: 0.12 },
  { id: 'smoke_out', name: 'SMOKE OUT', effect: 'Escape one attack.', price: 0.10 },
  { id: 'play_dead', name: 'PLAY DEAD', effect: 'Fake your death.', price: 0.12 },
  { id: 'miss_me', name: 'MISS ME', effect: 'Make an attacker miss.', price: 0.10 }
];
