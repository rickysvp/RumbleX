import { generateMockPlayers } from './mockPlayers';
import { Player, FeedEvent } from '../store/types';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `[${m}:${s}]`;
}

function chunkText(text: string, maxLength: number): string[] {
    const lines = [];
    let currentLine = "";
    
    text.split(" ").forEach(word => {
        if ((currentLine + word).length > maxLength) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine += word + " ";
        }
    });
    if (currentLine.trim()) {
        lines.push(currentLine.trim());
    }
    return lines;
}

export function runSimulation() {
    const players: Player[] = generateMockPlayers(10, true).map(p => ({
        ...p,
        mon: 1.0,
        status: 'alive' as const,
        kills: 0,
        isUser: p.handle === 'PILOT_01'
    }));

    console.log(`\nStarting RumbleX Simulation (v2 Engine)...\n`);
    console.log(`Players: ${players.length}`);
    console.log(`═══════════════════════════════════\n`);

    let currentTime = 600;
    let eventIndex = 0;

    while (players.filter(p => p.status === 'alive').length > 1 && currentTime > 0) {
        const step = Math.floor(Math.random() * 15) + 5;
        currentTime -= step;
        
        const alive = players.filter(p => p.status === 'alive');
        if (alive.length <= 1) break;

        const attacker = alive[Math.floor(Math.random() * alive.length)];
        const targets = alive.filter(p => p.id !== attacker.id);
        const target = targets[Math.floor(Math.random() * targets.length)];

        const looted = target.mon * 0.9;
        target.status = 'eliminated';
        target.eliminatedAt = 600 - currentTime;
        target.eliminatedBy = attacker.handle;
        attacker.mon += looted;
        target.mon = 0;
        attacker.kills += 1;

        const timeStr = formatTime(currentTime);
        const narrative = `${attacker.handle} eliminated ${target.handle} for ${looted.toFixed(1)} MON`;
        const lines = chunkText(narrative, 60);
        console.log(`${timeStr} ⚔️  ${lines[0]}`);
        for (let i = 1; i < lines.length; i++) {
            console.log(`            ${lines[i]}`);
        }
        
        eventIndex++;
    }

    const alive = players.filter(p => p.status === 'alive');
    const champion = alive.length > 0 ? alive.reduce((prev, current) => (prev.mon > current.mon) ? prev : current) : null;

    console.log(`\n═══════════════════════════════════`);
    console.log(`ROUND CONCLUDED`);
    console.log(`═══════════════════════════════════`);
    console.log(`Champion:        ${champion ? champion.handle : 'NONE'}`);
    console.log(`Survivors:       ${alive.length}`);
    
    console.log(`\nFINAL STANDINGS`);
    players.sort((a,b) => b.mon - a.mon).forEach(p => {
        console.log(`  ${p.handle.padEnd(14)} ${p.mon.toFixed(1)} MON  (${p.status})`);
    });

    console.log(`\n═══════════════════════════════════\n`);
    console.log(`✅ Round simulation complete. ${eventIndex} events generated.`);
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runSimulation();
}
