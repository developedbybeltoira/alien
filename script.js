'use strict';
// ═══════════════════════════════════════════════════════════
//  ALIEN DASH v4 — Character Shop · Believer System · Hard Mode
//  Custom Music File · 10 Characters · All Features
// ═══════════════════════════════════════════════════════════

// ═══ CUSTOM MUSIC ════════════════════════════════════════════
// Place your music file next to index.html named: believer.mp3
// Other accepted names: music.mp3 / background.mp3 / theme.mp3
// Supported: .mp3 .ogg .wav .m4a .aac
const MUSIC_FILES = ['believer.mp3','believer.ogg','music.mp3','theme.mp3','background.mp3'];
let bgAudioEl = null;
let bgAudioLoaded = false;

function tryLoadCustomMusic() {
  for (const file of MUSIC_FILES) {
    const audio = new Audio();
    audio.src = file;
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => {
      bgAudioEl = audio;
      bgAudioLoaded = true;
      console.log('%c🎵 Custom music loaded: ' + file, 'color:#ffd700;font-size:13px');
    }, { once: true });
    audio.load();
    break; // try first one; fallback to synth if none loads
  }
}
tryLoadCustomMusic();

function playCustomMusic() {
  if (!bgAudioLoaded || !bgAudioEl) return false;
  bgAudioEl.currentTime = 0;
  bgAudioEl.play().catch(() => {});
  return true;
}
function stopCustomMusic() {
  if (bgAudioEl) { bgAudioEl.pause(); bgAudioEl.currentTime = 0; }
}
function muteCustomMusic(m) {
  if (bgAudioEl) bgAudioEl.muted = m;
}

// ═══ SOUND ENGINE (synth fallback) ═══════════════════════════
const SFX = {
  ctx: null, master: null, bgGain: null, muted: false, _loop: null, _comboNote: 0,
  init() { try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); this.master=this.ctx.createGain(); this.master.gain.value=0.72; this.master.connect(this.ctx.destination); } catch(e){} },
  wake() { if(!this.ctx) this.init(); if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tone(f,type,dur,vol,t0,f2){
    if(!this.ctx||this.muted) return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.connect(g);g.connect(this.master);o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
    if(f2) o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
    g.gain.setValueAtTime(vol||0.3,t0);g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
    o.start(t0);o.stop(t0+dur);
  },
  noise(dur,vol,t0,hi){
    if(!this.ctx||this.muted) return;
    const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*dur,this.ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const flt=this.ctx.createBiquadFilter();flt.type=hi?'highpass':'lowpass';flt.frequency.value=hi||800;
    const g=this.ctx.createGain();g.gain.value=vol||0.3;
    src.connect(flt);flt.connect(g);g.connect(this.master);src.start(t0);src.stop(t0+dur);
  },
  play(name){
    this.wake(); if(!this.ctx||this.muted) return;
    const t=this.ctx.currentTime;
    const P = (f,tp,d,v,t0,f2)=>this.tone(f,tp,d,v,t0||t,f2);
    switch(name){
      case 'jump':   P(200,'sine',.1,.45,t,480);P(480,'triangle',.08,.2,t+.06,700);break;
      case 'djump':  P(480,'sine',.09,.4,t,960);P(720,'triangle',.1,.28,t+.05,1200);break;
      case 'coin':   P(900,'sine',.07,.55,t);P(1350,'sine',.09,.42,t+.04,1800);break;
      case 'combo':  const f=600+this._comboNote*120;P(f,'sine',.08,.48,t,f*1.3);this._comboNote=(this._comboNote+1)%7;break;
      case 'hit':    P(120,'sawtooth',.07,.65,t,55);P(180,'square',.05,.4,t,70);for(let i=0;i<3;i++)P(90-i*18,'sawtooth',.06,.3,t+i*.04,40);break;
      case 'death':  for(let i=0;i<8;i++)P(400-i*38,'sawtooth',.1,.42,t+i*.08,100-i*10);break;
      case 'start':  [261,329,392,523].forEach((f2,i)=>P(f2,'sine',.16,.42,t+i*.13,f2*1.02));break;
      case 'cdn':    P(440,'square',.1,.55,t);break;
      case 'go':     P(880,'sine',.06,.65,t,1200);P(1200,'sine',.08,.5,t+.07,1600);P(1600,'sine',.1,.6,t+.14,2000);break;
      case 'newbest':[523,659,784,1047,1319].forEach((f2,i)=>P(f2,'sine',.22,.5,t+i*.14));break;
      case 'powerup':[400,600,900,1400].forEach((f2,i)=>P(f2,'sine',.12,.4,t+i*.06,f2*1.5));break;
      case 'shield': P(800,'triangle',.12,.35,t,1200);P(1200,'sine',.1,.3,t+.1,800);break;
      case 'zone':   P(300,'triangle',.2,.45,t,600);P(600,'sine',.2,.4,t+.1,1200);break;
      case 'buy':    [400,600,800,1200,1600].forEach((f2,i)=>P(f2,'sine',.15,.45,t+i*.08,f2*1.2));break;
      case 'believer':[523,659,784,1047,784,1047,1319].forEach((f2,i)=>P(f2,'sine',.18,.55,t+i*.1,f2*1.1));break;
    }
  },
  startMusic(zone){
    if (bgAudioLoaded) { playCustomMusic(); return; }
    this.wake(); if(!this.ctx||this.muted) return;
    this.stopMusic();
    const BPM=zone===1?128:zone===2?138:zone===3?148:158, beat=60/BPM, bar=beat*4;
    const t0=this.ctx.currentTime+0.05, BARS=8;
    this.bgGain=this.ctx.createGain(); this.bgGain.gain.value=0.2; this.bgGain.connect(this.master);
    const patterns=[[55,55,73,55,82,55,73,82,55,55,65,55,82,65,55,73],[65,65,87,65,98,65,87,98,73,73,87,73,110,87,73,82],[73,73,98,73,110,73,98,73,82,82,98,82,123,98,82,110],[82,82,110,82,123,82,110,82,98,98,110,98,147,110,98,123]];
    const bass=patterns[zone-1]||patterns[0];
    const melodies=[[[0,440,.4],[.5,392,.3],[1,349,.4],[1.5,392,.25],[2,440,.5],[2.75,523,.35],[3,493,.5],[3.5,440,.4]],[[0,349,.35],[.375,392,.3],[.75,440,.4],[1.25,392,.3],[1.5,523,.45],[2,587,.4],[2.5,523,.3],[3,440,.5]],[[0,659,.35],[.5,587,.3],[1,523,.4],[1.5,587,.25],[2,659,.55],[2.5,784,.35],[3,698,.5],[3.5,659,.4]],[[0,880,.3],[.4,784,.25],[.8,698,.35],[1.2,784,.2],[1.6,880,.4],[2.2,1047,.3],[2.6,987,.45],[3.2,880,.35]]];
    const mel=melodies[zone-1]||melodies[0];
    for(let b=0;b<BARS*4;b++){
      const bt=t0+b*bar, bf=bass[b%bass.length];
      const o=this.ctx.createOscillator(),g=this.ctx.createGain(),flt=this.ctx.createBiquadFilter();
      flt.type='lowpass';flt.frequency.value=320;o.connect(flt);flt.connect(g);g.connect(this.bgGain);
      o.type='sawtooth';o.frequency.value=bf;
      g.gain.setValueAtTime(0.001,bt);g.gain.linearRampToValueAtTime(0.55,bt+0.015);g.gain.exponentialRampToValueAtTime(0.001,bt+bar*0.82);
      o.start(bt);o.stop(bt+bar);
      [0,beat*2].forEach(off=>{const kt=bt+off,ko=this.ctx.createOscillator(),kg=this.ctx.createGain();ko.connect(kg);kg.connect(this.bgGain);ko.type='sine';ko.frequency.setValueAtTime(160,kt);ko.frequency.exponentialRampToValueAtTime(38,kt+0.09);kg.gain.setValueAtTime(0.75,kt);kg.gain.exponentialRampToValueAtTime(0.001,kt+0.14);ko.start(kt);ko.stop(kt+0.16);});
      [beat,beat*3].forEach(off=>this.noise(0.14,0.38,bt+off,2000));
      for(let h=0;h<8;h++) this.noise(0.04,h%2===0?0.2:0.12,bt+h*(beat*0.5),8000);
      this.noise(0.18,0.15,bt+beat*3.5,6000);
      if(b%4===0) mel.forEach(([off,freq2,dur])=>{const mt=bt+off*beat,mo=this.ctx.createOscillator(),mg=this.ctx.createGain(),mf=this.ctx.createBiquadFilter();mf.type='lowpass';mf.frequency.value=2400;mo.connect(mf);mf.connect(mg);mg.connect(this.bgGain);mo.type='square';mo.frequency.value=freq2;mg.gain.setValueAtTime(0.001,mt);mg.gain.linearRampToValueAtTime(0.14,mt+0.025);mg.gain.exponentialRampToValueAtTime(0.001,mt+dur*beat);mo.start(mt);mo.stop(mt+dur*beat+0.05);});
      if(b%8===0)[bf*2,bf*2.52,bf*3].forEach(f2=>{const po=this.ctx.createOscillator(),pg=this.ctx.createGain();po.connect(pg);pg.connect(this.bgGain);po.type='triangle';po.frequency.value=f2;pg.gain.setValueAtTime(0.001,bt);pg.gain.linearRampToValueAtTime(0.06,bt+0.3);pg.gain.exponentialRampToValueAtTime(0.001,bt+bar*4);po.start(bt);po.stop(bt+bar*4);});
    }
    const totalDur=BARS*4*bar;
    this._loop=setTimeout(()=>{if(this.bgGain&&!this.muted)this.startMusic(zone);},(totalDur-0.08)*1000);
  },
  stopMusic(){
    clearTimeout(this._loop);this._loop=null;
    stopCustomMusic();
    if(this.bgGain&&this.ctx){try{this.bgGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+0.4);}catch(e){}}
    this.bgGain=null;
  },
  toggle(){
    this.muted=!this.muted;
    muteCustomMusic(this.muted);
    if(this.muted) this.stopMusic(); else this.startMusic(Game.zone||1);
    return this.muted;
  }
};

// ═══ CHARACTERS ══════════════════════════════════════════════
const CHARACTERS = [
  { id:'grey',   name:'The Grey OG',        price:0,      desc:'Your original runner. Balanced and reliable.',           perk:'No special perk — pure skill!',            emoji:'👽', tier:'FREE'  },
  { id:'wobble', name:'Wobble-Leg Wanderer', price:500,    desc:'Rubber-like legs that bounce high on landing.',          perk:'⬆ JUMP BOOST +15%',                         emoji:'🤸', tier:'RARE'  },
  { id:'neon',   name:'Neon Blur',           price:1500,   desc:'Leaves a glowing after-image trail while running.',      perk:'🌟 EXTENDED TRAIL GLOW',                    emoji:'🔵', tier:'RARE'  },
  { id:'scout',  name:'Abduction Scout',     price:3500,   desc:'Hovers slightly above the ground as he dashes.',         perk:'🛸 HOVERS — NO GROUND DUST',               emoji:'🛸', tier:'EPIC'  },
  { id:'moon',   name:'The Moon-Walker',     price:7500,   desc:'Low-gravity jump. Stays airborne 20% longer.',           perk:'🌙 LOW GRAVITY JUMP',                       emoji:'🌙', tier:'EPIC'  },
  { id:'cyborg', name:'Cyborg Sentinel',     price:15000,  desc:'Metallic skin that flashes red near obstacles.',         perk:'⚠ OBSTACLE RADAR FLASH',                  emoji:'🤖', tier:'EPIC'  },
  { id:'plasma', name:'Plasma Runner',       price:30000,  desc:'A body made of pure electric energy. Very high power.',  perk:'⚡ ELECTRIC BODY — SPEED BONUS',           emoji:'⚡', tier:'LEGENDARY'},
  { id:'void',   name:'Void Strider',        price:75000,  desc:'Semi-invisible. Only glowing eyes and $IBLV badge show.',perk:'👁 STEALTH — NEAR-INVISIBLE',              emoji:'👁', tier:'LEGENDARY'},
  { id:'emperor',name:'Galactic Emperor',    price:150000, desc:'Wears a neon crown. Coins slowly pulled toward him.',    perk:'👑 PASSIVE COIN MAGNET',                    emoji:'👑', tier:'LEGENDARY'},
  { id:'eternal',name:'The Eternal Believer',price:500000, desc:'Pure gold texture. Absolute prestige for the top.',      perk:'🏆 TRIPLE SCORE MULTIPLIER',               emoji:'🏆', tier:'MYTHIC' },
];

const CHAR_COLORS = {
  grey:    { body:'#8a9870', head:'#b5c9a0', eye:'#080808', trail:'#00f5ff', glow:'rgba(0,245,255,0.2)' },
  wobble:  { body:'#7ab870', head:'#aae890', eye:'#080808', trail:'#88ff44', glow:'rgba(100,255,50,0.25)' },
  neon:    { body:'#2255cc', head:'#4488ff', eye:'#00ffff', trail:'#0088ff', glow:'rgba(0,100,255,0.4)', neonTrail:true },
  scout:   { body:'#446688', head:'#88aacc', eye:'#00ccff', trail:'#00ccff', glow:'rgba(0,200,255,0.35)', hover:true },
  moon:    { body:'#aabbdd', head:'#ddeeff', eye:'#ccddff', trail:'#ffffff', glow:'rgba(200,220,255,0.3)', lowGrav:true },
  cyborg:  { body:'#888888', head:'#aaaaaa', eye:'#ff3333', trail:'#ff4444', glow:'rgba(255,50,50,0.25)', metallic:true },
  plasma:  { body:'#0033ff', head:'#2266ff', eye:'#ffffff', trail:'#00aaff', glow:'rgba(0,100,255,0.6)', plasma:true },
  void:    { body:'rgba(0,0,0,0.05)', head:'rgba(0,0,0,0.05)', eye:'#ffffff', trail:'rgba(100,0,255,0.4)', glow:'rgba(100,0,255,0.2)', invisible:true },
  emperor: { body:'#884400', head:'#cc6600', eye:'#ffdd00', trail:'#ffaa00', glow:'rgba(255,170,0,0.35)', crown:true, passiveMagnet:true },
  eternal: { body:'#ddaa00', head:'#ffdd44', eye:'#ffffff', trail:'#ffd700', glow:'rgba(255,215,0,0.5)', gold:true },
};

// ═══ DATABASE ════════════════════════════════════════════════
// ═══ SUPABASE DATABASE ═══════════════════════════════════════
const SUPA_URL = 'https://djdgezalatzhnteibsim.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZGdlemFsYXR6aG50ZWlic2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODEwOTcsImV4cCI6MjA5MDM1NzA5N30.hleGlrE1_s2n-rFuQH7V04Q-2CWuc2x-XMK7vpfgG_E';

const SUPA = {
  async query(method, path, body) {
    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
        method,
        headers: {
          'apikey': SUPA_KEY,
          'Authorization': `Bearer ${SUPA_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) { const e = await res.text(); console.error('Supa error:', e); return null; }
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch(e) { console.error('Supa fetch error:', e); return null; }
  },
  async getPlayer(username) {
    const rows = await this.query('GET', `players?username=eq.${encodeURIComponent(username.toLowerCase())}&limit=1`);
    return (rows && rows[0]) ? this._toLocal(rows[0]) : null;
  },
  async upsertPlayer(username, data) {
    const existing = await this.getPlayer(username);
    const row = this._toRow(username, data, existing);
    const rows = await this.query('POST', 'players', row);
    if (rows && rows[0]) { this._cacheSet(username, this._toLocal(rows[0])); return this._toLocal(rows[0]); }
    return existing;
  },
  async leaderboard(limit=20) {
    const rows = await this.query('GET', `players?order=high_score.desc&limit=${limit}`);
    if (!rows) return [];
    return rows.map(r => this._toLocal(r));
  },
  async resetScores() {
    await this.query('PATCH', 'players', { high_score:0, total_coins:0, spendable_coins:0, games_played:0, total_distance:0 });
    this._clearCache();
  },
  async deletePlayer(username) {
    await this.query('DELETE', `players?username=eq.${encodeURIComponent(username.toLowerCase())}`);
    this._cacheDelete(username);
  },
  async getAllPlayers() {
    const rows = await this.query('GET', 'players?order=high_score.desc');
    if (!rows) return [];
    return rows.map(r => this._toLocal(r));
  },
  _toRow(username, data, existing) {
    const base = existing || {};
    return {
      username: String(username).toLowerCase(),
      display_name: data.displayName || base.displayName || username,
      tg_id: data.tgId || base.tgId || String(username),
      tg_username: data.tgUsername || base.tgUsername || '',
      tg_photo: data.tgPhotoUrl || base.tgPhotoUrl || '',
      high_score: data.highScore !== undefined ? data.highScore : (base.highScore || 0),
      total_coins: data.totalCoins !== undefined ? data.totalCoins : (base.totalCoins || 0),
      spendable_coins: data.spendableCoins !== undefined ? data.spendableCoins : (base.spendableCoins || 0),
      games_played: data.gamesPlayed !== undefined ? data.gamesPlayed : (base.gamesPlayed || 0),
      total_distance: data.totalDistance !== undefined ? data.totalDistance : (base.totalDistance || 0),
      owned_chars: data.ownedChars || base.ownedChars || ['grey'],
      equipped_char: data.equippedChar || base.equippedChar || 'grey',
      join_date: base.joinDate || Date.now(),
      last_played: Date.now()
    };
  },
  _toLocal(row) {
    return {
      displayName: row.display_name,
      tgId: row.tg_id || '',
      tgUsername: row.tg_username || '',
      tgPhotoUrl: row.tg_photo || '',
      highScore: row.high_score || 0,
      totalCoins: row.total_coins || 0,
      spendableCoins: row.spendable_coins || 0,
      gamesPlayed: row.games_played || 0,
      totalDistance: row.total_distance || 0,
      ownedChars: row.owned_chars || ['grey'],
      equippedChar: row.equipped_char || 'grey',
      joinDate: row.join_date || Date.now(),
      lastPlayed: row.last_played || Date.now()
    };
  },
  // Local cache so UI is instant, syncs to Supabase in background
  _cache: {},
  _cacheSet(n, d) { this._cache[n.toLowerCase()] = d; },
  _cacheGet(n) { return this._cache[n.toLowerCase()] || null; },
  _cacheDelete(n) { delete this._cache[n.toLowerCase()]; },
  _clearCache() { this._cache = {}; }
};

// DB — unified interface (cache-first, Supabase-backed)
const DB = {
  KC: 'ad_user',
  _pending: {}, // tracks in-flight async ops

  get(n) { return SUPA._cacheGet(n); },

  async load(n) {
    const p = await SUPA.getPlayer(n);
    if (p) SUPA._cacheSet(n, p);
    return p;
  },

  async upsert(n, data) {
    const existing = SUPA._cacheGet(n) || {};
    const merged = Object.assign({}, existing, data, { displayName: data.displayName || existing.displayName || n });
    SUPA._cacheSet(n, merged);
    const result = await SUPA.upsertPlayer(n, merged);
    if (result) SUPA._cacheSet(n, result);
    return result || merged;
  },

  async updateScore(n, score, coins, dist) {
    const p = SUPA._cacheGet(n) || { highScore:0, totalCoins:0, spendableCoins:0, gamesPlayed:0, totalDistance:0, ownedChars:['grey'], equippedChar:'grey' };
    const updated = {
      displayName: p.displayName || n,
      highScore: Math.max(p.highScore || 0, score),
      totalCoins: (p.totalCoins || 0) + coins,
      spendableCoins: (p.spendableCoins || 0) + coins,
      gamesPlayed: (p.gamesPlayed || 0) + 1,
      totalDistance: (p.totalDistance || 0) + dist,
      ownedChars: p.ownedChars || ['grey'],
      equippedChar: p.equippedChar || 'grey'
    };
    SUPA._cacheSet(n, updated);
    SUPA.upsertPlayer(n, updated); // fire and forget
    return updated;
  },

  async buyChar(n, charId, price) {
    const p = SUPA._cacheGet(n); if (!p) return false;
    if ((p.spendableCoins || 0) < price) return false;
    const owned = [...(p.ownedChars || ['grey'])];
    if (owned.includes(charId)) return true;
    owned.push(charId);
    const updated = Object.assign({}, p, { ownedChars: owned, spendableCoins: (p.spendableCoins||0) - price });
    SUPA._cacheSet(n, updated);
    await SUPA.upsertPlayer(n, updated);
    return true;
  },

  async equipChar(n, charId) {
    const p = SUPA._cacheGet(n); if (!p) return;
    const owned = p.ownedChars || ['grey'];
    if (!owned.includes(charId)) return;
    const updated = Object.assign({}, p, { equippedChar: charId });
    SUPA._cacheSet(n, updated);
    SUPA.upsertPlayer(n, updated);
  },

  getEquipped(n) { const p = this.get(n); return p ? p.equippedChar || 'grey' : 'grey'; },
  getOwned(n) { const p = this.get(n); return p ? p.ownedChars || ['grey'] : ['grey']; },
  getSpendable(n) { const p = this.get(n); return p ? p.spendableCoins || 0 : 0; },

  async leaderboard(lim=20) { return await SUPA.leaderboard(lim); },
  async resetScores() { await SUPA.resetScores(); },
  async resetAll() {
    const all = await SUPA.getAllPlayers();
    // delete all players
    for (const p of all) await SUPA.deletePlayer(p.displayName);
    SUPA._clearCache();
  },
  async deletePlayer(n) { await SUPA.deletePlayer(n); },
  async getAllPlayers() { return await SUPA.getAllPlayers(); },

  currentUser() { return localStorage.getItem(this.KC) || null; },
  setUser(n) { localStorage.setItem(this.KC, n); },
  clearUser() { localStorage.removeItem(this.KC); }
};

const App = { user:null, isAdmin:false, prevScreen:null };

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>{s.style.display='none';s.classList.remove('active');});
  const el=document.getElementById(id); el.style.display='flex'; el.classList.add('active');
}

// ═══ TELEGRAM AUTH ════════════════════════════════════════════
const TGAuth = {
  ADMIN_PASS: 'admin123', // change this to your admin password
  _adminVisible: false,

  // Called when Telegram widget returns user data
  async onAuth(tgUser) {
    showConnecting(true);
    try {
      // tgUser: { id, first_name, last_name, username, photo_url, auth_date, hash }
      const tgId = String(tgUser.id);
      const displayName = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
      const username = tgUser.username || displayName;

      App.user = tgId;
      App.tgDisplayName = displayName;
      App.tgUsername = username;
      App.tgPhotoUrl = tgUser.photo_url || null;
      App.isAdmin = false;

      DB.setUser(tgId);
      SFX.wake();

      // Upsert into Supabase with TG info
      await DB.upsert(tgId, {
        displayName: displayName,
        tgId: tgId,
        tgUsername: username,
        tgPhotoUrl: tgUser.photo_url || null
      });

      SFX.play('start');
      showConnecting(false);
      await loadLogin_toMenu();
    } catch(e) {
      showConnecting(false);
      document.getElementById('loginError').textContent = '⚠ CONNECTION ERROR — CHECK INTERNET';
    }
  },

  openLogin() {
    // Telegram Login Widget — opens Telegram OAuth popup
    // Bot username: change 'AlienDashBot' to YOUR bot username
    // Create a bot at @BotFather, enable login widget, set domain
    const botUsername = 'aliendashbot'; // ← CHANGE THIS to your bot username

    // Try Telegram widget popup approach
    if (window.Telegram && window.Telegram.Login) {
      window.Telegram.Login.auth(
        { bot_id: botUsername, request_access: 'write' },
        (data) => { if (data) TGAuth.onAuth(data); }
      );
    } else {
      // Fallback: open Telegram OAuth in popup window
      const authUrl = `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(location.origin)}&return_to=${encodeURIComponent(location.href)}&request_access=write`;
      const popup = window.open(authUrl, 'tgauth', 'width=550,height=600,scrollbars=yes');
      // Listen for postMessage from popup
      const handler = (event) => {
        if (event.data && event.data.id) {
          window.removeEventListener('message', handler);
          if (popup) popup.close();
          TGAuth.onAuth(event.data);
        }
      };
      window.addEventListener('message', handler);
    }
  },

  toggleAdmin() {
    this._adminVisible = !this._adminVisible;
    const el = document.getElementById('adminOverride');
    el.classList.toggle('hidden', !this._adminVisible);
    if (this._adminVisible) document.getElementById('adminPassInput').focus();
  },

  async adminLogin() {
    const pass = document.getElementById('adminPassInput').value.trim();
    const err = document.getElementById('loginError');
    if (!pass) { err.textContent = '⚠ ENTER ADMIN PASSWORD'; return; }
    if (pass !== this.ADMIN_PASS) { err.textContent = '⚠ WRONG ADMIN PASSWORD'; return; }

    showConnecting(true);
    App.user = 'admin_' + pass.substring(0,4);
    App.tgDisplayName = 'ADMIN';
    App.tgUsername = 'admin';
    App.isAdmin = true;
    DB.setUser(App.user);
    try {
      await DB.upsert(App.user, { displayName: 'ADMIN', tgId: App.user });
      showConnecting(false);
      await renderAdmin(); showScreen('adminScreen');
    } catch(e) {
      showConnecting(false);
      err.textContent = '⚠ DB ERROR';
    }
  }
};

// Global callback for Telegram widget (called by TG script)
window.onTelegramAuth = function(user) { TGAuth.onAuth(user); };

// Show/hide connecting spinner
function showConnecting(show) {
  let el = document.getElementById('connectingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'connectingOverlay';
    el.className = 'connecting-overlay' + (show ? '' : ' hidden');
    el.innerHTML = '<div class="connecting-spinner"></div><div class="connecting-text">CONNECTING...</div>';
    document.body.appendChild(el);
  }
  el.classList.toggle('hidden', !show);
}

document.getElementById('adminLoginBtn').addEventListener('click', () => TGAuth.adminLogin());
document.getElementById('adminPassInput').addEventListener('keydown', e => { if(e.key==='Enter') TGAuth.adminLogin(); });
document.getElementById('viewLeaderBtn').addEventListener('click',()=>{App.prevScreen='loginScreen';renderLeaderboard();});

// Login BG stars
(function(){
  const c=document.getElementById('loginBgCanvas'),ctx=c.getContext('2d');
  let t=0;
  const stars=Array.from({length:160},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.8+0.4,s:Math.random()*0.6+0.2}));
  function draw(){c.width=c.offsetWidth;c.height=c.offsetHeight;const W=c.width,H=c.height;const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#010008');sky.addColorStop(0.5,'#080200');sky.addColorStop(1,'#150800');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);stars.forEach(s=>{const b=0.5+0.5*Math.sin(t*s.s+s.x*100);ctx.globalAlpha=b*0.75;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*H*0.6,s.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;t+=0.018;requestAnimationFrame(draw);}
  draw();
})();

window.addEventListener('DOMContentLoaded',async ()=>{
  document.addEventListener('touchstart',()=>SFX.wake(),{once:true});
  document.addEventListener('mousedown',()=>SFX.wake(),{once:true});
  const saved=DB.currentUser();
  if(saved){
    try {
      const p = await DB.load(saved);
      if(p){
        App.user = saved;
        App.tgDisplayName = p.displayName || saved;
        App.tgUsername = p.tgUsername || saved;
        App.isAdmin = saved.startsWith('admin_');
        await loadLogin_toMenu(); return;
      }
    } catch(e) {}
  }
  showScreen('loginScreen');
});

async function loadLogin_toMenu(){ await loadMenu(); }

// ═══ MENU ════════════════════════════════════════════════════
async function loadMenu(){
  // Refresh from Supabase
  if(App.user){ try{ await DB.load(App.user); }catch(e){} }
  const p=DB.get(App.user);
  const displayName = App.tgDisplayName || p?.displayName || App.user || 'ALIEN';
  document.getElementById('welcomeMsg').textContent=`WELCOME, ${displayName.toUpperCase()}`;
  document.getElementById('menuBestScore').textContent=`BEST: ${(p?p.highScore:0).toLocaleString()}`;
  document.getElementById('menuCoins').textContent=(p?p.spendableCoins:0).toLocaleString();
  // Show Telegram ID on menu
  const tgIdEl = document.getElementById('menuTgId');
  if(tgIdEl) tgIdEl.textContent = App.user ? `🔵 TG ID: ${App.user}` : '';
  const oldBtn=document.getElementById('adminMenuBtn'); if(oldBtn) oldBtn.remove();
  showScreen('menuScreen'); startMenuBg();
  if(App.isAdmin){
    const btn=document.createElement('button'); btn.id='adminMenuBtn'; btn.className='btn-secondary';
    btn.textContent='⚙️ ADMIN PANEL'; btn.style.cssText='border-color:rgba(255,0,100,0.45);color:#ff3399;margin-bottom:0';
    btn.addEventListener('click',async()=>{await renderAdmin();showScreen('adminScreen');});
    document.querySelector('.menu-overlay').appendChild(btn);
  }
}
document.getElementById('playBtn').addEventListener('click',startGame);
document.getElementById('shopBtn').addEventListener('click',()=>{renderShop();showScreen('shopScreen');});
document.getElementById('menuLeaderBtn').addEventListener('click',()=>{App.prevScreen='menuScreen';renderLeaderboard();});
document.getElementById('logoutBtn').addEventListener('click',()=>{App.user=null;App.isAdmin=false;App.tgDisplayName=null;App.tgUsername=null;App.tgPhotoUrl=null;SUPA._clearCache();DB.clearUser();document.getElementById('loginError').textContent='';document.getElementById('adminPassInput').value='';document.getElementById('adminOverride').classList.add('hidden');showScreen('loginScreen');});

let menuAnimId=null;
function startMenuBg(){
  const c=document.getElementById('menuBg'),ctx=c.getContext('2d');
  let t=0;
  const stars=Array.from({length:130},()=>({x:Math.random(),y:Math.random(),r:Math.random()*2+0.5,s:Math.random()*0.5+0.2}));
  function draw(){
    c.width=c.offsetWidth;c.height=c.offsetHeight;
    const W=c.width,H=c.height;
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#010814');sky.addColorStop(0.5,'#0a1a3a');sky.addColorStop(1,'#1a0a00');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{const b=0.5+0.5*Math.sin(t*s.s+s.x*100);ctx.globalAlpha=b*0.82;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*H*0.6,s.r,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
    const mx=W*0.78+Math.sin(t*0.1)*20,my=H*0.13;
    const mg=ctx.createRadialGradient(mx,my,0,mx,my,90);mg.addColorStop(0,'rgba(255,245,200,0.22)');mg.addColorStop(1,'transparent');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,90,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f0e8c0';ctx.beginPath();ctx.arc(mx,my,40,0,Math.PI*2);ctx.fill();
    drawCityLayer(ctx,W,H,t*-0.8,'#0a1520',0.68);
    drawCityLayer(ctx,W,H,t*-1.6,'#0e1f30',0.62,true);
    t+=0.02; menuAnimId=requestAnimationFrame(draw);
  }
  if(menuAnimId) cancelAnimationFrame(menuAnimId);
  draw();
}
function drawCityLayer(ctx,W,H,off,color,baseYr,windows){
  const baseY=H*baseYr,repeat=W*2.5,r=mulberry32(color.length*7);
  ctx.fillStyle=color;
  let bx=0;
  while(bx<W*2.5){
    const bw=(r()*0.09+0.04)*W,bh=(r()*0.22+0.05)*H;
    const dx=((bx-((off%repeat)+repeat)%repeat)%repeat+repeat)%repeat-W*0.3;
    ctx.fillRect(dx,baseY-bh,bw,bh+H*0.4);
    if(windows){ctx.fillStyle='rgba(255,230,100,0.52)';for(let wy=baseY-bh+8;wy<baseY-12;wy+=9)for(let wx=dx+5;wx<dx+bw-5;wx+=9)if((Math.floor((wy+wx)/6)%3)!==0)ctx.fillRect(wx,wy,4,4);ctx.fillStyle=color;}
    bx+=bw+r()*12;
  }
}

// ═══ CHARACTER SHOP ═══════════════════════════════════════════
let shopPreviewAnimIds = {};
let currentModalChar = null;

function renderShop(){
  const owned=DB.getOwned(App.user);
  const equipped=DB.getEquipped(App.user);
  const spendable=DB.getSpendable(App.user);
  document.getElementById('shopCoins').textContent=spendable.toLocaleString();

  const grid=document.getElementById('shopGrid');
  grid.innerHTML='';

  CHARACTERS.forEach((char,idx)=>{
    const isOwned=owned.includes(char.id);
    const isEquipped=equipped===char.id;
    const isFree=char.price===0;
    const canAfford=spendable>=char.price;

    const card=document.createElement('div');
    card.className=`shop-card ${isEquipped?'equipped':isOwned?'owned':'locked'}`;
    card.dataset.charId=char.id;

    const canvasEl=document.createElement('canvas');
    canvasEl.className='shop-card-canvas';
    canvasEl.width=130; canvasEl.height=155;
    card.appendChild(canvasEl);

    const badge=document.createElement('div');
    badge.className=`shop-card-badge ${isEquipped?'badge-equipped':isOwned?'badge-owned':isFree?'badge-free':'badge-locked'}`;
    badge.textContent=isEquipped?'ON':''+isOwned?'✓':isFree?'FREE':char.tier;
    if(isEquipped) badge.textContent='ON';
    else if(isOwned) badge.textContent='✓';
    else if(isFree) badge.textContent='FREE';
    else badge.textContent=char.tier;
    card.appendChild(badge);

    const numEl=document.createElement('div');
    numEl.className='shop-card-number';
    numEl.textContent='#'+String(idx+1).padStart(2,'0');
    card.appendChild(numEl);

    const name=document.createElement('div');
    name.className='shop-card-name';
    name.textContent=char.name;
    card.appendChild(name);

    const price=document.createElement('div');
    price.className=`shop-card-price ${isFree?'free-tag':''}`;
    price.textContent=isFree?'FREE':isOwned?'OWNED':'🪙 '+char.price.toLocaleString();
    card.appendChild(price);

    // Animated preview
    animateShopCard(canvasEl, char.id, idx);

    card.addEventListener('click',()=>openCharModal(char.id));
    grid.appendChild(card);
  });
}

function animateShopCard(canvas, charId, idx){
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  let frame=0;
  const colors=CHAR_COLORS[charId]||CHAR_COLORS.grey;

  if(shopPreviewAnimIds[charId]) cancelAnimationFrame(shopPreviewAnimIds[charId]);

  function draw(){
    ctx.clearRect(0,0,W,H);
    frame++;

    // Background glow
    const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
    bg.addColorStop(0,colors.glow||'rgba(0,245,255,0.1)');
    bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Ground line
    const gY=H*0.82;
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(10,gY); ctx.lineTo(W-10,gY); ctx.stroke();

    // Draw character on card
    drawCharOnCanvas(ctx, W/2, gY, charId, frame, 0.7);

    shopPreviewAnimIds[charId]=requestAnimationFrame(draw);
  }
  draw();
}

function openCharModal(charId){
  currentModalChar=charId;
  const char=CHARACTERS.find(c=>c.id===charId);
  const owned=DB.getOwned(App.user);
  const equipped=DB.getEquipped(App.user);
  const spendable=DB.getSpendable(App.user);
  const isOwned=owned.includes(charId);
  const isEquipped=equipped===charId;
  const colors=CHAR_COLORS[charId]||CHAR_COLORS.grey;

  document.getElementById('charModalName').textContent=char.emoji+' '+char.name;
  document.getElementById('charModalDesc').textContent=char.desc;
  document.getElementById('charModalPerk').textContent=char.perk;
  document.getElementById('charModalPrice').textContent=char.price===0?'FREE':isOwned?'OWNED':'🪙 '+char.price.toLocaleString();

  const buyBtn=document.getElementById('charBuyBtn');
  const equipBtn=document.getElementById('charEquipBtn');
  buyBtn.style.display='none'; equipBtn.style.display='none';

  if(isEquipped){
    buyBtn.style.display='none'; equipBtn.style.display='none';
    document.getElementById('charModalPrice').textContent='✓ CURRENTLY EQUIPPED';
  } else if(isOwned){
    equipBtn.style.display='block'; equipBtn.textContent='✓ EQUIP NOW';
  } else if(char.price===0){
    buyBtn.style.display='block'; buyBtn.textContent='🔓 EQUIP FREE';
  } else if(spendable>=char.price){
    buyBtn.style.display='block'; buyBtn.textContent='🔓 UNLOCK — 🪙'+char.price.toLocaleString();
  } else {
    buyBtn.style.display='block'; buyBtn.textContent='🔒 NEED '+(char.price-spendable).toLocaleString()+' MORE COINS';
    buyBtn.style.opacity='0.5'; buyBtn.disabled=true;
  }

  // Big preview canvas
  const canvas=document.getElementById('charPreviewCanvas');
  const ctx=canvas.getContext('2d');
  let frame=0;
  if(window._modalAnimId) cancelAnimationFrame(window._modalAnimId);
  function drawModal(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    frame++;
    const W=canvas.width,H=canvas.height;
    const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.6);
    bg.addColorStop(0,colors.glow||'rgba(0,245,255,0.15)'); bg.addColorStop(1,'transparent');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const gY=H*0.85;
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(20,gY); ctx.lineTo(W-20,gY); ctx.stroke();
    drawCharOnCanvas(ctx,W/2,gY,charId,frame,1.0);
    window._modalAnimId=requestAnimationFrame(drawModal);
  }
  drawModal();

  document.getElementById('charModal').classList.remove('hidden');
}

document.getElementById('charBuyBtn').addEventListener('click',async()=>{
  const char=CHARACTERS.find(c=>c.id===currentModalChar);
  if(!char) return;
  if(char.price===0){
    await DB.equipChar(App.user,char.id);
    SFX.play('buy');
  } else {
    const ok=await DB.buyChar(App.user,char.id,char.price);
    if(ok){ await DB.equipChar(App.user,char.id); SFX.play('buy'); }
    else return;
  }
  document.getElementById('charModal').classList.add('hidden');
  if(window._modalAnimId) cancelAnimationFrame(window._modalAnimId);
  renderShop();
  updateMenuWallet();
});
document.getElementById('charEquipBtn').addEventListener('click',async()=>{
  if(!currentModalChar) return;
  await DB.equipChar(App.user,currentModalChar);
  SFX.play('start');
  document.getElementById('charModal').classList.add('hidden');
  if(window._modalAnimId) cancelAnimationFrame(window._modalAnimId);
  renderShop();
});
document.getElementById('charCloseBtn').addEventListener('click',()=>{
  document.getElementById('charModal').classList.add('hidden');
  if(window._modalAnimId) cancelAnimationFrame(window._modalAnimId);
});
document.getElementById('shopBackBtn').addEventListener('click',async()=>{
  Object.values(shopPreviewAnimIds).forEach(id=>cancelAnimationFrame(id));
  shopPreviewAnimIds={};
  await loadMenu();
});

function updateMenuWallet(){
  const p=DB.get(App.user);
  if(p){
    document.getElementById('menuCoins').textContent=(p.spendableCoins||0).toLocaleString();
    document.getElementById('menuBestScore').textContent=`BEST: ${(p.highScore||0).toLocaleString()}`;
  }
}

// ═══ DRAW CHARACTER ON CANVAS ════════════════════════════════
function drawCharOnCanvas(ctx, cx, groundY, charId, frame, scale){
  const colors=CHAR_COLORS[charId]||CHAR_CHARS.grey;
  const bw=42*scale, bh=65*scale;
  const t=frame;
  const legSw=Math.sin(t*0.3)*10*scale;
  const bob=colors.hover?Math.sin(t*0.08)*4:0;
  const baseY=groundY-bh/2+bob;

  ctx.save(); ctx.translate(cx, baseY);

  // Character-specific glow
  const glr=ctx.createRadialGradient(0,0,0,0,0,bw*1.2);
  glr.addColorStop(0,colors.glow||'rgba(0,245,255,0.2)'); glr.addColorStop(1,'transparent');
  ctx.fillStyle=glr; ctx.beginPath(); ctx.arc(0,0,bw*1.2,0,Math.PI*2); ctx.fill();

  if(colors.invisible){
    // Void strider — only eyes and badge
    ctx.globalAlpha=0.12;
    drawAlienBase(ctx,bw,bh,t,scale,'rgba(80,0,150,0.4)','rgba(50,0,100,0.3)');
    ctx.globalAlpha=1;
    // Glowing eyes
    ctx.fillStyle=colors.eye;
    ctx.shadowColor=colors.eye; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.ellipse(-bw*.16,-bh*.38,bw*.2,bh*.14,-0.25,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bw*.16,-bh*.38,bw*.2,bh*.14,0.25,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // $IBLV badge
    ctx.fillStyle='rgba(0,245,255,0.9)'; ctx.font=`bold ${7*scale}px Orbitron,sans-serif`;
    ctx.textAlign='center'; ctx.fillText('$IBLV',0,bh*.12); ctx.textAlign='left';
    ctx.restore(); return;
  }

  if(colors.plasma){
    // Plasma — electric body
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+t*0.08, r=bw*.7+Math.sin(t*0.15+i)*bw*.15;
      ctx.fillStyle=`rgba(0,${80+i*20},255,${0.15+0.1*Math.sin(t*0.1+i)})`;
      ctx.beginPath(); ctx.arc(Math.cos(a)*r*.3,Math.sin(a)*r*.25,3*scale,0,Math.PI*2); ctx.fill();
    }
  }

  if(colors.gold||charId==='eternal'){
    // Gold shimmer
    const shine=ctx.createRadialGradient(-bw*.3,-bh*.5,0,0,0,bw*1.5);
    shine.addColorStop(0,'rgba(255,255,200,0.4)'); shine.addColorStop(1,'transparent');
    ctx.fillStyle=shine; ctx.beginPath(); ctx.ellipse(0,-bh*.1,bw*1.2,bh,0,0,Math.PI*2); ctx.fill();
  }

  drawAlienBase(ctx,bw,bh,t,scale,colors.body,colors.head,colors.eye,charId,colors);

  if(colors.crown){
    ctx.fillStyle='#ffd700';
    const cx_=0, cy_=-bh*.78;
    ctx.beginPath(); ctx.moveTo(-bw*.25,cy_+bh*.06); ctx.lineTo(-bw*.25,cy_); ctx.lineTo(-bw*.1,cy_-bh*.06); ctx.lineTo(0,cy_); ctx.lineTo(bw*.1,cy_-bh*.06); ctx.lineTo(bw*.25,cy_); ctx.lineTo(bw*.25,cy_+bh*.06); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff3333'; ['#ff3333','#00ffff','#ffffff'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(-bw*.15+i*bw*.15,cy_,2.5*scale,0,Math.PI*2); ctx.fill(); });
  }

  if(colors.metallic||charId==='cyborg'){
    // Metal highlight
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(-bw*.08,-bh*.4,bw*.22,bh*.12,-.3,0,Math.PI*2); ctx.fill();
    // Near-obstacle flash (random here for preview)
    if(Math.sin(t*0.12)>.7){
      ctx.strokeStyle='rgba(255,0,0,0.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(0,-bh*.1,bw*.35,bh*.5,0,0,Math.PI*2); ctx.stroke();
    }
  }

  ctx.restore();
}

function drawAlienBase(ctx,bw,bh,t,scale,bodyColor,headColor,eyeColor,charId,colors){
  const legSw=Math.sin(t*0.32)*12*scale;
  // Legs
  const legCol=typeof bodyColor==='string'&&bodyColor.startsWith('rgba')?bodyColor:bodyColor;
  ctx.strokeStyle=legCol||'#6b8a5a'; ctx.lineWidth=6*scale; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-8*scale,bh*.18); ctx.lineTo(-10*scale+legSw*.3,bh*.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8*scale,bh*.18); ctx.lineTo(10*scale-legSw*.3,bh*.5); ctx.stroke();
  // Torso
  const tg=ctx.createLinearGradient(-bw*.3,-bh*.08,bw*.3,bh*.2);
  tg.addColorStop(0,headColor||'#8faa75'); tg.addColorStop(1,bodyColor||'#5a7848');
  ctx.fillStyle=tg; ctx.beginPath(); ctx.ellipse(0,bh*.04,bw*.28,bh*.24,0,0,Math.PI*2); ctx.fill();
  // Arms
  const armSw=Math.sin(t*0.32+Math.PI)*10*scale;
  ctx.strokeStyle=bodyColor||'#7a9966'; ctx.lineWidth=5*scale; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-bw*.22,-bh*.07); ctx.quadraticCurveTo(-bw*.44,-bh*.05+armSw*.02,-bw*.4,bh*.1-armSw*.02); ctx.stroke();
  const wv=Math.sin(t*0.14)*4*scale;
  ctx.beginPath(); ctx.moveTo(bw*.22,-bh*.07); ctx.quadraticCurveTo(bw*.46,-bh*.14+wv*.04,bw*.48,-bh*.22+wv*.05); ctx.stroke();
  // Head
  const hg=ctx.createRadialGradient(-bw*.1,-bh*.4,0,0,-bh*.36,bw*.36);
  hg.addColorStop(0,headColor||'#b5c9a0'); hg.addColorStop(1,bodyColor||'#5a7848');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.ellipse(0,-bh*.36,bw*.36,bh*.28,0,0,Math.PI*2); ctx.fill();
  // Head bumps
  ctx.fillStyle=bodyColor||'#7a9966';
  ctx.beginPath(); ctx.ellipse(-bw*.17,-bh*.6,bw*.09,bh*.05,-0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bw*.17,-bh*.6,bw*.09,bh*.05,0.2,0,Math.PI*2); ctx.fill();
  // Eyes
  const blink=(t%120<5)?.18:1;
  const eW=bw*.2,eH=bh*.15*blink;
  ctx.fillStyle=eyeColor||'#080808';
  ctx.beginPath(); ctx.ellipse(-bw*.15,-bh*.4,eW,eH,-0.25,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bw*.15,-bh*.4,eW,eH,0.25,0,Math.PI*2); ctx.fill();
  if(blink>.5&&eyeColor!=='#ffffff'){
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-bw*.21,-bh*.44,bw*.045,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bw*.09,-bh*.44,bw*.045,0,Math.PI*2); ctx.fill();
  } else if(eyeColor==='#ffffff'){
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(-bw*.15,-bh*.4,eW*.5,eH*.5,-0.25,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bw*.15,-bh*.4,eW*.5,eH*.5,0.25,0,Math.PI*2); ctx.fill();
  }
}

// ═══ POWER-UP SYSTEM ══════════════════════════════════════════
const PU={
  DURATION:300,active:{},
  activate(type){this.active[type]=this.DURATION;SFX.play(type==='shield'?'shield':'powerup');this.updateHUD();},
  update(){Object.keys(this.active).forEach(k=>{this.active[k]--;if(this.active[k]<=0)delete this.active[k];});this.updateHUD();},
  has(type){return(this.active[type]||0)>0;},
  updateHUD(){
    const slots={magnet:'puMagnet',speed:'puSpeed',shield:'puShield',star:'puStar'};
    const timers={magnet:'puMagnetTimer',speed:'puSpeedTimer',shield:'puShieldTimer',star:'puStarTimer'};
    const cls={magnet:'active-magnet',speed:'active-speed',shield:'active-shield',star:'active-star'};
    Object.entries(slots).forEach(([type,slotId])=>{
      const slot=document.getElementById(slotId),timer=document.getElementById(timers[type]);
      if(this.active[type]){slot.classList.remove('hidden');slot.classList.add(cls[type]);timer.textContent=Math.ceil(this.active[type]/60)+'s';}
      else{slot.classList.add('hidden');slot.classList.remove(cls[type]);}
    });
  },
  reset(){this.active={};this.updateHUD();}
};

// ═══ ZONES ════════════════════════════════════════════════════
const ZONES=[
  {id:1,name:'🌃 NIGHT CITY',   skyTop:'#000d1a',skyBot:'#1a2a10',groundCol:'#1a2535',roadCol:'#111c26'},
  {id:2,name:'🏜️ DESERT STORM',skyTop:'#1a0800',skyBot:'#8a3a00',groundCol:'#5a3a10',roadCol:'#3a2008'},
  {id:3,name:'🪐 ALIEN PLANET', skyTop:'#080020',skyBot:'#1a0038',groundCol:'#1a0a30',roadCol:'#0e0420'},
  {id:4,name:'🚀 SPACE RACE',   skyTop:'#000005',skyBot:'#000818',groundCol:'#050520',roadCol:'#020210'},
];

// ═══ BELIEVER SYSTEM ══════════════════════════════════════════
const BELIEVER_MESSAGES = [
  { coins:5,  line1:'🔥 BULLISH!',          line2:'I BELIEVE',       line3:'$IBLV TO THE MOON' },
  { coins:10, line1:'🚀 TRUE BELIEVER',      line2:'10 IN A ROW!',    line3:'HODL FOREVER' },
  { coins:15, line1:'💎 DIAMOND HANDS',      line2:'YOU BELIEVE!',    line3:'15 COINS STRAIGHT' },
  { coins:20, line1:'👽 ALIEN APPROVED',     line2:'UNSTOPPABLE',     line3:'THE UNIVERSE SEES YOU' },
  { coins:25, line1:'⭐ COSMIC LEVEL',       line2:'25 COMBO!',       line3:'BORN TO BELIEVE' },
  { coins:30, line1:'🌌 GALACTIC GRINDER',   line2:'30 COINS!',       line3:'LEGENDARY BELIEVER' },
  { coins:50, line1:'🏆 THE ETERNAL ONE',    line2:'50 COINS!',       line3:'HALL OF FAME ENERGY' },
];
let coinStreakCount = 0;
let lastCoinTime = 0;

function checkBeliever(gameFrame){
  coinStreakCount++;
  lastCoinTime = gameFrame;
  const msg = [...BELIEVER_MESSAGES].reverse().find(m => coinStreakCount >= m.coins && coinStreakCount % m.coins === 0) || (coinStreakCount % 5 === 0 ? BELIEVER_MESSAGES[0] : null);
  if(msg && coinStreakCount % 5 === 0){
    showBelieverPopup(msg);
    SFX.play('believer');
  }
}

function showBelieverPopup(msg){
  const el=document.getElementById('believerPopup');
  el.innerHTML=`<span class="believer-line1">${msg.line1}</span><span class="believer-line2">${msg.line2}</span><span class="believer-line3">${msg.line3}</span>`;
  el.classList.remove('hidden');
  el.style.animation='none'; el.offsetHeight; el.style.animation='believerAnim 2.2s ease-out forwards';
  setTimeout(()=>el.classList.add('hidden'),2300);
}

// ═══ GAME ENGINE ══════════════════════════════════════════════
const Game={
  canvas:null,ctx:null,running:false,paused:false,
  W:0,H:0,frame:0,animId:null,
  score:0,coins:0,distance:0,lives:3,
  combo:0,comboTimer:0,maxCombo:0,
  speed:0,baseSpeed:4, // HARDER: reduced base speed ramp-up feels slower but is deadlier
  groundY:0,bgOff:0,bgOff2:0,bgOff3:0,moonX:0,
  player:null,obstacles:[],collectibles:[],particles:[],clouds:[],
  lastObs:0,lastCoin:0,lastPU:0,spawnGap:100, // HARDER: bigger initial gap but shrinks faster
  invincible:0,
  zone:1,zoneTimer:0,ZONE_DURATION:1500, // HARDER: zones advance faster
  charId:'grey',

  init(){this.canvas=document.getElementById('gameCanvas');this.ctx=this.canvas.getContext('2d');this.resize();window.addEventListener('resize',()=>this.resize());},
  resize(){this.canvas.width=window.innerWidth;this.canvas.height=window.innerHeight;this.W=this.canvas.width;this.H=this.canvas.height;this.groundY=this.H*0.78;},

  reset(){
    this.score=0;this.coins=0;this.distance=0;this.lives=3;
    this.combo=0;this.comboTimer=0;this.maxCombo=0;
    this.speed=2.5;this.baseSpeed=2.5; // Starts SLOW, ramps up gradually
    this.obstacles=[];this.collectibles=[];this.particles=[];this.clouds=[];
    this.frame=0;this.lastObs=0;this.lastCoin=0;this.lastPU=0;this.spawnGap=160; // wide gap at slow start
    this.bgOff=0;this.bgOff2=0;this.bgOff3=0;
    this.moonX=this.W*0.75;this.invincible=0;
    this.zone=1;this.zoneTimer=0;
    coinStreakCount=0;lastCoinTime=0;
    PU.reset();
    this.charId=DB.getEquipped(App.user)||'grey';
    this.initPlayer();this.initClouds();
    updateHUD();
  },

  initPlayer(){
    const charColors=CHAR_COLORS[this.charId]||CHAR_COLORS.grey;
    const hoverOffset=charColors.hover?-15:0;
    this.player={x:this.W*0.18,y:0,w:52,h:80,vy:0,onGround:true,jumping:false,doubleJump:false,frame:0,frameT:0,trail:[],hoverOffset};
    this.player.y=this.groundY-this.player.h+hoverOffset;
  },

  initClouds(){this.clouds=Array.from({length:6},(_,i)=>({x:(i/6)*this.W+Math.random()*200,y:this.H*(0.06+Math.random()*0.22),w:70+Math.random()*90,h:28+Math.random()*22,spd:0.4+Math.random()*0.9}));},

  jump(){
    const p=this.player;
    const colors=CHAR_COLORS[this.charId]||CHAR_COLORS.grey;
    const jumpMult=colors.lowGrav?0.019:this.charId==='wobble'?0.026:0.022; // Moon-Walker / Wobble
    if(p.onGround){
      p.vy=-(this.H*jumpMult);p.onGround=false;p.jumping=true;p.doubleJump=false;
      this.spawnParticles(p.x+p.w/2,p.y+p.h,colors.trail||'#00f5ff',6,'jump');
      SFX.play('jump');
    } else if(!p.doubleJump){
      p.vy=-(this.H*(jumpMult*0.82));p.doubleJump=true;
      this.spawnParticles(p.x+p.w/2,p.y+p.h/2,'#bf00ff',8,'jump');
      SFX.play('djump');
    }
  },

  update(){
    if(!this.running||this.paused) return;
    this.frame++;

    // HARDER: speed ramps faster, no cap reduction
    const charColors=CHAR_COLORS[this.charId]||CHAR_COLORS.grey;
    const speedMult=charColors.plasma?1.15:PU.has('speed')?1.6:1;
    // SPEED CURVE: slow (0-10s) → medium (10-30s) → fast (30s+) → max cap
    // Phase 1: 0-600 frames (~10s): gentle 2.5→5
    // Phase 2: 600-1800 frames (~30s): medium 5→10
    // Phase 3: 1800+ frames: fast 10→18
    let targetSpeed;
    if(this.frame < 600) {
      targetSpeed = 2.5 + (this.frame / 600) * 2.5; // 2.5 → 5
    } else if(this.frame < 1800) {
      targetSpeed = 5 + ((this.frame - 600) / 1200) * 5; // 5 → 10
    } else {
      targetSpeed = 10 + Math.min((this.frame - 1800) * 0.003, 8); // 10 → 18 cap
    }
    this.speed = Math.min(targetSpeed, 18) * speedMult;

    // Score: HARDER — score per frame reduced, need skill for high scores
    const starMult=PU.has('star')||this.charId==='eternal'?3:1;
    this.score+=Math.floor(this.speed*0.3*starMult); // was 0.5
    this.distance+=this.speed*0.05;

    // Zone progression
    this.zoneTimer++;
    if(this.zoneTimer>=this.ZONE_DURATION&&this.zone<4){
      this.zone++;this.zoneTimer=0;this.showZoneTransition();
      SFX.stopMusic();SFX.play('zone');
      setTimeout(()=>SFX.startMusic(this.zone),800);
    }

    // Background
    this.bgOff-=this.speed*0.25;this.bgOff2-=this.speed*0.55;this.bgOff3-=this.speed;
    this.moonX-=this.speed*0.05;if(this.moonX<-70)this.moonX=this.W+70;
    this.clouds.forEach(c=>{c.x-=c.spd*(this.speed*0.12);if(c.x+c.w<0)c.x=this.W+c.w;});

    // Player
    const p=this.player;
    const gravMult=charColors.lowGrav?0.00065:0.00105; // Moon-Walker floats
    p.vy+=this.H*gravMult; p.y+=p.vy;
    const hoverOff=charColors.hover?-15:0;
    const gl=this.groundY-p.h+hoverOff;
    if(p.y>=gl){p.y=gl;p.vy=0;p.onGround=true;p.jumping=false;}
    p.frameT++;if(p.frameT>=6){p.frame=(p.frame+1)%8;p.frameT=0;}
    p.trail.unshift({x:p.x+p.w/2,y:p.y+p.h/2,age:0});
    if(p.trail.length>10)p.trail.pop();
    p.trail.forEach(tr=>tr.age++);

    // Passive magnet (Galactic Emperor)
    const hasMagnet=PU.has('magnet')||this.charId==='emperor'||charColors.passiveMagnet;
    const magnetRange=this.charId==='emperor'?120:200;
    if(hasMagnet){
      this.collectibles.forEach(c=>{if(c.type!=='coin')return;const dx=(p.x+p.w/2)-(c.x+c.w/2),dy=(p.y+p.h/2)-(c.y+c.h/2),dist=Math.hypot(dx,dy);if(dist<magnetRange){c.x+=dx/dist*6;c.y+=dy/dist*6;}});
    }

    // Coin streak break
    if(this.frame-lastCoinTime>180&&coinStreakCount>0) coinStreakCount=0;

    // Spawn
    if(this.frame-this.lastObs>this.spawnGap){
      this.spawnObstacle();this.lastObs=this.frame;
      // HARDER: gap shrinks much faster
      // Spawn gap shrinks as game speeds up — fewer obstacles early
      if(this.frame < 600) this.spawnGap = Math.max(120, 160 - this.frame * 0.05);
      else if(this.frame < 1800) this.spawnGap = Math.max(60, 120 - (this.frame-600) * 0.04);
      else this.spawnGap = Math.max(35, 70 + Math.random() * 40 - (this.frame-1800) * 0.01);
    }
    if(this.frame-this.lastCoin>40){if(Math.random()<0.55)this.spawnCoin();this.lastCoin=this.frame;} // HARDER: fewer coins (was 0.65)
    if(this.frame-this.lastPU>420){if(Math.random()<0.4)this.spawnPowerup();this.lastPU=this.frame;} // HARDER: rarer powerups

    this.obstacles=this.obstacles.filter(o=>{o.x-=this.speed+(o.speedBonus||0);o.animFrame=(o.animFrame||0)+1;return o.x+o.w>-30;});
    this.collectibles=this.collectibles.filter(c=>{c.x-=this.speed;c.spin=(c.spin||0)+0.09;c.bob=(c.bob||0)+0.12;return c.x+c.w>-30;});
    this.particles=this.particles.filter(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.18;pt.life--;return pt.life>0;});
    PU.update();
    if(this.invincible>0)this.invincible--;
    if(this.comboTimer>0){this.comboTimer--;if(this.comboTimer<=0)this.combo=0;}

    // Cyborg radar flash
    if(charColors.metallic||this.charId==='cyborg'){
      const nearest=this.obstacles.find(o=>o.x-p.x<200&&o.x>p.x);
      if(nearest&&nearest.x-p.x<160){
        this.spawnParticles(p.x+p.w/2,p.y,'#ff0000',2,'jump');
      }
    }

    // Collisions
    if(this.invincible<=0){
      const hasShield=PU.has('shield');
      const isStar=PU.has('star')||this.charId==='eternal';
      for(const o of this.obstacles){
        if(rectsOvlp(p.x+8,p.y+8,p.w-16,p.h-10,o.x+4,o.y+4,o.w-8,o.h-6)){
          if(isStar){
            // Destroy obstacle
            this.spawnParticles(o.x+o.w/2,o.y+o.h/2,'#ffaa00',12,'explode');
            o.x=-1000;
          } else if(hasShield){
            delete PU.active['shield'];PU.updateHUD();
            this.invincible=60;
            this.spawnParticles(p.x+p.w/2,p.y+p.h/2,'#00aaff',15,'explode');
            SFX.play('shield');
          } else {
            this.hitObs();
          }
          break;
        }
      }
    }

    // Collect
    this.collectibles=this.collectibles.filter(c=>{
      if(rectsOvlp(p.x+4,p.y+4,p.w-8,p.h-8,c.x,c.y,c.w,c.h)){
        if(c.type==='coin') this.collectCoin(c);
        else this.collectPowerup(c);
        return false;
      }
      return true;
    });

    updateHUD();
  },

  hitObs(){
    this.lives--;this.invincible=90;this.combo=0;this.comboTimer=0;coinStreakCount=0;
    const p=this.player;
    this.spawnParticles(p.x+p.w/2,p.y+p.h/2,'#ff3333',22,'explode');
    SFX.play(this.lives<=0?'death':'hit');
    updateLives();
    if(this.lives<=0)setTimeout(()=>this.endGame(),500);
  },

  collectCoin(c){
    this.coins++;this.combo++;this.comboTimer=130;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
    const charColors=CHAR_COLORS[this.charId]||CHAR_COLORS.grey;
    const starMult=PU.has('star')||this.charId==='eternal'?2:1;
    // HARDER: combo bonus requires longer streaks
    const bonus=this.combo>=10?this.combo*8:this.combo>=5?this.combo*5:this.combo>=3?this.combo*3:8;
    this.score+=bonus*starMult;
    this.spawnParticles(c.x+c.w/2,c.y+c.h/2,'#ffd700',10,'coin');
    SFX.play(this.combo>=5?'combo':'coin');
    showScorePopup(c.x,c.y,`+${bonus*starMult}${this.combo>2?' x'+this.combo:''}`,'#ffd700');
    checkBeliever(this.frame);
  },

  collectPowerup(c){
    PU.activate(c.puType);
    this.spawnParticles(c.x+c.w/2,c.y+c.h/2,c.color||'#fff',16,'explode');
    showScorePopup(c.x,c.y,c.label,'#fff');
  },

  spawnParticles(x,y,color,n,type){
    for(let i=0;i<n;i++){
      const a=(Math.PI*2*i/n)+Math.random()*0.5;
      const spd=type==='coin'?2+Math.random()*3:type==='jump'?2+Math.random()*2:3+Math.random()*5;
      this.particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-(type==='coin'?2:0),color,life:20+Math.random()*15,maxLife:35,r:type==='coin'?4:3});
    }
  },

  spawnCoin(){
    const pats=['line','arc','single','double','wave'];
    const pat=pats[Math.floor(Math.random()*pats.length)];
    const baseY=this.groundY-80-Math.random()*65,bx=this.W+20;
    const mk=(x,y)=>({x,y,w:28,h:28,spin:0,bob:Math.random()*Math.PI*2,type:'coin'});
    if(pat==='single') this.collectibles.push(mk(bx,baseY));
    else if(pat==='line') for(let i=0;i<5;i++)this.collectibles.push(mk(bx+i*36,baseY));
    else if(pat==='arc') for(let i=0;i<5;i++)this.collectibles.push(mk(bx+i*36,baseY-Math.sin(i/4*Math.PI)*55));
    else if(pat==='double') for(let i=0;i<4;i++){this.collectibles.push(mk(bx+i*36,baseY));this.collectibles.push(mk(bx+i*36,baseY-46));}
    else for(let i=0;i<6;i++)this.collectibles.push(mk(bx+i*36,baseY-Math.sin(i/5*Math.PI*2)*50));
  },

  spawnPowerup(){
    const types=[{puType:'magnet',label:'🧲 MAGNET!',color:'#ff66ff',emoji:'🧲'},{puType:'speed',label:'⚡ SPEED!',color:'#ffee00',emoji:'⚡'},{puType:'shield',label:'🛡️ SHIELD!',color:'#00aaff',emoji:'🛡️'},{puType:'star',label:'⭐ STAR!',color:'#ffaa00',emoji:'⭐'}];
    const t=types[Math.floor(Math.random()*types.length)];
    const y=this.groundY-80-Math.random()*60;
    this.collectibles.push({x:this.W+20,y,w:36,h:36,spin:0,bob:0,type:'powerup',...t});
  },

  spawnObstacle(){
    const all=['ufo','trashCan','barrier','hydrant','car','enemyAlien','meteor','laserBeam','cone','crate','highVoltage','portal','rockSlide','sawBlade','iceBlock'];
    const pool=this.zone<2?all.filter(t=>t!=='laserBeam'&&t!=='meteor'):all;
    const type=pool[Math.floor(Math.random()*pool.length)];
    const gY=this.groundY,bx=this.W+30;
    // HARDER: faster obstacles
    const cfgs={
      ufo:{w:80,h:36,y:gY-190-Math.random()*60,speedBonus:1.8},
      trashCan:{w:40,h:60,y:gY-60,speedBonus:0.5},
      barrier:{w:120,h:22,y:gY-22,speedBonus:0.5},
      hydrant:{w:36,h:50,y:gY-50,speedBonus:0},
      car:{w:110,h:50,y:gY-50,speedBonus:3.5},
      enemyAlien:{w:50,h:70,y:gY-70,speedBonus:1.5},
      meteor:{w:46,h:46,y:40+Math.random()*(gY-200),speedBonus:4},
      laserBeam:{w:20,h:gY*0.28,y:gY-gY*0.28,speedBonus:0.5},
      cone:{w:36,h:54,y:gY-54,speedBonus:0},
      crate:{w:54,h:54,y:gY-54,speedBonus:0.5},
      highVoltage:{w:42,h:72,y:gY-72,speedBonus:0.5},
      portal:{w:50,h:90,y:gY-90,speedBonus:1},
      rockSlide:{w:60,h:50,y:gY-50,speedBonus:1.5},
      sawBlade:{w:52,h:52,y:gY-52-Math.random()*60,speedBonus:2},
      iceBlock:{w:55,h:45,y:gY-45,speedBonus:1},
    };
    const cfg=cfgs[type]||cfgs.crate;
    this.obstacles.push({type,x:bx,...cfg,animFrame:0});
  },

  showZoneTransition(){
    const zone=ZONES[this.zone-1];
    const el=document.getElementById('zoneTransition');
    el.textContent=zone.name; el.classList.remove('hidden');
    el.style.animation='none';el.offsetHeight;el.style.animation='zonePop 2.5s ease-out forwards';
    setTimeout(()=>el.classList.add('hidden'),2600);
  },

  draw(){
    const ctx=this.ctx,W=this.W,H=this.H;
    ctx.clearRect(0,0,W,H);
    this.drawBg();this.drawGround();this.drawClouds();
    this.drawParticles();this.drawCollectibles();this.drawObstacles();this.drawPlayer();
  },

  drawBg(){
    const ctx=this.ctx,W=this.W,H=this.H,z=ZONES[this.zone-1];
    const sky=ctx.createLinearGradient(0,0,0,H*0.78);
    sky.addColorStop(0,z.skyTop);sky.addColorStop(1,z.skyBot);
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*0.78);
    if(this.zone<=2){ctx.fillStyle='rgba(255,255,255,0.7)';for(let i=0;i<80;i++){const sx=((i*137.5+this.bgOff*0.04)%W+W)%W,sy=(i*73.1)%(H*0.52),b=0.5+0.5*Math.sin(this.frame*0.03+i);ctx.globalAlpha=b*0.75;ctx.beginPath();ctx.arc(sx,sy,i%3===0?1.5:0.8,0,Math.PI*2);ctx.fill();}}
    if(this.zone>=3){for(let i=0;i<50;i++){const sx=((i*197+this.bgOff*0.04)%W+W)%W,sy=(i*61)%(H*0.55),b=0.4+0.4*Math.sin(this.frame*0.04+i);ctx.globalAlpha=b*0.5;ctx.fillStyle=i%3===0?'#ff44ff':i%3===1?'#44ffff':'#ffff44';ctx.beginPath();ctx.arc(sx,sy,i%4===0?2:1,0,Math.PI*2);ctx.fill();}}
    ctx.globalAlpha=1;
    const mx=this.moonX,my=H*0.12;
    if(this.zone<=2){const mg=ctx.createRadialGradient(mx,my,0,mx,my,88);mg.addColorStop(0,'rgba(255,245,200,0.22)');mg.addColorStop(1,'transparent');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,88,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.zone===2?'#e8c090':'#f0e8c0';ctx.beginPath();ctx.arc(mx,my,40,0,Math.PI*2);ctx.fill();}
    else{const pg=ctx.createRadialGradient(mx,my,0,mx,my,55);pg.addColorStop(0,'#8844ff');pg.addColorStop(0.5,'#4422aa');pg.addColorStop(1,'#221166');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(mx,my,55,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(160,100,255,0.5)';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(mx,my,80,20,0.3,0,Math.PI*2);ctx.stroke();}
    this.drawBldgLayer(ctx,W,H,this.bgOff*0.18,H*0.67,this.zone===2?'#3a1800':this.zone>=3?'#0a0020':'#0a1520',0.55,11);
    this.drawBldgLayer(ctx,W,H,this.bgOff*0.48,H*0.62,this.zone===2?'#4a2205':this.zone>=3?'#0f0030':'#0d1e2e',0.85,13,true);
    this.drawBldgLayer(ctx,W,H,this.bgOff,H*0.57,this.zone===2?'#5a2808':this.zone>=3?'#150040':'#0f2030',1.15,17,true,true);
  },

  drawBldgLayer(ctx,W,H,off,baseY,color,scale,seed,windows,near){
    const repeat=W*2.5,r=mulberry32(seed*100);
    ctx.fillStyle=color; let bx=0;
    while(bx<W*2.5){
      const bw=(r()*0.09+0.04)*W*scale,bh=(r()*0.22+0.05)*H*scale;
      const dx=((bx-((off%repeat)+repeat)%repeat)%repeat+repeat)%repeat-W*0.3;
      ctx.fillRect(dx,baseY-bh,bw,bh+H*0.4);
      if(windows){ctx.fillStyle=this.zone===2?'rgba(255,180,80,0.5)':this.zone>=3?'rgba(180,100,255,0.55)':'rgba(255,230,100,0.52)';for(let wy=baseY-bh+8;wy<baseY-12;wy+=9)for(let wx=dx+5;wx<dx+bw-5;wx+=9)if((Math.floor((wy+wx)/6)%3)!==0)ctx.fillRect(wx,wy,4,4);ctx.fillStyle=color;}
      if(near&&r()<0.3){ctx.fillStyle=color;ctx.fillRect(dx+bw*.45,baseY-bh-16,4,18);ctx.fillStyle=this.zone>=3?'rgba(180,0,255,0.8)':'rgba(255,50,50,0.8)';ctx.beginPath();ctx.arc(dx+bw*.45+2,baseY-bh-18,4,0,Math.PI*2);ctx.fill();}
      bx+=bw+r()*12;
    }
  },

  drawGround(){
    const ctx=this.ctx,W=this.W,H=this.H,gY=this.groundY,z=ZONES[this.zone-1];
    ctx.fillStyle=z.groundCol;ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle=z.roadCol;ctx.fillRect(0,gY+28,W,H-gY-28);
    ctx.strokeStyle=this.zone===2?'rgba(120,60,0,0.4)':this.zone>=3?'rgba(80,0,150,0.4)':'rgba(40,60,80,0.5)';ctx.lineWidth=1;
    const sLS=62,sLO=((this.bgOff3%sLS)+sLS)%sLS;
    for(let lx=-sLS+sLO;lx<W+sLS;lx+=sLS){ctx.beginPath();ctx.moveTo(lx,gY);ctx.lineTo(lx,gY+28);ctx.stroke();}
    ctx.strokeStyle=this.zone===2?'rgba(255,160,0,0.5)':this.zone>=3?'rgba(180,0,255,0.5)':'rgba(255,255,100,0.45)';
    ctx.lineWidth=4;ctx.setLineDash([42,42]);ctx.lineDashOffset=this.bgOff3;
    ctx.beginPath();ctx.moveTo(0,gY+(H-gY)*0.55);ctx.lineTo(W,gY+(H-gY)*0.55);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=this.zone>=3?'rgba(180,0,255,0.18)':'rgba(255,255,255,0.14)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,gY);ctx.lineTo(W,gY);ctx.stroke();
    const lmpS=220,lmpO=((this.bgOff3%lmpS)+lmpS)%lmpS;
    for(let lx=-lmpS+lmpO;lx<W+lmpS;lx+=lmpS)this.drawLamp(ctx,lx,gY);
  },

  drawLamp(ctx,x,gY){
    const col=this.zone>=3?'#2a1050':'#334455',lCol=this.zone>=3?'rgba(180,80,255,0.28)':'rgba(255,230,120,0.28)',bCol=this.zone>=3?'#cc88ff':'#ffee88';
    ctx.strokeStyle=col;ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(x,gY);ctx.lineTo(x,gY-90);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,gY-90);ctx.lineTo(x+32,gY-90);ctx.stroke();
    const lg=ctx.createRadialGradient(x+32,gY-90,0,x+32,gY-90,42);lg.addColorStop(0,lCol);lg.addColorStop(1,'transparent');
    ctx.fillStyle=lg;ctx.beginPath();ctx.arc(x+32,gY-90,42,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=bCol;ctx.beginPath();ctx.arc(x+32,gY-90,6,0,Math.PI*2);ctx.fill();
  },

  drawClouds(){
    const ctx=this.ctx;
    this.clouds.forEach(c=>{
      const a=this.zone>=3?'rgba(80,40,120,0.14)':this.zone===2?'rgba(160,80,30,0.1)':'rgba(100,140,200,0.1)';
      ctx.fillStyle=a;ctx.beginPath();ctx.ellipse(c.x+c.w*.5,c.y,c.w*.5,c.h*.4,0,0,Math.PI*2);ctx.ellipse(c.x+c.w*.3,c.y+5,c.w*.4,c.h*.35,0,0,Math.PI*2);ctx.ellipse(c.x+c.w*.7,c.y+5,c.w*.3,c.h*.3,0,0,Math.PI*2);ctx.fill();
    });
  },

  drawParticles(){
    const ctx=this.ctx;
    this.particles.forEach(pt=>{ctx.globalAlpha=pt.life/pt.maxLife;ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r*(pt.life/pt.maxLife)+1,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  },

  drawCollectibles(){
    const ctx=this.ctx;
    this.collectibles.forEach(c=>{
      if(c.type==='powerup'){this.drawPowerup(ctx,c);return;}
      const bY=Math.sin(c.bob)*7,cx=c.x+c.w/2,cy=c.y+c.h/2+bY,r=c.w/2;
      const gl=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.2);gl.addColorStop(0,'rgba(255,215,0,0.35)');gl.addColorStop(1,'transparent');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(cx,cy,r*2.2,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(cx,cy);ctx.scale(Math.abs(Math.cos(c.spin)),1);
      const cBg=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);cBg.addColorStop(0,'#ebebeb');cBg.addColorStop(0.5,'#cccccc');cBg.addColorStop(1,'#888');
      ctx.fillStyle=cBg;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#8a8a8a';ctx.beginPath();ctx.arc(-r*.08,0,r*.65,Math.PI*.38,Math.PI*1.62);ctx.arc(r*.28,0,r*.52,Math.PI*1.62,Math.PI*.38,true);ctx.fill();
      ctx.strokeStyle='#666';ctx.lineWidth=0.8;ctx.beginPath();ctx.arc(0,0,r*.52,0,Math.PI*2);ctx.stroke();
      ctx.restore();
      ctx.save();ctx.shadowColor='#ffd700';ctx.shadowBlur=9;ctx.fillStyle='#ffe000';ctx.font=`900 ${r*.64}px Orbitron,sans-serif`;ctx.textAlign='center';ctx.fillText('I Believe',cx,cy+r+r*.66);ctx.restore();ctx.textAlign='left';
    });
  },

  drawPowerup(ctx,c){
    const bY=Math.sin(c.bob*.8)*8,cx=c.x+c.w/2,cy=c.y+c.h/2+bY,r=c.w/2;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.5);glow.addColorStop(0,c.color+'88');glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,r*2.5,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(c.spin);
    const bg=ctx.createRadialGradient(-r*.2,-r*.2,0,0,0,r);bg.addColorStop(0,'#fff');bg.addColorStop(0.5,c.color);bg.addColorStop(1,'#111');
    ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.font=`${r*1.1}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.emoji,cx,cy);ctx.textAlign='left';ctx.textBaseline='alphabetic';
  },

  drawObstacles(){this.obstacles.forEach(o=>this.drawObs(this.ctx,o));},

  drawObs(ctx,o){
    switch(o.type){
      case 'ufo':drawUFO(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'trashCan':drawTrashCan(ctx,o.x,o.y,o.w,o.h);break;
      case 'barrier':drawBarrier(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'hydrant':drawHydrant(ctx,o.x,o.y,o.w,o.h);break;
      case 'car':drawCar(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'enemyAlien':drawEnemyAlien(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'meteor':drawMeteor(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'laserBeam':drawLaser(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'cone':drawCone(ctx,o.x,o.y,o.w,o.h);break;
      case 'crate':drawCrate(ctx,o.x,o.y,o.w,o.h);break;
      case 'highVoltage':drawHighVoltage(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'portal':drawPortal(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'rockSlide':drawRockSlide(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'sawBlade':drawSawBlade(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
      case 'iceBlock':drawIceBlock(ctx,o.x,o.y,o.w,o.h,o.animFrame);break;
    }
  },

  drawPlayer(){
    const ctx=this.ctx,p=this.player,t=this.frame;
    const charColors=CHAR_COLORS[this.charId]||CHAR_COLORS.grey;
    if(this.invincible>0&&Math.floor(this.invincible/5)%2===0) return;

    // Shield aura
    if(PU.has('shield')){ctx.save();const sa=ctx.createRadialGradient(p.x+p.w/2,p.y+p.h/2,0,p.x+p.w/2,p.y+p.h/2,p.w*.75);sa.addColorStop(0,'rgba(0,170,255,0.22)');sa.addColorStop(1,'rgba(0,170,255,0)');ctx.fillStyle=sa;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w*.75,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,200,255,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w*.7,0,Math.PI*2);ctx.stroke();ctx.restore();}
    // Star aura
    if(PU.has('star')||this.charId==='eternal'){ctx.save();const ra=ctx.createRadialGradient(p.x+p.w/2,p.y+p.h/2,0,p.x+p.w/2,p.y+p.h/2,p.w);ra.addColorStop(0,'rgba(255,200,0,0.35)');ra.addColorStop(1,'transparent');ctx.fillStyle=ra;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w,0,Math.PI*2);ctx.fill();ctx.restore();}
    // Magnet field
    if(PU.has('magnet')||(charColors.passiveMagnet&&this.charId==='emperor')){ctx.save();ctx.strokeStyle='rgba(255,0,255,0.2)';ctx.lineWidth=1.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,120,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}

    // Trail
    p.trail.forEach((tr,i)=>{
      const a=(1-tr.age/10)*0.28;
      ctx.globalAlpha=a;
      ctx.fillStyle=charColors.trail||'#00f5ff';
      if(charColors.neonTrail){ctx.shadowColor=charColors.trail;ctx.shadowBlur=8;}
      ctx.beginPath();ctx.ellipse(tr.x,tr.y,8*(1-i/10),12*(1-i/10),0,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    });
    ctx.globalAlpha=1;

    ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);

    // Plasma body electric effect
    if(charColors.plasma){
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*0.09;const r=p.w*.5+Math.sin(t*.18+i)*p.w*.12;ctx.fillStyle=`rgba(0,${60+i*20},255,${0.2+0.1*Math.sin(t*.12+i)})`;ctx.beginPath();ctx.arc(Math.cos(a)*r*.25,Math.sin(a)*r*.22,2.5,0,Math.PI*2);ctx.fill();}
    }

    drawAlienBase(ctx,p.w,p.h,t,1.0,charColors.body||'#8a9870',charColors.head||'#b5c9a0',charColors.eye||'#080808',this.charId,charColors);

    // Crown for emperor
    if(charColors.crown||this.charId==='emperor'){
      ctx.fillStyle='#ffd700';
      const cy_=-p.h*.78;
      ctx.beginPath();ctx.moveTo(-p.w*.25,cy_+p.h*.06);ctx.lineTo(-p.w*.25,cy_);ctx.lineTo(-p.w*.1,cy_-p.h*.06);ctx.lineTo(0,cy_);ctx.lineTo(p.w*.1,cy_-p.h*.06);ctx.lineTo(p.w*.25,cy_);ctx.lineTo(p.w*.25,cy_+p.h*.06);ctx.closePath();ctx.fill();
      ['#ff3333','#00ffff','#ffffff'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(-p.w*.12+i*p.w*.12,cy_,3,0,Math.PI*2);ctx.fill();});
    }

    ctx.restore();
  },

  loop(){this.update();this.draw();if(this.running)this.animId=requestAnimationFrame(()=>this.loop());},

  endGame(){
    this.running=false;cancelAnimationFrame(this.animId);SFX.stopMusic();
    const updated=DB.updateScore(App.user,this.score,this.coins,Math.floor(this.distance));
    document.getElementById('finalScore').textContent=this.score.toLocaleString();
    document.getElementById('finalCoins').textContent=this.coins;
    document.getElementById('finalDistance').textContent=Math.floor(this.distance)+'m';
    document.getElementById('finalCombo').textContent=this.maxCombo+'x';
    const newBest=this.score>=updated.highScore;
    document.getElementById('newBestMsg').textContent=newBest?'★ NEW PERSONAL BEST! ★':`BEST: ${updated.highScore.toLocaleString()}`;
    document.getElementById('gameoverTitle').textContent=this.score>2000?'MISSION COMPLETE':'MISSION FAILED';
    document.getElementById('gameoverIcon').textContent=this.score>2000?'🛸':'💥';
    if(newBest)SFX.play('newbest');
    updateMenuWallet();
    showScreen('gameOverScreen');
  }
};

// ═══ OBSTACLE DRAWS ═══════════════════════════════════════════
function drawUFO(ctx,x,y,w,h,t){const cx=x+w/2,bY=y+Math.sin(t*.05)*6;const bg=ctx.createRadialGradient(cx,bY,0,cx,bY,w*.85);bg.addColorStop(0,'rgba(0,200,255,0.28)');bg.addColorStop(1,'transparent');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,bY,w*.85,0,Math.PI*2);ctx.fill();const beam=ctx.createLinearGradient(cx,bY+h*.35,cx,bY+h*.35+75);beam.addColorStop(0,'rgba(0,245,255,0.55)');beam.addColorStop(1,'rgba(0,245,255,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(cx-14,bY+h*.35);ctx.lineTo(cx+14,bY+h*.35);ctx.lineTo(cx+38,bY+h*.35+75);ctx.lineTo(cx-38,bY+h*.35+75);ctx.fill();const b2=ctx.createLinearGradient(cx-w*.5,bY-h*.2,cx+w*.5,bY+h*.2);b2.addColorStop(0,'#4a7a8a');b2.addColorStop(.5,'#7ab8cc');b2.addColorStop(1,'#3a5a6a');ctx.fillStyle=b2;ctx.beginPath();ctx.ellipse(cx,bY,w*.5,h*.3,0,0,Math.PI*2);ctx.fill();const dg=ctx.createRadialGradient(cx-w*.1,bY-h*.32,0,cx,bY-h*.22,w*.23);dg.addColorStop(0,'#cceecc');dg.addColorStop(1,'#336633');ctx.fillStyle=dg;ctx.beginPath();ctx.ellipse(cx,bY-h*.22,w*.22,h*.28,0,0,Math.PI*2);ctx.fill();const lc=['#ff3333','#33ff33','#3333ff','#ffff33','#ff66ff'];for(let i=0;i<5;i++){const la=(i/5)*Math.PI*2+t*.07;ctx.fillStyle=lc[i%lc.length];ctx.globalAlpha=.7+.3*Math.sin(t*.22+i);ctx.beginPath();ctx.arc(cx+Math.cos(la)*w*.44,bY+Math.sin(la)*h*.22,4,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
function drawTrashCan(ctx,x,y,w,h){ctx.fillStyle='#556677';ctx.beginPath();ctx.moveTo(x+4,y);ctx.lineTo(x+w-4,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.strokeStyle='#445566';ctx.lineWidth=3;[.3,.6].forEach(f=>{ctx.beginPath();ctx.moveTo(x,y+h*f);ctx.lineTo(x+w,y+h*f);ctx.stroke();});ctx.fillStyle='#667788';ctx.fillRect(x-3,y-7,w+6,9);ctx.fillRect(x+w*.3,y-12,w*.4,7);ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(x+6,y+4,6,h-8);}
function drawBarrier(ctx,x,y,w,h,t){ctx.fillStyle='#cc3300';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ffaa00';for(let i=0;i<4;i++)ctx.fillRect(x+i*(w/4),y,w/8,h);ctx.strokeStyle='#881100';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);['#ffff00','#ff8800'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+w*(.2+i*.6),y+h/2,5,0,Math.PI*2);ctx.fill();const blk=.6+.4*Math.sin(t*.15+i*Math.PI);ctx.globalAlpha=blk;ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(x+w*(.2+i*.6),y+h/2,5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});}
function drawHydrant(ctx,x,y,w,h){ctx.fillStyle='#cc2200';ctx.beginPath();ctx.roundRect(x+6,y+h*.2,w-12,h*.7,4);ctx.fill();ctx.beginPath();ctx.arc(x+w/2,y+h*.2,(w-12)/2,Math.PI,0);ctx.fill();ctx.fillStyle='#881500';ctx.beginPath();ctx.arc(x+w/2,y+h*.08,w*.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aa1800';ctx.fillRect(x,y+h*.35,8,12);ctx.fillRect(x+w-8,y+h*.35,8,12);ctx.fillStyle='#991100';ctx.fillRect(x+2,y+h*.85,w-4,h*.15);ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(x+10,y+h*.22,5,h*.5);}
function drawCar(ctx,x,y,w,h,t){ctx.fillStyle='rgba(0,0,0,0.28)';ctx.beginPath();ctx.ellipse(x+w/2,y+h+4,w*.4,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cc4400';ctx.beginPath();ctx.roundRect(x,y+h*.42,w,h*.58,[0,0,6,6]);ctx.fill();ctx.fillStyle='#ee5500';ctx.beginPath();ctx.moveTo(x+w*.15,y+h*.42);ctx.lineTo(x+w*.28,y);ctx.lineTo(x+w*.75,y);ctx.lineTo(x+w*.9,y+h*.42);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(150,230,255,0.6)';ctx.beginPath();ctx.moveTo(x+w*.3,y+h*.38);ctx.lineTo(x+w*.34,y+h*.06);ctx.lineTo(x+w*.54,y+h*.06);ctx.lineTo(x+w*.54,y+h*.38);ctx.fill();ctx.beginPath();ctx.moveTo(x+w*.56,y+h*.38);ctx.lineTo(x+w*.56,y+h*.06);ctx.lineTo(x+w*.72,y+h*.06);ctx.lineTo(x+w*.82,y+h*.38);ctx.fill();const hlG=ctx.createRadialGradient(x+w-5,y+h*.62,0,x+w-5,y+h*.62,22);hlG.addColorStop(0,'rgba(255,255,200,0.85)');hlG.addColorStop(1,'transparent');ctx.fillStyle=hlG;ctx.beginPath();ctx.arc(x+w-5,y+h*.62,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffcc';ctx.beginPath();ctx.ellipse(x+w-4,y+h*.62,9,5,0,0,Math.PI*2);ctx.fill();[.18,.78].forEach(wx=>{const wX=x+wx*w,wY=y+h;ctx.fillStyle='#111';ctx.beginPath();ctx.arc(wX,wY,h*.22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#333';ctx.beginPath();ctx.arc(wX,wY,h*.13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#888';ctx.lineWidth=2;for(let s=0;s<5;s++){const sa=t*.12+s*Math.PI*.4;ctx.beginPath();ctx.moveTo(wX,wY);ctx.lineTo(wX+Math.cos(sa)*h*.11,wY+Math.sin(sa)*h*.11);ctx.stroke();}});}
function drawEnemyAlien(ctx,x,y,w,h,t){const cx=x+w/2,bY=Math.sin(t*.08)*3;ctx.save();ctx.translate(cx,y+bY);ctx.fillStyle='#8a2020';ctx.beginPath();ctx.ellipse(0,h*.45,w*.28,h*.24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aa3030';ctx.beginPath();ctx.ellipse(0,h*.22,w*.36,h*.28,0,0,Math.PI*2);ctx.fill();const eg=ctx.createRadialGradient(-w*.12,h*.18,0,-w*.12,h*.18,w*.14);eg.addColorStop(0,'#ff4444');eg.addColorStop(1,'#880000');ctx.fillStyle=eg;ctx.beginPath();ctx.ellipse(-w*.12,h*.18,w*.14,h*.12,-0.2,0,Math.PI*2);ctx.fill();const eg2=ctx.createRadialGradient(w*.12,h*.18,0,w*.12,h*.18,w*.14);eg2.addColorStop(0,'#ff4444');eg2.addColorStop(1,'#880000');ctx.fillStyle=eg2;ctx.beginPath();ctx.ellipse(w*.12,h*.18,w*.14,h*.12,0.2,0,Math.PI*2);ctx.fill();const reach=Math.sin(t*.12)*9;ctx.strokeStyle='#992222';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-w*.25,h*.38);ctx.lineTo(-w*.55-reach,h*.5+reach);ctx.stroke();ctx.beginPath();ctx.moveTo(w*.25,h*.38);ctx.lineTo(w*.55+reach,h*.5+reach);ctx.stroke();ctx.strokeStyle='#771a1a';ctx.lineWidth=7;const ls=Math.sin(t*.16)*11;ctx.beginPath();ctx.moveTo(-w*.1,h*.65);ctx.lineTo(-w*.15,h+ls*.05);ctx.stroke();ctx.beginPath();ctx.moveTo(w*.1,h*.65);ctx.lineTo(w*.15,h-ls*.05);ctx.stroke();ctx.restore();}
function drawMeteor(ctx,x,y,w,h,t){const cx=x+w/2,cy=y+h/2;for(let i=0;i<6;i++){const ta=Math.PI*.25,tx=cx+Math.cos(ta)*i*13,ty=cy+Math.sin(ta)*i*13;ctx.globalAlpha=0.42-i*.065;ctx.fillStyle=`hsl(${22+i*9},90%,62%)`;ctx.beginPath();ctx.arc(tx,ty,w*.42-i*2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;const mg=ctx.createRadialGradient(cx-w*.12,cy-h*.12,0,cx,cy,w*.52);mg.addColorStop(0,'#fff5dd');mg.addColorStop(.4,'#ff6600');mg.addColorStop(1,'#662200');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(cx,cy,w*.52,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx+.1*w,cy-.22*h);ctx.lineTo(cx-.2*w,cy+.2*h);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-.1*w,cy+.1*h);ctx.lineTo(cx+.3*w,cy+.3*h);ctx.stroke();}
function drawLaser(ctx,x,y,w,h,t){const p=.6+.4*Math.sin(t*.22);ctx.fillStyle=`rgba(255,0,0,${.05*p})`;ctx.fillRect(x-22,y,62,h);ctx.save();ctx.fillStyle=`rgba(255,60,60,${.85*p})`;ctx.font='bold 9px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillText('LASER',x+w/2,y-12);ctx.restore();ctx.fillStyle=`rgba(255,60,60,${.18*p})`;ctx.fillRect(x-10,y,w+20,h);const bG=ctx.createLinearGradient(x,y,x+w,y);bG.addColorStop(0,`rgba(255,80,80,${p})`);bG.addColorStop(.5,`rgba(255,220,220,${p})`);bG.addColorStop(1,`rgba(255,80,80,${p})`);ctx.fillStyle=bG;ctx.fillRect(x-4,y,w+8,h);for(let i=0;i<4;i++){const py=y+(t*2.8+i*(h/4))%h;ctx.fillStyle=`rgba(255,220,220,${.92*p})`;ctx.beginPath();ctx.arc(x+w/2,py,3,0,Math.PI*2);ctx.fill();}ctx.fillStyle=`rgba(255,80,0,${.72*p})`;ctx.beginPath();ctx.moveTo(x-14,y+h/2-8);ctx.lineTo(x-4,y+h/2);ctx.lineTo(x-14,y+h/2+8);ctx.fill();}
function drawCone(ctx,x,y,w,h){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(x+w/2,y+h+2,w*.45,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff6600';ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';[[.28,.6],[.52,.76]].forEach(([t1,t2])=>{ctx.beginPath();ctx.moveTo(x+(w/2)*t1,y+h*t1);ctx.lineTo(x+w/2+(w/2)*t1,y+h*t1);ctx.lineTo(x+w/2+(w/2)*t2,y+h*t2);ctx.lineTo(x+(w/2)*t2,y+h*t2);ctx.fill();});ctx.fillStyle='#cc4400';ctx.fillRect(x-4,y+h-8,w+8,10);}
function drawCrate(ctx,x,y,w,h){ctx.fillStyle='#8b6914';ctx.fillRect(x,y,w,h);ctx.fillStyle='#a07820';for(let i=0;i<3;i++)ctx.fillRect(x+2,y+2+i*(h/3),w-4,h/3-2);ctx.strokeStyle='#5a4010';ctx.lineWidth=3;ctx.strokeRect(x+3,y+3,w-6,h-6);ctx.beginPath();ctx.moveTo(x,y+h/2);ctx.lineTo(x+w,y+h/2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);ctx.stroke();ctx.fillStyle='#888';[[0,0],[w-10,0],[0,h-10],[w-10,h-10]].forEach(([ox,oy])=>ctx.fillRect(x+ox,y+oy,10,10));ctx.fillStyle='rgba(255,255,0,0.7)';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('⚠',x+w/2,y+h/2+4);ctx.textAlign='left';}
function drawHighVoltage(ctx,x,y,w,h,t){const cx=x+w/2;ctx.fillStyle='#4a4a4a';ctx.fillRect(cx-4,y,8,h);[.3,.7].forEach(yf=>{ctx.fillStyle='#888';ctx.beginPath();ctx.ellipse(cx,y+h*yf,w*.35,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(cx,y+h*yf,w*.28,4,0,0,Math.PI*2);ctx.fill();});ctx.strokeStyle='#333';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-20,y+h*.3);ctx.lineTo(x+w+20,y+h*.3);ctx.stroke();ctx.beginPath();ctx.moveTo(x-20,y+h*.7);ctx.lineTo(x+w+20,y+h*.7);ctx.stroke();const sp=Math.sin(t*.32);if(sp>.45){ctx.strokeStyle=`rgba(255,255,100,${sp})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,y+h*.3);ctx.lineTo(cx+8,y+h*.45);ctx.lineTo(cx-8,y+h*.55);ctx.lineTo(cx,y+h*.7);ctx.stroke();ctx.fillStyle=`rgba(255,255,100,${sp*.45})`;ctx.beginPath();ctx.arc(cx,y+h*.5,8*sp,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#ffff00';ctx.beginPath();ctx.moveTo(cx,y+h*.03);ctx.lineTo(cx+13,y+h*.17);ctx.lineTo(cx-13,y+h*.17);ctx.closePath();ctx.fill();ctx.fillStyle='#000';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('⚡',cx,y+h*.16);ctx.textAlign='left';}
function drawPortal(ctx,x,y,w,h,t){const cx=x+w/2,cy=y+h/2;for(let i=3;i>=0;i--){ctx.strokeStyle=`rgba(191,0,255,${.16-i*.03})`;ctx.lineWidth=7-i;ctx.beginPath();ctx.arc(cx,cy,(w/2)*(1+i*.15),0,Math.PI*2);ctx.stroke();}ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.045);ctx.strokeStyle='#bf00ff';ctx.lineWidth=3;ctx.setLineDash([22,12]);ctx.beginPath();ctx.arc(0,0,w*.46,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();const v=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.38);v.addColorStop(0,'#00001c');v.addColorStop(.5,'rgba(55,0,110,.85)');v.addColorStop(1,'rgba(191,0,255,.65)');ctx.fillStyle=v;ctx.beginPath();ctx.arc(cx,cy,w*.38,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate(t*-.065);ctx.strokeStyle='rgba(200,100,255,0.55)';ctx.lineWidth=1.5;for(let s=0;s<4;s++){ctx.beginPath();for(let a=0;a<Math.PI*4;a+=0.12){const r2=(w*.36)*(a/(Math.PI*4)),sa=a+s*Math.PI*.5;if(a===0)ctx.moveTo(Math.cos(sa)*r2,Math.sin(sa)*r2);else ctx.lineTo(Math.cos(sa)*r2,Math.sin(sa)*r2);}ctx.stroke();}ctx.restore();}
function drawRockSlide(ctx,x,y,w,h,t){const shake=Math.sin(t*.25)*2;[[0,0,22],[w*.3,-8,18],[w*.6,0,20],[w*.15,h*.4,14],[w*.5,h*.38,16]].forEach(([ox,oy,r])=>{const rg=ctx.createRadialGradient(x+ox-r*.3+shake,y+oy-r*.3,0,x+ox+shake,y+oy,r);rg.addColorStop(0,'#aaa');rg.addColorStop(.6,'#777');rg.addColorStop(1,'#444');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x+ox+shake,y+oy,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+ox+shake,y+oy,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(x+ox+shake-r*.3,y+oy-r*.3,r*.3,0,Math.PI*2);ctx.fill();});for(let i=0;i<5;i++){const da=(t*.2+i)*.8,dr=8+i*3;ctx.globalAlpha=.2+.1*Math.sin(t*.3+i);ctx.fillStyle='#ccc';ctx.beginPath();ctx.arc(x+i*w*.22+Math.cos(da)*4,y+h+dr,5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
function drawSawBlade(ctx,x,y,w,h,t){const cx=x+w/2,cy=y+h/2,r=w/2;const gl=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.4);gl.addColorStop(0,'rgba(255,120,0,0.3)');gl.addColorStop(1,'transparent');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(cx,cy,r*1.4,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.18);ctx.fillStyle='#cc8800';for(let i=0;i<12;i++){ctx.save();ctx.rotate(i/12*Math.PI*2);ctx.beginPath();ctx.moveTo(0,-r*.55);ctx.lineTo(r*.18,-r*.82);ctx.lineTo(-r*.18,-r*.82);ctx.closePath();ctx.fill();ctx.restore();}const bg=ctx.createRadialGradient(-r*.15,-r*.15,0,0,0,r*.55);bg.addColorStop(0,'#eecc66');bg.addColorStop(.6,'#cc9900');bg.addColorStop(1,'#886600');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=2;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,0);const a=i/6*Math.PI*2;ctx.lineTo(Math.cos(a)*r*.48,Math.sin(a)*r*.48);ctx.stroke();}ctx.fillStyle='#884400';ctx.beginPath();ctx.arc(0,0,r*.2,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawIceBlock(ctx,x,y,w,h,t){const pulse=.7+.3*Math.sin(t*.15);ctx.fillStyle='rgba(0,50,150,0.18)';ctx.beginPath();ctx.ellipse(x+w/2,y+h+3,w*.4,5,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.shadowColor='rgba(0,200,255,0.6)';ctx.shadowBlur=12*pulse;const ig=ctx.createLinearGradient(x,y,x+w,y+h);ig.addColorStop(0,'rgba(180,240,255,0.95)');ig.addColorStop(.4,'rgba(100,200,255,0.85)');ig.addColorStop(1,'rgba(20,100,200,0.9)');ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();ctx.restore();ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+w*.3,y+4);ctx.lineTo(x+w*.15,y+h*.55);ctx.lineTo(x+w*.4,y+h*.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w*.7,y+8);ctx.lineTo(x+w*.82,y+h*.45);ctx.lineTo(x+w*.6,y+h*.78);ctx.stroke();ctx.fillStyle='rgba(255,255,255,0.22)';ctx.beginPath();ctx.roundRect(x+4,y+4,w*.35,h*.4,3);ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1.5;const sx=x+w/2,sy=y+h/2;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(a)*10,sy+Math.sin(a)*10);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*6,sy+Math.sin(a)*6);ctx.lineTo(sx+Math.cos(a+.5)*9,sy+Math.sin(a+.5)*9);ctx.stroke();}}

// ═══ HELPERS ══════════════════════════════════════════════════
function rectsOvlp(x1,y1,w1,h1,x2,y2,w2,h2){return x1<x2+w2&&x1+w1>x2&&y1<y2+h2&&y1+h1>y2;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function updateHUD(){
  document.getElementById('scoreDisplay').textContent=Game.score.toLocaleString();
  document.getElementById('coinDisplay').textContent=Game.coins;
  const p=DB.get(App.user);
  document.getElementById('bestDisplay').textContent=(p?Math.max(p.highScore,Game.score):Game.score).toLocaleString();
  document.getElementById('zoneDisplay').textContent=ZONES[Game.zone-1].name;
  const combo=document.getElementById('comboDisplay');
  combo.textContent=Game.combo>=3?`COMBO x${Game.combo}`:'';
  updateLives();
}
function updateLives(){const el=document.getElementById('livesDisplay');el.textContent=['❤️','❤️','❤️'].slice(0,Game.lives).join('')+['🖤','🖤','🖤'].slice(0,3-Game.lives).join('');}
function showScorePopup(x,y,text,color){const el=document.createElement('div');el.className='score-popup';el.textContent=text;el.style.color=color||'#ffd700';el.style.left=Math.min(Math.max(x,20),window.innerWidth-90)+'px';el.style.top=Math.max(y-20,10)+'px';document.getElementById('gameScreen').appendChild(el);setTimeout(()=>el.remove(),1000);}

// ═══ GAME FLOW ════════════════════════════════════════════════
function startGame(){
  if(!Game.canvas)Game.init();
  SFX.wake();Game.reset();showScreen('gameScreen');
  document.getElementById('tapHint').style.opacity='1';
  runCountdown(()=>{
    document.getElementById('countdown').classList.add('hidden');
    document.getElementById('tapHint').style.opacity='0';
    setTimeout(()=>document.getElementById('tapHint').style.display='none',600);
    Game.running=true;SFX.startMusic(1);Game.loop();
  });
}
function runCountdown(cb){
  const ov=document.getElementById('countdown'),num=document.getElementById('countdownNum'),sub=document.getElementById('countdownSub');
  ov.classList.remove('hidden');document.getElementById('tapHint').style.display='block';
  let n=3;
  function tick(){if(n<0){cb();return;}num.textContent=n===0?'GO!':n;sub.textContent=n===0?'RUN!':['GET READY','GET SET','3...2...1...'][n-1]||'';SFX.play(n===0?'go':'cdn');num.style.animation='none';num.offsetHeight;num.style.animation='cntPop 0.82s ease-out forwards';n--;setTimeout(tick,920);}
  tick();
}

// ═══ INPUT ════════════════════════════════════════════════════
document.getElementById('gameScreen').addEventListener('touchstart',e=>{e.preventDefault();if(Game.running&&!Game.paused)Game.jump();},{passive:false});
document.getElementById('gameScreen').addEventListener('mousedown',()=>{if(Game.running&&!Game.paused)Game.jump();});
document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='ArrowUp')&&Game.running&&!Game.paused){e.preventDefault();Game.jump();}if(e.code==='Escape'&&(Game.running||Game.paused))togglePause();});

// ═══ PAUSE ════════════════════════════════════════════════════
document.getElementById('pauseBtn').addEventListener('click',togglePause);
document.getElementById('resumeBtn').addEventListener('click',togglePause);
document.getElementById('quitBtn').addEventListener('click',async()=>{Game.running=false;cancelAnimationFrame(Game.animId);SFX.stopMusic();document.getElementById('pauseMenu').classList.add('hidden');await loadMenu();});
function togglePause(){if(!Game.running&&!Game.paused)return;Game.paused=!Game.paused;document.getElementById('pauseMenu').classList.toggle('hidden',!Game.paused);if(!Game.paused)Game.loop();}
document.getElementById('muteBtn').addEventListener('click',()=>{const m=SFX.toggle();document.getElementById('muteBtn').textContent=m?'🔇':'🔊';});

// ═══ GAME OVER ════════════════════════════════════════════════
document.getElementById('retryBtn').addEventListener('click',startGame);
document.getElementById('goMenuBtn').addEventListener('click',async()=>{ await loadMenu(); });
document.getElementById('goLeaderBtn').addEventListener('click',()=>{App.prevScreen='gameOverScreen';renderLeaderboard();});

// ═══ LEADERBOARD ══════════════════════════════════════════════
async function renderLeaderboard(){
  const el=document.getElementById('leaderboardList');
  el.innerHTML='<div class="lb-empty" style="color:rgba(0,245,255,0.5)">⟳ LOADING...</div>';
  showScreen('leaderboardScreen');
  const list=await DB.leaderboard();
  if(!list||!list.length){el.innerHTML='<div class="lb-empty">NO SCORES YET — BE THE FIRST!</div>';return;}
  const medals=['🥇','🥈','🥉'];
  el.innerHTML=list.map((p,i)=>{const me=String(p.tgId||p.displayName||'').toLowerCase()===String(App.user||'').toLowerCase(),cls=i===0?'top1':i===1?'top2':i===2?'top3':'';const label=p.displayName||(p.tgUsername?'@'+p.tgUsername:p.tgId||'?');return`<div class="lb-entry ${cls} ${me?'me':''}"><span class="lb-rank">${medals[i]||(i+1)}</span><span class="lb-name">${escHtml(label)}${me?' (YOU)':''}</span><span class="lb-score">${(p.highScore||0).toLocaleString()}</span><span class="lb-coins">🪙${p.totalCoins||0}</span></div>`;}).join('');
}
document.getElementById('backFromLB').addEventListener('click',()=>{const prev=App.prevScreen||'menuScreen';if(prev==='loginScreen'){showScreen('loginScreen');return;}if(prev==='gameOverScreen'){showScreen('gameOverScreen');return;}showScreen('menuScreen');});

// ═══ ADMIN ════════════════════════════════════════════════════
async function renderAdmin(){
  document.getElementById('adminStats').innerHTML='<div style="color:rgba(0,245,255,0.5);text-align:center;padding:20px;font-family:Orbitron,sans-serif;font-size:12px">⟳ LOADING...</div>';
  const players = await DB.getAllPlayers();
  const tGames=players.reduce((s,p)=>s+(p.gamesPlayed||0),0);
  const tCoins=players.reduce((s,p)=>s+(p.totalCoins||0),0);
  const top=players.reduce((m,p)=>Math.max(m,p.highScore||0),0);
  document.getElementById('adminStats').innerHTML=`<div class="admin-stat"><span class="admin-stat-val">${players.length}</span><div class="admin-stat-label">PLAYERS</div></div><div class="admin-stat"><span class="admin-stat-val">${tGames}</span><div class="admin-stat-label">TOTAL GAMES</div></div><div class="admin-stat"><span class="admin-stat-val">${tCoins.toLocaleString()}</span><div class="admin-stat-label">COINS EARNED</div></div><div class="admin-stat"><span class="admin-stat-val">${top.toLocaleString()}</span><div class="admin-stat-label">TOP SCORE</div></div>`;
  const pl=document.getElementById('adminPlayerList');
  pl.innerHTML=!players.length?'<div style="color:rgba(255,255,255,0.28);text-align:center;padding:20px;font-size:12px">No players yet</div>':players.map(p=>`<div class="admin-player"><div><div class="admin-player-name">${escHtml(p.displayName||'?')} ${p.tgUsername?'<span style="color:rgba(0,136,204,0.7);font-size:10px">@'+escHtml(p.tgUsername)+'</span>':''}</div><div class="admin-player-info">TG:${escHtml(p.tgId||'?')} · Score:${(p.highScore||0).toLocaleString()} · Games:${p.gamesPlayed||0} · Coins:${p.totalCoins||0} · Char:${p.equippedChar||'grey'}</div></div><button class="admin-del" onclick="delPlayer('${escHtml((p.tgId||p.displayName||'').toLowerCase())}')">✕</button></div>`).join('');
}
window.delPlayer=async function(k){if(confirm(`Delete "${k}"?`)){await DB.deletePlayer(k);await renderAdmin();}};
document.getElementById('resetLeaderBtn').addEventListener('click',async()=>{if(confirm('Reset ALL scores?')){await DB.resetScores();await renderAdmin();alert('Done!');}});
document.getElementById('resetAllBtn').addEventListener('click',async()=>{if(confirm('DELETE ALL data?')){await DB.resetAll();await renderAdmin();alert('All cleared!');}});
document.getElementById('exportBtn').addEventListener('click',async()=>{const players=await DB.getAllPlayers();const b=new Blob([JSON.stringify(players,null,2)],{type:'application/json'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='alienDash_data.json';a.click();URL.revokeObjectURL(u);});
document.getElementById('backFromAdmin').addEventListener('click',()=>{if(App.isAdmin)loadMenu();else showScreen('loginScreen');});

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

console.log('%c🛸 ALIEN DASH v5 — Telegram Login · Supabase · Shop · Believer · Slow→Fast!','color:#00f5ff;font-size:14px;font-weight:bold');
