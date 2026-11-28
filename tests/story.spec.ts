import { test, expect } from '@playwright/test';
import { storyFrame, storyLength } from '../src/story';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../data/scenarios.json', import.meta.url), 'utf8')) as {
  scenarios: {events: {id: string; path: string[]}[]}[];
};

test('the short story uses the firmware write, return ACK and local refusal in 25 seconds', () => {
  expect(storyLength).toBe(25000);
  for (const [ms, id, arrived] of [
    [0, 'setup', false], [2999, 'setup', false], [3000, 'write', false],
    [8999, 'write', false], [9000, 'write', true], [10000, 'ack', false],
    [13999, 'ack', false], [14000, 'ack', true], [15000, 'refusal', false],
    [21999, 'refusal', false], [22000, 'refusal', true], [25000, 'refusal', true],
  ] as const) {
    const frame = storyFrame(ms);
    expect([frame.beat.id, frame.arrived]).toEqual([id, arrived]);
  }
  const pathAt = (ms: number) => {
    const {event} = storyFrame(ms).beat;
    return data.scenarios.flatMap(s => s.events).find(e => e.id === event)!.path;
  };
  expect(pathAt(3000).filter(id => /^r\d$/.test(id))).toEqual(['r3','r4','r5','r2']);
  expect(pathAt(10000).filter(id => /^r\d$/.test(id))).toEqual(['r2','r1','r0','r3']);
  expect(pathAt(15000)).toEqual(['cpuB.core','cpuB.bridge']);
});
