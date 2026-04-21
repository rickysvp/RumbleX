import { SkillId, ItemId } from '../store/types';

const ELIM_TEMPLATES = [
  "{attacker} walked up to {target} and took everything. +{mon} MON.",
  "{target} tried to hold the line. {attacker} disagreed. +{mon} MON.",
  "{attacker} found {target} alone and made it quick. +{mon} MON.",
  "{target} had a plan. {attacker} had better aim. +{mon} MON.",
  "{attacker} sent {target} home broke. +{mon} MON.",
  "{attacker} just harvested {target} for {mon} MON.",
  "Lights out for {target}. {attacker} collected the bounty: {mon} MON.",
  "{attacker} ended {target}. Clean sweep, {mon} MON secured."
];

const LOOT_TEMPLATES = [
  "{attacker} relieved {target} of {mon} MON and kept moving.",
  "{attacker} hit the pocket, not the player. {mon} MON gone.",
  "{attacker} expertly siphoned {mon} MON from {target}'s stash.",
  "{target} blinked and missed it. {attacker} is now +{mon} MON richer.",
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

const SYSTEM_TEMPLATES: Record<string, string[]> = {
  round_open: [
    "ROUND #{round} OPEN. {fee} MON TO ENTER. CLOCK IS HOT.",
    "ARENA ACCESS AUTHORIZED FOR ROUND #{round}. 1 MON ENTRY.",
    "ROUND #{round} REGISTRATION IS LIVE. GET IN OR GET LEFT.",
    "DOORS OPEN FOR ROUND #{round}. STAKES ARE SET."
  ],
  entry_countdown: [
    "{time} SECONDS REMAINING. ENTRIES ARE CLOSING.",
    "CLOCK IS TICKING. {time}s LEFT TO JOIN THE FRAY.",
    "FINAL CALL FOR ROUND #{round}. {time}s REMAIN.",
    "{time}s SCALE. DON'T BE LATE TO THE MASSACRE."
  ],
  player_join: [
    "{handle} just locked in. That makes {count} in the chamber.",
    "{handle} entered the arena. Welcome to the meat grinder.",
    "{handle} initialized. {count} players now queued.",
    "New challenger: {handle}. The pot is growing."
  ],
  round_live: [
    "ROUND #{round} LIVE. {count} PLAYERS IN. STACKS ARE REAL.",
    "COMMENCING ROUND #{round}. {count} PILOTS ACTIVE. GOOD LUCK.",
    "THE DROP IS DONE. ROUND #{round} IS HOT. {count} SURVIVORS REMAIN.",
    "LOCK AND LOAD. ROUND #{round} HAS BEGUN."
  ],
  live_status: [
    "{time}s LEFT. {count} SURVIVORS REMAIN. STAY ALERT.",
    "{count} PLAYERS STILL STANDING. {time} SECONDS TO SURVIVAL.",
    "STATUS UPDATE: {count} GHOSTS IN THE MACHINE. {time}s CLIP.",
    "HALF TIME. {count} PILOTS REMAIN. MAKE IT COUNT."
  ],
  round_timeout: [
    "TIME. ROUND #{round} CLOSED.",
    "CLOCK ZERO. CEASE FIRE.",
    "TIMEOUT. SURVIVORS, LOCK YOUR STACKS.",
    "ROUND #{round} OVER. VACATE THE PERIMETER."
  ],
  survivor_summary: [
    "SURVIVORS: {list}",
    "EXTRACTING: {list}",
    "STILL BREATHING: {list}",
    "ROUND SURVIVORS: {list}"
  ],
  top_frag: [
    "TOP FRAG: {handle} — {kills} KILLS.",
    "MOST LETHAL: {handle} WITH {kills} CONFIRMED ELIMS.",
    "BLOODIEST HANDS: {handle} ({kills} KILLS).",
    "KILL LEADER FOR ROUND #{round}: {handle}."
  ],
  biggest_stack: [
    "BIGGEST STACK: {handle} — {mon} MON.",
    "BIGGEST BAG: {handle} KEPT {mon} MON.",
    "WEALTHIEST SURVIVOR: {handle} ({mon} MON).",
    "HEAVYWEIGHT: {handle} EXITED WITH {mon} MON."
  ]
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
    if (ability === 'One Tap') template = "One Tap landed. {target} gone before they saw it coming.";
    if (ability === 'No U') template = "No U reversed the hit. {attacker} is now the problem.";
    
    return template
      .replace('{attacker}', attacker)
      .replace('{target}', target || 'someone')
      .replace('{ability}', ability)
      .replace('{result}', result);
  },

  generateSystem(type: string, params: Record<string, any>): string {
    const templates = SYSTEM_TEMPLATES[type];
    if (!templates) return `[SYSTEM]: ${type}`;
    
    let template = templates[Math.floor(Math.random() * templates.length)];
    Object.keys(params).forEach(key => {
      template = template.replaceAll(`{${key}}`, params[key]);
    });
    return template;
  }
};
