import { useState } from 'react';
import { StrategyId, SkillId, ItemId } from '../store/types';
import { SKILLS } from '../data/skills';
import { ITEMS } from '../data/items';
import { useGameStore } from '../store/gameStore';

export function useLoadout() {
  const entryFee = useGameStore(state => state.entryFee);
  
  const [rounds, setRounds] = useState<number>(1);
  const [strategy, setStrategy] = useState<StrategyId>('go_loud');
  const [skill, setSkill] = useState<SkillId | null>(null);
  const [item, setItem] = useState<ItemId | null>(null);

  const skillPrice = skill ? SKILLS.find(s => s.id === skill)?.price || 0 : 0;
  const itemPrice = item ? ITEMS.find(i => i.id === item)?.price || 0 : 0;
  
  const entryFeePerRound = entryFee;
  const totalCost = (entryFeePerRound + skillPrice + itemPrice) * rounds;
  
  const startingMON = 1.0; // Base MON when entering

  const setRoundsValid = (val: number) => {
    let r = val;
    if (r < 1) r = 1;
    if (r > 50) r = 50;
    setRounds(r);
  };

  return {
    rounds,
    setRounds: setRoundsValid,
    strategy,
    setStrategy,
    skill,
    setSkill,
    item,
    setItem,
    totalCost,
    skillPrice,
    itemPrice,
    entryFeePerRound,
    startingMON,
    config: { rounds, strategy, skill, item }
  };
}
