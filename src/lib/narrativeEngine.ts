import { SkillId, ItemId } from '../store/types';

const ELIM_TEMPLATES = [
  "{attacker} walked up to {target} and took everything. +{mon} MON.",
  "{target} tried to hold the line. {attacker} disagreed. +{mon} MON.",
  "{attacker} found {target} alone and made it quick. +{mon} MON.",
  "{target} had a plan. {attacker} had better aim. +{mon} MON.",
  "{attacker} sent {target} home broke. +{mon} MON."
];

const LOOT_TEMPLATES = [
  "{attacker} relieved {target} of {mon} MON and kept moving.",
  "{attacker} hit the pocket, not the player. {mon} MON gone.",
  "{attacker} expertly siphoned {mon} MON from {target}'s stash.",
  "{target} blink and missed it. {attacker} is now +{mon} MON richer.",
  "A quick skirmish left {target} with {mon} MON less and {attacker} grinning."
];

const ABILITY_TEMPLATES = [
  "{attacker} activated {ability}. {result}.",
  "One Tap landed. {target} gone before they saw it coming.",
  "No U reversed the hit. {attacker} is now the problem.",
  "{attacker} faded into the shadows with Smoke Out.",
  "{target} thought they had a kill, but {attacker} is just Playing Dead.",
  "Miss Me! {attacker} danced around the incoming fire."
];

const SYSTEM_TEMPLATES = {
  round_live: "ROUND #{round} IS LIVE. {count} PLAYERS ENTERED.",
  round_concluded: "ROUND #{round} CONCLUDED. CHAMPION: {champion} +{mon} MON",
  round_open: "ROUND #{round} OPEN. ENTRY: {fee} MON.",
  remaining: "{count} PLAYERS REMAINING.",
  kill_leader: "KILL LEADER: {handle} — {mon} MON"
};

export const narrativeEngine = {
  generateElim(attacker: string, target: string, mon: number): string {
    const template = ELIM_TEMPLATES[Math.floor(Math.random() * ELIM_TEMPLATES.length)];
    return template
      .replace('{attacker}', attacker)
      .replace('{target}', target)
      .replace('{mon}', mon.toFixed(1));
  },

  generateLoot(attacker: string, target: string, mon: number): string {
    const template = LOOT_TEMPLATES[Math.floor(Math.random() * LOOT_TEMPLATES.length)];
    return template
      .replace('{attacker}', attacker)
      .replace('{target}', target)
      .replace('{mon}', mon.toFixed(1));
  },

  generateAbility(attacker: string, ability: string, result: string, target?: string): string {
    let template = ABILITY_TEMPLATES[Math.floor(Math.random() * ABILITY_TEMPLATES.length)];
    // Simple logic to match template to ability if it's specific
    if (ability === 'One Tap') template = "One Tap landed. {target} gone before they saw it coming.";
    if (ability === 'No U') template = "No U reversed the hit. {attacker} is now the problem.";
    
    return template
      .replace('{attacker}', attacker)
      .replace('{target}', target || 'someone')
      .replace('{ability}', ability)
      .replace('{result}', result);
  },

  generateSystem(type: keyof typeof SYSTEM_TEMPLATES, params: Record<string, any>): string {
    let template = SYSTEM_TEMPLATES[type] as string;
    Object.keys(params).forEach(key => {
      template = template.replace(`{${key}}`, params[key]);
    });
    return template;
  }
};
