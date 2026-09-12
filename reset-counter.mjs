// Run locally. Never place your GitHub token in site files.
import { execFileSync } from 'node:child_process';
const [reason = '', link = '', date] = process.argv.slice(2);
if (reason.length > 1000) throw new Error('Reason must be at most 1000 characters');
if (link) { const u = new URL(link); if (link.length > 2048 || !['https:','http:'].includes(u.protocol) || u.username || u.password) throw new Error('Use an http/https link without credentials'); }
if (date && !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(date)) throw new Error('Date must include timezone, e.g. 2026-09-10T23:00:00+04:00');
const started = date ? new Date(date) : new Date();
if (!Number.isFinite(started.getTime()) || started.getTime() > Date.now()) throw new Error('Start date must be valid and not in the future');
let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) { try { token = execFileSync('gh',['auth','token'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { throw new Error('Sign in with gh auth login or set GH_TOKEN (repository Contents: write)'); } }
const endpoint = 'https://api.github.com/repos/Woodlemax/wizard-no-ego-30/contents/counter.json';
const headers = {Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'};
const before = await fetch(endpoint + '?ref=main', {headers});
if (!before.ok) throw new Error(`Read failed: HTTP ${before.status}`);
const old = await before.json();
const state = {startedAt:started.toISOString(),resetReason:reason.trim() || null,resetLink:link.trim() || null};
const content = Buffer.from(JSON.stringify(state,null,2)+'\n').toString('base64');
const updated = await fetch(endpoint,{method:'PUT',headers,body:JSON.stringify({message:'Update counter start and incident details',sha:old.sha,branch:'main',content})});
if (!updated.ok) throw new Error(`Update failed: HTTP ${updated.status}. If 409, read the latest state before retrying.`);
console.log('Counter updated:',state.startedAt,'— GitHub Pages will publish the update shortly.');
