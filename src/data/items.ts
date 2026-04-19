import { ItemId } from '../store/types';

export const ITEMS: { id: ItemId, name: string, effect: string, price: number }[] = [
  { id: 'uno_reverse', name: 'UNO REVERSE', effect: 'Dump the problem on someone else.', price: 0.10 },
  { id: 'back_off_horn', name: 'BACK OFF HORN', effect: 'Push nearby players away.', price: 0.08 },
  { id: 'act_natural', name: 'ACT NATURAL', effect: 'Bait into a counter-kill.', price: 0.10 },
  { id: 'slip_card', name: 'SLIP CARD', effect: 'Turn a fumble into a win.', price: 0.08 },
  { id: 'decoy_dummy', name: 'DECOY DUMMY', effect: 'Fake body absorbs one kill.', price: 0.10 },
  { id: 'drama_bomb', name: 'DRAMA BOMB', effect: 'Force others to fight each other.', price: 0.12 }
];
