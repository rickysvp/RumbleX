import { tickSimulation } from '../lib/simulationEngine';
import { generateNarrative } from '../lib/narrativeEngine';
import { Player, FeedEvent } from '../store/types';
import { mockPlayers } from './mockPlayers';

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
    let players: Player[] = mockPlayers.map(p => ({
        ...p,
        mon: 1.0,
        status: 'alive',
        kills: 0,
        isUser: p.handle === 'Pilot_01'
    }));

    const allEvents: FeedEvent[] = [];
    let currentTime = 600;

    console.log(`\nStarting RumbleX Simulation (v2 Engine)...\n`);

    // Simulate to the end
    while (players.filter(p => p.status === 'alive').length > 1 && currentTime > 0) {
        const step = Math.floor(Math.random() * 15) + 5;
        currentTime -= step;
        
        const result = tickSimulation(players);
        if (result) {
            players = result.players;
            const narrative = generateNarrative(result.event, players);
            const feedEvent: FeedEvent = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: currentTime,
                type: result.event.type as any,
                text: narrative
            };
            allEvents.push(feedEvent);
            
            // Output Log
            const timeStr = formatTime(currentTime);
            const prefix = `${timeStr} ⚔️  `;
            const lines = chunkText(narrative, 60);
            console.log(`${prefix}${lines[0]}`);
            for (let i = 1; i < lines.length; i++) {
                console.log(`            ${lines[i]}`);
            }
        }
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
    console.log(`✅ Round simulation complete.`);
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runSimulation();
}
