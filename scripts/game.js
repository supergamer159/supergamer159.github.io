// roundRect polyfill for older browsers
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    this.beginPath();this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.quadraticCurveTo(x+w,y,x+w,y+r);
    this.lineTo(x+w,y+h-r);this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    this.lineTo(x+r,y+h);this.quadraticCurveTo(x,y+h,x,y+h-r);
    this.lineTo(x,y+r);this.quadraticCurveTo(x,y,x+r,y);this.closePath();
    return this;
  };
}

const DOM_CACHE=Object.create(null);
function el(id){
  return DOM_CACHE[id] || (DOM_CACHE[id]=document.getElementById(id));
}

// ═══════════════════════════════════════════════════════════════════
//  TITLE PARTICLE DRIFT
// ═══════════════════════════════════════════════════════════════════
(function initTitleParticles(){
  const canvas=el('title-canvas');
  if(!canvas)return;
  canvas.width=1100;canvas.height=720;
  const ctx=canvas.getContext('2d');
  const particles=[];
  const colors=['rgba(124,58,237,','rgba(255,60,0,','rgba(255,194,0,','rgba(0,207,255,','rgba(0,255,170,'];
  for(let i=0;i<55;i++){
    particles.push({
      x:Math.random()*1100, y:Math.random()*720,
      r:Math.random()*1.8+0.4,
      vx:(Math.random()-.5)*0.35, vy:-(Math.random()*0.5+0.1),
      color:colors[Math.floor(Math.random()*colors.length)],
      alpha:Math.random()*0.5+0.15,
      life:Math.random()
    });
  }
  function tick(){
    const titleScreen=el('title-screen');
    if(!titleScreen||!titleScreen.classList.contains('active')){requestAnimationFrame(tick);return;}
    ctx.clearRect(0,0,1100,720);
    for(const p of particles){
      p.life+=0.004; p.x+=p.vx; p.y+=p.vy;
      if(p.y<-5){p.y=725;p.x=Math.random()*1100;}
      if(p.x<-5)p.x=845; if(p.x>845)p.x=-5;
      const a=p.alpha*(0.5+0.5*Math.sin(p.life*3));
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.color+a+')';ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ═══════════════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════
const ACHIEVEMENTS=[
  // Wave milestones
  {id:'first_blood', icon:'🩸', name:'FIRST BLOOD',    desc:'Kill your first enemy',             check:(s)=>s.player.kills>=1},
  {id:'wave5',       icon:'⚔️', name:'VETERAN',        desc:'Survive to wave 5',                 check:(s)=>s.wave>=5},
  {id:'wave10',      icon:'🔥', name:'WARLORD',        desc:'Survive to wave 10',                check:(s)=>s.wave>=10},
  {id:'wave15',      icon:'👑', name:'LEGEND',         desc:'Survive to wave 15',                check:(s)=>s.wave>=15},
  {id:'wave25',      icon:'💀', name:'DEATH WALKER',   desc:'Survive to wave 25',                check:(s)=>s.wave>=25},
  {id:'wave50',      icon:'🌑', name:'NIGHTMARE',      desc:'Survive to wave 50',                check:(s)=>s.wave>=50},
  // Kill milestones
  {id:'kills100',    icon:'💀', name:'CENTURION',      desc:'Kill 100 enemies in one run',       check:(s)=>s.player.kills>=100},
  {id:'kills500',    icon:'⚔️', name:'BUTCHER',        desc:'Kill 500 enemies in one run',       check:(s)=>s.player.kills>=500},
  {id:'kills1000',   icon:'🔥', name:'ANNIHILATOR',    desc:'Kill 1,000 enemies in one run',     check:(s)=>s.player.kills>=1000},
  // Combo
  {id:'combo10',     icon:'🌀', name:'COMBO KING',     desc:'Hit a ×10 combo',                   check:(s)=>s.combo>=10},
  {id:'combo25',     icon:'⚡', name:'UNSTOPPABLE',    desc:'Hit a ×25 combo',                   check:(s)=>s.combo>=25},
  // Level
  {id:'level10',     icon:'📈', name:'EXPERIENCED',    desc:'Reach level 10 in one run',         check:(s)=>s.player.level>=10},
  {id:'level20',     icon:'🎓', name:'MASTER',         desc:'Reach level 20 in one run',         check:(s)=>s.player.level>=20},
  // Boss kills
  {id:'boss1',       icon:'👹', name:'BOSS SLAYER',    desc:'Kill your first boss',              check:(s)=>s._bossKills>=1},
  {id:'boss3',       icon:'🗡️', name:'BOSS HUNTER',   desc:'Kill 3 bosses in one run',          check:(s)=>s._bossKills>=3},
  {id:'boss5',       icon:'👑', name:'BOSS MASTER',    desc:'Kill 5 bosses in one run',          check:(s)=>s._bossKills>=5},
  {id:'boss7',       icon:'💀', name:'BOSS LEGEND',    desc:'Kill 7 bosses in one run',          check:(s)=>s._bossKills>=7},
  // Skill checks
  {id:'boss_undmg',  icon:'✦',  name:'UNTOUCHABLE',    desc:'Kill a boss without taking damage', check:(s)=>s._bossKillNoHit},
  {id:'pacifist_wave',icon:'🕊️',name:'PACIFIST',       desc:'Complete a wave without moving',    check:(s)=>s._untouchedWave},
  {id:'phoenix',     icon:'🔥', name:'PHOENIX RISING', desc:'Revive with Phoenix',               check:(s)=>s.player._phoenixEver},
  // Damage
  {id:'dmg_million', icon:'💥', name:'MILLION DAMAGE', desc:'Deal 1,000,000 total damage in a run', check:(s)=>s.totalDamageDealt>=1e6},
  {id:'dmg_billion', icon:'💫', name:'BILLION DAMAGE', desc:'Deal 1,000,000,000 total damage',   check:(s)=>s.totalDamageDealt>=1e9},
  // Synergy
  {id:'synergy1',    icon:'✨', name:'SYNERGIST',      desc:'Trigger your first synergy',        check:(s)=>s.player._anySynergy},
  {id:'synergy3',    icon:'🌟', name:'SYNERGY MASTER', desc:'Have 3 active synergies at once',   check:(s)=>(s.player._synergyCount||0)>=3},
  // Misc
  {id:'godmode',     icon:'🌟', name:'GOD MODE',       desc:'Reach 10,000 kills in one run',     check:(s)=>s.player.kills>=10000},
  {id:'century',     icon:'💯', name:'CENTURY',        desc:'Collect 100 total items in runs',   check:(s)=>(s.totalItemsEver||0)>=100},
  {id:'item_hoarder',icon:'🎒', name:'HOARDER',        desc:'Have 20 items in one run',          check:(s)=>s.collectedItems.length>=20},
  {id:'no_damage_5', icon:'🛡️', name:'IRON WILL',     desc:'Complete 5 waves without taking damage', check:(s)=>(s._cleanWaves||0)>=5},
  // Character-specific — checked via char id
  {id:'char_melee',  icon:'⚔️', name:'BLADE MASTER',  desc:'Reach wave 10 with a melee character', check:(s)=>s.wave>=10&&s.char.weaponType==='melee'},
  {id:'char_ranged', icon:'🎯', name:'SHARPSHOOTER',  desc:'Kill 500 enemies as a ranged character', check:(s)=>s.player.kills>=500&&s.char.weaponType==='ranged'},
];
function getUnlockedAchievements(){try{return JSON.parse(localStorage.getItem('spudgeon_ach')||'[]');}catch(e){return[];}}
function unlockAchievement(id){
  const unlocked=getUnlockedAchievements();
  if(unlocked.includes(id))return false;
  unlocked.push(id);
  try{localStorage.setItem('spudgeon_ach',JSON.stringify(unlocked));}catch(e){}
  return true;
}
function checkAchievements(s){
  const unlocked=getUnlockedAchievements();
  for(const ach of ACHIEVEMENTS){
    if(unlocked.includes(ach.id))continue;
    if(ach.check(s)){
      if(unlockAchievement(ach.id)){
        showAchievementToast(ach);
      }
    }
  }
}
function showAchievementToast(ach){
  const toast=document.getElementById('ach-toast');
  if(!toast)return;
  if(typeof ach==='string'){
    toast.innerHTML=`<span style="font-size:18px">✨</span> <div><div style="font-family:'JetBrains Mono',monospace;font-size:7px;color:var(--gold);letter-spacing:2px;text-transform:uppercase">POWER SPIKE</div><div style="font-size:11px;color:#fff">${ach}</div></div>`;
    toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2800);
    return;
  }
  toast.innerHTML=`<span style="font-size:18px">${ach.icon}</span> <div><div style="font-family:'JetBrains Mono',monospace;font-size:7px;color:var(--gold);letter-spacing:2px;text-transform:uppercase">ACHIEVEMENT UNLOCKED</div><div style="font-size:11px;color:#fff">${ach.name}</div><div style="font-size:10px;color:#aaa">${ach.desc}</div></div>`;
  toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),3500);
}

// BOSS_ITEMS and rollBossItem defined in the UPGRADES section below
function getBossLootChoices(){
  return rollBossItem(state);
}


function getUnlockedChars(){try{return JSON.parse(localStorage.getItem('spudgeon_chars')||'[]');}catch(e){return[];}}
function unlockChar(id){
  const u=getUnlockedChars();
  if(u.includes(id))return false;
  u.push(id);try{localStorage.setItem('spudgeon_chars',JSON.stringify(u));}catch(e){}
  return true;
}
function isCharUnlocked(ch){
  if(ch.id==='potato') return true;
  if(!ch.unlockHint && !ch.unlockReq) return true; // free
  if(ch.unlockReq && getUnlockedAchievements().includes(ch.unlockReq)) return true; // boss achievement
  return getUnlockedChars().includes(ch.id); // bought with shards or unlocked by boss kill event
}

// ═══════════════════════════════════════════════════════════════════
//  CHARACTERS
// ═══════════════════════════════════════════════════════════════════
const CHARACTERS=[
  {
    id:'potato', name:'SPUDGEON', icon:'🥔', tag:'BALANCED · GUN', // TRUE BALANCED STARTER
    weaponType:'ranged',
    desc:'Trusty all-rounder. Fires a steady stream of bullets.',
    abilityName:'DASH BURST', abilityIcon:'💨', abilityCooldown:2,
    statMods:{speed:0,damage:2,fireRate:0,maxHp:10},
    ability(s){
      const p=s.player;let dx=0,dy=0;
      if(keys['ArrowLeft']||keys['a']||keys['A'])dx=-1;
      if(keys['ArrowRight']||keys['d']||keys['D'])dx=1;
      if(keys['ArrowUp']||keys['w']||keys['W'])dy=-1;
      if(keys['ArrowDown']||keys['s']||keys['S'])dy=1;
      if(!dx&&!dy)dx=1;
      const l=Math.sqrt(dx*dx+dy*dy);
      p.x+=dx/l*120;p.y+=dy/l*120;
      p.x=Math.max(p.r,Math.min(W-p.r,p.x));p.y=Math.max(p.r,Math.min(H-p.r,p.y));
      p.immune=1.0;
      // Dash VFX — afterimage burst + wind streaks
      spawnParticles(s,p.x,p.y,'#ffd700',3);
      spawnParticles(s,p.x,p.y,'#ffffff',2);
      spawnParticles(s,p.x,p.y,'#ff8800',3);
      abilityRing(s,p.x,p.y,'#ffd700',55,.3,{glow:30,lw:4});
      abilityRing(s,p.x,p.y,'#ffffff',80,.22,{noEcho:true,glow:10,lw:1.5});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,215,0,0.18)';
      triggerShake(3);addFloat(p.x,p.y,'DASH!','#ffd700');
    },
    color:'#d4a000',pip:[3,3,3,3],
  },
  {
    id:'sniper', name:'MARKSMAN', icon:'🎯', tag:'SNIPER · GUN',
    weaponType:'ranged',
    desc:'Shoots slow but bullets pierce everything and deal massive damage. Every 5th shot is a Headshot.',
    passive:'💥 HEADSHOT — Every 5th shot deals 3× damage and crits for a screen-flash.',
    abilityName:'TRIPLE SHOT', abilityIcon:'⚡', abilityCooldown:3,
    statMods:{speed:-0.2,damage:8,fireRate:380,maxHp:-10},
    ability(s){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      for(let i=-1;i<=1;i++){spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ang+i*.15)*12,vy:Math.sin(ang+i*.15)*12,r:p.bulletSize+1,dmg:p.damage*1.2,pierce:99,life:2.0,isSniper:true});}
      spawnParticles(s,p.x,p.y,'#ff8800',2);
      spawnParticles(s,p.x,p.y,'#ffcc00',2);
      spawnParticles(s,p.x,p.y,'#ffffff',2);
      abilityRing(s,p.x,p.y,'#ff8800',60,.28,{glow:20,lw:3,noEcho:true});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,136,0,0.18)';
      addFloat(p.x,p.y,'TRIPLE SHOT!','#ff8800');
    },
    color:'#cc6600',pip:[5,2,2,2],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      // HEADSHOT passive: every 5th shot deals 3x damage
      p._shotCount=(p._shotCount||0)+1;
      const isHeadshot=(p._shotCount%5===0);
      const finalDmg=isHeadshot?dmg*3:dmg;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const mSpread=(p.multishot-1)*.12;
      for(let mi=0;mi<p.multishot;mi++){
        const ma=ang+(mi-(p.multishot-1)/2)*mSpread;
        const mDmg=(mi===0)?finalDmg:finalDmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ma)*12,vy:Math.sin(ma)*12,r:isHeadshot?p.bulletSize+5:p.bulletSize+2,dmg:mDmg,pierce:p.piercing+2,life:2.2,isSniper:true,isHeadshot});
      }
      if(isHeadshot){spawnParticles(s,p.x,p.y,'#ffee00',3);spawnParticles(s,p.x,p.y,'#ffffff',2);addFloat(p.x,p.y-10,'💥 HEADSHOT!','#ffee00');triggerShake(3);}
      // Laser line flash
      if(!s.laserBeams)s.laserBeams=[];
      const dist=Math.hypot(near.x-p.x,near.y-p.y)+60;
      s.laserBeams.push({x1:p.x,y1:p.y,x2:p.x+Math.cos(ang)*dist,y2:p.y+Math.sin(ang)*dist,color:isHeadshot?'#ffee00':'#ff8800',w:isHeadshot?7:4,life:.18,maxLife:.18});
    },
  },
  {
    id:'engineer', name:'ENGINEER', icon:'🔧', tag:'SUMMONER · TURRETS',
    weaponType:'ranged',
    desc:'Deploys up to 2 turrets. Turrets inherit your upgrades — damage, fire rate, and pierce.',
    abilityName:'DEPLOY TURRET', abilityIcon:'🔫', abilityCooldown:5,
    statMods:{speed:-0.1,damage:2,fireRate:40,maxHp:35},
    ability(s){
      const p=s.player;
      if(!s.turrets)s.turrets=[];
      if(s.turrets.length>=3)s.turrets.shift();
      s.turrets.push({x:p.x,y:p.y,r:10,shootTimer:0,shootCooldown:Math.max(0.28,p.fireRate/1000*0.7),life:40,maxLife:40,color:'#4af',_ownerDmg:Math.round(p.damage*0.65),_ownerPierce:p.piercing,_ownerBulletSize:p.bulletSize});
      // Deploy ring burst + sparks
      abilityRing(s,p.x,p.y,'#4af',50,.4,{glow:28,lw:4});
      abilityRing(s,p.x,p.y,'#4af',100,.6,{glow:16,lw:2});
      spawnParticles(s,p.x,p.y,'#4af',3);spawnParticles(s,p.x,p.y,'#ffffff',2);
      spawnParticles(s,p.x,p.y,'#00cfff',2);
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(68,170,255,0.18)';
      triggerShake(4);addFloat(p.x,p.y,'TURRET DEPLOYED!','#00cfff');
    },
    color:'#3a80d9',pip:[2,2,4,4],
  },
  {
    id:'cryomancer', name:'CRYOMANCER', icon:'❄️', tag:'CONTROLLER · GUN',
    weaponType:'ranged',
    desc:'Bullets shatter on impact, dealing 50% splash damage in a small radius. Blizzard freezes ALL enemies & deals burst damage.',
    abilityName:'BLIZZARD', abilityIcon:'🌨️', abilityCooldown:14,
    statMods:{speed:0,damage:2,fireRate:20,maxHp:20},
    ability(s){
      const p=s.player;
      for(const e of s.enemies){
        e._frozen=true;e._frozenTimer=3.5;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.05;
        const cd=p.damage*1.8;e.hp-=cd;s.totalDamageDealt+=cd;e.hitFlash=1;
        spawnParticles(s,e.x,e.y,'#aaddff',3);
      }
      spawnParticles(s,W/2,H/2,'#aaddff',2);spawnParticles(s,W/2,H/2,'#ffffff',2);
      spawnParticles(s,W/2,H/2,'#00cfff',3);
      abilityRing(s,W/2,H/2,'#aaddff',W*.45,.7,{glow:30,lw:5});
      abilityRing(s,W/2,H/2,'#ffffff',W*.3,.5,{glow:16,lw:2});
      abilityRing(s,p.x,p.y,'#aaddff',90,.5,{glow:24,lw:3});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(170,221,255,0.3)';
      addFloat(p.x,p.y,'❄ BLIZZARD!','#aaddff');
      // Screen flash
      const bf=document.getElementById('blizzard-flash');
      if(bf){bf.classList.add('active');setTimeout(()=>bf.classList.remove('active'),350);}
    },
    color:'#5599ff',pip:[3,3,3,3],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s,{x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
          r:p.bulletSize+1,dmg:bDmg,pierce:p.piercing,life:2.0,_iceShard:true,color:'#aaddff'});
      }
    },
  },
  {
    id:'pyro', name:'PYROMANCER', icon:'🔥', tag:'BURN STACKS · FLAMETHROWER',
    weaponType:'ranged',
    desc:'Flamethrower that stacks BURN on enemies. 6 stacks = INFERNO (40% more damage taken). Overheat mechanic: fire in bursts for max efficiency.',
    passive:'🔥 INFERNO — At 6 burn stacks enemies glow and take 40% extra damage from all sources. Stacks decay after 3s without hits.',
    abilityName:'NAPALM RAIN', abilityIcon:'☄️', abilityCooldown:6,
    statMods:{speed:0.2,damage:2,fireRate:-50,maxHp:-10},
    ability(s){
      const p=s.player;
      if(!s.firePatches)s.firePatches=[];
      // 10 large napalm pools around + ahead of player, instantly apply 4 burn stacks
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      const aimAng=near?Math.atan2(near.y-p.y,near.x-p.x):0;
      for(let i=0;i<14;i++){
        const a=aimAng+(Math.random()-.5)*Math.PI*1.4;
        const d=40+Math.random()*130;
        s.firePatches.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,
          r:28+(p.bulletSize*2),life:7.0,maxLife:7.0,dmgPs:p.damage*2.4,_napalmPatch:true});
      }
      // Instantly apply 4 burn stacks to all nearby enemies
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)<200){
          e._burnStacks=Math.min(6,(e._burnStacks||0)+4);
          e._burnTimer=3.0;
          e._onFire=true;e._fireTimer=3.5;
          e._fireDmg=p.damage*0.18*e._burnStacks;
        }
      }
      // Reset overheat
      p._pyroHeat=0;p._pyroOverheat=false;
      spawnParticles(s,p.x,p.y,'#ff6600',3);spawnParticles(s,p.x,p.y,'#ffcc00',2);
      spawnParticles(s,p.x,p.y,'#ff2200',3);spawnParticles(s,p.x,p.y,'#ffffff',2);
      abilityRing(s,p.x,p.y,'#ff6600',100,.45,{glow:40,lw:5});
      abilityRing(s,p.x,p.y,'#ffaa00',170,.6,{glow:28,lw:3.5});
      abilityRing(s,p.x,p.y,'#ff2200',240,.75,{glow:16,lw:2,noEcho:true});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,80,0,0.32)';
      triggerShake(9);addFloat(p.x,p.y,'🔥 NAPALM RAIN!','#ff6600');
    },
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      // Overheat check
      if(p._pyroOverheat)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      // Fire 3 flame projectiles per shot in a tight spread
      const shots=p.multishot>1?p.multishot+1:3;
      for(let i=0;i<shots;i++){
        const spread=(Math.random()-.5)*0.55;
        const spd=p.bulletSpeed*1.4+Math.random()*1.5;
        spawnBullet_pool(s, {
          x:p.x+Math.cos(ang)*16,y:p.y+Math.sin(ang)*16,
          vx:Math.cos(ang+spread)*spd,vy:Math.sin(ang+spread)*spd,
          r:p.bulletSize+3,dmg:dmg*(i===0?1.0:0.75),
          pierce:p.piercing,life:0.55+Math.random()*0.2,
          _flameBullet:true,
        });
      }
      // Build heat
      p._pyroHeat=(p._pyroHeat||0)+1;
      if(p._pyroHeat>=18){
        p._pyroOverheat=true;p._pyroHeatCooldown=1.8;p._pyroHeat=18;
        addFloat(p.x,p.y,'♨ OVERHEAT!','#ff2200');triggerShake(3);
      }
      // Flame particles
      spawnParticles(s,p.x+Math.cos(ang)*22,p.y+Math.sin(ang)*22,'#ff6600',2);
      spawnParticles(s,p.x+Math.cos(ang)*30,p.y+Math.sin(ang)*30,'#ffaa00',2);
    },
    color:'#ff5500',pip:[4,3,5,2],
  },
  {
    id:'knight', name:'KNIGHT', icon:'⚔️', tag:'MELEE · SWORD',
    weaponType:'melee',
    desc:'Swings a huge sword in an arc. Must get close — but massive damage.',
    passive:'🛡 FORTITUDE — Every 3 hits taken builds a block charge that absorbs the next hit.',
    abilityName:'WHIRLWIND', abilityIcon:'🌀', abilityCooldown:4,
    statMods:{speed:0.2,damage:6,fireRate:0,maxHp:40},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*8+40;
      const groups=p._fullSweep ? getMeleeGroups(p,s.enemies,reach,Math.PI) : getMeleeGroups(p,s.enemies,reach,Math.PI*0.55); // ~100° sectors
      if(!groups.length)return;
      doMeleeSwings(s,p,groups,{reach,dmg,arcHalf:Math.PI*0.32,color:'#ffcc44',life:.20,staggerMs:85,dmgFalloff:0.85});
    },
    ability(s){
      const p=s.player;
      const r=90+p.bulletSize*5;
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)<r+e.r){
          const d=p.damage*1.6;e.hp-=d;e.hitFlash=1;s.totalDamageDealt+=d;
          spawnParticles(s,e.x,e.y,'#ffaa00',2);addFloat(e.x,e.y,`-${fmtBig(d)}`,'#ffd700');
        }
      }
      if(!s.meleeSwings)s.meleeSwings=[];
      s.meleeSwings.push({x:p.x,y:p.y,ang:0,arcHalf:Math.PI,r,life:.3,maxLife:.3,color:'#ffdd00',full:true});
      // Multiple expanding golden rings
      abilityRing(s,p.x,p.y,'#ffd700',r*.4,.32,{glow:36,lw:5});
      abilityRing(s,p.x,p.y,'#ffaa00',r*.7,.44,{glow:28,lw:4});
      abilityRing(s,p.x,p.y,'#ffffff',r*.95,.3,{glow:14,lw:2,noEcho:true});
      abilityRing(s,p.x,p.y,'#ffd700',r*1.2,.55,{glow:18,lw:1.5,noEcho:true});
      spawnParticles(s,p.x,p.y,'#ffd700',3);spawnParticles(s,p.x,p.y,'#ffaa00',3);
      spawnParticles(s,p.x,p.y,'#ffffff',3);
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,215,0,0.2)';
      triggerShake(7);addFloat(p.x,p.y,'⚔ WHIRLWIND!','#ffd700');
    },
    color:'#e8c040',pip:[4,3,4,4],
  },
  {
    id:'berserker', unlockHint:'UNLOCK: 25 SHARDS', name:'BERSERKER', icon:'🪓', tag:'MELEE · AXE',
    weaponType:'melee',
    desc:'Charges into enemies with a brutal axe. Short range, insane damage.',
    passive:'🩸 BLOODLUST — Kills during Blood Rage reduce the next cooldown by 1.5s each.',
    abilityName:'BLOOD RAGE', abilityIcon:'🩸', abilityCooldown:5,
    statMods:{speed:0.5,damage:8,fireRate:0,maxHp:-20},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*6+34;
      const rageMul=p._berserkerRage?p._berserkerDmgBoost:1;
      const groups=p._fullSweep ? getMeleeGroups(p,s.enemies,reach,Math.PI) : getMeleeGroups(p,s.enemies,reach,Math.PI*0.45); // ~80° sectors — tighter chops
      if(!groups.length)return;
      // Berserker: each chop full damage (no falloff) but shorter arcs
      doMeleeSwings(s,p,groups.map(g=>({...g,dmg:undefined})),{
        reach, dmg:dmg*rageMul, arcHalf:Math.PI*0.28, color:'#ff4444',
        life:.14, staggerMs:60, dmgFalloff:1.0
      });
    },
    ability(s){
      const p=s.player;
      p._berserkerRage=true;p._berserkerTimer=4;p._berserkerDmgBoost=2.2;
      // Red vignette on
      const rv=document.getElementById('rage-vignette');
      if(rv){rv.classList.add('active');setTimeout(()=>rv.classList.remove('active'),4000);}
      spawnParticles(s,p.x,p.y,'#ff0033',3);spawnParticles(s,p.x,p.y,'#ff6688',3);
      spawnParticles(s,p.x,p.y,'#ffffff',2);
      abilityRing(s,p.x,p.y,'#ff0033',60,.45,{glow:40,lw:5});
      abilityRing(s,p.x,p.y,'#ff3355',110,.6,{glow:28,lw:3});
      abilityRing(s,p.x,p.y,'#ff8899',160,.72,{glow:14,lw:1.5,noEcho:true});
      flashEl('rage-vignette');
      triggerShake(8);addFloat(p.x,p.y,'BLOOD RAGE!','#ff3355');
    },
    color:'#cc2233',pip:[5,4,5,1],
  },
  {
    id:'ninja', unlockHint:'UNLOCK: 25 SHARDS', name:'NINJA', icon:'🥷', tag:'MELEE · DAGGERS',
    weaponType:'melee',
    desc:'Blindingly fast dual daggers. Hits 3 enemies at once. Smoke Bomb dashes away leaving damaging clones.',
    passive:'🗡 BACKSTAB — First hit on an enemy deals 2.5× damage.',
    abilityName:'SMOKE BOMB', abilityIcon:'💨', abilityCooldown:4,
    statMods:{speed:0.8,damage:4,fireRate:-120,maxHp:-20},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*5+30;
      const inRange=s.enemies.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<reach+e.r);
      inRange.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      const targets=inRange.slice(0,5); // ninja hits up to 5 — one dagger per target
      if(!targets.length)return;
      if(!s.meleeSwings)s.meleeSwings=[];
      targets.forEach((e,idx)=>{
        const isBackstab=!e._ninjaHit;
        const hitDmg=isBackstab?dmg*1.8:dmg*(1-idx*0.08);
        e._ninjaHit=true;
        // Stagger each dagger strike visually
        const delay=idx*45/1000;
        const ang=Math.atan2(e.y-p.y,e.x-p.x);
        const col=isBackstab?'#ff44ff':'#aa44ff';
        const doStrike=()=>{
          e.hp-=hitDmg;e.hitFlash=1;s.totalDamageDealt+=hitDmg;applyMeleeEffects(s,p,e,hitDmg);
          if(isBackstab){spawnParticles(s,e.x,e.y,'#ff44ff',2);addFloat(e.x,e.y,'BACKSTAB!','#ff44ff');}
          else{spawnParticles(s,e.x,e.y,'#aa44ff',2);addFloat(e.x,e.y,`-${fmtBig(hitDmg)}`,'#cc88ff');}
          s.meleeSwings.push({x:p.x,y:p.y,ang,arcHalf:0.22,r:reach,life:.09,maxLife:.09,color:col});
        };
        if(delay===0){doStrike();}
        else{
          if(!s._pendingSwings)s._pendingSwings=[];
          s._pendingSwings.push({delay,_t:0,_fn:doStrike,_isFn:true});
        }
      });
    },
    ability(s){
      const p=s.player;
      // Smoke Bomb: dash in movement direction, leave 3 shadow clones that damage nearby enemies
      let dx=0,dy=0;
      if(keys['a']||keys['A']||keys['ArrowLeft'])dx=-1;if(keys['d']||keys['D']||keys['ArrowRight'])dx+=1;
      if(keys['w']||keys['W']||keys['ArrowUp'])dy=-1;if(keys['s']||keys['S']||keys['ArrowDown'])dy+=1;
      if(!dx&&!dy){dx=0;dy=-1;}
      const ml=Math.sqrt(dx*dx+dy*dy)||1;
      if(!s.afterimages)s.afterimages=[];
      // Leave 3 clones behind that burst with damage
      for(let i=0;i<3;i++){
        const cx=p.x-dx/ml*i*30,cy=p.y-dy/ml*i*30;
        s.afterimages.push({x:cx,y:cy,r:p.r*1.2,color:'#aa44ff',life:.7,maxLife:.7});
        if(!s.firePatches)s.firePatches=[];
        s.firePatches.push({x:cx,y:cy,r:28,life:1.0,maxLife:1.0,dmgPs:p.damage*3.5,isGhost:true});
      }
      spawnParticles(s,p.x,p.y,'#330044',3);
      spawnParticles(s,p.x,p.y,'#000000',3);
      p.x+=dx/ml*95;p.y+=dy/ml*95;
      p.x=Math.max(p.r,Math.min(W-p.r,p.x));p.y=Math.max(p.r,Math.min(H-p.r,p.y));
      p.immune=0.8;
      spawnParticles(s,p.x,p.y,'#aa44ff',2);spawnParticles(s,p.x,p.y,'#ffffff',2);
      spawnParticles(s,p.x,p.y,'#220033',3);
      abilityRing(s,p.x,p.y,'#aa44ff',55,.35,{glow:32,lw:4});
      abilityRing(s,p.x,p.y,'#330044',90,.5,{glow:18,lw:2,noEcho:true});
      flashEl('void-flash');
      addFloat(p.x,p.y,'💨 SMOKE BOMB!','#aa44ff');
    },
    color:'#8833cc',pip:[3,5,5,2],
  },
  {
    id:'sentinel', unlockHint:'UNLOCK: 30 SHARDS', name:'SENTINEL', icon:'🛡️', tag:'TANK · SHIELD BASH',
    weaponType:'melee',
    desc:'Enormous HP. Bashes nearby enemies with a shield. Barrier absorbs all damage.',
    passive:'⚡ RETALIATION — When Iron Barrier expires, releases a shockwave damaging all nearby enemies.',
    abilityName:'IRON BARRIER', abilityIcon:'🧱', abilityCooldown:7,
    statMods:{speed:-0.4,damage:4,fireRate:0,maxHp:80},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*5+38;
      const groups=p._fullSweep ? getMeleeGroups(p,s.enemies,reach,Math.PI) : getMeleeGroups(p,s.enemies,reach,Math.PI*0.75); // ~135° wide sectors
      if(!groups.length)return;
      if(!s.meleeSwings)s.meleeSwings=[];
      // First hit: push + dmg all groups
      groups.forEach((g,idx)=>{
        const delay=idx*100/1000;
        const col=idx===0?'#ffaa00':'#ff8800';
        const doStrike=()=>{
          for(const e of g.enemies){
            e.hp-=dmg;e.hitFlash=1;s.totalDamageDealt+=dmg;applyMeleeEffects(s,p,e,dmg);
            const eang=Math.atan2(e.y-p.y,e.x-p.x);
            e.x+=Math.cos(eang)*10;e.y+=Math.sin(eang)*10; // knockback
            spawnParticles(s,e.x,e.y,'#ffaa00',2);addFloat(e.x,e.y,`-${fmtBig(dmg)}`,col);
          }
          s.meleeSwings.push({x:p.x,y:p.y,ang:g.ang,arcHalf:Math.PI*0.5,r:reach,life:.20,maxLife:.20,color:col});
        };
        if(delay===0){doStrike();}
        else{if(!s._pendingSwings)s._pendingSwings=[];s._pendingSwings.push({delay,_t:0,_fn:doStrike,_isFn:true});}
      });
    },
    ability(s){
      const p=s.player;p._barrier=true;p._barrierTimer=3.5;p.immune=3.5;
      abilityRing(s,p.x,p.y,'#ffaa00',55,.38,{glow:44,lw:6});
      abilityRing(s,p.x,p.y,'#ffdd55',95,.52,{glow:28,lw:3.5});
      abilityRing(s,p.x,p.y,'#ffffff',130,.6,{glow:14,lw:1.5,noEcho:true});
      spawnParticles(s,p.x,p.y,'#ffaa00',2);spawnParticles(s,p.x,p.y,'#ffffcc',3);
      spawnParticles(s,p.x,p.y,'#ffffff',2);
      flashEl('barrier-flash');triggerShake(4);addFloat(p.x,p.y,'🛡 IRON BARRIER!','#ffaa00');
    },
    color:'#cc8800',pip:[2,2,3,5],
  },
  {
    id:'warlock', unlockHint:'UNLOCK: 30 SHARDS', name:'WARLOCK', icon:'🔮', tag:'ARCANE · CURSE',
    weaponType:'ranged',
    desc:'Fires magic orbs that explode on impact. Soul Rend curses all visible enemies — draining their HP and healing you.',
    abilityName:'SOUL REND', abilityIcon:'💀', abilityCooldown:5,
    statMods:{speed:-0.1,damage:4,fireRate:120,maxHp:15},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ang)*3.5,vy:Math.sin(ang)*3.5,r:p.bulletSize+4,dmg:dmg,pierce:p.piercing,life:2.5,isAoEOrb:true,aoeR:40+p.bulletSize*2});
    },
    ability(s){
      const p=s.player;
      let totalDrain=0;
      for(const e of s.enemies){
        const drain=Math.min(e.hp*0.25, e.maxHp*0.25);
        e.hp-=drain;e.hitFlash=1;s.totalDamageDealt+=drain;totalDrain+=drain;
        spawnParticles(s,e.x,e.y,'#cc44ff',2);
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:e.x,y1:e.y,x2:p.x,y2:p.y,color:'#cc44ff',w:2,life:.5,maxLife:.5});
      }
      const healAmt=Math.floor(Math.min(p.maxHp*0.5, totalDrain*0.4));
      healPlayer(s,healAmt);
      updateHpHUD();
      abilityRing(s,p.x,p.y,'#cc44ff',70,.38,{glow:44,lw:5});
      abilityRing(s,p.x,p.y,'#9900ff',130,.52,{glow:32,lw:3});
      abilityRing(s,p.x,p.y,'#ff44ff',190,.64,{glow:18,lw:1.5,noEcho:true});
      spawnParticles(s,p.x,p.y,'#cc44ff',11);spawnParticles(s,p.x,p.y,'#ffffff',3);
      spawnParticles(s,p.x,p.y,'#440066',2);
      flashEl('void-flash');triggerShake(6);
      addFloat(p.x,p.y,`SOUL REND! +${healAmt}HP`,'#cc44ff');
    },
    color:'#9933cc',pip:[3,2,5,2],
  },
  {
    id:'phantom', unlockHint:'UNLOCK: 35 SHARDS', name:'PHANTOM', icon:'👻', tag:'HYBRID · SPECTRAL',
    weaponType:'ranged',
    desc:'Fast spectral shots pierce 1 enemy. Cloak fires a ghost burst on exit.',
    passive:'👻 WRAITH STRIKE — Deal +60% damage while cloaked. Cloak lasts 4s.',
    abilityName:'PHASE CLOAK', abilityIcon:'🌫️', abilityCooldown:6,
    statMods:{speed:0.6,damage:2,fireRate:-80,maxHp:-25},
    ability(s){
      const p=s.player;
      p._cloaked=true;p._cloakTimer=4.0;p.immune=4.0;
      p._cloakBurst=true;
      spawnParticles(s,p.x,p.y,'#aaaaff',2);spawnParticles(s,p.x,p.y,'#ffffff',3);
      spawnParticles(s,p.x,p.y,'#4466ff',3);
      abilityRing(s,p.x,p.y,'#aaaaff',50,.36,{glow:40,lw:5});
      abilityRing(s,p.x,p.y,'#6666ff',90,.52,{glow:24,lw:2.5});
      abilityRing(s,p.x,p.y,'#ffffff',130,.65,{glow:10,lw:1,noEcho:true});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(100,100,255,0.2)';
      addFloat(p.x,p.y,'CLOAKED!','#aaaaff');
    },
    color:'#8888ff',pip:[3,5,3,2],
    // Phantom bullets always pierce 1
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,r:p.bulletSize,dmg:bDmg,pierce:Math.max(1,p.piercing),life:2.2,isPhantom:true});
      }
    },
  },
  // ── 4 NEW CHARACTERS ────────────────────────────────────────────
  {
    id:'alchemist', unlockHint:'UNLOCK: 35 SHARDS', name:'ALCHEMIST', icon:'⚗️', tag:'RANGED · POISON',
    weaponType:'ranged',
    desc:'Lobs acid flasks that leave poison pools. Acid Nova erupts 8 large acid pools around you.',
    abilityName:'ACID NOVA', abilityIcon:'🧪', abilityCooldown:5,
    statMods:{speed:0,damage:2,fireRate:100,maxHp:20},
    ability(s){
      const p=s.player;
      if(!s.firePatches)s.firePatches=[];
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;const d=60+Math.random()*40;
        s.firePatches.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:55+(p.bulletSize*3),life:10.0,maxLife:10.0,dmgPs:p.damage*6.0,isAcid:true});
      }
      spawnParticles(s,p.x,p.y,'#aaff44',2);spawnParticles(s,p.x,p.y,'#88ff00',2);
      spawnParticles(s,p.x,p.y,'#ffffff',2);spawnParticles(s,p.x,p.y,'#004400',3);
      abilityRing(s,p.x,p.y,'#aaff44',75,.38,{glow:40,lw:5});
      abilityRing(s,p.x,p.y,'#00ff88',130,.52,{glow:28,lw:3});
      abilityRing(s,p.x,p.y,'#44ff00',195,.65,{glow:14,lw:1.5,noEcho:true});
      document.getElementById('ability-flash').style.background='rgba(100,255,50,0.3)';
      flashEl('ability-flash');triggerShake(7);
      addFloat(p.x,p.y,'☣ ACID NOVA!','#aaff44');
    },
    color:'#88cc22',pip:[3,3,3,3],
    // Shoots acid flasks that leave poison patches
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const boost=p._alchemyBoost||1;
      const spread=(p.multishot-1)*.2;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg*boost:dmg*boost*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*.8,vy:Math.sin(a)*p.bulletSpeed*.8,r:p.bulletSize+3,dmg:bDmg,pierce:p.piercing,life:2.0,isAcidFlask:true,acidDmg:dmg*boost*0.45,bSize:p.bulletSize});
      }
    },
  },
  {
    id:'reaper', unlockHint:'UNLOCK: 40 SHARDS', name:'REAPER', icon:'💀', tag:'MELEE · SCYTHE',
    weaponType:'melee',
    desc:'Massive scythe cleaves in a full 180° arc. Soul Harvest heals for each kill.',
    passive:'💀 SOUL METER — Every 5 kills auto-triggers a free mini Soul Harvest.',
    abilityName:'SOUL HARVEST', abilityIcon:'☠️', abilityCooldown:4,
    statMods:{speed:0.3,damage:8,fireRate:0,maxHp:-10},
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*7+50;
      // Nearest enemy determines forward direction
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near||nd>reach+near.r)return;
      const fwdAng=Math.atan2(near.y-p.y,near.x-p.x);
      const backAng=fwdAng+Math.PI; // backswing direction
      if(!s.meleeSwings)s.meleeSwings=[];
      // --- Forward swing ---
      const fwdHit=[];
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)>reach+e.r)continue;
        const ea=Math.atan2(e.y-p.y,e.x-p.x);
        let diff=ea-fwdAng;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        if(Math.abs(diff)<=Math.PI*0.5){fwdHit.push(e);}
      }
      for(const e of fwdHit){
        e.hp-=dmg;e.hitFlash=1;s.totalDamageDealt+=dmg;applyMeleeEffects(s,p,e,dmg);
        if(p._reaperHarvest){healPlayer(s,3);updateHpHUD();}
        spawnParticles(s,e.x,e.y,'#aa00ff',2);addFloat(e.x,e.y,`-${fmtBig(dmg)}`,'#cc44ff');
      }
      s.meleeSwings.push({x:p.x,y:p.y,ang:fwdAng,arcHalf:Math.PI*0.5,r:reach,life:.22,maxLife:.22,color:'#aa00ff'});
      // --- Backswing (120ms later, 60% dmg) — hits enemies BEHIND player ---
      const bsDmg=dmg*0.6;
      const bsX=p.x,bsY=p.y;
      if(!s._pendingSwings)s._pendingSwings=[];
      s._pendingSwings.push({delay:0.12,_t:0,_isFn:true,_fn:()=>{
        const backHit=[];
        for(const e of s.enemies){
          if(Math.hypot(e.x-bsX,e.y-bsY)>reach+e.r)continue;
          if(fwdHit.includes(e))continue; // don't double-hit
          const ea=Math.atan2(e.y-bsY,e.x-bsX);
          let diff=ea-backAng;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
          if(Math.abs(diff)<=Math.PI*0.5){backHit.push(e);}
        }
        for(const e of backHit){
          e.hp-=bsDmg;e.hitFlash=1;s.totalDamageDealt+=bsDmg;applyMeleeEffects(s,p,e,bsDmg);
          spawnParticles(s,e.x,e.y,'#660099',2);addFloat(e.x,e.y,`-${fmtBig(bsDmg)}`,'#cc44ff');
        }
        if(backHit.length){
          s.meleeSwings.push({x:bsX,y:bsY,ang:backAng,arcHalf:Math.PI*0.5,r:reach*0.85,life:.18,maxLife:.18,color:'#660099'});
        }
      }});
    },
    ability(s){
      const p=s.player;
      p._reaperHarvest=true;p._reaperTimer=6;
      const r=110;let hits=0;
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)<r+e.r){
          const d=p.damage*1.4;e.hp-=d;e.hitFlash=1;s.totalDamageDealt+=d;hits++;
          // Soul rising particles from each hit enemy
          spawnParticles(s,e.x,e.y,'#aa00ff',2);spawnParticles(s,e.x,e.y,'#660099',2);
        }
      }
      const heal=hits*8;healPlayer(s,heal);
      if(!s.meleeSwings)s.meleeSwings=[];
      s.meleeSwings.push({x:p.x,y:p.y,ang:0,arcHalf:Math.PI,r,life:.3,maxLife:.3,color:'#aa00ff',full:true});
      spawnParticles(s,p.x,p.y,'#aa00ff',11);spawnParticles(s,p.x,p.y,'#220033',3);
      spawnParticles(s,p.x,p.y,'#ff44ff',3);spawnParticles(s,p.x,p.y,'#ffffff',2);
      abilityRing(s,p.x,p.y,'#aa00ff',r*.55,.36,{glow:48,lw:6});
      abilityRing(s,p.x,p.y,'#6600aa',r*.9,.5,{glow:32,lw:3.5});
      abilityRing(s,p.x,p.y,'#ff44ff',r*1.15,.63,{glow:20,lw:2});
      abilityRing(s,p.x,p.y,'#ffffff',r*1.35,.72,{glow:8,lw:1,noEcho:true});
      flashEl('harvest-flash');triggerShake(5);
      addFloat(p.x,p.y,`💀 HARVEST! +${heal}HP`,'#aa00ff');
    },
    color:'#7700aa',pip:[5,3,4,2],
  },
  {
    id:'gunslinger', unlockHint:'UNLOCK: 30 SHARDS', name:'GUNSLINGER', icon:'🤠', tag:'RANGED · PISTOLS',
    weaponType:'ranged',
    desc:'Dual pistols — fires left AND right simultaneously. Fan the Hammer: rapid burst.',
    abilityName:'FAN THE HAMMER', abilityIcon:'🔫', abilityCooldown:3,
    statMods:{speed:0.4,damage:3,fireRate:-100,maxHp:5},
    ability(s){
      const p=s.player;
      if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      for(let i=0;i<8;i++){
        const a=ang+(Math.random()-.5)*.50;
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.2,vy:Math.sin(a)*p.bulletSpeed*1.2,r:p.bulletSize,dmg:p.damage*1.0,pierce:p.piercing,life:1.2});
      }
      // Muzzle flash + burst of sparks toward enemy direction
      spawnParticles(s,p.x,p.y,'#ff8800',9);spawnParticles(s,p.x,p.y,'#ffee00',4);
      spawnParticles(s,p.x,p.y,'#ffffff',3);spawnParticles(s,p.x,p.y,'#ff4400',2);
      abilityRing(s,p.x,p.y,'#ff8800',50,.28,{glow:36,lw:5,noEcho:true});
      abilityRing(s,p.x,p.y,'#ffee00',80,.22,{glow:20,lw:2,noEcho:true});
      if(!s.laserBeams)s.laserBeams=[];
      // Three overlapping muzzle beams for spread effect
      for(let _i=-1;_i<=1;_i++){
        const _a=ang+_i*0.12;
        s.laserBeams.push({x1:p.x,y1:p.y,x2:p.x+Math.cos(_a)*180,y2:p.y+Math.sin(_a)*180,color:'#ffee00',w:_i===0?7:3,life:.14,maxLife:.14});
      }
      flashEl('hammer-flash');triggerShake(7);
      addFloat(p.x,p.y,'🔫 FAN THE HAMMER! ×14','#ff8800');
    },
    color:'#cc7700',pip:[3,4,5,2],
    customShoot(s,dmg){
      // Shoots two bullets at once — left-offset and right-offset
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      const totalShots=Math.min(4,Math.max(2,p.multishot)); // always at least 2, capped at 4
      for(let i=0;i<totalShots;i++){
        const a=ang+(i-(totalShots-1)/2)*Math.max(.22,spread);
        const bDmg=(i<2)?dmg*0.90:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY)); // dual pistols — near-full damage
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,r:p.bulletSize,dmg:bDmg,pierce:p.piercing,life:1.2});
      }
    },
  },
  {
    id:'druid', unlockHint:'UNLOCK: 35 SHARDS', name:'DRUID', icon:'🌿', tag:'SUPPORT · NATURE',
    weaponType:'ranged',
    desc:'Shoots thorns at enemies. Places up to 2 Leech Plants that each latch 3 enemies — kills heal 3% max HP.',
    passive:'🌿 BARBED THORNS — Thorn hits briefly root enemies (0.4s) and deal +20% DoT.',
    abilityName:'LEECH PLANT', abilityIcon:'🪴', abilityCooldown:4,
    statMods:{speed:0,damage:2,fireRate:60,maxHp:30},
    ability(s){
      const p=s.player;
      if(!s.leechPlants)s.leechPlants=[];
      // Up to 2 plants at a time
      if(s.leechPlants.length>=2)s.leechPlants.shift();
      const plant={
        x:p.x, y:p.y,
        r:18,           // detection radius for enemies
        life:18, maxLife:18,
        dmgPs:Math.max(p.damage*1.4, p.maxHp*0.12),  // 12% max HP per second drain
        leechRange:150,   // how close enemy must be to get grabbed
        latchedEnemies:[],   // up to 3 simultaneous targets
        pulse:0,         // animation pulse counter
        feedCount:0,     // how many enemies consumed
      };
      s.leechPlants.push(plant);
      spawnParticles(s,p.x,p.y,'#44ff66',2);spawnParticles(s,p.x,p.y,'#005522',2);
      spawnParticles(s,p.x,p.y,'#00ff88',3);spawnParticles(s,p.x,p.y,'#ffffff',3);
      abilityRing(s,p.x,p.y,'#44ff66',55,.38,{glow:36,lw:4.5});
      abilityRing(s,p.x,p.y,'#00bb44',100,.52,{glow:22,lw:2.5});
      abilityRing(s,p.x,p.y,'#88ff44',150,.65,{glow:12,lw:1.5,noEcho:true});
      flashEl('earthbind-flash');
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(68,255,102,0.18)';
      triggerShake(3);
      addFloat(p.x,p.y,'🪴 LEECH PLANT!','#44ff66');
    },
    color:'#22aa44',pip:[3,3,3,4],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        // Normal shots — no rooting
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.15,vy:Math.sin(a)*p.bulletSpeed*1.15,r:p.bulletSize+2,dmg:bDmg,pierce:p.piercing+1,life:2.1,_druidThorn:true,color:'#44ff66'});
      }
    },
  },
  {
    id:'minigunner', unlockHint:'UNLOCK: 40 SHARDS', name:'MINIGUNNER', icon:'💥', tag:'SUPPRESSION · GUN',
    weaponType:'ranged',
    desc:'Fires tight 2-round bursts. Each consecutive hit on the same enemy builds +8% damage (up to +80%). Hailstorm unleashes a piercing storm.',
    passive:'🎯 SUPPRESSION — Consecutive hits on the same enemy stack +8% damage (up to +80%).',
    abilityName:'HAILSTORM', abilityIcon:'🌪️', abilityCooldown:7,
    statMods:{speed:-0.2,damage:2,fireRate:-120,maxHp:20},
    ability(s){
      const p=s.player;
      p._bulletStormActive=true;p._bulletStormTimer=2.0;
      // Bonus damage from suppression stacks
      const bonus=1+(p._suppressStacks||0)*0.05;
      p._bulletStormDmgBonus=bonus;
      spawnParticles(s,p.x,p.y,'#ff8800',16);spawnParticles(s,p.x,p.y,'#ffff00',2);
      spawnParticles(s,p.x,p.y,'#ffffff',2);spawnParticles(s,p.x,p.y,'#ff4400',3);
      abilityRing(s,p.x,p.y,'#ff8800',55,.32,{glow:44,lw:6});
      abilityRing(s,p.x,p.y,'#ffcc00',105,.46,{glow:28,lw:3.5});
      abilityRing(s,p.x,p.y,'#ffffff',160,.58,{glow:12,lw:1.5,noEcho:true});
      flashEl('hammer-flash');
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,136,0,0.22)';
      triggerShake(8);
      addFloat(p.x,p.y,'🌪 HAILSTORM!','#ff8800');
    },
    color:'#cc4400',pip:[5,2,5,3],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);

      // Track suppression target — stacks +8% dmg per consecutive hit, max 10 stacks
      if(p._suppressTarget!==near){p._suppressTarget=near;p._suppressStacks=0;}
      const suppBonus=1+(p._suppressStacks||0)*0.08;

      const inStorm=p._bulletStormActive;
      const stormBonus=inStorm?(p._bulletStormDmgBonus||1.5):1.0;
      const burstCount=2;
      const piercePow=inStorm?3:p.piercing;

      for(let i=0;i<burstCount;i++){
        const offset=(i-(burstCount-1)/2)*0.04;
        const a=ang+offset;
        const bDmg=dmg*stormBonus*suppBonus*(inStorm?0.90:1.0);
        spawnBullet_pool(s, {
          x:p.x,y:p.y,
          vx:Math.cos(a)*p.bulletSpeed*1.2,
          vy:Math.sin(a)*p.bulletSpeed*1.2,
          r:p.bulletSize,dmg:bDmg,pierce:piercePow,life:1.2,
          _suppressTarget:near,_isMinigunBullet:true
        });
      }
    },
  },
  {
    id:'vampire_hero', unlockReq:'boss1', unlockHint:'Kill 1 boss to unlock', name:'VAMPIRE', icon:'🧛', tag:'MELEE · LIFESTEAL',
    weaponType:'melee',
    desc:'Melee attacker with 10% lifesteal on every hit. Blood Surge heals you for all damage dealt.',
    passive:'🩸 LIFESTEAL — Every melee hit heals 10% of damage dealt.',
    abilityName:'BLOOD SURGE', abilityIcon:'❤️‍🔥', abilityCooldown:5,
    statMods:{speed:0.4,damage:4,fireRate:60,maxHp:-10},
    ability(s){
      const p=s.player;
      p._bloodSurgeActive=true;p._bloodSurgeTimer=5.0;
      const bsv=document.getElementById('rage-vignette');if(bsv)bsv.classList.add('active');
      spawnParticles(s,p.x,p.y,'#cc0033',2);spawnParticles(s,p.x,p.y,'#ff88aa',3);
      spawnParticles(s,p.x,p.y,'#ffffff',2);spawnParticles(s,p.x,p.y,'#440011',3);
      abilityRing(s,p.x,p.y,'#cc0033',70,.38,{glow:48,lw:6});
      abilityRing(s,p.x,p.y,'#ff0044',125,.52,{glow:32,lw:3.5});
      abilityRing(s,p.x,p.y,'#ff88aa',185,.66,{glow:16,lw:2,noEcho:true});
      flashEl('rage-vignette');
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(200,0,50,0.22)';
      triggerShake(6);
      addFloat(p.x,p.y,'🩸 BLOOD SURGE!','#cc0033');
    },
    color:'#880022',pip:[4,4,5,2],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*5+32;
      const inRange=s.enemies.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<reach+e.r);
      inRange.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      const targets=inRange.slice(0,4); // up to 4 claw strikes
      if(!targets.length)return;
      if(!s.meleeSwings)s.meleeSwings=[];
      let totalHeal=0;
      targets.forEach((e,idx)=>{
        const finalDmg=(p._bloodSurgeActive?dmg*2.0:dmg)*(1-idx*0.12);
        const delay=idx*50/1000;
        const doStrike=()=>{
          e.hp-=finalDmg;e.hitFlash=1;s.totalDamageDealt+=finalDmg;
          applyMeleeEffects(s,p,e,finalDmg);
          const healAmt=finalDmg*0.10;
          healPlayer(s,healAmt);updateHpHUD();
          spawnParticles(s,e.x,e.y,'#cc0033',2);
          addFloat(e.x,e.y,`-${fmtBig(finalDmg)}`,'#ff4466');
          const ang=Math.atan2(e.y-p.y,e.x-p.x);
          s.meleeSwings.push({x:p.x,y:p.y,ang,arcHalf:0.38,r:reach,life:.13,maxLife:.13,color:idx===0?'#ff0033':'#cc0033'});
        };
        if(delay===0){doStrike();}
        else{if(!s._pendingSwings)s._pendingSwings=[];s._pendingSwings.push({delay,_t:0,_fn:doStrike,_isFn:true});}
      });
    },
  },
  // ── UNLOCKABLE BOSS CHARACTERS ──────────────────────────────────
  {
    id:'ironclad', unlockReq:'boss1', unlockHint:'Kill 1 boss to unlock', name:'IRONCLAD', icon:'⚔️', tag:'MELEE · TANK',
    weaponType:'melee',
    desc:'A battle-hardened warrior. Massive HP, reflects damage back at attackers. Fortress Stance makes you invulnerable.',
    passive:'🔩 IRON SKIN — Take 25% less damage from all sources. Thorns: 40% damage returned on contact.',
    abilityName:'FORTRESS STANCE', abilityIcon:'🏰', abilityCooldown:7,
    statMods:{speed:-0.4,damage:4,fireRate:100,maxHp:55},
    ability(s){
      const p=s.player;
      p._barrier=true;p._barrierTimer=3.0;p._fortressStance=true;
      spawnParticles(s,p.x,p.y,'#cccccc',3);spawnParticles(s,p.x,p.y,'#ffd700',3);
      spawnParticles(s,p.x,p.y,'#ffffff',3);spawnParticles(s,p.x,p.y,'#888899',3);
      abilityRing(s,p.x,p.y,'#cccccc',65,.36,{glow:44,lw:6});
      abilityRing(s,p.x,p.y,'#ffd700',115,.5,{glow:36,lw:4});
      abilityRing(s,p.x,p.y,'#ffffff',165,.62,{glow:16,lw:2,noEcho:true});
      abilityRing(s,p.x,p.y,'#ffd700',210,.7,{glow:8,lw:1,noEcho:true});
      flashEl('barrier-flash');
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,215,0,0.2)';
      triggerShake(6);
      addFloat(p.x,p.y,'🏰 FORTRESS STANCE!','#ffd700');
    },
    color:'#888899',pip:[4,2,3,5],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      const reach=p.bulletSize*5+40;
      // Heavy cleave: two sweeping arcs — right side then left side (slower stagger)
      const groups=p._fullSweep ? getMeleeGroups(p,s.enemies,reach,Math.PI) : getMeleeGroups(p,s.enemies,reach,Math.PI*0.9); // ~160° sectors
      if(!groups.length)return;
      if(!s.meleeSwings)s.meleeSwings=[];
      groups.forEach((g,idx)=>{
        const delay=idx*130/1000; // ironclad is slow and deliberate
        const col=idx===0?'#aaaacc':'#888899';
        const doStrike=()=>{
          for(const e of g.enemies){
            const fd=idx===0?dmg:dmg*0.75;
            e.hp-=fd;e.hitFlash=1;s.totalDamageDealt+=fd;
            applyMeleeEffects(s,p,e,fd);
            spawnParticles(s,e.x,e.y,col,2);addFloat(e.x,e.y,`-${fmtBig(fd)}`,col);
          }
          s.meleeSwings.push({x:p.x,y:p.y,ang:g.ang,arcHalf:Math.PI*0.48,r:reach,life:.22,maxLife:.22,color:col});
        };
        if(delay===0){doStrike();}
        else{if(!s._pendingSwings)s._pendingSwings=[];s._pendingSwings.push({delay,_t:0,_fn:doStrike,_isFn:true});}
      });
    },
  },
  {
    id:'spellblade', unlockReq:'boss3', unlockHint:'Kill 3 bosses to unlock', name:'SPELLBLADE', icon:'🔮', tag:'RANGED · MAGIC',
    weaponType:'ranged',
    desc:'Fires homing magic orbs that chain between enemies. Arcane Surge fires 8 seeking missiles that each seek independently.',
    passive:'✨ ARCANE ECHO — Every 3rd shot fires a free seeking bonus orb at a random enemy.',
    abilityName:'ARCANE SURGE', abilityIcon:'🌟', abilityCooldown:6,
    statMods:{speed:0.1,damage:4,fireRate:50,maxHp:0},
    ability(s){
      const p=s.player;
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.2,vy:Math.sin(a)*p.bulletSpeed*1.2,
          r:p.bulletSize+3,dmg:p.damage*1.8,pierce:2,life:3.0,_seekerBullets:true,_arcaneOrb:true});
      }
      spawnParticles(s,p.x,p.y,'#cc44ff',3);spawnParticles(s,p.x,p.y,'#8844ff',6);
      spawnParticles(s,p.x,p.y,'#ff44cc',3);spawnParticles(s,p.x,p.y,'#ffffff',3);
      abilityRing(s,p.x,p.y,'#cc44ff',70,.36,{glow:48,lw:5.5});
      abilityRing(s,p.x,p.y,'#ff44cc',120,.5,{glow:32,lw:3});
      abilityRing(s,p.x,p.y,'#8844ff',175,.62,{glow:18,lw:2});
      abilityRing(s,p.x,p.y,'#ffffff',225,.72,{glow:8,lw:1,noEcho:true});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(204,68,255,0.25)';
      triggerShake(6);
      addFloat(p.x,p.y,'✨ ARCANE SURGE!','#cc44ff');
    },
    color:'#9933ff',pip:[4,3,4,2],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      p._spellbladeShotCount=(p._spellbladeShotCount||0)+1;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
          r:p.bulletSize+2,dmg:bDmg,pierce:p.piercing+1,life:2.2,_arcaneOrb:true});
      }
      // Arcane Echo: every 4th shot fires an extra free orb
      if(p._spellbladeShotCount%3===0&&s.enemies.length>1){
        const rnd=s.enemies[Math.floor(Math.random()*s.enemies.length)];
        const ra=Math.atan2(rnd.y-p.y,rnd.x-p.x);
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ra)*p.bulletSpeed*1.1,vy:Math.sin(ra)*p.bulletSpeed*1.1,
          r:p.bulletSize+4,dmg:dmg*1.2,pierce:1,life:2.5,_arcaneOrb:true,_seekerBullets:true});
        addFloat(p.x,p.y,'ECHO!','#cc44ff');
      }
    },
  },
  {
    id:'riftwalker', unlockReq:'boss5', unlockHint:'Kill 5 bosses to unlock', name:'RIFTWALKER', icon:'🌌', tag:'RANGED · VOID',
    weaponType:'ranged',
    desc:'Tears rifts in space that teleport bullets. Rift Step instantly blinks to a random position and fires a burst in all directions.',
    passive:'🌌 VOID DRIFT — 40% chance every shot to fire a 2nd rift bullet. Rift bullets deal 90% damage.',
    abilityName:'RIFT STEP', abilityIcon:'✨', abilityCooldown:5,
    statMods:{speed:0.4,damage:4,fireRate:-80,maxHp:-5},
    ability(s){
      const p=s.player;
      spawnParticles(s,p.x,p.y,'#4400ff',3);
      // Teleport to random position
      p.x=80+Math.random()*(W-160);p.y=80+Math.random()*(H-160);
      p.immune=0.6;
      // Fire ring burst from new position
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2;
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.3,vy:Math.sin(a)*p.bulletSpeed*1.3,
          r:p.bulletSize+2,dmg:p.damage*1.4,pierce:p.piercing+1,life:2.0});
      }
      spawnParticles(s,p.x,p.y,'#8844ff',2);spawnParticles(s,p.x,p.y,'#ffffff',3);
      abilityRing(s,p.x,p.y,'#4400ff',80,.4);
      addFloat(p.x,p.y,'RIFT STEP!','#8844ff');
    },
    color:'#4400cc',pip:[3,4,4,2],
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
          r:p.bulletSize,dmg:bDmg,pierce:p.piercing,life:2.0});
      }
      // Void Drift: 20% chance extra rift bullet from offset position
      if(Math.random()<0.40){
        const ox=p.x+(Math.random()-.5)*50,oy=p.y+(Math.random()-.5)*50;
        spawnBullet_pool(s, {x:ox,y:oy,vx:Math.cos(ang)*p.bulletSpeed,vy:Math.sin(ang)*p.bulletSpeed,
          r:p.bulletSize+1,dmg:dmg*0.90,pierce:p.piercing,life:1.8,color:'#8855ff'});
        spawnParticles(s,ox,oy,'#6633ff',2);addFloat(ox,oy,'✦','#6633ff');
      }
    },
  },
  // ── CHRONOMANCER ────────────────────────────────────────────────
  {
    id:'chronomancer', unlockReq:'boss7', unlockHint:'Kill 7 bosses to unlock', name:'CHRONOMANCER', icon:'⏳', tag:'RANGED · TIME',
    weaponType:'ranged',
    desc:'Manipulates time itself. Bullets slow enemies on hit. Time Stop freezes all enemies for 2.5s.',
    passive:'⚡ TIME SURGE — Your bullets deal 30% bonus damage.',
    abilityName:'TIME STOP', abilityIcon:'❄️', abilityCooldown:9,
    statMods:{speed:0.1,damage:4,fireRate:40,maxHp:0},
    pip:[3,3,3,2],
    color:'#00ccff',
    ability(s){
      const p=s.player;
      // Freeze all enemies for 4s, deal burst damage to frozen
      for(const e of s.enemies){
        if(!e.isBoss){
          e._timeFrozen=4.0;e._origSpeed=e._origSpeed||e.speed;
          const burstDmg=p.damage*2.0;e.hp-=burstDmg;e.hitFlash=1;s.totalDamageDealt+=burstDmg;
          spawnParticles(s,e.x,e.y,'#00ccff',2);
        } else{e._timeFrozen=1.5;}
      }
      spawnParticles(s,p.x,p.y,'#00ccff',8);spawnParticles(s,p.x,p.y,'#ffffff',5);
      abilityRing(s,p.x,p.y,'#00ccff',120,.45,{glow:50,lw:6});
      abilityRing(s,p.x,p.y,'#0088ff',220,.65,{glow:30,lw:4});
      abilityRing(s,p.x,p.y,'#ffffff',350,.85,{glow:20,lw:2,noEcho:true});
      triggerShake(6);addFloat(p.x,p.y-30,'⏳ TIME STOP!','#00ccff');
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(0,200,255,0.25)';      
    },
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const spread=(p.multishot-1)*.18;
      for(let i=0;i<p.multishot;i++){
        const a=ang+(i-(p.multishot-1)/2)*spread;
        const bDmg=(i===0)?dmg:dmg*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
          r:p.bulletSize+1,dmg:bDmg,pierce:p.piercing,life:2.2,color:'#00ccff'});
      }
    },
  },
  // ── NECROMANCER ───────────────────────────────────────────────────
  {
    id:'necromancer_hero', unlockHint:'UNLOCK: 65 SHARDS', name:'NECROMANCER', icon:'💀', tag:'RANGED · SUMMON',
    weaponType:'ranged',
    desc:'Soul bolts raise slain enemies as skeleton allies (max 8). Each skeleton reduces damage taken 6%.',
    passive:'🦴 UNDYING — Each skeleton reduces damage taken by 6%.',
    abilityName:'DEATH NOVA', abilityIcon:'💥', abilityCooldown:5,
    statMods:{speed:-0.1,damage:2,fireRate:60,maxHp:10},
    unlockHint:'UNLOCK VIA SHARD TREE',
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ang)*p.bulletSpeed,vy:Math.sin(ang)*p.bulletSpeed,
        r:p.bulletSize+2,dmg:dmg,pierce:p.piercing,life:2.0,_isSoulBolt:true});
    },
    ability(s){
      const p=s.player;
      const skels=s._skeletons||[];
      const boom=p.damage*3.5;
      for(const sk of skels){
        explodeAt(s,sk.x,sk.y,65,boom);
        spawnParticles(s,sk.x,sk.y,'#aa00ff',3);
        abilityRing(s,sk.x,sk.y,'#aa00ff',65,.4,{glow:28,lw:3});
      }
      s._skeletons=[];
      explodeAt(s,p.x,p.y,80,boom*0.5);
      abilityRing(s,p.x,p.y,'#aa00ff',80,.45,{glow:36,lw:4});
      abilityRing(s,p.x,p.y,'#440088',130,.6,{glow:20,lw:2});
      spawnParticles(s,p.x,p.y,'#aa00ff',2);spawnParticles(s,p.x,p.y,'#000033',2);
      flashEl('void-flash');triggerShake(8);
      addFloat(p.x,p.y,'💥 DEATH NOVA!','#aa00ff');
    },
    color:'#7700cc',pip:[3,4,2,2],
  },
  // ── TEMPLAR ──────────────────────────────────────────────────────
  {
    id:'templar', unlockHint:'UNLOCK: 65 SHARDS', name:'TEMPLAR', icon:'✝️', tag:'HYBRID · HOLY',
    weaponType:'ranged',
    desc:'Consecrated bolts bounce once. Aura weakens nearby enemies -20% dmg. Divine Wrath: holy beam.',
    passive:'✨ CONSECRATION — Enemies within 90px deal 20% less damage.',
    abilityName:'DIVINE WRATH', abilityIcon:'✨', abilityCooldown:6,
    statMods:{speed:-0.1,damage:4,fireRate:80,maxHp:45},
    unlockHint:'UNLOCK VIA SHARD TREE',
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ang)*p.bulletSpeed,vy:Math.sin(ang)*p.bulletSpeed,
        r:p.bulletSize+2,dmg:dmg,pierce:p.piercing,life:1.8,_isHolyBolt:true,_bounces:1});
    },
    ability(s){
      const p=s.player;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      const targetX=near?near.x:p.x,targetY=near?near.y:p.y-200;
      const beamDmg=p.damage*6;
      const beamAng=Math.atan2(targetY-p.y,targetX-p.x);
      for(const e of s.enemies){
        const ex=e.x-p.x,ey=e.y-p.y;
        const proj=ex*Math.cos(beamAng)+ey*Math.sin(beamAng);
        const perp=Math.abs(-ex*Math.sin(beamAng)+ey*Math.cos(beamAng));
        if(proj>0&&perp<e.r+22){
          e.hp-=beamDmg;e.hitFlash=1;s.totalDamageDealt+=beamDmg;
          spawnParticles(s,e.x,e.y,'#ffffaa',2);addFloat(e.x,e.y,`-${fmtBig(beamDmg)}`,'#ffee88');
        }
      }
      if(!s.laserBeams)s.laserBeams=[];
      const bLen=900;
      s.laserBeams.push({x1:p.x,y1:p.y,x2:p.x+Math.cos(beamAng)*bLen,y2:p.y+Math.sin(beamAng)*bLen,
        color:'#ffeeaa',w:8,life:.45,maxLife:.45});
      abilityRing(s,p.x,p.y,'#ffffaa',90,.4,{glow:44,lw:5});
      spawnParticles(s,p.x,p.y,'#ffffaa',3);spawnParticles(s,p.x,p.y,'#ffffff',2);
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(255,255,180,0.35)';
      triggerShake(9);addFloat(p.x,p.y,'✨ DIVINE WRATH!','#ffeeaa');
    },
    color:'#ddcc44',pip:[3,2,3,4],
  },
  // ── TRICKSTER ─────────────────────────────────────────────────────
  {
    id:'trickster', unlockHint:'UNLOCK: 60 SHARDS', name:'TRICKSTER', icon:'🃏', tag:'RANGED · CHAOS',
    weaponType:'ranged',
    desc:'Each shot fires a random elemental card (fire/ice/void/acid/bolt). Wild Card fires all 5 at once.',
    passive:'🎲 FORTUNE — 30% chance to fire two cards. Ice freezes, Bolt chains, Fire ignites, Void explodes.',
    abilityName:'WILD CARD', abilityIcon:'🃏', abilityCooldown:4,
    statMods:{speed:0.3,damage:3,fireRate:90,maxHp:-5},
    unlockHint:'UNLOCK VIA SHARD TREE',
    customShoot(s,dmg){
      const p=s.player;if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      if(!near)return;
      const ang=Math.atan2(near.y-p.y,near.x-p.x);
      const cards=['fire','ice','void','acid','bolt'];
      const card=cards[Math.floor(Math.random()*cards.length)];
      const shootCard=(a,d2)=>{
        const bc={x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
          r:p.bulletSize+1,dmg:d2,pierce:p.piercing,life:1.8,_trickCard:card};
        if(card==='fire')bc._isIncendiary=true;
        else if(card==='acid'){bc.isAcidFlask=true;bc.acidDmg=d2*0.25;bc.bSize=p.bulletSize;}
        else if(card==='void'){bc.isAoEOrb=true;bc.aoeR=30+p.bulletSize*1.5;}
        spawnBullet_pool(s, bc);
      };
      shootCard(ang,dmg);
      if(Math.random()<0.30)shootCard(ang+(Math.random()-.5)*0.3,dmg*0.7);
    },
    ability(s){
      const p=s.player;
      if(!s.enemies.length)return;
      let near=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
      const ang=near?Math.atan2(near.y-p.y,near.x-p.x):0;
      const types=['fire','ice','void','acid','bolt'];
      types.forEach((card,i)=>{
        const sp=(i-2)*0.22;
        const bc={x:p.x,y:p.y,vx:Math.cos(ang+sp)*p.bulletSpeed*1.3,vy:Math.sin(ang+sp)*p.bulletSpeed*1.3,
          r:p.bulletSize+3,dmg:p.damage*1.5,pierce:p.piercing+1,life:2.2,_trickCard:card};
        if(card==='fire')bc._isIncendiary=true;
        else if(card==='acid'){bc.isAcidFlask=true;bc.acidDmg=p.damage*0.4;bc.bSize=p.bulletSize;}
        else if(card==='void'){bc.isAoEOrb=true;bc.aoeR=40+p.bulletSize*2;}
        spawnBullet_pool(s, bc);
      });
      ['#ff4444','#44aaff','#aa44ff','#44ff88','#ffff44'].forEach(c=>spawnParticles(s,p.x,p.y,c,2));
      abilityRing(s,p.x,p.y,'#ff8844',60,.35,{glow:28,lw:3});
      abilityRing(s,p.x,p.y,'#44aaff',90,.45,{glow:22,lw:2,noEcho:true});
      flashEl('ability-flash');document.getElementById('ability-flash').style.background='rgba(200,100,255,0.2)';
      triggerShake(5);addFloat(p.x,p.y,'🃏 WILD CARD!','#ff88ff');
    },
    color:'#ff44cc',pip:[4,4,4,4],
  },
];

let selectedChar=CHARACTERS[0];

function buildCharSelect(){
  const grid=document.getElementById('char-grid');
  grid.innerHTML='';
  const shards=getShards();
  const css=document.getElementById('char-screen-shards');if(css)css.textContent=shards;
  // Sort: free/unlocked first, then locked by cost
  const sortedChars=[
    ...CHARACTERS.filter(ch=>isCharUnlocked(ch)),
    ...CHARACTERS.filter(ch=>!isCharUnlocked(ch)),
  ];
  sortedChars.forEach(ch=>{
    const locked=!isCharUnlocked(ch);
    const card=document.createElement('div');
    card.className='char-card'+(ch===selectedChar&&!locked?' selected':'')+(locked?' locked':'');
    const pips=(n,v)=>[1,2,3,4,5].map(i=>`<div class="stat-pip${i<=v?' filled':''}"></div>`).join('');
    if(locked){
      const isBossUnlock = ch.unlockReq && ch.unlockReq.startsWith('boss');
      const unlockEntry=SHARD_UPGRADES.find(u=>u.id==='sh_unlock_'+ch.id)||
                        SHARD_UPGRADES.find(u=>u.apply&&String(u.apply).includes("'"+ch.id+"'"));
      const cost=unlockEntry?unlockEntry.cost:50;
      const canAfford=shards>=cost;
      if(isBossUnlock){
        card.innerHTML=`
          <div class="char-icon-locked">${ch.icon}</div>
          <div class="char-name-locked">${ch.name}</div>
          <div class="char-tag" style="color:var(--orange);border-color:var(--orange)">${ch.tag}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--orange);margin-top:4px;text-align:center;line-height:1.5">🏆 BOSS UNLOCK<br>${ch.unlockHint||''}</div>`;
        card.style.cursor='default';
        card.title=ch.unlockHint||'Defeat bosses to unlock';
      } else {
        card.innerHTML=`
          <div class="char-icon-locked">${ch.icon}</div>
          <div class="char-name-locked">${ch.name}</div>
          <div class="lock-desc">${ch.tag}</div>
          <div class="lock-cost">💠 ${cost} SHARDS</div>
          <button class="btn-unlock" ${canAfford?'':'disabled'}>
            ${canAfford?'🔓 UNLOCK':'NOT ENOUGH'}
          </button>
          ${!canAfford?`<div class="cant-afford">Need ${cost-shards} more</div>`:''}`;
        const btn=card.querySelector('.btn-unlock');
        if(btn&&canAfford){
          btn.addEventListener('click',(ev)=>{
            ev.stopPropagation();
            addShards(-cost);
            unlockChar(ch.id);
            showAchievementToast('🔓 '+ch.name+' UNLOCKED!');
            buildCharSelect();
          });
        }
      }
    } else {
      card.innerHTML=`
        <div class="char-icon">${ch.icon}</div>
        <div class="char-name">${ch.name}</div>
        <div class="char-tag">${ch.tag}</div>`;
      card.onclick=()=>{
        if(selectedChar===ch){
          // Second click on already selected = confirm
          confirmCharSelect();
        } else {
          selectedChar=ch;
          document.querySelectorAll('.char-card').forEach(c=>c.classList.remove('selected'));
          card.classList.add('selected');
        }
      };
      card.ondblclick=()=>confirmCharSelect();
    }
    grid.appendChild(card);
  });
}

function confirmCharSelect(){
  if(!selectedChar||!isCharUnlocked(selectedChar))return;
  // Populate detail panel
  const ch=selectedChar;
  const pips=(n,v)=>[1,2,3,4,5].map(i=>`<div class="stat-pip${i<=v?' filled':''}"></div>`).join('');
  const panel=document.getElementById('char-detail-panel');
  if(panel){
    panel.innerHTML=`
      <span class="cd-icon">${ch.icon}</span>
      <div class="cd-name">${ch.name}</div>
      <span class="cd-tag">${ch.tag}</span>
      <div class="cd-desc">${ch.desc}</div>
      <div class="cd-ability">⚡ ${ch.abilityName} <span style="color:#555;font-size:11px">(${ch.abilityCooldown}s cooldown)</span></div>
      ${ch.passive?`<div class="cd-passive">${ch.passive}</div>`:''}
      <div class="cd-stats">
        <div class="cd-stat">DMG<div class="stat-pips">${pips('dmg',ch.pip[0])}</div></div>
        <div class="cd-stat">SPD<div class="stat-pips">${pips('spd',ch.pip[1])}</div></div>
        <div class="cd-stat">ATK<div class="stat-pips">${pips('atk',ch.pip[2])}</div></div>
        <div class="cd-stat">DEF<div class="stat-pips">${pips('def',ch.pip[3])}</div></div>
      </div>`;
  }
  // Switch panels
  document.getElementById('char-step-1').style.display='none';
  const step2=document.getElementById('char-step-2');
  step2.style.display='flex';
  buildRunModSelect();
}

function charScreenBack(){
  document.getElementById('char-step-1').style.display='flex';
  document.getElementById('char-step-1').style.flexDirection='column';
  const step2=document.getElementById('char-step-2');
  step2.style.display='none';
}
// ═══════════════════════════════════════════════════════════════════
//  ENGINE
// ═══════════════════════════════════════════════════════════════════
const canvas=el('canvas');
const ctx=canvas.getContext('2d');
const starfieldCanvas=el('starfield');
const starfieldCtx=starfieldCanvas?starfieldCanvas.getContext('2d'):null;
let W=1100,H=668;
function resize(){
  W=canvas.width=1100;
  H=canvas.height=668;
  if(starfieldCanvas){
    starfieldCanvas.width=W;
    starfieldCanvas.height=H;
  }
  _hexCache=null;
}

let state={},raf=null,keys={};


// ── BALANCE CONSTANTS ─────────────────────────────────────────────
// Diminishing return exponents — lower = steeper DR (nerfs stacking)
const DR_DMG   = 0.82;   // eased from 0.62 — still falls off but less punishing
const DR_SPD   = 0.78;   // eased from 0.58
const DR_HP    = 0.84;   // eased slightly
const DR_MAG   = 0.80;   // was 0.75
const DR_BSZ   = 0.78;   // was 0.72 — bullet size DR
const DR_BSP   = 0.80;   // was 0.80 — bullet speed DR
const DR_FIR   = 0.80;   // was 0.75 — fire rate DR
const DR_REG   = 0.76;   // was 0.70 — regen DR

// Multishot damage penalty per extra bullet (0 = full damage, 0.6 = 60% reduction)
const MULTISHOT_DMG_PENALTY = 0.35; // extra bullets deal 65% damage

const SURGE_PICKUPS={
  fury:{id:'fury',icon:'🔥',name:'FURY',color:'#ff7c2b',duration:10},
  blitz:{id:'blitz',icon:'⚡',name:'BLITZ',color:'#38c3f5',duration:8},
  vacuum:{id:'vacuum',icon:'🧲',name:'VACUUM',color:'#1effa0',duration:9},
  nova:{id:'nova',icon:'💥',name:'NOVA',color:'#ffd86b',duration:0},
};
const SURGE_DROP_TABLE=[SURGE_PICKUPS.fury,SURGE_PICKUPS.blitz,SURGE_PICKUPS.vacuum,SURGE_PICKUPS.nova];

function initState(){
  const ch=selectedChar,sm=ch.statMods;
  // ── NERFED BASE STATS ──────────────────────────────────────────
  // Base damage: 28 so wave 1 doesn't feel spongey
  // Base speed: 1.85 (was 2.2)
  const baseFireRate=ch.weaponType==='melee'?220:340;
  return {
    player:{
      x:0,y:0,
      hp:Math.max(30,150+sm.maxHp),maxHp:Math.max(30,150+sm.maxHp),
      speed:2.2+sm.speed,
      level:1,xp:0,xpNext:10,kills:0,gold:0,
      fireRate:Math.max(100,baseFireRate+sm.fireRate),
      bulletSpeed:6.0,damage:28+sm.damage,
      bulletSize:5,
      piercing:0,multishot:1,r:14,
      lastShot:0,immune:0,
      _regen:1.5,_regenAcc:0,_magnetRange:100,  // innate +2 HP/s base regen
      _orbitalCount:0,_orbitalAngle:0,
      _thorns:false,_explosiveBullets:false,_vampiric:false,
      _berserkerRage:false,_berserkerTimer:0,_berserkerDmgBoost:1,
      _cloaked:false,_cloakTimer:0,
      _barrier:false,_barrierTimer:0,
      _abilityCooldown:0,_abilityMaxCd:ch.abilityCooldown,
      _charId:ch.id,
    },
    char:ch,
    enemies:[],bullets:[],orbitalBullets:[],bossBullets:[],
    chests:[],turrets:[],firePatches:[],meleeSwings:[],_pendingSwings:[],
    xpOrbs:[],battlePickups:[],particles:[],floatTexts:[],
    collectedItems:[],
    wave:1,spawnTimer:0,spawnRate:0.72,_baseSpawnRate:0.72,
    paused:false,gameOver:false,won:false,
    lastTime:0,totalTime:0,
    upgradePool:null, // VS-style: choices generated dynamically
    bossSpawned:false,bossAlive:false,
    combo:1,comboTimer:0,comboMaxTime:2.2,
    _nextComboPickup:8,
    shakeX:0,shakeY:0,shakeTimer:0,
    totalDamageDealt:0,totalDamageTaken:0,
    killStreak:0,killStreakTimer:0,  // RAMPAGE system
    _lastWaveChest:0,  // track wave chest milestones
    _dpsLog:[],  // [{t, dmg}] rolling 3s window
  };
}


// ═══════════════════════════════════════════════════════════════════
//  OBJECT POOLS
//  Pre-allocate objects and reuse them to avoid GC pressure.
//  acquire() resets an object from the free list (or allocates new).
//  release(obj) marks it inactive and returns it to free list.
// ═══════════════════════════════════════════════════════════════════
function makePool(factory, resetFn, initSize=64){
  const free=[];
  for(let i=0;i<initSize;i++) free.push(factory());
  return {
    acquire(...args){
      const obj=free.length?free.pop():factory();
      resetFn(obj,...args);
      obj._poolDead=false;
      return obj;
    },
    release(obj){
      obj._poolDead=true;
      free.push(obj);
    },
    get freeCount(){ return free.length; },
  };
}

// ── ENEMY POOL ────────────────────────────────────────────────────
const EnemyPool=makePool(
  ()=>({x:0,y:0,r:10,hp:1,maxHp:1,speed:1,dmgPs:1,xp:1,gold:1,
        color:'#fff',name:'',shape:'circle',alpha:1,hitFlash:0,
        isBoss:false,_poolDead:false,_dead:false}),
  (o,props)=>{
    // Clear all dynamic flags
    o._dead=false;o._poolDead=false;o.hitFlash=0;
    o.explodes=false;o.splits=false;o.shielded=false;o.shieldHp=0;
    o.shoots=false;o.shootTimer=0;o.shootCooldown=2;
    o.enrages=false;o._enraged=false;
    o.necro=false;o.necroTimer=0;o.necroCooldown=0;
    o.isBomber=false;o._fuseTimer=0;
    o.isTeleporter=false;o._teleportTimer=0;
    o.isShielderBot=false;o._orbitTarget=null;o._orbitAngle=0;
    o.isSapper=false;o.isMimic=false;o._mimicRevealed=false;
    o.isHerald=false;o._auraTimer=0;o._auraR=0;
    o.isJuggernaut=false;o._chargeTimer=0;o._charging=false;
    o.isBoss=false;o._isMiniboss=false;
    o._frozen=false;o._frozenTimer=0;o._frozenSpeed=0;
    o._garlicSlowed=false;o._garlicBaseSpeed=0;
    o._stunned=false;o._stunTimer=0;
    o._bleedStacks=0;o._bleeding=false;o._bleedTimer=0;o._bleedDmg=0;
    o._onFire=false;o._fireTimer=0;o._fireDmg=0;o._inferno=false;
    o._poisoned=false;o._poisonTimer=0;
    o._timeWarped=false;o._hitSlowed=false;
    o._sporeSlowed=false;o._poisonSlowed=false;
    o._suppressBaseSpeed=0;o._suppressStacks=0;
    o._mimicR=0;o._zoneTint=null;o._eliteColor=null;
    o._killedBySoulBolt=false;o._consecrated=false;
    o._shieldActive=false;o._mkAbsorbed=0;
    o._assassinHit=false;
    // Copy all provided props
    if(props) Object.assign(o,props);
  },
  128
);

// ── BULLET POOL ───────────────────────────────────────────────────
const BulletPool=makePool(
  ()=>({x:0,y:0,vx:0,vy:0,r:5,dmg:10,life:1,pierce:0,color:'#fff',
        _poolDead:false,isAoEOrb:false,aoeR:0,
        _isMinigunBullet:false,_isSoulBolt:false,_suppressTarget:null,
        isTurret:false,_trickCard:null,_isNecroOrb:false,_isBeam:false,
        _grav:0,_bouncing:false,isRing:false}),
  (o,props)=>{
    o._poolDead=false;o.pierce=0;o.isAoEOrb=false;o.aoeR=0;
    o._timeShot=false;o._isMinigunBullet=false;o._isSoulBolt=false;
    o._suppressTarget=null;o.isTurret=false;o._trickCard=null;
    o._isNecroOrb=false;o._isBeam=false;o._grav=0;o._bouncing=false;
    o.isRing=false;o._voidTrail=false;
    if(props) Object.assign(o,props);
  },
  256
);

// ── BOSS BULLET POOL ─────────────────────────────────────────────
const BossBulletPool=makePool(
  ()=>({x:0,y:0,vx:0,vy:0,r:7,dmg:10,life:2.5,color:'#ff4040',
        _poolDead:false,sourceName:'',_plagueBullet:false,
        _spiralBullet:false,_isMeteor:false}),
  (o,props)=>{
    o._poolDead=false;o._plagueBullet=false;
    o._spiralBullet=false;o._isMeteor=false;o.sourceName='';
    if(props) Object.assign(o,props);
  },
  128
);

// ── XP ORB POOL ───────────────────────────────────────────────────
const OrbPool=makePool(
  ()=>({x:0,y:0,r:5,value:1,life:8,_poolDead:false}),
  (o,props)=>{
    o._poolDead=false;
    if(props) Object.assign(o,props);
  },
  300
);

// ── PARTICLE POOL ─────────────────────────────────────────────────
const ParticlePool=makePool(
  ()=>({x:0,y:0,vx:0,vy:0,r:2,color:'#fff',life:.5,
        isRing:false,isExpandRing:false,maxR:0,maxLife:0,
        glowBlur:0,lineW:1.5,_echo:false,scale:1,_poolDead:false}),
  (o,props)=>{
    o._poolDead=false;o.isRing=false;o.isExpandRing=false;
    o.maxR=0;o.maxLife=0;o.glowBlur=0;o.lineW=1.5;o._echo=false;o.scale=1;
    if(props) Object.assign(o,props);
  },
  256
);

// ── FLOAT TEXT POOL ───────────────────────────────────────────────
const FloatPool=makePool(
  ()=>({x:0,y:0,text:'',color:'#fff',life:1.0,scale:1,_poolDead:false}),
  (o,props)=>{
    o._poolDead=false;o.scale=1;
    if(props) Object.assign(o,props);
  },
  64
);

// ── POOL HELPERS — drop-in replacements for push/splice ───────────
function spawnFloat_pool_obj(s, props){
  if(!s) return;
  if(s.floatTexts&&s.floatTexts.length>25){FloatPool.release(s.floatTexts.shift());}
  const o = FloatPool.acquire(props);
  s.floatTexts.push(o);
  return o;
}

function spawnFloat_pool(x,y,text,color,scale){
  if(!state) return;
  spawnFloat_pool_obj(state, {x, y:y-10, text, color:color||'#fff', life:1.0, scale:scale||1});
}

function spawnEnemy_pool(s,props){
  const o=EnemyPool.acquire(props);
  enemyPush(s, o);
  return o;
}
function enemyPush(s, obj){
  if(obj){ obj._poolDead=false; obj._dead=false; s.enemies.push(obj); }
  return obj;
}
function spawnBullet_pool(s,props){
  const o=BulletPool.acquire(props);
  s.bullets.push(o);
  return o;
}
function spawnBossBullet_pool(s,props){
  const o=BossBulletPool.acquire(props);
  s.bossBullets.push(o);
  return o;
}
function spawnOrb_pool(s,props){
  const o=OrbPool.acquire(props);
  s.xpOrbs.push(o);
  return o;
}
function spawnParticle_pool(s,props){
  const o=ParticlePool.acquire(props);
  s.particles.push(o);
  return o;
}
function spawnFloat_pool(x,y,text,color,scale){
  if(!state) return;
  const o=FloatPool.acquire({x,y:y-10,text,color:color||'#fff',life:1.0,scale:scale||1});
  state.floatTexts.push(o);
}

// Release all dead objects from array back to pool — call once per frame
function flushPool(arr, pool){
  for(let i=arr.length-1;i>=0;i--){
    if(arr[i]._poolDead||arr[i]._dead){
      pool.release(arr[i]);
      arr[i]=arr[arr.length-1];
      arr.pop();
    }
  }
}


//  WEAPONS: 6 slots, each levels 1→max (shown as pips)
//  PASSIVES: 6 slots, each levels 1→5
//  EVOLUTIONS: weapon(max) + required passive(max) → fused super-weapon
// ═══════════════════════════════════════════════════════════════════

const ALL_UPGRADES=[
  // ── DAMAGE ────────────────────────────────────────────────────────────────
  // Flat adds. No stack multiplier. You get what you see.
  {wtype:'any',id:'dmg1',name:'POWER UP',    icon:'⚔️',rarity:'common',
   desc:'+5 Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=5;}},
  {wtype:'any',id:'dmg2',name:'BATTLE FOCUS',icon:'🎯',rarity:'common',
   desc:'+9 Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=9;}},
  {wtype:'any',id:'dmg4',name:'WAR MACHINE', icon:'💢',rarity:'rare',
   desc:'+14 Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=14;}},
  // ONE legendary multiplier item — that's it. unique so can only appear once.
  {wtype:'any',id:'dmg5',name:'DEVASTATOR',  icon:'💥',rarity:'legendary',unique:true,
   desc:'×1.5 damage (one time only)',apply:p=>{p.damage=Math.round(p.damage*1.25);}},

  // ── ATTACK SPEED ──────────────────────────────────────────────────────────
  {wtype:'any',id:'atk1',name:'QUICK HANDS',icon:'⚡',rarity:'common',
   desc:'-8% attack cooldown',apply:p=>{p.fireRate=Math.max(120,Math.round(p.fireRate*0.92));}},
  {wtype:'any',id:'atk2',name:'FRENZY',     icon:'🌀',rarity:'common',
   desc:'-12% attack cooldown',apply:p=>{p.fireRate=Math.max(120,Math.round(p.fireRate*0.88));}},
  {wtype:'any',id:'atk3',name:'OVERDRIVE',  icon:'💫',rarity:'rare',unique:true,
   desc:'-18% attack cooldown',apply:p=>{p.fireRate=Math.max(120,Math.round(p.fireRate*0.82));}},

  // ── HP & SUSTAIN ──────────────────────────────────────────────────────────
  {wtype:'any',id:'hp1',name:'IRON SKIN',  icon:'❤️', rarity:'common',
   desc:'+25 Max HP',apply:p=>{p._hpStacks=(p._hpStacks||0)+1;const g=Math.max(12,Math.round(25*Math.pow(DR_HP,p._hpStacks-1)));p.maxHp+=g;p.hp=Math.min(p.hp+Math.round(g*.5),p.maxHp);}},
  {wtype:'any',id:'hp2',name:'WAR VETERAN',icon:'🩺', rarity:'common',
   desc:'+50 Max HP, +2 regen/s',apply:p=>{p._hpStacks=(p._hpStacks||0)+1;const g=Math.max(20,Math.round(50*Math.pow(DR_HP,p._hpStacks-1)));p.maxHp+=g;p.hp=Math.min(p.hp+Math.round(g*.5),p.maxHp);p._regen+=2;}},
  {wtype:'any',id:'hp4',name:'FORTRESS',   icon:'🏰', rarity:'rare',
   desc:'+100 Max HP, +5 regen/s',apply:p=>{p._hpStacks=(p._hpStacks||0)+1;const g=Math.max(35,Math.round(100*Math.pow(DR_HP,p._hpStacks-1)));p.maxHp+=g;p.hp=Math.min(p.hp+Math.round(g*.5),p.maxHp);p._regen+=5;}},

  // ── REGEN ─────────────────────────────────────────────────────────────────
  {wtype:'any',id:'reg1',name:'LIFE SPRING',icon:'🌿',rarity:'common',
   desc:'+3 HP/sec',apply:p=>{p._regStacks=(p._regStacks||0)+1;p._regen+=Math.max(1,parseFloat((3*Math.pow(DR_REG,p._regStacks-1)).toFixed(1)));}},
  {wtype:'any',id:'reg2',name:'VITAL SURGE',icon:'🫀',rarity:'common',
   desc:'+6 HP/sec',apply:p=>{p._regStacks=(p._regStacks||0)+1;p._regen+=Math.max(2,parseFloat((6*Math.pow(DR_REG,p._regStacks-1)).toFixed(1)));}},

  // ── MOVE SPEED ────────────────────────────────────────────────────────────
  {wtype:'any',id:'spd1',name:'SWIFT BOOTS',icon:'👟',rarity:'common',
   desc:'+Move Speed',apply:p=>{p._spdStacks=(p._spdStacks||0)+1;p.speed+=Math.max(0.05,parseFloat((0.25*Math.pow(DR_SPD,p._spdStacks-1)).toFixed(2)));}},
  {wtype:'any',id:'spd2',name:'FLEET FOOT', icon:'💨',rarity:'common',
   desc:'+Move Speed',apply:p=>{p._spdStacks=(p._spdStacks||0)+1;p.speed+=Math.max(0.08,parseFloat((0.45*Math.pow(DR_SPD,p._spdStacks-1)).toFixed(2)));}},

  // ── MAGNET ────────────────────────────────────────────────────────────────
  {wtype:'any',id:'mag1',name:'MAGNET', icon:'🧲',rarity:'common',
   desc:'+XP range',apply:p=>{p._magStacks=(p._magStacks||0)+1;p._magnetRange+=Math.max(10,Math.round(35*Math.pow(DR_MAG,p._magStacks-1)));}},
  {wtype:'any',id:'mag2',name:'VACUUM', icon:'🔮',rarity:'common',
   desc:'+XP range',apply:p=>{p._magStacks=(p._magStacks||0)+1;p._magnetRange+=Math.max(18,Math.round(65*Math.pow(DR_MAG,p._magStacks-1)));}},

  // ── ABILITY ───────────────────────────────────────────────────────────────
  {wtype:'any',id:'p_cooldown', name:'QUICK CAST',icon:'♾️',rarity:'common',
   desc:'-15% ability cooldown',apply:p=>{p._abilityMaxCd*=0.85;}},
  {wtype:'any',id:'p_cooldown2',name:'ETERNITY',   icon:'⌛',rarity:'common',
   desc:'-30% ability cooldown',apply:p=>{p._abilityMaxCd*=0.70;}},

  // ── ORBITAL ───────────────────────────────────────────────────────────────
  {wtype:'any',id:'orb1',name:'ORBITAL RING',icon:'🪐',rarity:'common',
   desc:'+1 orbital (70% dmg, circles you)',apply:p=>p._orbitalCount+=1},
  {wtype:'any',id:'orb2',name:'TWIN ORBITS', icon:'🌙',rarity:'rare',
   desc:'+2 orbitals',apply:p=>p._orbitalCount+=2},

  // ── ON-KILL EFFECTS ───────────────────────────────────────────────────────
  {wtype:'any',id:'nova1',name:'NOVA BURST',    icon:'💥',rarity:'common',unique:true,
   desc:'20% on-kill explosion (60% dmg)',apply:p=>{p._novaOnKill=true;p._novaLevel=Math.max(p._novaLevel||0,1);}},
  {wtype:'any',id:'nova2',name:'SUPERNOVA',     icon:'🌟',rarity:'rare',
   desc:'50% on-kill explosion, larger radius',apply:p=>{p._novaOnKill=true;p._novaLevel=Math.max(p._novaLevel||0,3);}},
  {wtype:'any',id:'chain1',name:'CHAIN LIGHTNING',icon:'⚡',rarity:'common',unique:true,
   desc:'40% chance: bullet arcs to nearby enemy (50% dmg)',apply:p=>{p._chainLightning=true;p._chainLevel=Math.max(p._chainLevel||0,1);}},
  {wtype:'any',id:'chain2',name:'THUNDERSTORM', icon:'🌩️',rarity:'rare',
   desc:'Chains to 3 enemies, 70% dmg',apply:p=>{p._chainLightning=true;p._chainLevel=Math.max(p._chainLevel||0,4);}},
  {wtype:'any',id:'garlic1',name:'GARLIC AURA', icon:'🧄',rarity:'common',unique:true,
   desc:'Aura: constant dmg to nearby enemies',apply:p=>{p._garlicAura=true;p._garlicLevel=Math.max(p._garlicLevel||0,1);}},
  {wtype:'any',id:'garlic2',name:'STENCH CLOUD',icon:'☁️',rarity:'rare',
   desc:'Bigger aura, slows enemies 20%',apply:p=>{p._garlicAura=true;p._garlicLevel=Math.max(p._garlicLevel||0,3);}},
  {wtype:'any',id:'reaper1',name:'DEATH SCYTHE',icon:'💀',rarity:'rare',unique:true,
   desc:'15% chance on kill: chain-kill nearest enemy',apply:p=>{p._deathShroud=true;p._reaperLevel=Math.max(p._reaperLevel||0,1);}},
  {wtype:'any',id:'reaper2',name:'SOUL REAPER',  icon:'👻',rarity:'rare',
   desc:'50% chain-kill chance with AoE explosion',apply:p=>{p._deathShroud=true;p._reaperLevel=Math.max(p._reaperLevel||0,4);}},

  // ── SUSTAIN ───────────────────────────────────────────────────────────────
  {wtype:'any',id:'p_leech', name:'LIFE LEECH',   icon:'❤️‍🔥',rarity:'rare',unique:true,
   desc:'Heal 3% of damage dealt per hit',apply:p=>{p._lifeLeech=true;p._leechLevel=(p._leechLevel||0)+1;}},
  {wtype:'any',id:'p_leech2',name:'BLOOD DRINKER',icon:'🩸',rarity:'rare',
   desc:'7% leech on hit, +3 HP per kill',apply:p=>{p._lifeLeech=true;p._leechLevel=Math.max(p._leechLevel||0,3);p._vampiric=true;p._vampHpPerKill=(p._vampHpPerKill||0)+3;}},

  // ── DEFENSE ───────────────────────────────────────────────────────────────
  {wtype:'any',id:'p_armor', name:'IRON HIDE',    icon:'🛡️',rarity:'common',
   desc:'+10% damage reduction',apply:p=>{p._armor=(p._armor||0)+0.10;}},
  {wtype:'any',id:'p_armor2',name:'FORTRESS SKIN',icon:'🪨',rarity:'rare',
   desc:'+20% damage reduction',apply:p=>{p._armor=(p._armor||0)+0.20;}},
  {wtype:'any',id:'p_thorns',name:'THORNS',        icon:'🌵',rarity:'rare',unique:true,
   desc:'Reflect 25% of contact damage back at attacker',apply:p=>{p._thorns=true;p._thornsPct=(p._thornsPct||0)+0.25;}},

  // ── COMBO / KILL BONUSES ──────────────────────────────────────────────────
  {wtype:'any',id:'combo1',   name:'COMBO MASTER',icon:'🔥',rarity:'rare',unique:true,
   desc:'×1.1 damage at 5+ combo, ×1.2 at 10+ combo',apply:p=>{p._comboMaster=true;}},
  {wtype:'any',id:'gold1',    name:'PROSPECTOR',  icon:'💰',rarity:'common',
   desc:'+3 gold per kill',apply:p=>{p._bonusGold=(p._bonusGold||0)+3;}},
  {wtype:'any',id:'gold2',    name:'TREASURE HUNTER',icon:'🪙',rarity:'rare',
   desc:'+8 gold per kill, +50 gold now',apply:p=>{p._bonusGold=(p._bonusGold||0)+8;p.gold+=50;}},
  {wtype:'any',id:'xp1',      name:'FAST LEARNER',icon:'📚',rarity:'common',
   desc:'+25% XP from all sources',apply:p=>{p._xpMult=(p._xpMult||1)*1.25;}},

  // ── STATUS EFFECTS ────────────────────────────────────────────────────────
  {wtype:'any',id:'freeze1',name:'FROST TOUCH',  icon:'❄️',rarity:'rare',unique:true,
   desc:'Bullets freeze enemies for 1.5s',apply:p=>{p._cryoRounds=true;p._cryoLevel=2;}},
  {wtype:'any',id:'cryo2',  name:'PERMAFROST',   icon:'🧊',rarity:'rare',
   desc:'Frozen enemies take +40% damage',apply:p=>{p._cryoRounds=true;p._cryoLevel=3;p._cryoVuln=true;}},
  {wtype:'any',id:'burn1',  name:'PYROCLAST',    icon:'🔥',rarity:'rare',unique:true,
   desc:'35% chance bullets ignite (4s burn DoT)',apply:p=>{p._incendiaryBullets=true;p._incendLevel=2;}},
  {wtype:'any',id:'bleed1', name:'HEMORRHAGE',   icon:'🩸',rarity:'rare',unique:true,
   desc:'Melee/bullet hits cause bleed (DoT)',apply:p=>{p._bleedOnHit=true;p._bleedChance=0.30;}},

  // ── RANGED SPECIFIC ───────────────────────────────────────────────────────
  {wtype:'ranged',id:'bsz1',    name:'CALIBER UP',    icon:'🔴',rarity:'common',
   desc:'+Bullet Size',apply:p=>{p._bszStacks=(p._bszStacks||0)+1;p.bulletSize+=Math.max(0.5,parseFloat((2.5*Math.pow(DR_BSZ,p._bszStacks-1)).toFixed(1)));}},
  {wtype:'ranged',id:'bsz2',    name:'HEAVY ROUNDS',  icon:'🟤',rarity:'rare',
   desc:'+Bullet Size, +5 Damage',apply:p=>{p._bszStacks=(p._bszStacks||0)+1;p._dmgStacks=(p._dmgStacks||0)+1;p.bulletSize+=Math.max(0.5,parseFloat((4.0*Math.pow(DR_BSZ,p._bszStacks-1)).toFixed(1)));p.damage+=5;}},
  {wtype:'ranged',id:'bsp1',    name:'VELOCITY',      icon:'💫',rarity:'common',
   desc:'+20% bullet speed',apply:p=>p.bulletSpeed*=1.20},
  {wtype:'ranged',id:'bsp2',    name:'SUPERSONIC',    icon:'🚀',rarity:'rare',
   desc:'+40% bullet speed + 1 pierce',apply:p=>{p.bulletSpeed*=1.40;p.piercing+=1;}},
  {wtype:'ranged',id:'ms1',     name:'BURST FIRE',    icon:'🔀',rarity:'common',
   desc:'+1 extra bullet',apply:p=>p.multishot+=1},
  {wtype:'ranged',id:'ms2',     name:'SPREADSHOT',    icon:'🎆',rarity:'rare',
   desc:'+1 extra bullet',apply:p=>p.multishot+=1},
  {wtype:'ranged',id:'ms3',     name:'HAILSTORM',     icon:'🌨️',rarity:'rare',
   desc:'+2 extra bullets',apply:p=>p.multishot+=2},
  {wtype:'ranged',id:'pierce1', name:'PIERCING ROUNDS',icon:'🏹',rarity:'rare',
   desc:'Bullets pierce 1 enemy',apply:p=>p.piercing+=1},
  {wtype:'ranged',id:'pierce2', name:'PENETRATOR',    icon:'🗡️',rarity:'rare',unique:true,
   desc:'Bullets pierce 2 enemies',apply:p=>{p.piercing+=2;}},
  {wtype:'ranged',id:'expl1',   name:'THERMITE',      icon:'💣',rarity:'rare',unique:true,
   desc:'Bullets explode on hit (50% dmg AoE)',apply:p=>{p._explosiveBullets=true;p._explLevel=1;}},
  {wtype:'ranged',id:'expl2',   name:'CLUSTER BOMB',  icon:'💥',rarity:'rare',
   desc:'Larger explosions + chain reaction',apply:p=>{p._explosiveBullets=true;p._explLevel=3;}},
  {wtype:'ranged',id:'ricochet1',name:'RICOCHET',     icon:'🎱',rarity:'rare',unique:true,
   desc:'Bullets bounce to nearest enemy after hit',apply:p=>{p._ricochet=true;p._ricoLevel=1;}},
  {wtype:'ranged',id:'ricochet2',name:'BOUNCEWALL',   icon:'🎯',rarity:'epic',
   desc:'Bounce up to 4 times, dmg grows per bounce',apply:p=>{p._ricochet=true;p._ricoLevel=4;}},
  {wtype:'ranged',id:'seeker1', name:'SEEKER ROUNDS', icon:'🎯',rarity:'rare',unique:true,
   desc:'Bullets home toward nearest enemy',apply:p=>{p._seekerBullets=true;p._seekerLevel=2;}},
  {wtype:'ranged',id:'incend2', name:'NAPALM',        icon:'🌋',rarity:'epic',
   desc:'All bullets ignite, fire spreads on death',apply:p=>{p._incendiaryBullets=true;p._incendLevel=3;}},
  {wtype:'ranged',id:'sniper1', name:'SNIPER SCOPE',  icon:'🔭',rarity:'epic',unique:true,
   desc:'Every 4th shot: 5× damage sniper round',apply:p=>{p._sniperMode=true;p._sniperCounter=0;p._sniperInterval=4;}},
  {wtype:'ranged',id:'cryo1',   name:'CRYO ROUNDS',   icon:'🧊',rarity:'rare',unique:true,
   desc:'Bullets chill enemies (slow 30%, 1s)',apply:p=>{p._cryoRounds=true;p._cryoLevel=1;}},

  // ── MELEE DAMAGE ──────────────────────────────────────────────────────────
  {wtype:'melee',id:'m_dmg1',name:'SHARP EDGE',  icon:'⚔️',rarity:'common',
   desc:'+5 Melee Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=5;}},
  {wtype:'melee',id:'m_dmg2',name:'BRUTAL FORCE',icon:'🔨',rarity:'rare',
   desc:'+9 Melee Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=9;}},
  {wtype:'melee',id:'m_dmg3',name:'BERSERKER',   icon:'😤',rarity:'epic',
   desc:'+14 Melee Damage',apply:p=>{p._dmgStacks=(p._dmgStacks||0)+1;p.damage+=14;}},
  // ONE melee legendary multiplier
  {wtype:'melee',id:'m_dmg4',name:'TITAN CLEAVE',icon:'⚡',rarity:'legendary',unique:true,
   desc:'×1.5 melee damage (one time only)',apply:p=>{p.damage=Math.round(p.damage*1.25);}},

  // ── MELEE REACH ───────────────────────────────────────────────────────────
  {wtype:'melee',id:'m_rch1',name:'LONG BLADE', icon:'🔪',rarity:'common',
   desc:'+Swing Reach',apply:p=>{p._bszStacks=(p._bszStacks||0)+1;p.bulletSize+=Math.max(1,parseFloat((3.0*Math.pow(DR_BSZ,p._bszStacks-1)).toFixed(1)));}},
  {wtype:'melee',id:'m_rch2',name:'GREAT WEAPON',icon:'🪃',rarity:'rare',
   desc:'+More Reach',apply:p=>{p._bszStacks=(p._bszStacks||0)+1;p.bulletSize+=Math.max(2,parseFloat((5.0*Math.pow(DR_BSZ,p._bszStacks-1)).toFixed(1)));}},
  {wtype:'melee',id:'m_rch3',name:'TITAN ARMS',  icon:'💪',rarity:'epic',
   desc:'+Big Reach, +10 Damage',apply:p=>{p._bszStacks=(p._bszStacks||0)+1;p._dmgStacks=(p._dmgStacks||0)+1;p.bulletSize+=Math.max(3,parseFloat((8.0*Math.pow(DR_BSZ,p._bszStacks-1)).toFixed(1)));p.damage+=10;}},

  // ── MELEE MULTI-HIT ───────────────────────────────────────────────────────
  {wtype:'melee',id:'m_mh1',name:'CLEAVE',         icon:'⚔️',rarity:'rare',
   desc:'+1 extra target per swing',apply:p=>p.multishot+=1},
  {wtype:'melee',id:'m_mh2',name:'WHIRLWIND STRIKE',icon:'🌪️',rarity:'epic',
   desc:'+1 extra target per swing',apply:p=>p.multishot+=1},

  // ── MELEE SUSTAIN ─────────────────────────────────────────────────────────
  {wtype:'melee',id:'m_ls1',name:'LIFESTEAL',    icon:'❤️‍🔥',rarity:'rare',
   desc:'+4 HP per kill',apply:p=>{p._vampiric=true;p._vampHpPerKill=(p._vampHpPerKill||0)+4;}},
  {wtype:'melee',id:'m_ls2',name:'SOUL DRAIN',   icon:'💀',  rarity:'epic',
   desc:'+10 HP per kill, +3 regen/s',apply:p=>{p._vampiric=true;p._vampHpPerKill=(p._vampHpPerKill||0)+10;p._regen+=3;}},

  // ── MELEE ON-HIT ──────────────────────────────────────────────────────────
  {wtype:'melee',id:'m_bleed', name:'BLEED',           icon:'🩸',rarity:'rare',unique:true,
   desc:'Hits apply bleed (4s damage over time)',apply:p=>{p._meleeBleed=true;p._bleedLevel=Math.max(p._bleedLevel||0,2);}},
  {wtype:'melee',id:'m_stun',  name:'STAGGERING BLOW', icon:'⭐',rarity:'rare',
   desc:'Hits stun enemies 0.6s',apply:p=>{p._meleeStun=true;p._stunDur=0.6;}},
  {wtype:'melee',id:'m_fire',  name:'FLAME EDGE',      icon:'🔥',rarity:'epic',unique:true,
   desc:'Hits ignite enemies (3.5s burn DoT)',apply:p=>{p._meleeIgnite=true;p._fireLevel=Math.max(p._fireLevel||0,2);}},
  {wtype:'melee',id:'m_shock', name:'THUNDER BLADE',   icon:'⚡',rarity:'epic',unique:true,
   desc:'40% chance: hits chain lightning to nearby enemy',apply:p=>{p._meleeChain=true;p._mChainLevel=Math.max(p._mChainLevel||0,2);}},
  {wtype:'melee',id:'new_executioner',name:'EXECUTIONER',icon:'🪓',rarity:'epic',unique:true,
   desc:'+60% damage to enemies below 30% HP',apply:p=>{p._executioner=true;p._execLevel=Math.max(p._execLevel||0,2);}},
  {wtype:'melee',id:'new_counter',name:'COUNTER STRIKE',icon:'🛡️',rarity:'rare',
   desc:'Taking damage grants +20% damage for 2s',apply:p=>p._counterStrike=true},
  {wtype:'melee',id:'m_quake',name:'EARTHQUAKE',icon:'🌍',rarity:'epic',unique:true,
   desc:'Every 5th hit: shockwave damages all nearby enemies',apply:p=>{p._quakeOnHit=true;p._quakeInterval=5;}},
];
// ═══════════════════════════════════════════════════════════════════
//  BOSS ITEMS — powerful unique rewards for killing bosses
//  Each run you can only get 1 boss item per boss killed.
//  These are stronger than regular items but can't be rerolled.
// ═══════════════════════════════════════════════════════════════════
const BOSS_ITEMS=[
  {id:'bi_aegis',      name:'AEGIS CORE',       icon:'🛡️', rarity:'boss', wtype:'any',
   desc:'Absorb the next 3 hits completely. Recharges every 30s.',
   apply:p=>{p._aegisCharges=(p._aegisCharges||0)+3;p._aegisCd=30;}},

  {id:'bi_wrath',      name:'WRATH SIGIL',       icon:'⚡', rarity:'boss', wtype:'any',
   desc:'+40 Damage and +15% attack speed.',
   apply:p=>{p.damage+=10;p.fireRate=Math.max(120,Math.round(p.fireRate*0.88));}},

  {id:'bi_tyrant',     name:'TYRANT HEART',      icon:'🩸', rarity:'boss', wtype:'any',
   desc:'+200 Max HP, +8 regen/sec, +3 HP per kill.',
   apply:p=>{p.maxHp+=200;p.hp=Math.min(p.hp+100,p.maxHp);p._regen+=8;p._vampiric=true;p._vampHpPerKill=(p._vampHpPerKill||0)+3;}},

  {id:'bi_storm',      name:'STORM CROWN',       icon:'⛈️', rarity:'boss', wtype:'any',
   desc:'Chain lightning on every hit. Chains to 2 enemies at 60% damage.',
   apply:p=>{p._chainLightning=true;p._chainLevel=Math.max(p._chainLevel||0,3);}},

  {id:'bi_inferno',    name:'INFERNO CORE',      icon:'🔥', rarity:'boss', wtype:'any',
   desc:'All attacks ignite enemies. Fire spreads to nearby enemies on death.',
   apply:p=>{p._incendiaryBullets=true;p._meleeIgnite=true;p._incendLevel=3;p._fireLevel=3;}},

  {id:'bi_void',       name:'VOID SHARD',         icon:'🌌', rarity:'boss', wtype:'any',
   desc:'Kills have 25% chance to trigger Nova explosion at 80% damage.',
   apply:p=>{p._novaOnKill=true;p._novaLevel=Math.max(p._novaLevel||0,4);}},

  {id:'bi_colossus',   name:'COLOSSUS RUNE',      icon:'💪', rarity:'boss', wtype:'any',
   desc:'+30% damage reduction. Contact with enemies deals 15% of your damage.',
   apply:p=>{p._armor=(p._armor||0)+0.30;p._thorns=true;p._thornsPct=(p._thornsPct||0)+0.15;}},

  {id:'bi_bloodmoon',  name:'BLOOD MOON',         icon:'🌑', rarity:'boss', wtype:'any',
   desc:'+10% lifesteal on hit. Heal doubles while below 50% HP.',
   apply:p=>{p._lifeLeech=true;p._leechLevel=Math.max(p._leechLevel||0,4);p._crisisHeal=true;}},

  {id:'bi_abyssal',    name:'ABYSSAL ECHO',       icon:'🔮', rarity:'boss', wtype:'any',
   desc:'Every 5 kills fires an extra burst of 4 homing bullets.',
   apply:p=>{p._abyssalEcho=true;p._abyssalCount=0;p._abyssalInterval=5;}},

  {id:'bi_crown',      name:'WARLORD\'S CROWN',   icon:'👑', rarity:'boss', wtype:'any',
   desc:'+25 Damage. Enemies you kill explode dealing 40% damage to nearby.',
   apply:p=>{p.damage+=8;p._novaOnKill=true;p._novaLevel=Math.max(p._novaLevel||0,2);}},

  {id:'bi_soul',       name:'SOUL FORGE',          icon:'💀', rarity:'boss', wtype:'any',
   desc:'Gain +5 damage for every 10 enemies killed this run.',
   apply:p=>{p._soulForge=true;p._soulForgeThreshold=10;}},

  {id:'bi_tempest',    name:'TEMPEST CORE',        icon:'🌪️', rarity:'boss', wtype:'any',
   desc:'+2 multishot/extra hits. Bullets travel 30% faster.',
   apply:p=>{p.multishot+=2;p.bulletSpeed*=1.30;}},

  {id:'bi_glacier',    name:'GLACIER HEART',       icon:'❄️', rarity:'boss', wtype:'any',
   desc:'Freeze all enemies for 2s every 20s. Frozen enemies take +50% damage.',
   apply:p=>{p._glacierPulse=true;p._glacierCd=20;p._cryoVuln=true;}},

  {id:'bi_reaper',     name:'REAPER\'S SCYTHE',    icon:'☠️', rarity:'boss', wtype:'any',
   desc:'On kill: 35% chance to instantly kill nearest non-boss enemy.',
   apply:p=>{p._deathShroud=true;p._reaperLevel=Math.max(p._reaperLevel||0,3);}},

  {id:'bi_phoenix',    name:'PHOENIX CORE',        icon:'🔥', rarity:'boss', wtype:'any',
   desc:'Once per run: revive at 35% HP when you would die.',
   apply:p=>{p._phoenix=true;p._phoenixCharges=(p._phoenixCharges||0)+1;}},

  {id:'bi_titan',      name:'TITAN SHELL',         icon:'🪨', rarity:'boss', wtype:'any',
   desc:'+150 Max HP, +40% armor, full heal now.',
   apply:p=>{p.maxHp+=150;p.hp=p.maxHp;p._armor=(p._armor||0)+0.40;}},

  {id:'bi_shadow',     name:'SHADOW MANTLE',       icon:'🌑', rarity:'boss', wtype:'any',
   desc:'After taking damage: 2s of 80% damage reduction (10s cooldown).',
   apply:p=>{p._shadowMantle=true;p._shadowMantleCd=10;}},

  {id:'bi_omega',      name:'OMEGA CORE',          icon:'⭕', rarity:'boss', wtype:'any',
   desc:'+50 Damage, +1 pierce, bullets leave fire trails.',
   apply:p=>{p.damage+=12;p.piercing+=1;p._fireBulletTrail=true;}},
  // ── NEW COMMON ITEMS ──────────────────────────────────────────────
  {wtype:'any',id:'tough1',name:'TOUGHNESS',icon:'🦴',rarity:'common',
   desc:'+6% damage reduction',apply:p=>{p._armor=(p._armor||0)+0.06;}},

  {wtype:'any',id:'haste1',name:'HASTE',icon:'⚡',rarity:'common',
   desc:'+0.15 move speed',apply:p=>{p.speed+=0.15;}},

  {wtype:'any',id:'scavenger',name:'SCAVENGER',icon:'🔍',rarity:'common',
   desc:'+12 XP pickup range, +2 gold per kill',apply:p=>{p._magnetRange+=12;p._bonusGold=(p._bonusGold||0)+2;}},

  {wtype:'any',id:'steady1',name:'STEADY HAND',icon:'🎯',rarity:'common',
   desc:'+3 Damage',apply:p=>{p.damage+=3;}},

  {wtype:'any',id:'vitality1',name:'VITALITY',icon:'💚',rarity:'common',
   desc:'+20 Max HP, +1 regen/s',apply:p=>{p.maxHp+=20;p.hp=Math.min(p.hp+10,p.maxHp);p._regen+=1;}},

  {wtype:'ranged',id:'swift_shot',name:'SWIFT SHOT',icon:'💨',rarity:'common',
   desc:'+10% bullet speed',apply:p=>{p.bulletSpeed*=1.10;}},

  {wtype:'ranged',id:'steady_aim',name:'STEADY AIM',icon:'🔭',rarity:'common',
   desc:'+2 Damage, bullets travel slightly further',apply:p=>{p.damage+=2;p.bulletSpeed*=1.05;}},

  {wtype:'melee',id:'m_tough1',name:'WARRIOR SKIN',icon:'🩹',rarity:'common',
   desc:'+20 Max HP, +5% damage reduction',apply:p=>{p.maxHp+=20;p.hp=Math.min(p.hp+10,p.maxHp);p._armor=(p._armor||0)+0.05;}},

];

// Separate array kept for expansion; merged at runtime
const EXTRA_BOSS_ITEMS=[];

function rollBossItem(s){
  // Return 3 random boss items the player hasn't picked yet
  const picked=(s._pickedBossItems||[]);
  const pool=BOSS_ITEMS.concat(EXTRA_BOSS_ITEMS).filter(b=>!picked.includes(b.id));
  if(!pool.length) return BOSS_ITEMS.slice(0,3); // all picked, recycle
  const shuffled=[...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,Math.min(3,shuffled.length));
}

function buildUpgradePool(){
  const wt=selectedChar.weaponType||'ranged';
  return ALL_UPGRADES.filter(u=>!u.wtype||u.wtype==='any'||u.wtype===wt);
}

function getCardDesc(u, p){
  const s=p._dmgStacks||0,sp=p._spdStacks||0,hp=p._hpStacks||0,
        mg=p._magStacks||0,bz=p._bszStacks||0,rg=p._regStacks||0;
  const fmtN=n=>n%1===0?n:n.toFixed(1);
  switch(u.id){
    case 'dmg1': return `+5 Damage (total: ${p.damage})`;
    case 'dmg2': return `+9 Damage (total: ${p.damage})`;
    case 'dmg4': return `+14 Damage (total: ${p.damage})`;
    case 'dmg5': return `×1.25 → ${Math.round(p.damage*1.25)} damage`;
    case 'm_dmg1': return `+5 Melee Damage (total: ${p.damage})`;
    case 'm_dmg2': return `+9 Melee Damage (total: ${p.damage})`;
    case 'm_dmg3': return `+14 Melee Damage (total: ${p.damage})`;
    case 'm_dmg4': return `×1.25 → ${Math.round(p.damage*1.25)} damage`;
    case 'atk1': return `-8% cooldown → ${Math.round(p.fireRate*0.92)}ms`;
    case 'atk2': return `-12% cooldown → ${Math.round(p.fireRate*0.88)}ms`;
    case 'atk3': return `-18% cooldown → ${Math.round(p.fireRate*0.82)}ms`;
    case 'hp1': { const g=Math.max(12,Math.round(25*Math.pow(DR_HP,hp))); return `+${g} Max HP`; }
    case 'hp2': { const g=Math.max(20,Math.round(50*Math.pow(DR_HP,hp))); return `+${g} Max HP, +2 regen`; }
    case 'hp4': { const g=Math.max(35,Math.round(100*Math.pow(DR_HP,hp))); return `+${g} Max HP, +5 regen`; }
    case 'reg1': return `+${fmtN(Math.max(1,parseFloat((3*Math.pow(DR_REG,rg)).toFixed(1))))} HP/sec`;
    case 'reg2': return `+${fmtN(Math.max(2,parseFloat((6*Math.pow(DR_REG,rg)).toFixed(1))))} HP/sec`;
    case 'mag1': return `+${Math.max(10,Math.round(35*Math.pow(DR_MAG,mg)))} XP range`;
    case 'mag2': return `+${Math.max(18,Math.round(65*Math.pow(DR_MAG,mg)))} XP range`;
    case 'spd1': return `+${fmtN(Math.max(.05,parseFloat((0.25*Math.pow(DR_SPD,sp)).toFixed(2))))} Speed`;
    case 'spd2': return `+${fmtN(Math.max(.08,parseFloat((0.45*Math.pow(DR_SPD,sp)).toFixed(2))))} Speed`;
    case 'bsz1': return `+${fmtN(Math.max(.5,parseFloat((2.5*Math.pow(DR_BSZ,bz)).toFixed(1))))} Bullet Size`;
    case 'bsz2': return `+${fmtN(Math.max(.5,parseFloat((4.0*Math.pow(DR_BSZ,bz)).toFixed(1))))} Size, +8 Dmg`;
    case 'bsp1': return `+20% Bullet Speed → ${p.bulletSpeed.toFixed(1)}×1.2`;
    case 'bsp2': return `+40% Speed, +1 Pierce`;
    case 'm_rch1': return `+${fmtN(Math.max(1,parseFloat((3.0*Math.pow(DR_BSZ,bz)).toFixed(1))))} Swing Reach`;
    case 'm_rch2': return `+${fmtN(Math.max(2,parseFloat((5.0*Math.pow(DR_BSZ,bz)).toFixed(1))))} Swing Reach`;
    case 'm_rch3': return `+${fmtN(Math.max(3,parseFloat((8.0*Math.pow(DR_BSZ,bz)).toFixed(1))))} Reach, +10 Dmg`;
    case 'tough1':     return '+6% damage reduction';
    case 'haste1':     return '+0.15 move speed';
    case 'scavenger':  return '+12 XP range, +2 gold/kill';
    case 'steady1':    return '+3 Damage (total: '+p.damage+')';
    case 'vitality1':  return '+20 Max HP, +1 regen/s';
    case 'swift_shot': return '+10% bullet speed';
    case 'steady_aim': return '+2 Damage, +5% bullet speed';
    case 'm_tough1':   return '+20 Max HP, +5% dmg reduction';
    default: return u.desc||'';
  }
}

function getUpgradeChoices(pool, count=3){
  const owned=new Set((state&&state.collectedItems||[]).map(c=>c.id));
  const available=pool.filter(u=>!(u.unique&&owned.has(u.id)));
  if(!available.length) return [];

  // Per-item weights (higher = more likely per item of that rarity)
  // With 34 commons, 37 rares, 11 epics, 2 legendaries this gives:
  // ~40% common, ~35% rare, ~18% epic, ~7% legendary per card shown
  const weights={common:20,rare:16,epic:28,legendary:60};
  
  function pickOne(exclude){
    const pool2=available.filter(u=>!exclude.has(u.id||u));
    if(!pool2.length) return null;
    const total=pool2.reduce((s,u)=>s+(weights[u.rarity]||1),0);
    let roll=Math.random()*total;
    for(const u of pool2){ roll-=(weights[u.rarity]||1); if(roll<=0) return u; }
    return pool2[pool2.length-1];
  }

  const chosen=[];
  const chosenIds=new Set();
  // Pity system: if no epic/legendary seen in 4+ offers, guarantee one
  const s2=state||{};
  s2._dryStreak=(s2._dryStreak||0);
  const needsPity = s2._dryStreak>=4;
  let gotHighRarity=false;
  for(let i=0;i<count;i++){
    let u;
    if(i===0&&needsPity){
      // Force at least epic
      const highPool=available.filter(u2=>!chosenIds.has(u2.id)&&(u2.rarity==='epic'||u2.rarity==='legendary'));
      u = highPool.length ? highPool[Math.floor(Math.random()*highPool.length)] : pickOne(chosenIds);
    } else {
      u=pickOne(chosenIds);
    }
    if(!u) break;
    if(u.rarity==='epic'||u.rarity==='legendary') gotHighRarity=true;
    chosen.push(u);
    chosenIds.add(u.id);
  }
  s2._dryStreak = gotHighRarity ? 0 : s2._dryStreak+1;
  return chosen;
}


function buildSaveData(){
  return {
    version: '3.5',
    savedAt: new Date().toISOString(),
    shards: getShards(),
    ownedUpgrades: getOwnedShardUpgrades(),
    upgradeLevels: getUpgradeLevels(),
    unlockedChars: (() => { try{ return JSON.parse(localStorage.getItem('spudgeon_unlocked')||'[]'); }catch(e){ return []; } })(),
    highScore: getHighScore(),
    achievements: getUnlockedAchievements(),
  };
}

function exportSaveData(){
  const data = buildSaveData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'spudgeon_save.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showAchievementToast('💾 SAVE EXPORTED!');
}

function importSaveData(file){
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if(!data.version) throw new Error('Invalid save');
      if(data.shards !== undefined) localStorage.setItem('spudgeon_shards', data.shards);
      if(data.ownedUpgrades) localStorage.setItem('spudgeon_shard_owned', JSON.stringify(data.ownedUpgrades));
      if(data.upgradeLevels) localStorage.setItem('spudgeon_upg_levels', JSON.stringify(data.upgradeLevels));
      if(data.unlockedChars) localStorage.setItem('spudgeon_unlocked', JSON.stringify(data.unlockedChars));
      if(data.highScore){
        localStorage.setItem('spudgeon_hs_wave', data.highScore.wave||0);
        localStorage.setItem('spudgeon_hs_kills', data.highScore.kills||0);
        localStorage.setItem('spudgeon_hs_level', data.highScore.level||0);
        localStorage.setItem('spudgeon_hs_char', data.highScore.waveChar||'');
      }
      if(data.achievements) localStorage.setItem('spudgeon_ach', JSON.stringify(data.achievements));
      showAchievementToast('✅ SAVE IMPORTED! Reloading...');
      setTimeout(()=>location.reload(), 1500);
    } catch(err) {
      showAchievementToast('❌ IMPORT FAILED: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function triggerImport(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.json';
  inp.onchange = e => { if(e.target.files[0]) importSaveData(e.target.files[0]); };
  inp.click();
}

function getSaveDataPreview(){
  const d = buildSaveData();
  const lvTotal = Object.values(d.upgradeLevels||{}).reduce((a,b)=>a+b,0);
  return `SHARDS: ${d.shards} | UPGRADE LVs: ${lvTotal} | ACHIEVEMENTS: ${d.achievements.length} | BEST WAVE: ${d.highScore.wave||0}`;
}


// ═══════════════════════════════════════════════════════════════════
//  META-PROGRESSION — SHARD SYSTEM
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
//  SHARD UPGRADES — Leveled, scaling, persistent meta-progression
//  Each upgrade has maxLv levels. Cost = baseCost * (currentLv + 1).
//  apply(p, s, totalLv) is called every run start with total purchased levels.
// ═══════════════════════════════════════════════════════════════════════

// ── STAT BOOSTS (Tab 1) ──────────────────────────────────────────────
const STAT_UPGRADES = [
  { id:'su_hp',       icon:'❤️',  name:'VITAL CORE',      maxLv:10, baseCost:5,
    desc: lv => `+${lv*20} starting HP`,
    apply:(p,s,lv) => { p.maxHp+=lv*20; p.hp+=lv*20; } },

  { id:'su_dmg',      icon:'⚔️',  name:'WAR FORGED',       maxLv:10, baseCost:6,
    desc: lv => `+${lv*5}% starting damage`,
    apply:(p,s,lv) => { p.damage=Math.floor(p.damage*(1+lv*0.05)); } },

  { id:'su_spd',      icon:'💨',  name:'SWIFT STEP',       maxLv:8,  baseCost:5,
    desc: lv => `+${(lv*0.25).toFixed(2)} starting speed`,
    apply:(p,s,lv) => { p.speed+=lv*0.25; } },

  { id:'su_regen',    icon:'🌿',  name:'LIFE SPRING',      maxLv:8,  baseCost:7,
    desc: lv => `+${(lv*0.4).toFixed(1)} HP/sec regen`,
    apply:(p,s,lv) => { p._regen=(p._regen||0)+lv*0.4; } },

  { id:'su_pierce',   icon:'🏹',  name:'PENETRATOR',       maxLv:5,  baseCost:10,
    desc: lv => `+${lv} starting pierce`,
    apply:(p,s,lv) => { p.piercing+=lv; } },

  { id:'su_multishot',icon:'🔀',  name:'BURST BARREL',     maxLv:5,  baseCost:12,
    desc: lv => `+${lv} starting multishot`,
    apply:(p,s,lv) => { p.multishot+=lv; } },

  { id:'su_bullet_spd',icon:'⚡', name:'VELOCITY',         maxLv:8,  baseCost:5,
    desc: lv => `+${lv*10}% bullet speed`,
    apply:(p,s,lv) => { p.bulletSpeed*=(1+lv*0.10); } },

  { id:'su_xp',       icon:'📈',  name:'FAST LEARNER',     maxLv:8,  baseCost:7,
    desc: lv => `XP requirement -${lv*8}%`,
    apply:(p,s,lv) => { p.xpNext=Math.floor(p.xpNext*Math.pow(0.92,lv)); } },

  { id:'su_gold',     icon:'💰',  name:'TREASURE SENSE',   maxLv:8,  baseCost:5,
    desc: lv => `Start with +${lv*25} gold`,
    apply:(p,s,lv) => { p.gold+=lv*25; } },

  { id:'su_ability_cd',icon:'🌀', name:'QUICK CAST',       maxLv:6,  baseCost:9,
    desc: lv => `-${lv}s ability cooldown`,
    apply:(p,s,lv) => { p._abilityMaxCd=Math.max(1,p._abilityMaxCd-lv); } },

  { id:'su_revive',   icon:'🔄',  name:'SECOND CHANCE',    maxLv:3,  baseCost:20,
    desc: lv => `Start each run with ${lv} revive charge${lv>1?'s':''}`,
    apply:(p,s,lv) => { p._reviveCharges=(p._reviveCharges||0)+lv; } },

  { id:'su_combo',    icon:'🔥',  name:'FLOW STATE',       maxLv:6,  baseCost:6,
    desc: lv => `Combo window +${(lv*0.4).toFixed(1)}s`,
    apply:(p,s,lv) => { if(s)s.comboMaxTime+=lv*0.4; } },
];

// ── POWER BOOSTS (Tab 2) ─────────────────────────────────────────────
const POWER_UPGRADES = [
  { id:'pu_luck',     icon:'🍀',  name:'LUCKY STRIKE',     maxLv:10, baseCost:8,
    desc: lv => `+${lv*4}% crit chance, crits deal 2.5× damage`,
    apply:(p,s,lv) => { p._critChance=(p._critChance||0)+lv*0.04; } },

  { id:'pu_leech',    icon:'🩸',  name:'LIFE LEECH',       maxLv:8,  baseCost:10,
    desc: lv => `${(lv*2)}% of damage dealt heals you`,
    apply:(p,s,lv) => { p._lifeLeechMult=(p._lifeLeechMult||0)+lv*0.02; } },

  { id:'pu_aura',     icon:'🔆',  name:'DAMAGE AURA',      maxLv:6,  baseCost:12,
    desc: lv => `Passively deal ${lv*4} dmg/s to all nearby enemies`,
    apply:(p,s,lv) => { p._auraStrength=(p._auraStrength||0)+lv*4; } },

  { id:'pu_wave_gold',icon:'🌊',  name:'WAVE BOUNTY',      maxLv:8,  baseCost:6,
    desc: lv => `+${lv*15} gold at start of each wave`,
    apply:(p,s,lv) => { p._waveBounty=(p._waveBounty||0)+lv*15; } },

  { id:'pu_boss_gold',icon:'👑',  name:'PLUNDERER',        maxLv:6,  baseCost:10,
    desc: lv => `+${lv*40} gold from boss kills`,
    apply:(p,s,lv) => { p._bossGoldBonus=(p._bossGoldBonus||0)+lv*40; } },

  { id:'pu_xp_kill',  icon:'✨',  name:'SOUL HARVEST',     maxLv:6,  baseCost:9,
    desc: lv => `+${lv*8}% bonus XP on kills`,
    apply:(p,s,lv) => { p._killXpBonus=(p._killXpBonus||0)+lv*0.08; } },

  { id:'pu_head_start',icon:'🎁', name:'HEAD START',       maxLv:3,  baseCost:18,
    desc: lv => `Start with ${lv} random common item${lv>1?'s':''}`,
    apply:(p,s,lv) => {
      const pool=buildUpgradePool().filter(u=>u.rarity==='common');
      for(let i=0;i<lv;i++){if(pool.length){const u=pool[Math.floor(Math.random()*pool.length)];u.apply(p);}}
    } },

  { id:'pu_glass_proof',icon:'🔮',name:'GLASS PROOF',      maxLv:1,  baseCost:15,
    desc: lv => `Glass Cannon mod: only 1.3× dmg taken (not 2×)`,
    apply:(p,s,lv) => { p._glassProof=true; } },

  { id:'pu_sapper_ward',icon:'🛡️',name:'SAPPER WARD',      maxLv:1,  baseCost:12,
    desc: lv => `Sapper debuff duration halved`,
    apply:(p,s,lv) => { p._sapperWard=true; } },

  { id:'pu_explosion', icon:'💥', name:'CHAIN REACTION',   maxLv:5,  baseCost:14,
    desc: lv => `${lv*12}% chance kills trigger a small explosion`,
    apply:(p,s,lv) => { p._deathExplChance=(p._deathExplChance||0)+lv*0.12; } },

  { id:'pu_shield',   icon:'⚜️',  name:'BARRIER BORN',     maxLv:5,  baseCost:12,
    desc: lv => `Start each run with ${lv*10} shield HP`,
    apply:(p,s,lv) => { p._startShield=(p._startShield||0)+lv*10; } },

  { id:'pu_shard_mult',icon:'💠', name:'SHARD MAGNET',     maxLv:6,  baseCost:10,
    desc: lv => `+${lv*15}% shard rewards from runs`,
    apply:(p,s,lv) => { if(s)s._shardMult=(s._shardMult||1)+lv*0.15; } },
];

// Combined for easy lookup
const ALL_SHARD_UPGRADES = [...STAT_UPGRADES, ...POWER_UPGRADES];

// Character unlocks kept as flat one-time buys
const SHARD_UPGRADES = [
  ...ALL_SHARD_UPGRADES,
  {id:'sh_unlock_marksman',   icon:'🔓', name:'UNLOCK MARKSMAN',   cost:20, desc:'Unlock the MARKSMAN character.',   apply(p){ unlockChar('sniper');         showAchievementToast('🔓 MARKSMAN UNLOCKED!'); } },
  {id:'sh_unlock_engineer',   icon:'🔓', name:'UNLOCK ENGINEER',   cost:25, desc:'Unlock the ENGINEER character.',   apply(p){ unlockChar('engineer');       showAchievementToast('🔓 ENGINEER UNLOCKED!'); } },
  {id:'sh_unlock_cryo',       icon:'🔓', name:'UNLOCK CRYOMANCER', cost:20, desc:'Unlock the CRYOMANCER character.', apply(p){ unlockChar('cryomancer');     showAchievementToast('🔓 CRYOMANCER UNLOCKED!'); } },
  {id:'sh_unlock_pyro',       icon:'🔓', name:'UNLOCK PYROMANCER', cost:25, desc:'Unlock the PYROMANCER character.', apply(p){ unlockChar('pyro');           showAchievementToast('🔓 PYROMANCER UNLOCKED!'); } },
  {id:'sh_unlock_knight',     icon:'🔓', name:'UNLOCK KNIGHT',     cost:20, desc:'Unlock the KNIGHT character.',     apply(p){ unlockChar('knight');         showAchievementToast('🔓 KNIGHT UNLOCKED!'); } },
  {id:'sh_unlock_berserk',    icon:'🔓', name:'UNLOCK BERSERKER',  cost:25, desc:'Unlock the BERSERKER character.',  apply(p){ unlockChar('berserker');      showAchievementToast('🔓 BERSERKER UNLOCKED!'); } },
  {id:'sh_unlock_ninja',      icon:'🔓', name:'UNLOCK NINJA',      cost:25, desc:'Unlock the NINJA character.',      apply(p){ unlockChar('ninja');          showAchievementToast('🔓 NINJA UNLOCKED!'); } },
  {id:'sh_unlock_sentinel',   icon:'🔓', name:'UNLOCK SENTINEL',   cost:30, desc:'Unlock the SENTINEL character.',   apply(p){ unlockChar('sentinel');       showAchievementToast('🔓 SENTINEL UNLOCKED!'); } },
  {id:'sh_unlock_warlock',    icon:'🔓', name:'UNLOCK WARLOCK',    cost:30, desc:'Unlock the WARLOCK character.',    apply(p){ unlockChar('warlock');        showAchievementToast('🔓 WARLOCK UNLOCKED!'); } },
  {id:'sh_unlock_phantom',    icon:'🔓', name:'UNLOCK PHANTOM',    cost:35, desc:'Unlock the PHANTOM character.',    apply(p){ unlockChar('phantom');        showAchievementToast('🔓 PHANTOM UNLOCKED!'); } },
  {id:'sh_unlock_alchemist',  icon:'🔓', name:'UNLOCK ALCHEMIST',  cost:35, desc:'Unlock the ALCHEMIST character.',  apply(p){ unlockChar('alchemist');      showAchievementToast('🔓 ALCHEMIST UNLOCKED!'); } },
  {id:'sh_unlock_reaper',     icon:'🔓', name:'UNLOCK REAPER',     cost:40, desc:'Unlock the REAPER character.',     apply(p){ unlockChar('reaper');         showAchievementToast('🔓 REAPER UNLOCKED!'); } },
  {id:'sh_unlock_gunslinger', icon:'🔓', name:'UNLOCK GUNSLINGER', cost:30, desc:'Unlock the GUNSLINGER character.', apply(p){ unlockChar('gunslinger');     showAchievementToast('🔓 GUNSLINGER UNLOCKED!'); } },
  {id:'sh_unlock_druid',      icon:'🔓', name:'UNLOCK DRUID',      cost:35, desc:'Unlock the DRUID character.',      apply(p){ unlockChar('druid');          showAchievementToast('🔓 DRUID UNLOCKED!'); } },
  {id:'sh_unlock_minigun',    icon:'🔓', name:'UNLOCK MINIGUNNER', cost:40, desc:'Unlock the MINIGUNNER character.', apply(p){ unlockChar('minigunner');     showAchievementToast('🔓 MINIGUNNER UNLOCKED!'); } },
  {id:'sh_unlock_vampire',    icon:'🔓', name:'UNLOCK VAMPIRE',    cost:50, desc:'Unlock the VAMPIRE character.',    apply(p){ unlockChar('vampire_hero');   showAchievementToast('🔓 VAMPIRE UNLOCKED!'); } },
  {id:'sh_unlock_ironclad',   icon:'🔓', name:'UNLOCK IRONCLAD',   cost:50, desc:'Unlock the IRONCLAD character.',   apply(p){ unlockChar('ironclad');       showAchievementToast('🔓 IRONCLAD UNLOCKED!'); } },
  {id:'sh_unlock_spellblade', icon:'🔓', name:'UNLOCK SPELLBLADE', cost:55, desc:'Unlock the SPELLBLADE character.', apply(p){ unlockChar('spellblade');     showAchievementToast('🔓 SPELLBLADE UNLOCKED!'); } },
  {id:'sh_unlock_riftwalker', icon:'🔓', name:'UNLOCK RIFTWALKER', cost:60, desc:'Unlock the RIFTWALKER character.', apply(p){ unlockChar('riftwalker');     showAchievementToast('🔓 RIFTWALKER UNLOCKED!'); } },
  {id:'sh_unlock_necro',      icon:'🔓', name:'UNLOCK NECROMANCER',cost:65, desc:'Unlock the NECROMANCER character.',apply(p){ unlockChar('necromancer_hero');showAchievementToast('🔓 NECROMANCER UNLOCKED!'); } },
  {id:'sh_unlock_templar',    icon:'🔓', name:'UNLOCK TEMPLAR',    cost:65, desc:'Unlock the TEMPLAR character.',    apply(p){ unlockChar('templar');        showAchievementToast('🔓 TEMPLAR UNLOCKED!'); } },
  {id:'sh_unlock_trickster',  icon:'🔓', name:'UNLOCK TRICKSTER',  cost:60, desc:'Unlock the TRICKSTER character.',  apply(p){ unlockChar('trickster');      showAchievementToast('🔓 TRICKSTER UNLOCKED!'); } },
];

function getShards(){ try{return parseInt(localStorage.getItem('spudgeon_shards')||'0');}catch(e){return 0;} }
function addShards(n){ try{const cur=getShards();localStorage.setItem('spudgeon_shards',cur+n);}catch(e){} }

// Leveled upgrades: stored as {id: level} object
function getUpgradeLevels(){ try{return JSON.parse(localStorage.getItem('spudgeon_upg_levels')||'{}');}catch(e){return {};} }
function getUpgradeLevel(id){ return getUpgradeLevels()[id]||0; }
function setUpgradeLevel(id,lv){ try{const o=getUpgradeLevels();o[id]=lv;localStorage.setItem('spudgeon_upg_levels',JSON.stringify(o));}catch(e){} }

// Legacy one-time unlocks (character unlocks)
function getOwnedShardUpgrades(){ try{return JSON.parse(localStorage.getItem('spudgeon_shard_owned')||'[]');}catch(e){return [];} }
function ownShardUpgrade(id){ try{const o=getOwnedShardUpgrades();if(!o.includes(id)){o.push(id);localStorage.setItem('spudgeon_shard_owned',JSON.stringify(o));}}catch(e){} }
function isShardOwned(id){ return getOwnedShardUpgrades().includes(id); }

function calcShardReward(s){
  let shards = Math.floor(s.wave * 1.5);
  shards += Math.floor((s.player.kills||0) * 0.08);
  shards += (s._bossKills||0) * 5;
  const grade = calcRunGrade(s);
  if(grade==='S')shards+=20;else if(grade==='A')shards+=12;else if(grade==='B')shards+=6;
  return Math.max(1, Math.floor(shards * (s._shardMult||1.0)));
}

function applyShardUpgradesToPlayer(p,s){
  // Apply leveled stat/power upgrades
  for(const up of ALL_SHARD_UPGRADES){
    const lv = getUpgradeLevel(up.id);
    if(lv>0) up.apply(p, s, lv);
  }
  // Apply legacy character unlock one-timers (non-char ones are now replaced)
  const owned = getOwnedShardUpgrades();
  for(const id of owned){
    const up = SHARD_UPGRADES.find(u=>u.id===id&&u.id.startsWith('sh_unlock_'));
    if(up&&up.apply) up.apply(p,s);
  }
}

function setUpgradeTab(tab){
  document.getElementById('upg-panel-stats').style.display = tab==='stats'?'flex':'none';
  document.getElementById('upg-panel-power').style.display = tab==='power'?'flex':'none';
  document.getElementById('upg-panel-chars').style.display = tab==='chars'?'flex':'none';
  document.querySelectorAll('.upg-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
}

function buildLeveledPanel(panelEl, upgrades, shards){
  panelEl.innerHTML='';
  upgrades.forEach(up=>{
    const lv = getUpgradeLevel(up.id);
    const maxed = lv >= up.maxLv;
    const cost = up.baseCost * (lv + 1);
    const canAfford = shards >= cost;
    const card = document.createElement('div');
    card.className = 'upg-card' + (maxed?' maxed':(!canAfford?' cant':''));

    // Level pips
    const pips = Array.from({length:up.maxLv},(_,i)=>`<div class="uc-pip${i<lv?(lv>=up.maxLv?' maxed':' on'):''}"></div>`).join('');

    const descText = up.desc(lv+1 <= up.maxLv ? lv+1 : lv);
    const costText = maxed ? '✦ MAXED' : `💠 ${cost}`;
    const costClass = maxed ? 'maxed' : canAfford ? 'buy' : 'cant';

    card.innerHTML = `
      <div class="uc-icon">${up.icon}</div>
      <div class="uc-name">${up.name}</div>
      <div class="uc-pips">${pips}</div>
      <div class="uc-desc">${descText}</div>
      <div class="uc-cost ${costClass}">${costText}</div>`;

    if(!maxed && canAfford){
      card.onclick = () => {
        addShards(-cost);
        setUpgradeLevel(up.id, lv+1);
        buildUnlockScreen();
      };
    }
    panelEl.appendChild(card);
  });
}

function buildUnlockScreen(){
  const prev=document.getElementById('save-preview');
  if(prev)prev.textContent=getSaveDataPreview();
  const shards=getShards();
  const totalEl=document.getElementById('shard-total-val');
  if(totalEl)totalEl.textContent=shards;

  // ── STAT BOOSTS panel ─────────────────────────────────────────
  const statPanel=document.getElementById('upg-panel-stats');
  if(statPanel) buildLeveledPanel(statPanel, STAT_UPGRADES, shards);

  // ── POWER BOOSTS panel ────────────────────────────────────────
  const powerPanel=document.getElementById('upg-panel-power');
  if(powerPanel) buildLeveledPanel(powerPanel, POWER_UPGRADES, shards);

  // ── CHARACTER UNLOCKS panel ───────────────────────────────────
  const charPanel=document.getElementById('upg-panel-chars');
  if(charPanel){
    charPanel.innerHTML='';
    const allChars=CHARACTERS.filter(ch=>ch.id!=='potato'&&ch.unlockHint);
    const unlockedChars=allChars.filter(ch=>isCharUnlocked(ch));
    const shardChars=allChars.filter(ch=>!isCharUnlocked(ch)&&!ch.unlockReq);
    const bossChars=allChars.filter(ch=>!isCharUnlocked(ch)&&ch.unlockReq);

    const makeCharCard=(ch,state)=>{
      const card=document.createElement('div');
      const up=SHARD_UPGRADES.find(u=>u.id==='sh_unlock_'+ch.id)||
               SHARD_UPGRADES.find(u=>u.apply&&String(u.apply).includes("'"+ch.id+"'"));
      const cost=up?up.cost:50;
      const canAfford=shards>=cost;
      if(state==='owned'){
        card.className='char-upg-card owned';
        card.innerHTML=`<div class="cuc-icon">${ch.icon}</div>
          <div class="cuc-info"><div class="cuc-name">${ch.name}</div><div class="cuc-tag">${ch.tag}</div></div>
          <div class="cuc-right"><div class="cuc-badge owned">✓ UNLOCKED</div></div>`;
      } else if(state==='boss'){
        card.className='char-upg-card boss-locked';
        card.innerHTML=`<div class="cuc-icon" style="filter:grayscale(1);opacity:0.5">${ch.icon}</div>
          <div class="cuc-info"><div class="cuc-name" style="color:#888">${ch.name}</div><div class="cuc-tag">${ch.tag}</div></div>
          <div class="cuc-right"><div class="cuc-badge boss">🏆 ${ch.unlockHint.toUpperCase()}</div></div>`;
      } else {
        card.className='char-upg-card'+(canAfford?'':' cant');
        card.innerHTML=`<div class="cuc-icon" style="${canAfford?'':'filter:grayscale(1);opacity:0.5'}">${ch.icon}</div>
          <div class="cuc-info"><div class="cuc-name" style="${canAfford?'':'color:#666'}">${ch.name}</div><div class="cuc-tag">${ch.tag}</div></div>
          <div class="cuc-right">
            <div class="cuc-badge ${canAfford?'buy':'cant'}">💠 ${cost} SHARDS</div>
            ${!canAfford?`<div style="font-family:'Share Tech Mono',monospace;font-size:7px;color:#554466">Need ${cost-shards} more</div>`:''}
          </div>`;
        if(canAfford&&up){
          card.onclick=()=>{addShards(-cost);ownShardUpgrade(up.id);up.apply(null);buildUnlockScreen();};
        }
      }
      charPanel.appendChild(card);
    };

    const secLabel=(color,text)=>{const d=document.createElement('div');d.style.cssText=`font-family:'Bebas Neue',sans-serif;font-size:11px;color:${color};letter-spacing:3px;width:100%;margin:6px 0 4px`;d.textContent=text;charPanel.appendChild(d);};
    if(unlockedChars.length){ secLabel('#ffd700','✓ UNLOCKED'); unlockedChars.forEach(ch=>makeCharCard(ch,'owned')); }
    if(shardChars.length){
      secLabel('#9933ff','💠 UNLOCK WITH SHARDS');
      shardChars.sort((a,b)=>{
        const ca=SHARD_UPGRADES.find(u=>u.id==='sh_unlock_'+a.id);
        const cb=SHARD_UPGRADES.find(u=>u.id==='sh_unlock_'+b.id);
        return (ca?ca.cost:99)-(cb?cb.cost:99);
      }).forEach(ch=>makeCharCard(ch,'shard'));
    }
    if(bossChars.length){ secLabel('#ff8844','🏆 BOSS UNLOCKS'); bossChars.forEach(ch=>makeCharCard(ch,'boss')); }
  }
}

function openUnlockScreen(){
  buildUnlockScreen();
  showScreen('unlock-screen');
}
function closeUnlockScreen(){
  showScreen('title-screen');
}

function updateRunModHUD(){
  const el=document.getElementById('run-mod-hud');
  if(!el||!activeRunModifier)return;
  el.textContent=activeRunModifier.icon+' '+activeRunModifier.name;
  el.style.color=activeRunModifier.cls==='hard'?'#ff8866':activeRunModifier.cls==='easy'?'#88ff88':activeRunModifier.cls==='chaos'?'#00ffcc':'#aaaaaa';
}
function updateShardHUD(){
  const el = document.getElementById('shard-val');
  if(el) el.textContent = getShards();
}

function updateSurgeHUD(s){
  const hud=el('surge-hud');
  if(!hud||!s||!s.player)return;
  const p=s.player;
  const active=[];
  if((p._surgeFuryTimer||0)>0) active.push({type:'fury',label:'Fury',time:p._surgeFuryTimer});
  if((p._surgeBlitzTimer||0)>0) active.push({type:'blitz',label:'Blitz',time:p._surgeBlitzTimer});
  if((p._surgeVacuumTimer||0)>0) active.push({type:'vacuum',label:'Vacuum',time:p._surgeVacuumTimer});
  const stateKey=active.map(buff=>`${buff.type}:${Math.ceil(buff.time*10)}`).join('|');
  if(hud.dataset.state===stateKey)return;
  hud.dataset.state=stateKey;
  hud.innerHTML=active.map(buff=>
    `<div class="surge-pill" data-type="${buff.type}"><strong>${buff.label}</strong>${buff.time.toFixed(1)}s</div>`
  ).join('');
}

function updateSurgeState(s,dt){
  const p=s.player;
  if((p._surgeFuryTimer||0)>0)p._surgeFuryTimer=Math.max(0,p._surgeFuryTimer-dt);
  if((p._surgeBlitzTimer||0)>0)p._surgeBlitzTimer=Math.max(0,p._surgeBlitzTimer-dt);
  if((p._surgeVacuumTimer||0)>0)p._surgeVacuumTimer=Math.max(0,p._surgeVacuumTimer-dt);
  updateSurgeHUD(s);
}

function spawnBattlePickup(s,x,y,forcedType=null){
  if(!s||s.gameOver)return;
  if(!s.battlePickups)s.battlePickups=[];
  if(s.battlePickups.length>=4)s.battlePickups.shift();
  const def=forcedType&&SURGE_PICKUPS[forcedType]?SURGE_PICKUPS[forcedType]:SURGE_DROP_TABLE[Math.floor(Math.random()*SURGE_DROP_TABLE.length)];
  s.battlePickups.push({
    type:def.id,
    x,y,
    r:def.id==='nova'?13:12,
    life:12,
    maxLife:12,
    bob:Math.random()*Math.PI*2,
    spin:Math.random()*Math.PI*2,
  });
  addFloat(x,y-18,`${def.icon} ${def.name}`,def.color);
}

function applyBattlePickup(s,pickup){
  const p=s.player;
  const def=SURGE_PICKUPS[pickup.type];
  if(!def)return;
  if(pickup.type==='fury'){
    p._surgeFuryTimer=Math.max(p._surgeFuryTimer||0,def.duration);
  }else if(pickup.type==='blitz'){
    p._surgeBlitzTimer=Math.max(p._surgeBlitzTimer||0,def.duration);
  }else if(pickup.type==='vacuum'){
    p._surgeVacuumTimer=Math.max(p._surgeVacuumTimer||0,def.duration);
    p_addXp(s,Math.max(4,Math.ceil((s.wave||1)*0.6)));
    updateXpHUD();
    checkLevelUp(s);
  }else if(pickup.type==='nova'){
    explodeAt(s,p.x,p.y,160,p.damage*2.4);
    triggerShake(7);
  }
  spawnParticles(s,p.x,p.y,def.color,6);
  abilityRing(s,p.x,p.y,def.color,pickup.type==='nova'?180:90,pickup.type==='nova'?0.5:0.35,{glow:24,lw:3});
  flashEl('ability-flash');
  const af=el('ability-flash');
  if(af)af.style.background=pickup.type==='nova'?'rgba(255,216,107,0.22)':`${def.color}22`;
  addFloat(p.x,p.y-28,`${def.icon} ${def.name}!`,def.color);
  updateSurgeHUD(s);
}

// ═══════════════════════════════════════════════════════════════════
//  RUN MODIFIERS — chosen before each run, affect shard gain
// ═══════════════════════════════════════════════════════════════════
const RUN_MODIFIERS = [
  {id:'none',      name:'STANDARD',     icon:'⚔️', cls:'normal', shardMult:1.0,  desc:'Normal run.'},
  {id:'glass',     name:'GLASS CANNON', icon:'🔮', cls:'hard',   shardMult:1.5,  desc:'Deal 2× dmg, take 2× dmg. +50% shards.'},
  {id:'noheal',    name:'BLOOD PACT',   icon:'🩸', cls:'hard',   shardMult:1.6,  desc:'No healing at all. +60% shards.'},
  {id:'elite_all', name:'ELITE SURGE',  icon:'👑', cls:'hard',   shardMult:1.4,  desc:'All enemies are elites. +40% shards.'},
  {id:'frenzied',  name:'SPEED DEMON',  icon:'💨', cls:'hard',   shardMult:1.4,  desc:'Enemies move 70% faster. +40% shards.'},
  {id:'titan',     name:'TITAN RUN',    icon:'💀', cls:'hard',   shardMult:1.8,  desc:'Two bosses per boss wave. +80% shards.'},
];

let activeRunModifier = RUN_MODIFIERS[0]; // default: STANDARD

function applyRunModifier(s){
  const m = activeRunModifier;
  if(!m) return;
  if(m.id==='slowmo')    s.player.speed = Math.max(0.5, s.player.speed*0.7);
  if(m.id==='fragile')   { s.player.hp = Math.floor(s.player.maxHp*0.5); }
  if(m.id==='elite_all') s._modEliteAll = true;
  if(m.id==='armored')   s._modArmored = true;
  if(m.id==='frenzied')  s._modFrenzied = true;
  if(m.id==='glass')     s._modGlass = true;
  if(m.id==='noheal')    s._modNoHeal = true;
  if(m.id==='titan')     s._modTitanRun = true;
  if(m.id==='reversal')  s._modReversal = true;
  if(m.id==='echo')      s._modEcho = true;
  // Store multiplier for shard calc
  s._shardMult = m.shardMult;
}

// Titan run: spawn second boss on boss waves
function checkTitanRun(s){
  if(!s._modTitanRun) return;
  if(!s._titanSecondSpawned){ s._titanSecondSpawned=true; spawnBoss(s); }
}

function buildRunModSelect(){
  const grid = document.getElementById('run-mod-grid');
  if(!grid) return;
  grid.innerHTML = '';
  RUN_MODIFIERS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'run-mod-card ' + m.cls + (m===activeRunModifier?' selected':'');
    const mult = m.shardMult >= 1 ? `+${Math.round((m.shardMult-1)*100)}%` : `${Math.round((m.shardMult-1)*100)}%`;
    card.innerHTML = `<div class="rmc-icon">${m.icon}</div>
      <div class="rmc-name">${m.name}</div>
      <div class="rmc-desc">${m.desc}</div>
      <div class="rmc-mult ${m.shardMult>=1?'pos':'neg'}">💠 ${mult} SHARDS</div>`;
    card.onclick = () => {
      activeRunModifier = m;
      buildRunModSelect();
    };
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  (WAVE MODIFIER STUBS — kept for spawn effects used in run mods)
// ═══════════════════════════════════════════════════════════════════
const WAVE_MODIFIERS = [
  // DANGER modifiers
  {id:'armored',    name:'ARMORED',     icon:'🛡',  cls:'danger', desc:'Enemies take 40% less damage',
   onWaveStart(s){ s._modArmored=true; },  onWaveEnd(s){ s._modArmored=false; }},
  {id:'frenzied',   name:'FRENZIED',    icon:'💨',  cls:'danger', desc:'All enemies move 70% faster',
   onWaveStart(s){ s._modFrenzied=true; }, onWaveEnd(s){ s._modFrenzied=false; }},
  {id:'vampiric',   name:'VAMPIRIC',    icon:'🩸',  cls:'danger', desc:'Enemies heal 8% max HP on hit',
   onWaveStart(s){ s._modVampiric=true; }, onWaveEnd(s){ s._modVampiric=false; }},
  {id:'bloodmoon',  name:'BLOOD MOON',  icon:'🌑',  cls:'danger', desc:'No healing this wave',
   onWaveStart(s){ s._modNoHeal=true; },   onWaveEnd(s){ s._modNoHeal=false; }},
  {id:'sapper',     name:'SABOTAGE',    icon:'⚡',  cls:'danger', desc:'Your ability cooldown is doubled',
   onWaveStart(s){ s._modSapper=true; },   onWaveEnd(s){ s._modSapper=false; }},
  {id:'elite_wave', name:'ELITE SURGE', icon:'👑',  cls:'danger', desc:'All enemies spawn as elites',
   onWaveStart(s){ s._modEliteAll=true; }, onWaveEnd(s){ s._modEliteAll=false; }},
  {id:'minefield',  name:'MINEFIELD',   icon:'💣',  cls:'danger', desc:'Random damage zones appear',
   onWaveStart(s){ s._modMinefield=true; },onWaveEnd(s){ s._modMinefield=false;s._minePatches=[];}},
  // BUFF modifiers (good for player)
  {id:'doubler',    name:'DOUBLE XP',   icon:'⚡',  cls:'buff',   desc:'Enemies drop 2× XP',
   onWaveStart(s){ s._modDoubleXp=true; }, onWaveEnd(s){ s._modDoubleXp=false; }},
  {id:'goldrain',   name:'GOLD RUSH',   icon:'💰',  cls:'buff',   desc:'Enemies drop 3× gold',
   onWaveStart(s){ s._modGoldRush=true; }, onWaveEnd(s){ s._modGoldRush=false; }},
  {id:'berserker_mod',name:'BLOODLUST', icon:'🔥',  cls:'buff',   desc:'You deal 40% more damage',
   onWaveStart(s){ s._modPlayerDmg=1.4; }, onWaveEnd(s){ s._modPlayerDmg=1.0; }},
  {id:'guardian',   name:'GUARDIAN',    icon:'🛡',  cls:'buff',   desc:'Start wave with 25% HP shield',
   onWaveStart(s){ s.player._modShield=s.player.maxHp*0.25; },
   onWaveEnd(s){ s.player._modShield=0; }},
  // CHAOS modifiers
  {id:'echo',       name:'ECHO',        icon:'👁',  cls:'chaos',  desc:'Enemies spawn a weak copy on death',
   onWaveStart(s){ s._modEcho=true; },     onWaveEnd(s){ s._modEcho=false; }},
  {id:'glasscannon',name:'GLASS CANNON',icon:'🔮',  cls:'chaos',  desc:'Deal 2× damage, take 2× damage',
   onWaveStart(s){ s._modGlass=true; },    onWaveEnd(s){ s._modGlass=false; }},
  {id:'fog',        name:'BLACKOUT',    icon:'🌫',  cls:'chaos',  desc:'Minimap disabled, reduced vision',
   onWaveStart(s){ s._modFog=true; },      onWaveEnd(s){ s._modFog=false; }},
  {id:'reversal',   name:'REVERSAL',    icon:'🔄',  cls:'chaos',  desc:'Enemies deal damage that heals you, healing patches hurt',
   onWaveStart(s){ s._modReversal=true; }, onWaveEnd(s){ s._modReversal=false; }},
  {id:'titan',      name:'TITAN WAVE',  icon:'💀',  cls:'danger', desc:'Spawn a random boss mid-wave',
   onWaveStart(s){ s._modTitan=true; setTimeout(()=>{if(state&&!state.bossAlive)spawnBoss(state);},3000); },
   onWaveEnd(s){ s._modTitan=false; }},
];

function rollWaveModifiers(wave){
  if(wave<3) return [];  // first 2 waves: clean
  const danger=WAVE_MODIFIERS.filter(m=>m.cls==='danger');
  const buff=WAVE_MODIFIERS.filter(m=>m.cls==='buff');
  const chaos=WAVE_MODIFIERS.filter(m=>m.cls==='chaos');
  const pick=[];
  // Every 5 waves: guaranteed danger mod
  if(wave%5===0) pick.push(danger[Math.floor(Math.random()*danger.length)]);
  // Every 3 waves: buff mod (good for player)
  if(wave%3===0) pick.push(buff[Math.floor(Math.random()*buff.length)]);
  // Every 7 waves: chaos mod
  if(wave%7===0) pick.push(chaos[Math.floor(Math.random()*chaos.length)]);
  // Wave 15+: extra danger
  if(wave>=15&&wave%5===0) {
    const extra=danger.filter(m=>!pick.includes(m));
    if(extra.length) pick.push(extra[Math.floor(Math.random()*extra.length)]);
  }
  // Dedupe
  return [...new Set(pick)];
}

function applyWaveModifiers(s, mods){
  for(const m of mods) if(m.onWaveStart) m.onWaveStart(s);
  s._activeMods=mods;
  // Update active mods HUD
  const modsEl=el('active-mods-hud');
  if(modsEl){
    modsEl.innerHTML=mods.map(m=>`<div class="amod-chip ${m.cls}">${m.icon} ${m.name}</div>`).join('');
  }
}

function clearWaveModifiers(s){
  for(const m of (s._activeMods||[])) if(m.onWaveEnd) m.onWaveEnd(s);
  s._activeMods=[];
  const modsEl=el('active-mods-hud');
  if(modsEl)modsEl.innerHTML='';
}

function showWaveModBanner(mods, callback){
  if(!mods||!mods.length){if(callback)callback();return;}
  const labels=mods.map(m=>`${m.icon} ${m.name}`).join('  ·  ');
  const banner=document.getElementById('wave-announce');
  if(banner){
    banner.innerHTML=`<span style="font-size:11px;letter-spacing:2px;color:#ffd700">${labels}</span>`;
    banner.style.display='flex';banner.classList.add('active');
    setTimeout(()=>{banner.classList.remove('active');if(callback)callback();},2000);
  } else {if(callback)callback();}
}

function renderActiveModStrip(s){
  const strip=document.getElementById('mod-strip');
  if(!strip)return;
  const mods=s._activeMods||[];
  strip.innerHTML=mods.map(m=>
    `<span class="mod-pill ${m.cls}">${m.icon} ${m.name}</span>`
  ).join('');
  strip.style.display=mods.length?'flex':'none';
}

// ═══════════════════════════════════════════════════════════════════
//  ENEMIES — HARDER SCALING
// ═══════════════════════════════════════════════════════════════════
const ENEMY_TYPES=[
  {name:'GRUNT',   color:'#ff4455',r:10,speed:1.5, hp:270, dmgPs:16,xp:3, gold:1,shape:'circle'},
  {name:'RUNNER',  color:'#ff9900',r:8, speed:2.6, hp:228, dmgPs:14,xp:2, gold:1,shape:'circle'},
  {name:'TANK',    color:'#cc2200',r:19,speed:0.85, hp:2520,dmgPs:24,xp:8, gold:4,shape:'circle'},
  {name:'SPEEDER', color:'#ffdd00',r:8, speed:3.0, hp:312, dmgPs:18,xp:4, gold:2,shape:'diamond'},
  {name:'BRUTE',   color:'#cc00ff',r:22,speed:0.90, hp:4320,dmgPs:28,xp:16,gold:8,shape:'circle'},
  {name:'GHOST',   color:'#88aaff',r:11,speed:2.8, hp:360, dmgPs:18,xp:5, gold:2,shape:'circle',alpha:.6},
  {name:'EXPLODER',color:'#ff6600',r:12,speed:2.4, hp:420, dmgPs:0, xp:6, gold:2,shape:'circle',explodes:true},
  {name:'SHIELDER',color:'#00ccff',r:13,speed:1.5, hp:720,dmgPs:20,xp:7, gold:3,shape:'circle',shielded:true},
  {name:'SPLITTER',color:'#aa44ff',r:14,speed:1.6, hp:1200,dmgPs:16,xp:10,gold:4,shape:'circle',splits:true},
  {name:'SNIPER',  color:'#ff4488',r:9, speed:0.7, hp:330, dmgPs:0, xp:7, gold:3,shape:'circle',shoots:true,shootCooldown:1.4},
  // index 10
  {name:'BERSERKER',color:'#ff2200',r:16,speed:1.2,hp:2640,dmgPs:32,xp:13,gold:6,shape:'circle',enrages:true},
  {name:'NECROMANCER',color:'#8800aa',r:12,speed:1.0,hp:1680,dmgPs:12,xp:15,gold:7,shape:'circle',necro:true,necroTimer:4,necroCooldown:4},
  // NEW ENEMIES (indices 12-14) — Mimic & Vampire removed
  {name:'BOMBER',   color:'#ff8800',r:13,speed:1.8,hp:510, dmgPs:0, xp:8, gold:3,shape:'circle',isBomber:true},
  {name:'TELEPORTER',color:'#00ffcc',r:10,speed:1.8,hp:528,dmgPs:23,xp:9,gold:4,shape:'diamond',isTeleporter:true},
  {name:'JUGGERNAUT',color:'#8b0000',r:26,speed:0.70,hp:7200,dmgPs:38,xp:24,gold:14,shape:'circle',isJuggernaut:true},
  // NEW v3.4 ENEMY TYPES (indices 15-18)
  {name:'SHIELDER-BOT',color:'#00aaff',r:11,speed:1.6,hp:600,dmgPs:16,xp:8,gold:3,shape:'circle',isShielderBot:true},
  {name:'SAPPER',      color:'#ffe000',r:10,speed:2.2,hp:420, dmgPs:22,xp:9,gold:4,shape:'diamond',isSapper:true},
  {name:'MIMIC',       color:'#ffd700',r:16,speed:0,  hp:1500,dmgPs:40,xp:14,gold:10,shape:'circle',isMimic:true},
  {name:'HERALD',      color:'#ff88ff',r:14,speed:0.8,hp:960,dmgPs:8, xp:14,gold:7,shape:'circle',isHerald:true},
];

// BOSSES — much more HP, faster projectiles, more aggressive
const BOSS_TYPES=[
  // 1 — KING SLIME: charges, scatters globs, splits at 50%
  {name:'KING SLIME',    color:'#00ee88',r:38,speed:1.4, hp:10000,dmgPs:28,xp:40, gold:25,pattern:'charge',
   chargeTimer:1.8,chargeCooldown:1.8,charging:false,chargeVx:0,chargeVy:0,shootCooldown:0.85,shootTimer:0},
  // 2 — DEATH STAR: orbits centre, bullet rings + aimed laser, spiral phase
  {name:'DEATH STAR',    color:'#ff2266',r:34,speed:0.65,hp:11500,dmgPs:24,xp:60, gold:32,pattern:'orbit',
   orbitAngle:0,shootCooldown:0.42,shootTimer:0,burstCount:9},
  // 3 — VOID TITAN: gravity pull, 4-arm cross, void collapse at 50%
  {name:'VOID TITAN',    color:'#7700ff',r:42,speed:0.7, hp:13000,dmgPs:36,xp:80, gold:42,pattern:'summon',
   summonTimer:6.0,summonCooldown:6.0,shootCooldown:0.5,shootTimer:0},
  // 4 — FROST LICH: drifts, triple lances + spiral arms, ice wall + shatter at 50%
  {name:'FROST LICH',    color:'#44ccff',r:36,speed:0.85,hp:14000,dmgPs:30,xp:70, gold:38,pattern:'frost',
   shootCooldown:0.28,shootTimer:0},
  // 5 — BLOOD MOON: rage-scales speed, rotating spiral, blood clones at 65%, rage burst at 35%
  {name:'BLOOD MOON',    color:'#cc0000',r:40,speed:1.0, hp:15500,dmgPs:38,xp:90, gold:48,pattern:'bloodmoon',
   shootCooldown:0.6,shootTimer:0},
  // 6 — SHADOW HYDRA: triple-dash poison combo, 5-spread shots, splits at 50%
  {name:'SHADOW HYDRA',  color:'#334400',r:44,speed:0.9, hp:17000,dmgPs:34,xp:52,gold:54,pattern:'hydra',
   hasSplit:false,shootCooldown:0.38,shootTimer:0,_dashCooldown:2.5,_dashing:false,_dashVx:0,_dashVy:0},
  // 7 — INFERNAL COLOSSUS: hunt→stomp→meteor→charge phases, fire trail
  {name:'INFERNAL COLOSSUS',color:'#ff6600',r:50,speed:0.65,hp:18500,dmgPs:44,xp:60,gold:65,pattern:'colossus',
   stompTimer:1.8,stompCooldown:1.8,shootCooldown:0.55,shootTimer:0},
  // 8 — STORM WITCH: teleport+mines, triple bolts, edge convergence storm at 40%
  {name:'STORM WITCH',   color:'#aaff00',r:32,speed:1.2, hp:12500,dmgPs:26,xp:55,gold:58,pattern:'stormwitch',
   teleportTimer:3.0,teleportCooldown:3.0,shootCooldown:0.42,shootTimer:0,lightningTimer:4.0,lightningCooldown:4.0},
  // 9 — PLAGUE LORD: spreading puddles, infection shots, mega horde at 50%
  {name:'PLAGUE LORD',   color:'#44ff44',r:40,speed:0.8, hp:16000,dmgPs:28,xp:58,gold:62,pattern:'plaguelord',
   plagueCooldown:2.2,plagueTimer:2.2,minionTimer:5.0,minionCooldown:5.0,shootCooldown:0.5,shootTimer:0},
  // 10 — TITAN WORM: burrows underground, erupts near player, spread volley at 50%
  {name:'TITAN WORM',    color:'#aa6600',r:48,speed:0.5, hp:19000,dmgPs:38,xp:65,gold:70,pattern:'titanworm',
   burrowTimer:4.5,burrowCooldown:4.5,isBurrowed:false,burrowedTimer:0,eruptTimer:0,shootCooldown:0.6,shootTimer:0},
  // 11 — MIRROR KNIGHT: parries player bullets back, punishes sustained fire
  {name:'MIRROR KNIGHT', color:'#c0e8ff',r:38,speed:1.1, hp:20000,dmgPs:32,xp:70,gold:75,pattern:'mirrorknight',
   shootCooldown:0.9,shootTimer:0},
  // 12 — NETHER ARCHITECT: constructs geometric fire-wall cages around the player
  {name:'NETHER ARCHITECT',color:'#ff8844',r:36,speed:0.7,hp:21500,dmgPs:28,xp:75,gold:80,pattern:'architect',
   shootCooldown:0.55,shootTimer:0},
  // 13 — TWIN SERPENTS: two linked serpents sharing HP; survivor enrages if the other dies first
  {name:'TWIN SERPENTS', color:'#44ffcc',r:34,speed:1.3, hp:22000,dmgPs:30,xp:80,gold:85,pattern:'serpent',
   shootCooldown:0.7,shootTimer:0},
  // 14 — THE RECURSION: fractal splitter — halves on death down 3 levels, arena floods
  {name:'THE RECURSION', color:'#ee44ff',r:44,speed:0.8, hp:23000,dmgPs:26,xp:85,gold:90,pattern:'recursion',
   shootCooldown:0.5,shootTimer:0,_recurseDepth:0},
  // 15 — OMEGA CORE: 3-phase ultimate boss — gravity well → orbital cannon array → berserker overload
  {name:'OMEGA CORE',    color:'#ffffff',r:46,speed:0.5, hp:26000,dmgPs:40,xp:100,gold:120,pattern:'omegacore',
   shootCooldown:0.4,shootTimer:0},
];

function getEdgePos(){
  const side=Math.floor(Math.random()*4),pad=30;
  if(side===0)return{x:Math.random()*W,y:-pad};
  if(side===1)return{x:W+pad,y:Math.random()*H};
  if(side===2)return{x:Math.random()*W,y:H+pad};
  return{x:-pad,y:Math.random()*H};
}

function spawnEnemy(s){
  const w=s.wave;
  let pool=[0,0,1];
  if(w>=2)pool.push(1,2);if(w>=3)pool.push(3,6);if(w>=4)pool.push(7);
  if(w>=5)pool.push(4,5);if(w>=7)pool.push(8,9);
  if(w>=8)pool.push(10);  // Berserker (single weight)
  if(w>=9)pool.push(1,2);if(w>=10)pool.push(11); // Necromancer (single weight)
  if(w>=11)pool.push(6);if(w>=12)pool.push(8,9); // light enemies, no extra heavies
  if(w>=7)pool.push(12);  // Bomber wave 7+
  if(w>=9)pool.push(13);  // Teleporter wave 9+
  if(w>=13)pool.push(14); // Juggernaut wave 13+ (pushed back, single weight)
  if(w>=8) pool.push(15);  // Shielder-Bot
  if(w>=10)pool.push(16);  // Sapper
  if(w>=11)pool.push(17);  // Mimic
  if(w>=12)pool.push(18);  // Herald
  const t=ENEMY_TYPES[pool[Math.floor(Math.random()*pool.length)]];
  const pos=getEdgePos();
  const _zoneHpMult=getZone(w).enemyHpMult;
  // Exponential HP scaling — linear early, exponential past wave 15, capped at wave 60 level
  const _levelMult = 1 + (s.player.level - 1) * 0.04; // +10% HP per player level
  const _rawScale = Math.pow(1.12, w);
  const hpScale = _rawScale * _zoneHpMult * _levelMult;
  const _spdLevelMult = 1 + (s.player.level - 1) * 0.02; // +5% speed per player level
  const spdScale = Math.min(3.0, 1 + (w-1)*0.04) * _spdLevelMult;
  const e={x:pos.x,y:pos.y,r:t.r,hp:t.hp*hpScale,maxHp:t.hp*hpScale,speed:t.speed*spdScale,
    dmgPs:t.dmgPs * Math.min(4.0, 1+(w-1)*0.06) * (1+(s.player.level-1)*0.03),
    xp:t.xp,gold:t.gold,color:t.color,name:t.name,shape:t.shape||'circle',
    alpha:t.alpha||1,hitFlash:0,isBoss:false};
  const _zt=getZone(w).enemyTint;if(_zt)e._zoneTint=_zt;
  if(t.explodes)e.explodes=true;if(t.splits)e.splits=true;
  if(t.shielded){e.shielded=true;e.shieldHp=50+(w*4);}
  if(t.shoots){e.shoots=true;e.shootTimer=Math.random()*2;e.shootCooldown=Math.max(0.8,t.shootCooldown-(w*0.05));}
  // healer removed
  if(t.enrages){e.enrages=true;e._enraged=false;}
  if(t.necro){e.necro=true;e.necroTimer=t.necroTimer;e.necroCooldown=t.necroCooldown;}
  if(t.isBomber){e.isBomber=true;e._fuseTimer=2.5+Math.random()*2;}
  if(t.isTeleporter){e.isTeleporter=true;e._teleportTimer=2.5+Math.random()*2;}
  if(t.isShielderBot){e.isShielderBot=true;e._orbitTarget=null;e._orbitAngle=Math.random()*Math.PI*2;}
  if(t.isSapper){e.isSapper=true;}
  if(t.isMimic){e.isMimic=true;e._mimicRevealed=false;e.speed=0;e.dmgPs=0;
    // Disguised as a chest — use chest colors
    e.color='#ffd700';e._mimicR=e.r;e.r=14;}
  if(t.isHerald){e.isHerald=true;e._auraTimer=0;e._auraR=90+w*4;}
  if(t.isJuggernaut){e.isJuggernaut=true;e._chargeTimer=3.5;e._charging=false;}
  // Wave modifiers applied at spawn
  if(s._modFrenzied)e.speed*=1.7;
  if(s._modArmored){e._armored=true;e.hp*=1.6;e.maxHp=e.hp;}
  if(s._modEliteAll&&!e._elite){
    e._elite=true;e.hp*=2.2;e.maxHp=e.hp;e.dmgPs*=1.5;e.speed*=1.15;
    e.xp=Math.ceil(e.xp*2.5);e.gold=Math.ceil(e.gold*2);e._eliteColor=e.color;
  }
  if(s._modDoubleXp)e.xp*=2;
  if(s._modGoldRush)e.gold*=3;
  // ELITE system: 12% chance any enemy is elite
  if(Math.random()<0.20&&w>=3){
    e._elite=true;
    e.hp*=2.2;e.maxHp=e.hp;e.dmgPs*=1.5;e.speed*=1.15;
    e.xp=Math.ceil(e.xp*2.5);e.gold=Math.ceil(e.gold*2);
    e._eliteColor=e.color;
  }
  enemyPush(s, e);
}

// Fixed boss order — waves 5,10,15,...50 map to indices 0–9; then repeats stronger
// BOSS_TYPES order: King Slime, Death Star, Void Titan, Frost Lich, Blood Moon,
//                  Shadow Hydra, Infernal Colossus, Storm Witch, Plague Lord, Titan Worm
function spawnBoss(s){
  if(s.bossAlive)return;
  const bossNum=Math.max(1,Math.floor(s.wave/5));   // 1 on wave5, 2 on wave10, …20 on wave100
  const idx=(bossNum-1)%BOSS_TYPES.length;           // cycles 0–9 then repeats
  const lap=Math.floor((bossNum-1)/BOSS_TYPES.length);
  const boss=JSON.parse(JSON.stringify(BOSS_TYPES[idx]));
  // Boss HP: exponential scaling per wave. Wave 5 = base, doubles ~every 10 waves past wave 20
  const waveNum = s.wave;
  const wsc = Math.pow(1.12, waveNum - 5);  // exponential like enemies
  const lapBonus = 1 + lap * 0.40;
  boss.hp = Math.round(boss.hp * wsc * lapBonus);
  boss.maxHp=boss.hp;
  boss.dmgPs=Math.round(boss.dmgPs*(1+s.wave*0.04)*(1+(s.player.level-1)*0.03));
  boss.x=W/2; boss.y=-80; boss.hitFlash=0; boss.isBoss=true;
  enemyPush(s, boss);s.bossAlive=true;s.bossSpawned=true;
  s._bossStartDmg=state.totalDamageTaken;
  s._bossFightStart=s.totalTime;
  s._bossFightDmgStart=s.totalDamageDealt;
  s._bossKillNoHit=false;
  document.getElementById('boss-bar-wrap').classList.add('active');
  const lapLabel=lap>0?` [LVL ${lap+1}]`:'';
  document.getElementById('boss-name').textContent=`⚠ ${boss.name}${lapLabel} ⚠`;
  announceWave(`⚠ BOSS: ${boss.name}${lapLabel} ⚠`,'boss');
  sndBossSpawn();
  // Boss entrance drama
  setTimeout(()=>{
    abilityRing(s,W/2,H/2,'#ff4488',250,.6,{glow:50,lw:6});
    abilityRing(s,W/2,H/2,'#ff2266',450,.9,{glow:25,lw:3,noEcho:true});
    triggerShake(14);
    const af=document.getElementById('ability-flash');
    if(af){af.style.background='rgba(255,20,80,0.35)';af.classList.add('active');setTimeout(()=>{af.classList.remove('active');af.style.background='';},600);}
  },400);
}

// ═══════════════════════════════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════════════════════════════
function gameLoop(ts){
  if(!state)return;
  const dt=Math.min((ts-state.lastTime)/1000,.05);
  state.lastTime=ts;state.lastDt=dt;
  if(!state.paused&&!state.gameOver)update(dt);
  draw();
  raf=requestAnimationFrame(gameLoop);
}

function update(dt){
  const s=state,p=s.player;
  s.totalTime+=dt;
  s._achTimer=(s._achTimer||0)+dt;if(s._achTimer>1.0){s._achTimer=0;checkAchievements(s);}

  // ── SPATIAL GRID — rebuilt each frame, used for bullet-enemy collision ──
  // 64px cells covering the canvas. Enemies are bucketed by their cell.
  const CELL=80;
  const GCOLS=Math.ceil(W/CELL)+2, GROWS=Math.ceil(H/CELL)+2;
  if(!s._grid||s._grid.length!==GCOLS*GROWS) s._grid=new Array(GCOLS*GROWS);
  const grid=s._grid;
  for(let i=0;i<grid.length;i++) grid[i]=null; // clear with null sentinel
  for(let i=0;i<s.enemies.length;i++){
    const e=s.enemies[i];if(e._dead)continue;
    const cx=((e.x/CELL)|0)+1, cy=((e.y/CELL)|0)+1;
    if(cx<0||cx>=GCOLS||cy<0||cy>=GROWS)continue;
    const idx=cy*GCOLS+cx;
    e._gridNext=grid[idx]; grid[idx]=e; // linked list in cell
  }

  // ── HOIST PER-FRAME BULLET DAMAGE CONSTANTS ──────────────────────
  // These never change within a frame — compute once, reuse in inner loop
  s._fc_crit    = p._critChance||0;
  s._fc_rage    = p._rageDmgMult||1.0;
  s._fc_lowHp   = (p._lowHpBonus&&p.hp/p.maxHp<0.25)?1.5:1.0;
  s._fc_dodge   = p._dodgeDmgMult||1.0;
  s._fc_combo   = p._comboMaster?(s.combo>=5?1.20:s.combo>=3?1.10:1.0):1.0;
  s._fc_leech   = (p._lifeLeech?[0,.03,.05,.08,.11,.16][Math.min(5,p._leechLevel||1)]:0)+(p._lifeLeechMult||0);
  s._fc_rampage  = p._rampageMult||1.0;
  s._fc_ks       = (p._killStreakPower&&p._ksReady)?5.0:1.0;
  s._fc_newMult  = s._fc_rage*s._fc_lowHp*s._fc_dodge*s._fc_combo*s._fc_rampage*s._fc_ks;

  // ── HUD DIRTY FLAGS — update HUD at most every 3 frames ──────────
  s._hudDirty=(s._hudDirty||0)+1;
  const HUD_INTERVAL=3;

  // ── EXPLOSION BUDGET — cap chain explosions per frame ────────────
  s._explBudget=12; // max explosions this frame (prevents cascade lag)

  // Pending staggered melee swings
  if(s._pendingSwings&&s._pendingSwings.length){
    const p=s.player;
    for(let i=s._pendingSwings.length-1;i>=0;i--){
      const ps=s._pendingSwings[i];
      ps._t+=dt;
      if(ps._t>=ps.delay){
        if(ps._isFn){ ps._fn(); }
        else{ _strikeGroup(s, p, ps.g, {reach:ps.reach,dmg:ps.dmg,arcHalf:ps.arcHalf,color:ps.color,life:ps.life}); }
        s._pendingSwings.splice(i,1);
      }
    }
  }

  // DPS meter update
  s._dpsTimer=(s._dpsTimer||0)+dt;
  if(s._dpsTimer>0.25){
    s._dpsTimer=0;
    const now=s.totalTime, window=3.0;
    s._dpsLog=s._dpsLog.filter(e=>now-e.t<window);
    const totalDmg=s._dpsLog.reduce((a,e)=>a+e.dmg,0);
    const dps=Math.round(totalDmg/window);
    if(dps > (s._peakDps||0)) s._peakDps=dps;
    const dpsEl=document.getElementById('dps-val');
    if(dpsEl)dpsEl.textContent=fmtBig(dps);
  }
  // Track best combo
  if(s.combo>(s._bestCombo||0)) s._bestCombo=s.combo;
  // Player movement trail at high speed
  const _spd=Math.hypot(p._lastX!=null?p.x-p._lastX:0, p._lastY!=null?p.y-p._lastY:0)/dt;
  if(_spd>180&&Math.random()<0.4){
    if(!s.afterimages)s.afterimages=[];
    s.afterimages.push({x:p.x,y:p.y,r:p.r*0.8,color:p.color||'#ffd700',life:0.12,maxLife:0.12});
  }
  p._lastX=p.x;p._lastY=p.y;

  // Wave = floor(totalTime / WAVE_DURATION) + 1, advances automatically
  const WAVE_DURATION = 30; // seconds per wave
  const newWave = Math.floor(s.totalTime / WAVE_DURATION) + 1;
  if(newWave > s.wave){
    const prevWave = s.wave;
    s.wave = newWave;
    s.bossSpawned = false;
    s._bossReminderTimer = 0;
    s._titanSecondSpawned = false;
    s._waveKills = 0; // reset per-wave kill count
    s._waveStartDamageTaken = s.totalDamageTaken;
    s._minePatches = s._minePatches || [];
    // Spawn rate scales with wave
    s.spawnRate = Math.max(0.06, 0.74 - (s.wave - 1) * 0.036);
    s._baseSpawnRate = s.spawnRate; // set once per wave advance
    if(p._waveBounty && s.wave > 1){
      p.gold += p._waveBounty;
      addFloat(p.x, p.y - 30, `+${p._waveBounty}💰`, "#ffd700");
      updateKillsHUD();
    }
    // Zone transition
    const _prevZoneIdx = getZoneIndex(prevWave);
    const _curZoneIdx  = getZoneIndex(s.wave);
    if(_curZoneIdx !== _prevZoneIdx){
      const _zone = getZone(s.wave);
      announceWave(_zone.entryMsg,'zone');
      spawnParticles(s, s.player.x, s.player.y, _zone.accent, 30,15);
      abilityRing(s, s.player.x, s.player.y, _zone.accent, 400, 1.2);
      triggerShake(12);
      _hexCache = null;
      _zoneHexColor = _zone.hexColor;
      _zoneDustColor = _zone.dustColor;
    }
    // Roll wave modifiers
    const newMods = rollWaveModifiers(s.wave);
    if(newMods.length > 0){
      showWaveModBanner(newMods, () => applyWaveModifiers(s, newMods));
    } else {
      applyWaveModifiers(s, []);
    }
    if(s.wave % 5 !== 0){
      announceWave(`WAVE ${s.wave}`);
      // Wave complete: small gold bonus
      const _waveBonus = 10 + s.wave * 2;
      p.gold += _waveBonus;
      addFloat(p.x, p.y-25, `+${_waveBonus}💰`, '#ffd700');
      updateKillsHUD();
      // Wave complete flash — brief gold burst
      spawnParticles(s, p.x, p.y, '#ffd700', 8);
      spawnParticles(s, p.x, p.y, '#ffffff', 4);
      abilityRing(s, p.x, p.y, '#ffd700', 120, 0.5, {glow:20,lw:2,noEcho:true});
      // Clean wave bonus
      if(s._untouchedWave){
        addFloat(p.x, p.y-40, '✦ FLAWLESS! +50G', '#00ffcc');
        p.gold += 50; updateKillsHUD();
        s._untouchedWave = false;
      }
    }
    updateWaveHUD();
  }
  // Boss waves: spawn boss when entering a wave divisible by 5
  if(s.wave % 5 === 0 && !s.bossSpawned && !s.bossAlive){ spawnBoss(s); checkTitanRun(s); announceWave(`⚠ BOSS WAVE ${s.wave}`,'boss'); }
  const isBossWave = s.wave % 5 === 0;
  if(isBossWave && s.bossAlive){
    if(!s._bossReminderTimer || s._bossReminderTimer <= 0){
      s._bossReminderTimer = 8;
      addFloat(W/2, 40, '⚠ DEFEAT THE BOSS!', '#ff4488');
    }
    s._bossReminderTimer = (s._bossReminderTimer || 8) - dt;
  }
  // Spawn surge in final 8s of each wave (escalating tension)
  const _waveProgress = (s.totalTime % 30) / 30;
  if(_waveProgress > 0.7 && s.wave%5!==0) {
    s.spawnRate = (s._baseSpawnRate||s.spawnRate) * Math.max(0.4, 1.0 - (_waveProgress-0.7)*2.0);
  } else if(_waveProgress <= 0.7) {
    s.spawnRate = s._baseSpawnRate || s.spawnRate;
  }
  updateTimerHUD();
  // Check untouched wave
  if(s._waveStartDamageTaken!==undefined&&s.totalDamageTaken===s._waveStartDamageTaken&&s.enemies.length===0&&s.wave>1){s._untouchedWave=true;s._cleanWaves=(s._cleanWaves||0)+1;}

  // Herald buff decay + speed boost effect
  for(const e of s.enemies){
    if(e._heraldBuffTimer){
      e._heraldBuffTimer-=dt;
      if(e._heraldBuffTimer<=0){e._heraldBuffed=false;e._heraldBuffTimer=0;}
    }
  }

  // Necromancer skeletons update
  if(s._skeletons){
    const p2=s.player;
    for(let si=s._skeletons.length-1;si>=0;si--){
      const sk=s._skeletons[si];
      sk.life-=dt;
      if(sk.life<=0){s._skeletons.splice(si,1);continue;}
      // Move toward nearest enemy
      let nearE=null,nearD=Infinity;
      for(const en of s.enemies){const d=Math.hypot(en.x-sk.x,en.y-sk.y);if(d<nearD){nearE=en;nearD=d;}}
      if(nearE){
        const sa=Math.atan2(nearE.y-sk.y,nearE.x-sk.x);
        sk.x+=Math.cos(sa)*sk.speed*(60*dt);sk.y+=Math.sin(sa)*sk.speed*(60*dt);
        // Melee attack
        if(nearD<sk.r+nearE.r+4){
          const skDmg=p2.damage*0.65*dt;
          nearE.hp-=skDmg;nearE.hitFlash=Math.min(1,nearE.hitFlash+0.05);
          s.totalDamageDealt+=skDmg;
          if(s._dpsLog)s._dpsLog.push({t:s.totalTime,dmg:skDmg});
        }
      }
    }
    // Undying passive: reduce damage taken per skeleton
    if(s.char&&s.char.id==='necromancer_hero'){
      p2._reduceDmg=1.0-Math.min(0.48,s._skeletons.length*0.06);
    }
  }

  // Sapper debuff timer
  if(p._sapperDebuff){
    p._sapperTimer=(p._sapperTimer||0)-dt;
    if(p._sapperTimer<=0){p._sapperDebuff=false;addFloat(p.x,p.y,'ABILITY RESTORED','#00ffaa');}
  }

  // Spawn enemies continuously — VS style, no gaps
  if(s.enemies.length < 90){
    s.spawnTimer -= dt;
    if(s.spawnTimer <= 0){
      const c = 1 + Math.floor(s.wave / 1.5) + (s.wave < 3 ? 1 : 0);
      for(let i = 0; i < c; i++){ if(s.enemies.length < 180) spawnEnemy(s); }
      s.spawnTimer = s.spawnRate;
    }
  }

  // Combo decay — shorter window
  s.comboTimer-=dt;
  if(s.comboTimer<=0&&s.combo>1){s.combo=1;s.comboTimer=0;s._nextComboPickup=8;updateComboHUD();}
  // Update combo timer bar
  if(s.combo>1){
    const pct=Math.max(0,s.comboTimer/s.comboMaxTime*100);
    const tf=el('combo-timer-fill');
    if(tf)tf.style.width=pct+'%';
  }

  // Screen shake decay
  if(s.shakeTimer>0){s.shakeTimer-=dt;if(s.shakeTimer<=0){s.shakeX=0;s.shakeY=0;}}

  updateSurgeState(s,dt);

  // Player movement
  let dx=0,dy=0;
  if(keys['ArrowLeft']||keys['a']||keys['A'])dx-=1;if(keys['ArrowRight']||keys['d']||keys['D'])dx+=1;
  if(keys['ArrowUp']||keys['w']||keys['W'])dy-=1;if(keys['ArrowDown']||keys['s']||keys['S'])dy+=1;
  const mv=Math.sqrt(dx*dx+dy*dy)||1;
  const moveSpeed=p.speed*((p._surgeBlitzTimer||0)>0?1.28:1.0);
  if(dx||dy){p.x+=dx/mv*moveSpeed*60*dt;p.y+=dy/mv*moveSpeed*60*dt;}
  p.x=Math.max(p.r,Math.min(W-p.r,p.x));p.y=Math.max(p.r,Math.min(H-p.r,p.y));

  // Ability cooldown
  if(p._abilityCooldown>0)p._abilityCooldown=Math.max(0,p._abilityCooldown-dt);
  updateAbilityHUD(p);

  // Special timers
  if(p._berserkerRage){p._berserkerTimer-=dt;if(p._berserkerTimer<=0){p._berserkerRage=false;p._berserkerDmgBoost=1;}}
  if(p._cloaked){
    p._cloakTimer-=dt;
    if(p._cloakTimer<=0){
      p._cloaked=false;p.immune=0;
      // Phantom burst on cloak exit
      if(p._cloakBurst){
        p._cloakBurst=false;
        for(let i=0;i<8;i++){const a=i/8*Math.PI*2;spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.3,vy:Math.sin(a)*p.bulletSpeed*1.3,r:p.bulletSize+1,dmg:p.damage*1.5,pierce:3,life:1.8,isPhantom:true});}
        spawnParticles(s,p.x,p.y,'#aaaaff',4);addFloat(p.x,p.y,'GHOST BURST!','#aaaaff');
      }
    }
  }
  if(p._barrier){p._barrierTimer-=dt;if(p._barrierTimer<=0){
    p._barrier=false;p.immune=0;
    // RETALIATION passive: shockwave on expiry
    if(p._charId==='sentinel'){
      const shockR=130;const shockDmg=p.damage*1.8+(p._barrierDmgAcc||0)*0.4;
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)<shockR+e.r){
          e.hp-=shockDmg;e.hitFlash=1;s.totalDamageDealt+=shockDmg;
          spawnParticles(s,e.x,e.y,'#ffdd55',2);addFloat(e.x,e.y,`-${fmtBig(shockDmg)}`,'#ffcc00');
        }
      }
      abilityRing(s,p.x,p.y,'#ffaa00',shockR,.45);abilityRing(s,p.x,p.y,'#ffffff',shockR*1.3,.55);
      spawnParticles(s,p.x,p.y,'#ffaa00',3);
      triggerShake(5);addFloat(p.x,p.y,'RETALIATION!','#ffdd00');
      p._barrierDmgAcc=0;
    }
  }}
  if(p._alchemyBoost){p._alchemyTimer-=dt;if(p._alchemyTimer<=0){p._alchemyBoost=1;delete p._alchemyTimer;}}
  if(p._reaperHarvest){p._reaperTimer-=dt;if(p._reaperTimer<=0){p._reaperHarvest=false;}}
  if(p._counterActive){p._counterTimer-=dt;if(p._counterTimer<=0){p._counterActive=false;}}

  // ── NEW PASSIVE TICKS ─────────────────────────────────────────────
  // Rage stacks: each kill adds a stack, stacks decay over 5s
  if(p._rampageKills){
    if(p._rampageTimer>0){p._rampageTimer-=dt;if(p._rampageTimer<=0){p._rampageStacks=0;p._rampageMult=1;}}
  }
  if(p._rageStacks){
    if(!p._rageStackCount)p._rageStackCount=0;
    if(!p._rageDecayTimer)p._rageDecayTimer=5;
    p._rageDecayTimer-=dt;
    if(p._rageDecayTimer<=0){p._rageDecayTimer=5;p._rageStackCount=Math.max(0,p._rageStackCount-1);}
    const maxStacks=p._rageMax||10;
    const rageDmgBonus=1+(p._rageStackCount/maxStacks)*(p._rageDmgPct||0.02)*maxStacks;
    p._rageDmgMult=rageDmgBonus;
    if(p._rageAtkSpd){p._rageFireMod=1-Math.min(0.4,p._rageStackCount*0.01);}
    if(p._rageMoveSpd&&p._rageStackCount>=maxStacks&&!p._rageSpdActive){p._rageSpdActive=true;p.speed*=1.10;}
    else if(p._rageMoveSpd&&p._rageStackCount<maxStacks&&p._rageSpdActive){p._rageSpdActive=false;p.speed/=1.10;}
  }
  // Dodge burst: +20% dmg for 3s after dodge
  if(p._dodgeBurst&&p._dodgeBurstTimer>0){
    p._dodgeBurstTimer-=dt;
    p._dodgeDmgMult=p._dodgeBurstTimer>0?1.20:1.0;
  }
  // Overload: charge up, next shot deals 300% dmg
  if(p._overload){
    if(!p._overloadReady){
      p._overloadCharge=(p._overloadCharge||0)+dt;
      if(p._overloadCharge>=(p._overloadCd||8)){p._overloadReady=true;p._overloadCharge=0;addFloat(p.x,p.y-20,'⚡ OVERLOAD!','#ffff44');}
    }
  }
  // Gold Rush: check gold milestones
  if(p._goldRush){
    const thresh=p._goldRushThresh||50;
    const dmgBonus=p._goldRushDmg||5;
    const newTier=Math.floor(p.gold/thresh);
    if(newTier>(p._goldRushTier||0)){
      const gained=newTier-(p._goldRushTier||0);
      p.damage+=gained*dmgBonus;
      if(p._goldRushSpd)p.speed+=gained*0.05;
      p._goldRushTier=newTier;
      addFloat(p.x,p.y-20,`💰 GOLD RUSH! +${gained*dmgBonus} DMG`,'#ffd700');
    }
  }
  // Soulstone: apply XP mult
  if(p._xpMult&&p._xpMult>1){/* applied at XP pickup in p_addXp */}
  // ── NEW BOSS ITEM PASSIVES ────────────────────────────────────────
  // AEGIS CORE: absorb hits, recharge timer
  if(p._aegisCharges!==undefined&&p._aegisCd){
    p._aegisCdTimer=(p._aegisCdTimer||0)+dt;
    if(p._aegisCdTimer>=p._aegisCd&&p._aegisCharges<3){
      p._aegisCharges=Math.min(3,p._aegisCharges+1);p._aegisCdTimer=0;
      addFloat(p.x,p.y-20,'🛡 AEGIS CHARGED','#aaffff');
    }
  }
  // GLACIER HEART: periodic freeze pulse
  if(p._glacierPulse){
    p._glacierTimer=(p._glacierTimer||0)+dt;
    if(p._glacierTimer>=p._glacierCd){
      p._glacierTimer=0;
      for(const e of s.enemies){
        e._frozen=true;e._frozenTimer=2.0;
        if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.05;
      }
      abilityRing(s,p.x,p.y,'#aaddff',300,.8,{glow:20,lw:2});
      addFloat(p.x,p.y-30,'❄ GLACIER PULSE','#aaddff');
    }
  }
  // SHADOW MANTLE: post-hit damage reduction window
  if(p._shadowMantle){
    if(p._shadowMantleActive){
      p._shadowMantleTimer-=dt;
      if(p._shadowMantleTimer<=0) p._shadowMantleActive=false;
    }
    if(p._shadowMantleCdTimer>0) p._shadowMantleCdTimer-=dt;
  }
  // SOUL FORGE: +5 dmg per N kills
  if(p._soulForge){
    const threshold=p._soulForgeThreshold||10;
    const tier=Math.floor((p.kills||0)/threshold);
    if(tier>(p._soulForgeTier||0)){
      const gained=tier-(p._soulForgeTier||0);
      p.damage+=gained*5;p._soulForgeTier=tier;
      addFloat(p.x,p.y-20,`💀 SOUL FORGE +${gained*5}`,'#aa44ff');
    }
  }
  // ABYSSAL ECHO: every N kills fire 4 homing bullets
  if(p._abyssalEcho&&p._abyssalFire){
    p._abyssalFire=false;
    for(let i=0;i<4;i++){
      const a=i/4*Math.PI*2;
      spawnBullet_pool(s,{x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,
        r:p.bulletSize+2,dmg:p.damage*0.6,pierce:1,life:2.5,_seekerBullets:true});
    }
    addFloat(p.x,p.y-20,'🔮 ECHO BURST','#4466ff');
  }
  // CRISIS HEAL: double leech below 50% HP
  if(p._crisisHeal&&p._lifeLeech){
    p._leechMult = p.hp<p.maxHp*0.5 ? 2.0 : 1.0;
  }
  // Black Hole (boss item)
  if(p._blackHole){
    p._blackHoleTimer=(p._blackHoleTimer||0)+dt;
    if(p._blackHoleTimer>=(p._blackHoleCd||18)){
      p._blackHoleTimer=0;p._blackHoleActive=true;p._blackHoleDur=4.0;
      p._blackHoleX=p.x;p._blackHoleY=p.y;
      addFloat(p.x,p.y-30,'🌑 BLACK HOLE!','#aa44ff');
    }
    if(p._blackHoleActive){
      p._blackHoleDur-=dt;
      if(p._blackHoleDur<=0){p._blackHoleActive=false;}
      else{
        const bx=p._blackHoleX||p.x,by=p._blackHoleY||p.y;
        for(const e of s.enemies){
          const bdx=bx-e.x,bdy=by-e.y,bd=Math.hypot(bdx,bdy)||1;
          if(bd<300){e.x+=bdx/bd*4*60*dt;e.y+=bdy/bd*4*60*dt;}
          if(bd<50){dealDamageToEnemy(s,e,80*dt);}
        }
        spawnParticles(s,bx,by,'#aa44ff',2);
      }
    }
  }
  // Doom Explosion (boss item)
  if(p._doomExplosion){/* triggered in killEnemy */}
  // Assassin mark: tag first-hit enemies
  if(p._assassinMark){/* applied per-bullet in hit logic */}
  if(p._bulletStormActive){
    p._bulletStormTimer-=dt;
    if(p._bulletStormTimer<=0){
      p._bulletStormActive=false;p._bulletStormDmgBonus=1.0;
      const hf=document.getElementById('hammer-flash');
    }
    // During storm: fire rate tripled
    p._stormFireMod=p._bulletStormActive?(1/3):1.0;
  } else {
    p._stormFireMod=1.0;
  }
  // Minigunner: decay suppression stacks if target dies or changes
  if(p._charId==='minigunner'){
    const rd=document.getElementById('minigun-ramp');
    const rf=document.getElementById('minigun-ramp-fill');
    const stacks=p._suppressStacks||0;
    // Target gone? reset stacks
    if(p._suppressTarget&&p._suppressTarget.hp<=0){p._suppressTarget=null;p._suppressStacks=0;}
    if(rd){rd.style.opacity=(stacks>0||p._bulletStormActive)?'1':'0';}
    if(rf){
      const pct=p._bulletStormActive?100:Math.min(100,(stacks/5)*100);
      rf.style.width=pct+'%';
      rf.style.background=p._bulletStormActive?'#ffee00':'#ff8800';
    }
    const rampLabel=rd&&rd.querySelector('div');
    if(rampLabel){rampLabel.textContent=p._bulletStormActive?'⚡ STORM!':(`🎯 SUPPRESS ${stacks}/5`);}
  }
  if(p._bloodSurgeActive){
    p._bloodSurgeTimer-=dt;
    if(p._bloodSurgeTimer<=0){
      p._bloodSurgeActive=false;
      const rv=document.getElementById('rage-vignette');if(rv)rv.classList.remove('active');
    }
  }
  // Pyromancer: overheat cooldown + burn stack decay
  if(p._charId==='pyro'){
    if(p._pyroOverheat){
      p._pyroHeatCooldown=(p._pyroHeatCooldown||1.8)-dt;
      if(p._pyroHeatCooldown<=0){p._pyroOverheat=false;p._pyroHeat=0;addFloat(p.x,p.y,'COOLED DOWN','#ff8800');}
    } else if(p._pyroHeat>0){
      p._pyroHeat=Math.max(0,p._pyroHeat-dt*4);
    }
    for(const e of s.enemies){
      if((e._burnStacks||0)>0){
        e._burnTimer=(e._burnTimer||0)-dt;
        if(e._burnTimer<=0){e._burnStacks=Math.max(0,e._burnStacks-1);e._burnTimer=0.8;}
        if(e._onFire)e._fireDmg=p.damage*0.05*e._burnStacks;
        e._inferno=(e._burnStacks>=6);if(!e._inferno)e._infernoAnnounced=false;
      }
    }
  }
  // Storm Mantle passive: ring of lightning every 5s
  if(p._stormMantle){
    p._stormMantleTimer=(p._stormMantleTimer||5.0)-dt;
    if(p._stormMantleTimer<=0){
      p._stormMantleTimer=5.0;
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2;spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed*1.1,vy:Math.sin(a)*p.bulletSpeed*1.1,r:p.bulletSize+1,dmg:p.damage*1.0,pierce:1,life:1.6});}
      spawnParticles(s,p.x,p.y,'#ffff00',3);abilityRing(s,p.x,p.y,'#ffff44',60,.3);
      addFloat(p.x,p.y,'⚡ STORM!','#ffff00');
      if(p._syn_stormChain){
        // Thundergod synergy: storm bolts also chain
        for(let i=0;i<16;i++){
          let cn=null,cd=Infinity;
          for(const ce of s.enemies){const d=Math.hypot(ce.x-p.x,ce.y-p.y);if(d<cd&&d<300){cn=ce;cd=d;}}
          if(cn){cn.hp-=p.damage*0.4;cn.hitFlash=0.6;spawnParticles(s,cn.x,cn.y,'#00d4ff',2);}
        }
      }
    }
  }
  // ── ZONE ITEM EFFECTS ──────────────────────────────────────────────
  // Shadow Cloak: auto-cloak every 8s
  if(p._autoCloakItem){
    p._autoCloakTimer=(p._autoCloakTimer||8.0)-dt;
    if(p._autoCloakTimer<=0&&!p._cloaked){
      p._autoCloakTimer=8.0;p._cloaked=true;p._cloakTimer=1.5;
      spawnParticles(s,p.x,p.y,'#4400aa',2);addFloat(p.x,p.y,'🌑 CLOAKED','#8844ff');
    }
    if(p._cloaked){p._cloakTimer-=dt;if(p._cloakTimer<=0){p._cloaked=false;}}
  }
  // Berserker Fury: taking damage boosts dmg up to 5 stacks
  if(p._berserkFury&&p._berserkFuryStacks>0){
    p._berserkFuryTimer=(p._berserkFuryTimer||0)-dt;
    if(p._berserkFuryTimer<=0)p._berserkFuryStacks=Math.max(0,(p._berserkFuryStacks||0)-1);
  }
  // Null Anchor: cannot move
  if(p._nullAnchor){p.speed=0;}
  // Boss Barrier passive: auto-recharging block
  if(p._bossBarrierMax){
    if(!p._bossBarrierReady){
      p._bossBarrierTimer=(p._bossBarrierTimer||0)+dt;
      if(p._bossBarrierTimer>=p._bossBarrierMax){p._bossBarrierReady=true;p._bossBarrierTimer=0;addFloat(p.x,p.y,'BARRIER READY!','#aaaaff');}
    }
  }
  // Nova Core: big explosion every 6s
  if(p._novaCore){
    p._novaCoreTimer=(p._novaCoreTimer||6.0)-dt;
    if(p._novaCoreTimer<=0){
      p._novaCoreTimer=6.0;
      explodeAt(s,p.x,p.y,200,p.damage*3);
      spawnParticles(s,p.x,p.y,'#ff8800',5);spawnParticles(s,p.x,p.y,'#ffffff',2);
      abilityRing(s,p.x,p.y,'#ff8800',120,.4);abilityRing(s,p.x,p.y,'#ffff00',200,.6);
      addFloat(p.x,p.y,'💥 NOVA!','#ff8800');triggerShake(8);
    }
  }
  // Chronoshift: on-kill slow — timer counts down
  if(p._chronoshiftActive){
    p._chronoshiftTimer=(p._chronoshiftTimer||0)-dt;
    if(p._chronoshiftTimer<=0){
      p._chronoshiftActive=false;
      // Restore speeds
      /* chrono slow removed */
    }
  }
  // Colossus Heart: damage boost timer after taking a hit
  if(p._colossusActive){
    p._colossusTimer=(p._colossusTimer||0)-dt;
    if(p._colossusTimer<=0)p._colossusActive=false;
  }
  // Void Rifts: gravity pull nearby enemies inward
  if(s.voidRifts){
    for(let vi=s.voidRifts.length-1;vi>=0;vi--){
      const vr=s.voidRifts[vi];vr.life-=dt;
      if(vr.life<=0){s.voidRifts.splice(vi,1);continue;}
      for(const ve of s.enemies){
        const vd=Math.hypot(ve.x-vr.x,ve.y-vr.y);
        if(vd<vr.r&&vd>2){const va=Math.atan2(vr.y-ve.y,vr.x-ve.x);ve.x+=Math.cos(va)*vr.pull*dt;ve.y+=Math.sin(va)*vr.pull*dt;}
      }
      spawnParticles(s,vr.x,vr.y,'#0088cc',2);
    }
  }
  // Endless Hunger: +0.3 damage per kill (applied in killEnemy)
  // Iron Skin (Ironclad): passive -25% damage reduction
  if(p._charId==='ironclad'){p._reduceDmg=0.75;p._thorns=true;}
  // Pyromancer heat bar
  if(p._charId==='pyro'){
    const heatPct=Math.min(1,(p._pyroHeat||0)/18);
    const barEl=document.getElementById('pyro-heat-bar');
    const fill=document.getElementById('pyro-heat-fill');
    const label=document.getElementById('pyro-heat-label');
    if(barEl){
      barEl.style.opacity='1';
      document.getElementById('minigun-ramp').style.opacity='0';
      if(fill){fill.style.width=(heatPct*100)+'%';fill.style.background=p._pyroOverheat?'#ff2200':heatPct>0.7?'#ff6600':'#ffaa00';}
      if(label)label.textContent=p._pyroOverheat?'♨ OVERHEAT':'🔥 HEAT '+Math.round(heatPct*100)+'%';
    }
  } else {
    const pyroEl=document.getElementById('pyro-heat-bar');
    if(pyroEl)pyroEl.style.opacity='0';
  }
  // (minigun HUD handled in bullet storm block above)
  // Adrenaline: +8% damage per wave survived (was 5%)
  if(p._adrenaline){p._adrenalineBonus=1+(s.wave-1)*0.08;}

  // ── CHARACTER PASSIVES ──────────────────────────────────────────
  // PHANTOM: Ghostwalk — leave spectral trails while cloaked + moving
  if(p._charId==='phantom'&&p._cloaked){
    const mvg=(keys['a']||keys['A']||keys['d']||keys['D']||keys['w']||keys['W']||keys['s']||keys['S']||keys['ArrowLeft']||keys['ArrowRight']||keys['ArrowUp']||keys['ArrowDown']);
    if(mvg){
      p._ghostTrailTimer=(p._ghostTrailTimer||0)-dt;
      if(p._ghostTrailTimer<=0){
        p._ghostTrailTimer=0.22;
        if(!s.firePatches)s.firePatches=[];
        s.firePatches.push({x:p.x+(Math.random()-0.5)*8,y:p.y+(Math.random()-0.5)*8,r:14,life:1.2,maxLife:1.2,dmgPs:p.damage*1.4,isGhost:true});
        spawnParticles(s,p.x,p.y,'#8888ff',2);
      }
    }
  }

  // SENTINEL: Retaliation shockwave when barrier expires
  if(p._charId==='sentinel'&&p._barrier){p._barrierDmgAcc=(p._barrierDmgAcc||0)+dt*12;}
  
  // REAPER: Soul Meter — auto mini-harvest every 5 kills
  if(p._charId==='reaper'){
    const soulKills=p.kills;
    const prevMeter=p._soulMeterPrev||0;
    if(Math.floor(soulKills/8)>Math.floor(prevMeter/8)){
      // Mini harvest
      const r=90;let hits=0;
      for(const e of s.enemies){
        if(Math.hypot(e.x-p.x,e.y-p.y)<r+e.r){
          const d=p.damage*0.8;e.hp-=d;e.hitFlash=1;s.totalDamageDealt+=d;hits++;
          spawnParticles(s,e.x,e.y,'#aa00ff',2);
        }
      }
      const heal=hits*5;healPlayer(s,heal);
      if(!s.meleeSwings)s.meleeSwings=[];
      s.meleeSwings.push({x:p.x,y:p.y,ang:0,arcHalf:Math.PI,r,life:.25,maxLife:.25,color:'#880088',full:true});
      abilityRing(s,p.x,p.y,'#aa00ff',r,.4);
      addFloat(p.x,p.y,`SOUL REAP!${heal>0?' +'+heal+'HP':''}`, '#aa00ff');
      updateHpHUD();
    }
    p._soulMeterPrev=soulKills;
  }

  // RAMPAGE kill streak system
  if(s.killStreakTimer>0){s.killStreakTimer-=dt;if(s.killStreakTimer<=0){s.killStreak=0;}}
  if(p._rampageTimer>0){
    p._rampageTimer-=dt;
    if(p._rampageTimer<=0){
      p._rampageActive=false;addFloat(p.x,p.y,'RAMPAGE ENDED','#ff8800');
      document.getElementById('rampage-display').classList.remove('active');
    }
  }
  // Update rampage HUD
  const rampEl=document.getElementById('rampage-display');
  if(rampEl)rampEl.classList.toggle('active',!!p._rampageActive);
  // Kill streak progress (show when building toward rampage)
  const streakEl=document.getElementById('streak-display');
  if(streakEl){
    const streak=s.killStreak||0;
    if(streak>=4&&streak<10&&!p._rampageActive){
      streakEl.textContent=`🔥 ${streak}/10 STREAK`;streakEl.style.opacity='1';
    } else {streakEl.style.opacity='0';}
  }

  // Bonus chest every 5 non-boss waves — spawn at start of those waves
  if(s.wave%5!==0&&s.wave!==s._lastWaveChest&&Math.floor(s.totalTime/30)+1===s.wave&&(s.totalTime%30)<0.5){
    s._lastWaveChest=s.wave;
    if(s.wave%10===0){ // every 10 waves drop a chest
      const pos=getEdgePos();pos.x=Math.max(50,Math.min(W-50,pos.x));pos.y=Math.max(50,Math.min(H-50,pos.y));
      s.chests.push({x:pos.x,y:pos.y,r:16,bob:0,isMilestone:true});
      addFloat(W/2,H/2,'🎁 BONUS CHEST!','#ffd700');
    }
  }

  // Templar consecration aura
  if(s.char&&s.char.id==='templar'){
    for(const en of s.enemies){
      const d=Math.hypot(en.x-p.x,en.y-p.y);
      en._consecrated=d<90;
    }
  }

  // Minefield mod — spawn mine patches periodically
  if(s._modMinefield){
    s._mineTimer=(s._mineTimer||0)+dt;
    if(s._mineTimer>3.0){
      s._mineTimer=0;
      if(!s.firePatches)s.firePatches=[];
      const mx=60+Math.random()*(W-120),my=60+Math.random()*(H-120);
      s.firePatches.push({x:mx,y:my,r:30,life:5.0,maxLife:5.0,dmgPs:p.maxHp*0.06,_isMine:true,isAcid:false,isGhost:false,isFrost:false});
      spawnParticles(s,mx,my,'#ff6600',2);
    }
  }

  // Regen
  if(p._regen>0&&!s._modNoHeal){p._regenAcc+=dt;if(p._regenAcc>=1){p.hp=Math.min(p.maxHp,p.hp+p._regen);p._regenAcc=0;updateHpHUD();}}

  // ── DANGER VIGNETTE — flashes red border when HP < 25% ─────────
  const dangerEl=document.getElementById('danger-vignette');
  if(dangerEl)dangerEl.classList.toggle('active',p.hp/p.maxHp<0.25);

  // ── WAVE CLEARED banner — show when all enemies die mid-wave ────
  if(!s._waveClearedShown&&!s.bossAlive&&s.enemies.length===0&&s.totalTime>2&&s.wave>0){
    s._waveClearedShown=true;
    const wcel=document.getElementById('wave-cleared');
    if(wcel){wcel.textContent=`✓ WAVE ${s.wave} CLEARED!`;wcel.classList.remove('show');void wcel.offsetWidth;wcel.classList.add('show');}
    setTimeout(()=>{if(wcel)wcel.classList.remove('show');},2400);
  }
  if(s.enemies.length>0)s._waveClearedShown=false;


  // Auto-shoot — apply all damage multipliers
  let effDmg=p.damage*(p._berserkerRage?p._berserkerDmgBoost:1);
  // Wave modifier: player damage buff/nerf
  if(s._modPlayerDmg&&s._modPlayerDmg!==1)effDmg*=s._modPlayerDmg;
  if(s._modGlass)effDmg*=2.0;
  if(p._berserkerCharm&&p.hp/p.maxHp<0.4)effDmg*=1.15;
  if(p._counterActive)effDmg*=1.20;
  if(p._adrenalineBonus)effDmg*=p._adrenalineBonus;
  if(p._alchemyBoost&&p._alchemyBoost>1)effDmg*=p._alchemyBoost;
  if(p._rampageActive)effDmg*=1.5;
  if((p._surgeFuryTimer||0)>0)effDmg*=1.35;
  if(p._colossusActive)effDmg*=1.30;
  if(p._berserkFury&&p._berserkFuryStacks>0)effDmg*=(1+0.08*(p._berserkFuryStacks||0));
  if(p._cursedBlade)effDmg*=1.80;
  if(p._cloaked&&p._charId==='phantom')effDmg*=1.60; // Phantom: +60% dmg while cloaked
  // Momentum: speed above 2 boosts damage
  if(p._momentum&&p.speed>2)effDmg+=Math.floor((p.speed-2)*5);
  // Glass cannon / berserker charm already applied via multiplier in contact hit
  // Engineer overclock: -8% fire CD per active turret
  const _engBonus=(p._charId==='engineer'&&state&&state.turrets)?Math.max(0.65,1.0-0.08*(state.turrets.length)):1.0;
  const _surgeFireRate=(p._surgeBlitzTimer||0)>0?0.76:1.0;
  const _effectiveFireRate=p.fireRate*(p._bulletStormActive?(1/3):1.0)*_engBonus*_surgeFireRate;
  if(s.enemies.length>0&&performance.now()-p.lastShot>_effectiveFireRate){
    // Sniper mode: every 3rd shot = 5× damage, big visual
    let _shootDmg=effDmg;
    if(p._sniperMode){
      p._sniperCounter=(p._sniperCounter||0)+1;
      const _sniperN=p._sniperInterval||4;
      if(p._sniperCounter>=_sniperN){p._sniperCounter=0;_shootDmg=effDmg*5;spawnParticles(s,p.x,p.y,'#ff8800',5);addFloat(p.x,p.y-20,'⚡ SNIPER!','#ffaa00');}
    }
    autoShoot(s,_shootDmg);p.lastShot=performance.now();
  }

  // Orbital bullets
  if(p._orbitalCount>0){
    p._orbitalAngle=(p._orbitalAngle||0)+dt*(2.5+(p._orbitalSpeedBonus||0));s.orbitalBullets=[];
    const _orbDmg=p._orbitalScalesWithDmg ? effDmg*1.0 : effDmg*(.70+(p._orbitalDmgBonus||0)/p.damage);
    const _orbSize=p._orbitalBig?12:7;
    const _orbR=40+(p._orbitalPull?20:0);
    for(let i=0;i<p._orbitalCount;i++){const a=p._orbitalAngle+(i/p._orbitalCount)*Math.PI*2;s.orbitalBullets.push({x:p.x+Math.cos(a)*_orbR,y:p.y+Math.sin(a)*_orbR,r:_orbSize||7,dmg:_orbDmg});}
    // ORBITAL PULL: enemies near orbitals get pulled toward player
    if(p._orbitalPull&&s.enemies.length>0){
      for(const ob of s.orbitalBullets){
        for(const _oe of s.enemies){
          if(Math.hypot(_oe.x-ob.x,_oe.y-ob.y)<80){
            const _opdx=p.x-_oe.x,_opdy=p.y-_oe.y,_opd=Math.hypot(_opdx,_opdy)||1;
            _oe.x+=_opdx/_opd*2*60*dt;_oe.y+=_opdy/_opd*2*60*dt;
          }
        }
      }
    }
  }else s.orbitalBullets=[];

  // Garlic aura
  if(p._garlicAura&&s.enemies.length>0){
    const gLv=p._garlicLevel||1;
    const gR=[0,90,120,150,190][Math.min(4,gLv)];
    const gDmg=[0,p.damage*0.25,p.damage*0.45,p.damage*0.75,p.damage*1.1][Math.min(4,gLv)];
    const gSlow=gLv>=3?(gLv>=4?0.40:0.20):0;
    for(const ge of s.enemies){
      const gd=Math.hypot(ge.x-p.x,ge.y-p.y);
      if(gd<gR){
        const _gRes=ge.isBoss?0.40:1.0;
        ge.hp-=gDmg*dt*_gRes;ge.hitFlash=Math.min(1,ge.hitFlash+.04);s.totalDamageDealt+=gDmg*dt*_gRes;
        if(gSlow&&!ge._garlicSlowed){ge._garlicSlowed=true;if(!ge._garlicBaseSpeed)ge._garlicBaseSpeed=ge.speed;ge.speed*=(1-gSlow);}
        if(ge.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(ge))s._deferredKills.push(ge);}
      } else if(ge._garlicSlowed){ge._garlicSlowed=false;if(ge._garlicBaseSpeed){ge.speed=ge._garlicBaseSpeed;delete ge._garlicBaseSpeed;}}
    }
  }

  // Meta DAMAGE AURA (from shard upgrade) — pulses dmg to all nearby enemies
  if((p._auraStrength||0)>0&&s.enemies.length>0){
    const _aR=140;
    for(const _ae of s.enemies){
      if(Math.hypot(_ae.x-p.x,_ae.y-p.y)<_aR+_ae.r){
        const _aDmg=p._auraStrength*dt*(_ae.isBoss?0.3:1.0);
        _ae.hp-=_aDmg;_ae.hitFlash=Math.min(1,(_ae.hitFlash||0)+0.03);
        s.totalDamageDealt+=_aDmg;
        if(_ae.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(_ae))s._deferredKills.push(_ae);}
      }
    }
  }

  // DRAIN AURA (vampiric passive lv3+): drain HP from nearby enemies
  if(p._drainAura&&s.enemies.length>0){
    let drained=0;
    for(const _de of s.enemies){
      if(Math.hypot(_de.x-p.x,_de.y-p.y)<120+_de.r&&!_de.isBoss){
        const _dd=3*dt;_de.hp-=_dd;s.totalDamageDealt+=_dd;drained+=_dd;
        if(_de.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(_de))s._deferredKills.push(_de);}
      }
    }
    if(drained>0){healPlayer(s,drained*0.5);}
  }

  // FIRE TRAIL (afterburn passive): leave patches behind player
  if(p._firTrail){
    p._trailTimer=(p._trailTimer||0)+dt;
    if(p._trailTimer>0.4){
      p._trailTimer=0;
      if(!s.firePatches)s.firePatches=[];
      s.firePatches.push({x:p.x+(Math.random()-0.5)*20,y:p.y+(Math.random()-0.5)*20,r:22,life:2.5,maxLife:2.5,dmgPs:p.damage*0.4});
    }
  }

  // POISON BULLETS: tick poison DoT on all enemies
  if(p._poisonBullets){
    const poisonDmgPct=[0,0.05,0.08,0.10,0.10][Math.min(4,p._poisonLevel||1)];
    const poisonSlow=p._poisonLevel>=3;
    for(const _pe of s.enemies){
      if(_pe._poisoned){
        _pe._poisonTimer=((_pe._poisonTimer||0)-dt);
        const _pd=_pe.maxHp*poisonDmgPct*dt*(_pe.isBoss?0.3:1.0);
        _pe.hp-=_pd;s.totalDamageDealt+=_pd;
        if(poisonSlow&&!_pe._poisonSlowed){_pe._poisonSlowed=true;if(!_pe._poisonBaseSpd)_pe._poisonBaseSpd=_pe.speed;_pe.speed*=0.80;}
        if(_pe._poisonTimer<=0){
          _pe._poisoned=false;
          if(_pe._poisonSlowed){_pe._poisonSlowed=false;if(_pe._poisonBaseSpd)_pe.speed=_pe._poisonBaseSpd;}
          // Level 4+: spread poison on expiry
          if(p._poisonLevel>=4){for(const _ne of s.enemies){if(_ne!==_pe&&Math.hypot(_ne.x-_pe.x,_ne.y-_pe.y)<60&&!_ne._poisoned){_ne._poisoned=true;_ne._poisonTimer=3.0;}}}
        }
        if(_pe.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(_pe))s._deferredKills.push(_pe);}
      }
    }
  }

  // SPORE CLOUDS: tick existing clouds and spawn new on kill (done in killEnemy)
  if(p._sporeClouds&&s.sporePatches){
    for(let _si=s.sporePatches.length-1;_si>=0;_si--){
      const sp=s.sporePatches[_si];sp.life-=dt;
      if(sp.life<=0){s.sporePatches.splice(_si,1);continue;}
      for(const _se of s.enemies){
        if(Math.hypot(_se.x-sp.x,_se.y-sp.y)<sp.r+_se.r){
          const _sd=sp.dmg*dt*(_se.isBoss?0.3:1.0);
          _se.hp-=_sd;s.totalDamageDealt+=_sd;
          if(sp.slow&&!_se._sporeSlowed){_se._sporeSlowed=true;if(!_se._sporeBaseSpd)_se._sporeBaseSpd=_se.speed;_se.speed*=0.70;}
          if(_se.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(_se))s._deferredKills.push(_se);}
        }
      }
    }
  }

  // MAGNET BEAM: pull enemies, deal continuous dmg in cone
  if(p._magnetBeam&&s.enemies.length>0){
    const _mbR=[0,120,160,200,240][Math.min(4,p._magnetBeamLv||1)];
    const _mbDmg=[0,15,25,40,40][Math.min(4,p._magnetBeamLv||1)];
    const _mbBonus=p._magnetBeamLv>=3?1.20:1.0;
    for(const _me of s.enemies){
      const _md=Math.hypot(_me.x-p.x,_me.y-p.y);
      if(_md<_mbR){
        const _mx=p.x-_me.x,_my=p.y-_me.y,_mm=Math.hypot(_mx,_my)||1;
        _me.x+=_mx/_mm*3*60*dt;_me.y+=_my/_mm*3*60*dt;
        const _mbd=_mbDmg*dt*(_me.isBoss?0.3:1.0)*_mbBonus;
        _me.hp-=_mbd;s.totalDamageDealt+=_mbd;
        if(_me.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(_me))s._deferredKills.push(_me);}
      }
    }
  }

  // Bullets move
  // Bullet cap — prevents O(n²) blowup with echo/multishot/storm
  if(s.bullets.length>150){
    for(let _ci=0;_ci<40;_ci++){BulletPool.release(s.bullets[_ci]);}
    s.bullets.splice(0,40);
  }
  const _bl=s.bullets;
  // Cache nearest enemy for seeker once per frame (not once per bullet)
  let _seekTarget=null;
  if(p._seekerBullets&&s.enemies.length>0){
    let _snd=Infinity;
    for(const _se of s.enemies){const _sd=Math.hypot(_se.x-p.x,_se.y-p.y);if(_sd<_snd){_seekTarget=_se;_snd=_sd;}}
  }
  for(let i=_bl.length-1;i>=0;i--){
    const b=_bl[i];
    // Seeker homing: gently steer toward cached nearest enemy
    if(p._seekerBullets&&!b.isTurret&&s.enemies.length>0&&!(Math.floor(s.totalTime*30)%2)){
      const nt=_seekTarget,nd=_seekTarget?Math.hypot(_seekTarget.x-b.x,_seekTarget.y-b.y):Infinity;
      if(nt&&nd<300){
        const ta=Math.atan2(nt.y-b.y,nt.x-b.x);
        const ca=Math.atan2(b.vy,b.vx);
        let da=ta-ca; while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
        const spd=Math.hypot(b.vx,b.vy)||5;
        const na=ca+da*Math.min(1,dt*8);
        b.vx=Math.cos(na)*spd; b.vy=Math.sin(na)*spd;
      }
    }
    // Holy bolt bounce off edges
  if(b._isHolyBolt&&b._bounces>0){
    if(b.x<0||b.x>W){b.vx*=-1;b._bounces--;spawnParticles(s,b.x,b.y,'#ffffaa',2);}
    if(b.y<0||b.y>H){b.vy*=-1;b._bounces--;spawnParticles(s,b.x,b.y,'#ffffaa',2);}
  }
  b.x+=b.vx*60*dt;b.y+=b.vy*60*dt;b.life-=dt;
  if(p._fireBulletTrail&&!b.isTurret&&Math.random()<0.12){if(!s.firePatches)s.firePatches=[];s.firePatches.push({x:b.x,y:b.y,r:5+p.bulletSize*0.5,life:0.7,maxLife:0.7,dmgPs:p.damage*1.0,_napalmPatch:true});}
    if(b.life<=0||b.x<-40||b.x>W+40||b.y<-40||b.y>H+40){BulletPool.release(b);_bl[i]=_bl[_bl.length-1];_bl.pop();}
  }

  // Boss bullets
  const _bbl=s.bossBullets;for(let i=_bbl.length-1;i>=0;i--){
    const b=_bbl[i];b.x+=b.vx*60*dt;b.y+=b.vy*60*dt;b.life-=dt;
    if(b.life<=0||b.x<-40||b.x>W+40||b.y<-40||b.y>H+40){BossBulletPool.release(b);_bbl[i]=_bbl[_bbl.length-1];_bbl.pop();continue;}
    if(!p._cloaked&&!p._barrier&&p.immune<=0&&Math.hypot(p.x-b.x,p.y-b.y)<p.r+b.r){
      let _bdmg=b.dmg;
      if(p._armor)_bdmg*=(1-Math.min(0.70,p._armor));
      if(s._modGlass)_bdmg*=(s.player._glassProof?1.3:2.0);
      if(!s._adminMode){sndDamage();p.hp-=_bdmg;}p.immune=0.4;BossBulletPool.release(b);_bbl[i]=_bbl[_bbl.length-1];_bbl.pop();
      s.totalDamageTaken+=_bdmg;
      if(s._modReversal){p.hp=Math.min(p.maxHp,p.hp+_bdmg*0.5);}
      if(s._modVampiric&&state.enemies.length>0){const _ve=state.enemies[0];_ve.hp=Math.min(_ve.maxHp,_ve.hp+_bdmg*0.1);}
      // Plague Lord infection: bullet lands and leaves an acid patch
      if(b._plagueBullet){if(!s.firePatches)s.firePatches=[];s.firePatches.push({x:b.x,y:b.y,r:30,life:4.0,maxLife:4.0,dmgPs:18,isAcid:true});spawnParticles(s,b.x,b.y,'#44ff44',2);}
      const killerLabel=b.sourceName?`${b.sourceName} BULLET`:"SNIPER BULLET";
      if(s.combo>1){s.combo=1;s.comboTimer=0;s._nextComboPickup=8;updateComboHUD();addFloat(p.x,p.y-20,'COMBO LOST!','#ff2d55');}
      updateHpHUD();spawnParticles(s,p.x,p.y,'#ff2d55',2);
      triggerDamageFlash();triggerShake(3);
      if(p.hp<=0){if(!tryRevive(s,killerLabel||'SNIPER BULLET'))return;}
    }
  }

  // Slow field orbs
  if(s.slowOrbs){
    for(let i=s.slowOrbs.length-1;i>=0;i--){
      const so=s.slowOrbs[i];so.life-=dt;
      if(so.life<=0){s.slowOrbs.splice(i,1);continue;}
      for(const e of s.enemies){
        if(Math.hypot(e.x-so.x,e.y-so.y)<so.r+e.r){
          if(!e._frozen){e._frozen=true;e._frozenTimer=.8;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.5;}
        }
      }
    }
  }

  // Turrets
  if(s.turrets&&s.turrets.length>0){
    for(let i=s.turrets.length-1;i>=0;i--){
      const t=s.turrets[i];t.life-=dt;
      if(t.life<=0){s.turrets.splice(i,1);continue;}
      t.shootTimer-=dt;
      if(t.shootTimer<=0&&s.enemies.length>0){
        t.shootTimer=t.shootCooldown;
        let near=null,nd=Infinity;
        for(const e of s.enemies){const d=Math.hypot(e.x-t.x,e.y-t.y);if(d<nd){near=e;nd=d;}}
        if(near){const ang=Math.atan2(near.y-t.y,near.x-t.x);const td=t._ownerDmg||p.damage;const tp=t._ownerPierce||0;const ts=t._ownerBulletSize||5;spawnBullet_pool(s, {x:t.x,y:t.y,vx:Math.cos(ang)*7.5,vy:Math.sin(ang)*7.5,r:ts,dmg:td*0.85,pierce:tp,life:1.5,isTurret:true});}
      }
    }
  }

  // Leech plants
  if(s.leechPlants&&s.leechPlants.length>0){
    for(let i=s.leechPlants.length-1;i>=0;i--){
      const pl=s.leechPlants[i];
      pl.life-=dt;
      pl.pulse=(pl.pulse||0)+dt*3;
      if(pl.life<=0){
        spawnParticles(s,pl.x,pl.y,'#336622',2);
        s.leechPlants.splice(i,1);continue;
      }
      if(!pl.latchedEnemies)pl.latchedEnemies=[];

      // ── Drain each latched enemy ─────────────────────────────────
      for(let li=pl.latchedEnemies.length-1;li>=0;li--){
        const le=pl.latchedEnemies[li];
        // Drop if dead or wandered too far
        if(!s.enemies.includes(le)||Math.hypot(le.x-pl.x,le.y-pl.y)>pl.leechRange*1.8){
          pl.latchedEnemies.splice(li,1);continue;
        }
        const drain=pl.dmgPs*dt;
        le.hp-=drain;le.hitFlash=Math.min(1,le.hitFlash+.08);
        s.totalDamageDealt+=drain;
        // Passive drain trickle heal
        healPlayer(s,drain*0.10);
        if(Math.random()<0.25)spawnParticles(s,le.x+(pl.x-le.x)*.3,le.y+(pl.y-le.y)*.3,'#44ff66',2);
        // Kill — heal 2% max HP and extend plant life
        if(le.hp<=0){
          pl.life=Math.min(pl.maxLife*2,pl.life+6);
          pl.feedCount++;
          pl.maxLife=Math.max(pl.maxLife,pl.life);
          const killHeal=Math.floor(p.maxHp*0.03);
          healPlayer(s,killHeal);
          spawnParticles(s,pl.x,pl.y,'#00ff88',3);spawnParticles(s,pl.x,pl.y,'#44ff66',2);
          abilityRing(s,pl.x,pl.y,'#00ff88',45,.4);
          addFloat(pl.x,pl.y-20,`CONSUMED! +${killHeal}HP`,'#00ff88');
          updateHpHUD();
          pl.latchedEnemies.splice(li,1);
        }
      }

      // ── Grab new targets up to 3 ────────────────────────────────
      if(pl.latchedEnemies.length<3){
        // Collect all in-range non-boss enemies not already latched
        const candidates=s.enemies.filter(e=>
          !e.isBoss&&
          !pl.latchedEnemies.includes(e)&&
          Math.hypot(e.x-pl.x,e.y-pl.y)<pl.leechRange+e.r
        );
        // Sort by closest and grab until full
        candidates.sort((a,b)=>Math.hypot(a.x-pl.x,a.y-pl.y)-Math.hypot(b.x-pl.x,b.y-pl.y));
        for(const near of candidates){
          if(pl.latchedEnemies.length>=3)break;
          pl.latchedEnemies.push(near);
          if(!near._frozenSpeed)near._frozenSpeed=near.speed;
          near.speed=Math.min(near.speed,near._frozenSpeed*0.20);
          near._leeched=true;
          spawnParticles(s,near.x,near.y,'#44ff66',2);
          addFloat(near.x,near.y,'LEECHED!','#44ff66');
        }
      }
    }
  }

  // Fire/frost patches
  if(s.firePatches&&s.firePatches.length>0){
    if(s.firePatches.length>40)s.firePatches.splice(0,s.firePatches.length-35);
    for(let i=s.firePatches.length-1;i>=0;i--){
      const fp=s.firePatches[i];fp.life-=dt;
      if(fp.life<=0){s.firePatches.splice(i,1);continue;}
      if(fp.isFrost){
        // Freeze enemies walking on frost
        for(const e of s.enemies){
          if(Math.hypot(e.x-fp.x,e.y-fp.y)<fp.r+e.r){
            if(!e._frozen){e._frozen=true;e._frozenTimer=1.8;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.08;}
          }
        }
      }else{
        for(const e of s.enemies){if(Math.hypot(e.x-fp.x,e.y-fp.y)<fp.r+e.r){const _fpRes=e.isBoss?0.60:1.0;const _fpDmg=fp.dmgPs*dt*_fpRes;e.hp-=_fpDmg;e.hitFlash=Math.min(1,e.hitFlash+.12);s.totalDamageDealt+=_fpDmg;}}
        // Mine patches damage the player; reversal makes all patches damage player
        if((fp._isMine||s._modReversal)&&!fp.isGhost&&p.immune<=0){
          if(Math.hypot(p.x-fp.x,p.y-fp.y)<fp.r+p.r){
            const _mineDmg=fp.dmgPs*dt*(s._modGlass?2:1);
            if(!s._adminMode){p.hp-=_mineDmg;p.immune=0.15;s.totalDamageTaken+=_mineDmg;updateHpHUD();}
          }
        }
      }
    }
  }

  // Enemies update
  for(let i=s.enemies.length-1;i>=0;i--){
    const e=s.enemies[i];
    e.hitFlash=Math.max(0,e.hitFlash-dt*8);
    if(e._frozen){e._frozenTimer-=dt;if(e._frozenTimer<=0){e._frozen=false;if(e._frozenSpeed){e.speed=e._frozenSpeed;delete e._frozenSpeed;}}}
    if(e._stunned){e._stunTimer-=dt;if(e._stunTimer<=0){e._stunned=false;if(e._frozenSpeed){e.speed=e._frozenSpeed;delete e._frozenSpeed;}}}
    // Bleed DoT
    if(e._bleeding){
      e._bleedTimer-=dt;
      const bleedDmg=e._bleedDmg*dt;
      e.hp-=bleedDmg;s.totalDamageDealt+=bleedDmg;
      if(state.player._bleedLeech){healPlayer(state,bleedDmg*0.10);}
      if(e._bleedTimer<=0)e._bleeding=false;
    }
    // Fire DoT
    if(e._onFire){e._fireTimer-=dt;e.hp-=e._fireDmg*dt;s.totalDamageDealt+=e._fireDmg*dt;if(e._fireTimer<=0)e._onFire=false;}
    // healer AI removed
    // BERSERKER: enrages at 50% HP - doubles speed and damage
    if(e.enrages&&!e._enraged&&e.hp/e.maxHp<0.5){
      e._enraged=true;e.speed*=2.0;e.dmgPs*=1.8;e.color='#ff0000';
      spawnParticles(s,e.x,e.y,'#ff0000',3);addFloat(e.x,e.y,'ENRAGED!','#ff0000');
    }
    // BOSS PHASE 2: at 50% HP boss enters phase 2 — faster, more bullets, visual change
    if(e.isBoss&&!e._phase2&&e.hp/e.maxHp<0.50){
      e._phase2=true;
      e.speed*=1.6;
      e.dmgPs*=1.4;
      e._phase2Color=e.color;
      // Flash the boss
      abilityRing(s,e.x,e.y,'#ff4444',e.r*4,.5,{glow:40,lw:5});
      abilityRing(s,e.x,e.y,'#ffffff',e.r*2,.3,{glow:20,lw:2,noEcho:true});
      spawnParticles(s,e.x,e.y,'#ff4444',8);spawnParticles(s,e.x,e.y,'#ffffff',5);
      triggerShake(10);
      addFloat(e.x,e.y-40,'⚠ PHASE 2!','#ff4444');
      announceWave('⚠ PHASE 2 — ENRAGED!','boss');
    }
    // Phase 2 color pulse
    if(e._phase2&&!e.hitFlash){
      const pulse=0.7+Math.sin(s.totalTime*6)*0.3;
      e._renderColor=`rgba(255,${Math.floor(50*pulse)},${Math.floor(50*pulse)},1)`;
    }
    // NECROMANCER: revives a nearby dead-ish (low HP) enemy periodically
    if(e.necro&&!e.isBoss){
      e.necroTimer-=dt;
      if(e.necroTimer<=0){
        e.necroTimer=e.necroCooldown;
        // Find the lowest-HP non-necro enemy and restore 40% HP
        let target=null,lowestRatio=1;
        for(const other of s.enemies){
          if(other!==e&&!other.isBoss&&!other.necro){
            const ratio=other.hp/other.maxHp;
            if(ratio<lowestRatio){lowestRatio=ratio;target=other;}
          }
        }
        if(target&&lowestRatio<0.6){
          const heal=target.maxHp*0.4;target.hp=Math.min(target.maxHp,target.hp+heal);
          spawnParticles(s,target.x,target.y,'#8800aa',2);
          // Draw necro beam visually
          if(!s.laserBeams)s.laserBeams=[];
          s.laserBeams.push({x1:e.x,y1:e.y,x2:target.x,y2:target.y,color:'#cc44ff',w:2,life:.4,maxLife:.4});
          addFloat(target.x,target.y,'REVIVED!','#cc44ff');
        }
      }
    }
    // BOMBER: counts down a fuse then detonates in a large explosion
    if(e.isBomber){
      e._fuseTimer-=dt;
      if(e._fuseTimer<=0){
        // Detonate
        explodeAt(s,e.x,e.y,55,e.dmgPs*0.9);
        spawnParticles(s,e.x,e.y,'#ff8800',3);spawnParticles(s,e.x,e.y,'#ffff00',3);
        abilityRing(s,e.x,e.y,'#ff6600',70,.35);
        addFloat(e.x,e.y,'BOOM!','#ff8800');triggerShake(5);
        // Spawn 2 small grunt fragments
        for(let fi=0;fi<2;fi++){
          const ang=Math.random()*Math.PI*2;const dist=30+Math.random()*30;
          const frag={...JSON.parse(JSON.stringify(ENEMY_TYPES[0])),x:e.x+Math.cos(ang)*dist,y:e.y+Math.sin(ang)*dist};
          const hpScale=1+(s.wave-1)*.45;
          enemyPush(s, EnemyPool.acquire({...frag,hp:frag.hp*hpScale*0.4,maxHp:frag.hp*hpScale*0.4,speed:frag.speed*2,hitFlash:0,isBoss:false,xp:1,gold:0,r:frag.r*.7}));
        }
        e._dead=true;EnemyPool.release(e);s.enemies[i]=s.enemies[s.enemies.length-1];s.enemies.pop();continue;
      }
      // Flash red at low fuse
      if(e._fuseTimer<1.2)e.hitFlash=Math.abs(Math.sin(e._fuseTimer*8))*.8;
    }
    // TELEPORTER: periodically teleports behind the player
    if(e.isTeleporter){
      e._teleportTimer-=dt;
      if(e._teleportTimer<=0){
        e._teleportTimer=3.0+Math.random()*2;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        const dist=50+Math.random()*40;
        const newX=p.x-Math.cos(ang)*dist;const newY=p.y-Math.sin(ang)*dist;
        spawnParticles(s,e.x,e.y,'#00ffcc',2);
        e.x=Math.max(e.r,Math.min(W-e.r,newX));e.y=Math.max(e.r,Math.min(H-e.r,newY));
        spawnParticles(s,e.x,e.y,'#00ffcc',2);addFloat(e.x,e.y,'BLINK!','#00ffcc');
        e.immune=(e.immune||0)+0.3;
      }
    }
    // JUGGERNAUT: slow tank that periodically charges at full speed
    if(e.isJuggernaut){
      if(e._charging){
        e._chargeDuration=(e._chargeDuration||0)-dt;
        if(e._chargeDuration<=0){e._charging=false;e._chargeTimer=3.5+Math.random();}
        // While charging, move in charge direction at full speed
        e.x+=e._chargeVx*60*dt;e.y+=e._chargeVy*60*dt;
        // Damage everything in the path
        for(const other of s.enemies){
          if(other!==e&&Math.hypot(other.x-e.x,other.y-e.y)<e.r+other.r){other.hp-=30;other.hitFlash=1;}
        }
      }else{
        e._chargeTimer-=dt;
        if(e._chargeTimer<=0){
          e._charging=true;e._chargeDuration=0.65;
          const ang=Math.atan2(p.y-e.y,p.x-e.x);
          e._chargeVx=Math.cos(ang)*6;e._chargeVy=Math.sin(ang)*6;
          spawnParticles(s,e.x,e.y,'#8b0000',3);addFloat(e.x,e.y,'CHARGE!','#ff2200');triggerShake(4);
        }
      }
    }


    let dead=false;
    // ── CHRONOMANCER TIME FREEZE ──────────────────────────────────────
    if(e._timeFrozen>0){
      e._timeFrozen-=dt;
      if(e._timeFrozen<=0){e.speed=e._origSpeed||e.speed;}
      else{e.speed=0.02;}
    }
    // TIME DILATION slow from _timeShot bullets (applied at bullet hit, see below)
    if(e._thornSlowed>0){e._thornSlowed-=dt;if(e._thornSlowed<=0&&e._thornSlowBase){e.speed=e._thornSlowBase;delete e._thornSlowBase;}}
    // ── SHIELDER-BOT: orbits a nearby enemy, blocks bullets aimed there ──
    if(e.isShielderBot){
      // Find nearest non-shielderbot enemy to orbit
      if(!e._orbitTarget||!s.enemies.includes(e._orbitTarget)||e._orbitTarget.hp<=0){
        e._orbitTarget=s.enemies.find(oe=>oe!==e&&!oe.isShielderBot&&!oe.isBoss)||null;
      }
      if(e._orbitTarget){
        e._orbitAngle=(e._orbitAngle||0)+dt*2.2;
        const orbitR=e._orbitTarget.r+22;
        const tx=e._orbitTarget.x+Math.cos(e._orbitAngle)*orbitR;
        const ty=e._orbitTarget.y+Math.sin(e._orbitAngle)*orbitR;
        e.x+=(tx-e.x)*dt*6;e.y+=(ty-e.y)*dt*6;
        // Block bullets aimed at orbit target (absorbs them)
        if(!dead&&s.bullets.length){
          for(let bi=s.bullets.length-1;bi>=0;bi--){
            const b=s.bullets[bi];
            if(Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){
              e.hp-=b.dmg*0.5;BulletPool.release(b);s.bullets[bi]=s.bullets[s.bullets.length-1];s.bullets.pop();
              spawnParticles(s,e.x,e.y,'#00aaff',2);
              if(e.hp<=0){dead=true;break;}
            }
          }
        }
      }
    }

    // ── SAPPER: rushes player, disables ability on contact ──────────────
    if(e.isSapper&&!dead){
      const sd=Math.hypot(e.x-p.x,e.y-p.y);
      if(sd<p.r+e.r+4&&p.immune<=0&&!p._cloaked){
        // Disable ability for 4 seconds
        if(!p._sapperDebuff){
          p._sapperDebuff=true;p._sapperTimer=p._sapperWard?2.0:4.0;
          p._abilityCooldown=Math.max(p._abilityCooldown,p._abilityMaxCd*1.5);
          addFloat(p.x,p.y,'⚡ ABILITY DISABLED!','#ffe000');
          spawnParticles(s,p.x,p.y,'#ffe000',3);
          if(!s.laserBeams)s.laserBeams=[];
          s.laserBeams.push({x1:e.x,y1:e.y,x2:p.x,y2:p.y,color:'#ffe000',w:2,life:.5,maxLife:.5});
        }
      }
    }

    // ── MIMIC: disguised as chest, reveals when player gets close ────────
    if(e.isMimic&&!dead){
      const md=Math.hypot(e.x-p.x,e.y-p.y);
      if(!e._mimicRevealed&&md<100){
        e._mimicRevealed=true;
        const t=ENEMY_TYPES[17]; // MIMIC base
        e.r=e._mimicR;e.speed=t.speed*(1+(s.wave-1)*.06);e.dmgPs=t.dmgPs*(1+(s.wave-1)*.06);
        e.color='#ff44aa';e._enraged=true;e.shape='circle';
        spawnParticles(s,e.x,e.y,'#ffd700',3);spawnParticles(s,e.x,e.y,'#ff44aa',3);
        addFloat(e.x,e.y,'MIMIC!','#ff44aa');triggerShake(6);
      }
    }

    // ── HERALD: emits buff aura to nearby enemies ────────────────────────
    if(e.isHerald&&!dead){
      e._auraTimer=(e._auraTimer||0)+dt;
      if(e._auraTimer>0.5){
        e._auraTimer=0;
        const aura=e._auraR||100;
        let buffed=0;
        for(const oe of s.enemies){
          if(oe===e||oe.isBoss)continue;
          if(Math.hypot(oe.x-e.x,oe.y-e.y)<aura){
            oe._heraldBuffed=true;oe._heraldBuffTimer=1.5; // resets every 0.5s while in range
            buffed++;
          }
        }
        if(buffed>0){
          // Visual pulse
          if(!s.particles)s.particles=[];
          abilityRing(s,e.x,e.y,'#ff88ff',aura*0.6,.5,{glow:12,lw:1.5,noEcho:true});
        }
      }
      // Keep moving slowly, staying away from edges
      const cx=W/2,cy=H/2;
      const distC=Math.hypot(e.x-cx,e.y-cy);
      if(distC>120){const ac=Math.atan2(cy-e.y,cx-e.x);e.x+=Math.cos(ac)*e.speed*(60*dt)*0.5;e.y+=Math.sin(ac)*e.speed*(60*dt)*0.5;}
    }

    // HIT SLOW timer decay
    if(e._hitSlowed){e._hitSlowTimer-=dt;if(e._hitSlowTimer<=0){e._hitSlowed=false;if(e._hitSlowBaseSpd){e.speed=e._hitSlowBaseSpd;delete e._hitSlowBaseSpd;}}}
    if(e.isBoss)updateBossAI(s,e,dt);
    else{
      const exd=p.x-e.x,eyd=p.y-e.y,ed=Math.sqrt(exd*exd+eyd*eyd)||1;
      const _spd=e.speed*(e._heraldBuffed?1.35:1.0);
      if(!(e.isShielderBot&&e._orbitTarget)&&!(e.isHerald)&&!(e.isMimic&&!e._mimicRevealed)){
        e.x+=exd/ed*_spd*60*dt;e.y+=eyd/ed*_spd*60*dt;
      }
      if(e.shoots){e.shootTimer-=dt;if(e.shootTimer<=0){e.shootTimer=e.shootCooldown;const ang=Math.atan2(p.y-e.y,p.x-e.x);spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang)*5.5,vy:Math.sin(ang)*5.5,r:5,dmg:26,life:2.5,color:'#ff4488',sourceName:e.name});}}
    }
    // Update boss bar (primary boss only, not minibosses/clones)
    if(e.isBoss&&!e._isMiniboss){
      const bpct=Math.max(0,e.hp/e.maxHp*100);
      const bfill=document.getElementById('boss-bar-fill');
      bfill.style.width=bpct+'%';
      // Phase 2: bar goes red and pulses
      if(e._phase2){
        bfill.style.background='linear-gradient(90deg,#cc0000,#ff4444)';
        bfill.style.boxShadow='0 0 8px rgba(255,0,0,0.6)';
      } else if(bpct<30){
        bfill.style.background='linear-gradient(90deg,#aa2200,#ff6600)';
        bfill.style.boxShadow='0 0 5px rgba(255,100,0,0.4)';
      } else {
        bfill.style.background='';bfill.style.boxShadow='';
      }
      document.getElementById('boss-hp-text').textContent=`${fmtBig(e.hp)} / ${fmtBig(e.maxHp)}`;
    }
    // Bullet hits enemy — use spatial grid for fast lookup
    if(!(e.isBoss&&e.isBurrowed)){
    const _eR=e.r+12;
    // Get grid cell for this enemy
    const _ecx=((e.x/CELL)|0)+1, _ecy=((e.y/CELL)|0)+1;
    for(let j=s.bullets.length-1;j>=0;j--){
      const b=s.bullets[j];
      // AABB broad-phase: skip if bullet clearly not near this enemy
      if(Math.abs(e.x-b.x)>_eR+b.r||Math.abs(e.y-b.y)>_eR+b.r)continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){
        if(e.shielded&&e.shieldHp>0){e.shieldHp-=b.dmg;e.hitFlash=.5;if(e.shieldHp<=0){e.shielded=false;addFloat(e.x,e.y,'SHIELD BROKEN','#00ccff');}b.pierce--;if(b.pierce<0)BulletPool.release(b);s.bullets[j]=s.bullets[s.bullets.length-1];s.bullets.pop();continue;}
        if(b.isAoEOrb){
          explodeAt(s,b.x,b.y,b.aoeR||40,b.dmg*1.1);
          spawnParticles(s,b.x,b.y,'#cc44ff',2);
          BulletPool.release(b);s.bullets[j]=s.bullets[s.bullets.length-1];s.bullets.pop();if(e.hp<=0){dead=true;}break;
        }
        const _bossRes=e.isBoss?0.60:1.0;
        if(e.isBoss&&!e._resistAnnounced){e._resistAnnounced=true;addFloat(e.x,e.y,'🛡 RESISTANT!','#ffaa00');}
        if(e._shieldActive){e._mkAbsorbed=(e._mkAbsorbed||0)+1;spawnParticles(s,e.x,e.y,'#ffffff',2);BulletPool.release(b);s.bullets[j]=s.bullets[s.bullets.length-1];s.bullets.pop();continue;}
        const _infernoBonusDmg=e._inferno?b.dmg*0.4:0;
        // Use hoisted per-frame constants
        const _metaCrit=s._fc_crit>0&&Math.random()<s._fc_crit;
        const _critM=p._critMult||2.5;
        const _overMult=(p._overload&&p._overloadReady)?(()=>{p._overloadReady=false;addFloat(p.x,p.y-20,'⚡ OVERLOAD!','#ffff44');return(p._overloadCd||8)<6?3.5:3.0;})():1.0;
        if(p._ksReady){p._ksReady=false;}  // consume kill streak on first hit
        const _statusAmpMult = (p._statusAmp&&(e._onFire||e._frozen||e._poisoned||e._bleeding))?1.5:1.0;
        const _finalDmg=(b.dmg+_infernoBonusDmg)*_bossRes*(_metaCrit?(_critM||2.5):1)*s._fc_newMult*_overMult*_statusAmpMult;
        if(_metaCrit){ spawnParticles(s,e.x,e.y,'#ffd700',2); if(!e._critFloatThisFrame){e._critFloatThisFrame=true;addFloat(e.x,e.y,'CRIT!','#ffd700');} }
        e.hp-=_finalDmg;e.hitFlash=1;s.totalDamageDealt+=_finalDmg;
        // Leech: use hoisted constant, batch heal (no HUD update here - done end-of-frame)
        if(s._fc_leech>0){healPlayer(s,_finalDmg*s._fc_leech);}
        if(p._crimsonPact){healPlayer(s,_finalDmg*0.08);}
        if(p._cursedBlade){healPlayer(s,_finalDmg*0.08);}
        if(_metaCrit&&(p._critMult||0)>0){ /* crit mult already baked into _finalDmg via 2.5 */ }
        // Crit chain lightning (lucky charm lv4)
        if(_metaCrit&&p._critChain&&s.enemies.length>1){
          const _cn=s.enemies.filter(ce=>ce!==e&&!ce._dead&&Math.hypot(ce.x-e.x,ce.y-e.y)<200);
          if(_cn.length){const _ct=_cn[0];const _ccd=_finalDmg*0.6;_ct.hp-=_ccd;_ct.hitFlash=1;s.totalDamageDealt+=_ccd;if(!s.laserBeams)s.laserBeams=[];s.laserBeams.push({x1:e.x,y1:e.y,x2:_ct.x,y2:_ct.y,color:'#ffff44',w:2,life:.15,maxLife:.15});}
        }
        // ELECTRIFY (Overcharge boss item): chain dmg on hit
        if(p._electrify&&!e.isBoss&&Math.random()<0.35){
          const _en=s.enemies.filter(ce=>ce!==e&&!ce._dead&&Math.hypot(ce.x-e.x,ce.y-e.y)<120);
          if(_en.length){const _et=_en[Math.floor(Math.random()*_en.length)];const _ed=_finalDmg*0.4;_et.hp-=_ed;_et.hitFlash=1;s.totalDamageDealt+=_ed;if(!s.laserBeams)s.laserBeams=[];s.laserBeams.push({x1:e.x,y1:e.y,x2:_et.x,y2:_et.y,color:'#88ffff',w:2,life:.12,maxLife:.12});}
        }
        // POISON BULLETS: apply poison on hit
        // ICE SHARD: splash 50% damage to nearby enemies on hit
        if(b._iceShard&&!e.isBoss){
          for(let _is=0;_is<s.enemies.length;_is++){
            const _se=s.enemies[_is];
            if(_se!==e&&!_se._dead&&Math.hypot(_se.x-e.x,_se.y-e.y)<30+_se.r){
              const _sd=_finalDmg*0.50;_se.hp-=_sd;_se.hitFlash=0.5;s.totalDamageDealt+=_sd;
            }
          }
        }
        // BLEED ON HIT
        if(p._bleedOnHit&&!e.isBoss&&Math.random()<(p._bleedChance||0.25)){
          if(!e._bleeding){e._bleeding=true;e._bleedTimer=5.0;e._bleedDmg=_finalDmg*0.08;e._bleedStacks=1;}
          else{e._bleedStacks=Math.min(8,(e._bleedStacks||1)+1);e._bleedTimer=5.0;e._bleedDmg=_finalDmg*0.08*e._bleedStacks;}
        }
                if(p._poisonBullets&&!e._poisoned&&!e.isBoss){
          const poisonChance=[0,0.30,0.55,0.75,0.99][Math.min(4,p._poisonLevel||1)];
          const poisonDur=[0,4,6,6,6][Math.min(4,p._poisonLevel||1)];
          if(Math.random()<poisonChance){e._poisoned=true;e._poisonTimer=poisonDur;spawnParticles(s,e.x,e.y,'#44ff44',2);}
        }
        // VOID LANCE: +40% dmg bonus already from high pierce, apply trail
        if(p._voidLance&&p._voidLevel>=3&&!e.isBoss){
          if(!s.firePatches)s.firePatches=[];
          if(s.firePatches.length<40)s.firePatches.push({x:b.x,y:b.y,r:18,life:2.0,maxLife:2.0,dmgPs:p.damage*0.30,_voidTrail:true});
        }
        if(b._isSoulBolt)e._killedBySoulBolt=true;
        if(s._dpsLog&&s._dpsLog.length<200)s._dpsLog.push({t:s.totalTime,dmg:_finalDmg});
        if(e._inferno&&_infernoBonusDmg>0)spawnParticles(s,e.x,e.y,'#ff2200',2);
        // SUPPRESSION: minigun bullets stack a slow on their target
        if(b._isMinigunBullet&&b._suppressTarget===e&&!e.isBoss){
          p._suppressStacks=Math.min(5,(p._suppressStacks||0)+1);
          const slowPct=p._suppressStacks*0.14; // 14% per stack up to 70%
          if(!e._suppressBaseSpeed)e._suppressBaseSpeed=e.speed;
          e.speed=e._suppressBaseSpeed*(1-slowPct);
          if(p._suppressStacks>=5&&!e._fullySupPressed){
            e._fullySupPressed=true;
            addFloat(e.x,e.y,'SUPPRESSED!','#ff8800');
            spawnParticles(s,e.x,e.y,'#ff8800',2);
          }
        }
        // Executioner: +50% vs low-HP enemies
        if(p._executioner&&!b.isTurret&&e.hp>0){
          const execThresh=[0,.30,.40,.50,.50][Math.min(4,p._execLevel||1)];
          const execBonus=[0,.35,.50,.70,.70][Math.min(4,p._execLevel||1)];
          if(e.hp/e.maxHp<execThresh){
            if(p._execInstakill&&e.hp/e.maxHp<0.15&&!e.isBoss){e.hp=0;}
            else{const xDmg=b.dmg*execBonus;e.hp-=xDmg;s.totalDamageDealt+=xDmg;}
          }
        }
        if(p._charId==='cryomancer'&&!e._frozen){e._frozen=true;e._frozenTimer=1.6;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.3;}
        // Chronomancer: TIME DILATION — 50% slow for 2s on every hit
        // Riftwalker: VOID DRIFT — 30% chance to fire extra rift bullet from a random nearby position
        if(p._charId==='riftwalker'&&!b.isTurret&&!b._isRiftDrift&&Math.random()<0.30){
          const rx=p.x+(Math.random()-.5)*80,ry=p.y+(Math.random()-.5)*80;
          const ra=Math.atan2(e.y-ry,e.x-rx);
          spawnBullet_pool(s, {x:rx,y:ry,vx:Math.cos(ra)*p.bulletSpeed*1.1,vy:Math.sin(ra)*p.bulletSpeed*1.1,r:p.bulletSize,dmg:b.dmg*0.55,pierce:0,life:1.4,_isRiftDrift:true});
        }
        if(p._slowField&&!b.isTurret&&Math.random()<.3){if(!s.slowOrbs)s.slowOrbs=[];s.slowOrbs.push({x:b.x,y:b.y,r:20,life:1.2});}
        if(p._cryoRounds&&!b.isTurret&&!e._frozen){
          const cryoChance=[0,.40,.60,.80,.99,.99][Math.min(5,p._cryoLevel||1)];
          const cryoDur=[0,1.0,2.0,2.0,2.5,2.5][Math.min(5,p._cryoLevel||1)];
          const cryoLevel=p._cryoLevel||1;
          if(Math.random()<cryoChance){
            if(cryoLevel<=1){// cryo1: 30% slow for 1s (not full freeze)
              if(!e._frozenSpeed){e._frozenSpeed=e.speed;e.speed*=0.70;}
              e._frozenTimer=Math.max(e._frozenTimer||0,1.0);
            } else {// cryo2+: full freeze
              e._frozen=true;e._frozenTimer=cryoDur;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.05;
            }
            if(p._cryoVuln)e._cryoVuln=true;}
        }
        if(p._incendiaryBullets&&!b.isTurret&&Math.random()<.25&&!e._onFire){e._onFire=true;e._fireTimer=3.0;e._fireDmg=p.damage*0.12;}
        // Druid thorn: slow 40% for 1.5s
        // Acid flask: leave poison patch on hit
        if(b.isAcidFlask){
          if(!s.firePatches)s.firePatches=[];
          s.firePatches.push({x:e.x,y:e.y,r:22+(b.bSize||5)*2,life:4.0,maxLife:4.0,dmgPs:b.acidDmg||10,isAcid:true});
          spawnParticles(s,e.x,e.y,'#88ff00',2);
        }
        // Trickster card effects
        if(b._trickCard==='ice'&&!e._frozen){e._frozen=true;e._frozenTimer=1.8;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed*=0.2;spawnParticles(s,e.x,e.y,'#88ddff',2);}
        if(b._trickCard==='bolt'&&!e.isBoss){const _bchain=s.enemies.filter(en=>en!==e&&Math.hypot(en.x-e.x,en.y-e.y)<120);if(_bchain.length>0){const _bt=_bchain[0];const _bcd=b.dmg*0.6*_bossRes;_bt.hp-=_bcd;_bt.hitFlash=1;s.totalDamageDealt+=_bcd;spawnParticles(s,_bt.x,_bt.y,'#ffff44',2);if(!s.laserBeams)s.laserBeams=[];s.laserBeams.push({x1:e.x,y1:e.y,x2:_bt.x,y2:_bt.y,color:'#ffff44',w:2,life:.15,maxLife:.15});}}
        // (vine rooting removed)
        if(!b._isEcho)spawnParticles(s,e.x,e.y,e.color,2);
        if(!b._isEcho&&Math.random()<0.35){
          const fdmg=Math.floor(b.dmg);
          const fcol=fdmg>=80?'#ff4444':fdmg>=40?'#ff8800':'#ffd700';
          const fsize=fdmg>=80?1.4:fdmg>=40?1.15:1.0;
          spawnFloat_pool_obj(state, {x:e.x,y:e.y-10,text:`-${fmtBig(fdmg)}`,color:fcol,life:1.0,scale:fsize});
        }
        if(p._explosiveBullets){
          const exR=[0,42,60,80,80][Math.min(4,p._explLevel||1)];
          const exDmg=[0,.5,.65,.65,.90][Math.min(4,p._explLevel||1)];
          explodeAt(s,e.x,e.y,exR,p.damage*exDmg);
          // Level 3: 15% chain reaction
          if(p._explLevel>=3&&Math.random()<(p._explLevel>=4?.35:.15)){
            let cn=null,cd=Infinity;for(const ce of s.enemies){if(ce!==e){const d=Math.hypot(ce.x-e.x,ce.y-e.y);if(d<exR*1.5&&d<cd){cn=ce;cd=d;}}}
            if(cn)explodeAt(s,cn.x,cn.y,exR*.7,p.damage*exDmg*.6);
          }
        }
        // Cryo vulnerability: frozen enemies take 30% more damage
        if(e._cryoVuln&&e._frozen){const cvBonus=_finalDmg*0.30;e.hp-=cvBonus;s.totalDamageDealt+=cvBonus;}
        // Flame bullet: apply burn stacks
        if(b._flameBullet&&p._charId==='pyro'){
          e._burnStacks=Math.min(6,(e._burnStacks||0)+1);
          e._burnTimer=3.0;
          e._onFire=true;
          e._fireTimer=Math.max(e._fireTimer||0, 2.5);
          e._fireDmg=p.damage*0.05*e._burnStacks;
          if(e._burnStacks>=6&&!e._infernoAnnounced){
            e._infernoAnnounced=true;
            addFloat(e.x,e.y,'🔥 INFERNO!','#ff2200');
            spawnParticles(s,e.x,e.y,'#ff2200',2);
          }
        }
        if(p._chainLightning&&!b.isTurret&&!b._isEcho){
          const chainProc=[0,.40,.50,.65,.80,1.0][p._chainLevel||1];
          const chainArcs=[0,1,2,3,4,99][Math.min(5,p._chainLevel||1)];
          const chainDmgPct=[0,.55,.65,.80,.90,.90][Math.min(5,p._chainLevel||1)];
          if(Math.random()<chainProc){
            let chained=0,lastX=e.x,lastY=e.y,chainSet=new Set([e]);
            while(chained<chainArcs){
              let cn=null,cd=Infinity;
              for(const ce of s.enemies){if(!chainSet.has(ce)){const d=Math.hypot(ce.x-lastX,ce.y-lastY);if(d<cd&&d<260){cn=ce;cd=d;}}}
              if(!cn)break;
              chainSet.add(cn);
              const _chainRes=cn.isBoss?0.60:1.0;
              const _chainDmg=b.dmg*chainDmgPct*_chainRes;
              cn.hp-=_chainDmg;cn.hitFlash=.8;s.totalDamageDealt+=_chainDmg;
              spawnParticles(s,cn.x,cn.y,'#00d4ff',2);
              if(!s.laserBeams)s.laserBeams=[];
              s.laserBeams.push({x1:lastX,y1:lastY,x2:cn.x,y2:cn.y,color:'#00d4ff',w:3,life:.15,maxLife:.15});
              if(cn.hp<=0){if(!s._deferredKills)s._deferredKills=[];s._deferredKills.push(cn);}
              lastX=cn.x;lastY=cn.y;chained++;
            }
          }
        }
        // Ricochet: redirect bullet toward nearest OTHER enemy, chain based on _ricoLevel
        if(p._ricochet&&!b.isTurret&&!b._isEcho&&b.pierce<=0){
          const ricoMax=[0,1,2,3,4][Math.min(4,p._ricoLevel||1)];
          const ricoBounces=b._ricoBounces||0;
          if(ricoBounces<ricoMax){
            let rb=null,rd=Infinity;
            for(const re of s.enemies){if(re!==e){const rdd=Math.hypot(re.x-b.x,re.y-b.y);if(rdd<rd&&rdd<280){rb=re;rd=rdd;}}}
            if(rb){
              b._ricoBounces=(b._ricoBounces||0)+1;
              b._ricochetDone=true;b.pierce=0;b.life=1.2;
              b.dmg*=0.80; // each bounce deals 80% of previous
              const ra=Math.atan2(rb.y-b.y,rb.x-b.x);
              const sp=Math.hypot(b.vx,b.vy)||p.bulletSpeed||7;
              b.vx=Math.cos(ra)*sp;b.vy=Math.sin(ra)*sp;
              b.x=e.x;b.y=e.y;
              spawnParticles(s,b.x,b.y,'#ffd700',2);
              // Level 4: final bounce explodes
              if(p._ricoLevel>=4&&b._ricoBounces>=ricoMax){explodeAt(s,b.x,b.y,50,p.damage*0.40);}
              // Reposition bullet at end of array so it's processed again next frame
              s.bullets[j]=s.bullets[s.bullets.length-1];s.bullets.pop();
              s.bullets.push(b); // b stays pooled and active
              continue;
            }
          }
        }
        b.pierce--;if(b.pierce<0&&!p._noPierceLimit){BulletPool.release(b);s.bullets[j]=s.bullets[s.bullets.length-1];s.bullets.pop();}
        if(e.hp<=0){dead=true;break;}
      }
      // Guard: re-read bullet at j after any pops (swap may have changed it)
      if(j>=0&&j<s.bullets.length&&s.bullets[j]&&s.bullets[j]!==b){}// intentional — b already captured above
    }
    } // end bullet-hit burrowed guard
    // Orbital hits
    if(!dead&&p._orbitalCount>0&&!(e.isBoss&&e.isBurrowed)){for(const ob of s.orbitalBullets){if(Math.hypot(e.x-ob.x,e.y-ob.y)<e.r+ob.r){const _obRes=e.isBoss?0.60:1.0;e.hp-=ob.dmg*dt*28*_obRes;if(e.hp<=0){dead=true;break;}}}}
    if(!(e.isBoss&&e.isBurrowed)){if(!dead&&e.hp<=0){dead=true;}}
    if(dead){killEnemy(s,e,i);continue;}
    // Contact damage — dmgPs is damage-per-second; tick every 0.25s for chunky hits
    if(e.isBoss&&e.isBurrowed)continue; // can't touch while underground
    // Boss Barrier: blocks one hit, then recharges
    if(p._bossBarrierReady&&!p._barrier&&p.immune<=0&&Math.hypot(p.x-e.x,p.y-e.y)<p.r+e.r-4){
      p._bossBarrierReady=false;p._bossBarrierTimer=0;p.immune=0.6;
      spawnParticles(s,p.x,p.y,'#8888ff',2);addFloat(p.x,p.y,'BARRIER BLOCK!','#8888ff');
      abilityRing(s,p.x,p.y,'#aaaaff',45,.3);continue;
    }
    if(!p._cloaked&&!p._barrier&&p.immune<=0&&Math.hypot(p.x-e.x,p.y-e.y)<p.r+e.r-4){
      // KNIGHT FORTITUDE: block one hit every 3 hits taken
      if(p._charId==='knight'){
        p._fortitudeHits=(p._fortitudeHits||0)+1;
        if(p._fortitudeHits%3===0&&(p._fortitudeHits/3)>(p._fortitudeBlocks||0)){
          p._fortitudeBlocks=(p._fortitudeBlocks||0)+1;
        }
        if(p._fortitudeBlocks>0){
          p._fortitudeBlocks--;
          spawnParticles(s,p.x,p.y,'#ffd700',2);addFloat(p.x,p.y,'BLOCKED!','#ffd700');
          abilityRing(s,p.x,p.y,'#ffd700',40,.25);
          p.immune=0.3;continue;
        }
      }
      // GLASS MODE: die to any hit
      if(p._glassMode&&!s._adminMode){p.hp=0;if(!tryRevive(s,e.name))return;continue;}
      // SHADOW STEP: dodge chance
      if((p._dodgeChance||0)>0&&Math.random()<p._dodgeChance){
        spawnParticles(s,p.x,p.y,'#8800ff',2);addFloat(p.x,p.y,'DODGE!','#cc88ff');
        p.immune=0.4;
        if(p._dodgeBurst){p._dodgeBurstTimer=3.0;}
        continue;
      }
      // DIVINE SHIELD: periodic absorb
      if(p._divineShield){
        p._dsTimer=(p._dsTimer||0)+dt;
        if(p._dsReady){
          p._dsReady=false;p._dsTimer=0;
          spawnParticles(s,p.x,p.y,'#ffffaa',2);addFloat(p.x,p.y,'✨ DIVINE!','#ffffaa');
          abilityRing(s,p.x,p.y,'#ffffaa',50,.3);
          if(p._dsHeal)healPlayer(s,Math.ceil(p.maxHp*0.05));
          p.immune=0.5;continue;
        }
        if(p._dsTimer>=(p._dsCd||12)){p._dsReady=true;}
      }
      // RESILIENCE: extended immune window
      const _immuneDur = p._immuneBoost2 ? 2.5 : p._immuneBoost ? 1.2 : 0.22 + (p._iFrameBoost||0);
      const rawDmg=e.dmgPs*0.25;
      let dmg=rawDmg*(p._reduceDmg||1)*(e._consecrated?0.8:1.0);
      if(p._armor)dmg*=(1-Math.min(0.70,p._armor)); // armor DR, cap at 70%
      // AEGIS CORE: absorb hit entirely
      if(p._aegisCharges>0&&dmg>0){p._aegisCharges--;dmg=0;spawnParticles(s,p.x,p.y,'#aaffff',3);addFloat(p.x,p.y-20,'🛡 AEGIS!','#aaffff');p._aegisCdTimer=0;}
      // SHADOW MANTLE: 80% reduction window after taking a hit
      if(p._shadowMantle&&p._shadowMantleActive)dmg*=0.20;
      if(s._modGlass)dmg*=(p._glassProof?1.3:2.0);
      // Guardian shield absorption
      if(p._modShield&&p._modShield>0){
        const abs=Math.min(p._modShield,dmg);p._modShield-=abs;dmg-=abs;
      }
      if(s._modReversal){p.hp=Math.min(p.maxHp,p.hp+dmg*0.5);dmg=0;}
      if(s._modVampiric){e.hp=Math.min(e.maxHp,e.hp+rawDmg*0.1);}
      if(!s._adminMode){sndDamage();p.hp-=dmg;p.immune=_immuneDur+(p._iFrameBoost||0);s.totalDamageTaken+=dmg;}
      // SHADOW MANTLE: activate 2s protection window (10s CD)
      if(p._shadowMantle&&!p._shadowMantleActive&&(p._shadowMantleCdTimer||0)<=0){
        p._shadowMantleActive=true;p._shadowMantleTimer=2.0;p._shadowMantleCdTimer=p._shadowMantleCd||10;
      }
      if(p._colossusHeart){p._colossusActive=true;p._colossusTimer=2.0;}
      if(p._berserkFury){p._berserkFuryStacks=Math.min(5,(p._berserkFuryStacks||0)+1);p._berserkFuryTimer=4.0;}
      if(p._crimsonPact){/* applied on bullet hit */}
      if(p._thorns&&!e.isBoss)e.hp-=dmg*.3;
      if(p._tyrantFist&&!e.isBoss){e.hp-=p._tyrantContactDmg||30;spawnParticles(s,e.x,e.y,'#ff8800',2);}
      if(p._juggernaut&&!e.isBoss){const _jd=p.damage*0.15;e.hp-=_jd;s.totalDamageDealt+=_jd;}
      // HIT SLOW: slow attacker on contact
      if(p._hitSlow&&!e.isBoss&&!e._hitSlowed){
        e._hitSlowed=true;e._hitSlowTimer=2.0;
        if(!e._hitSlowBaseSpd)e._hitSlowBaseSpd=e.speed;
        e.speed*=0.75;
      }
      // HIGH HP REFLECT: reflect 15% dmg if above 75% HP
      if(p._highHpReflect&&p.hp/p.maxHp>=0.75&&!e.isBoss){
        e.hp-=dmg*0.15;e.hitFlash=1;
      }
      // Mirror shield: reflect dmg as bullet
      if(p._mirrorShield&&!e.isBoss&&Math.random()<.4){
        const ang=Math.atan2(e.y-p.y,e.x-p.x);
        spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ang)*p.bulletSpeed,vy:Math.sin(ang)*p.bulletSpeed,r:p.bulletSize,dmg:dmg*2.5,pierce:0,life:1.5});
      }
      // Counter strike: taking dmg boosts ATK for 2s
      if(p._counterStrike){p._counterActive=true;p._counterTimer=2.0;}
      // Combo reset on hit
      if(s.combo>1){s.combo=1;s.comboTimer=0;s._nextComboPickup=8;updateComboHUD();addFloat(p.x,p.y-20,'COMBO LOST!','#ff2d55');}
      updateHpHUD();spawnParticles(s,p.x,p.y,'#ff2d55',2);
      triggerDamageFlash();
      if(p.hp<=0){if(!tryRevive(s,e.name))return;}
    }
    if(e.explodes&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r+22){
      if(!p._cloaked&&!p._barrier&&!s._adminMode){explodeAt(s,e.x,e.y,60,18);p.hp-=18;updateHpHUD();triggerShake(4);}
      spawnParticles(s,e.x,e.y,'#ff6600',4);
      e._dead=true;EnemyPool.release(e);s.enemies[i]=s.enemies[s.enemies.length-1];s.enemies.pop();
      if(p.hp<=0){if(!tryRevive(s,e.name))return;}continue;
    }
  }
  // Flush deferred kills (chain lightning, etc.) — safe now that enemy loop is done
  if(s._deferredKills&&s._deferredKills.length){
    for(const dk of s._deferredKills){
      const _dki=s.enemies.indexOf(dk);
      if(_dki>=0)killEnemy(s,dk,_dki);
    }
    s._deferredKills=[];
  }
  if(p.immune>0)p.immune-=dt;

  // Surge pickups
  for(let i=s.battlePickups.length-1;i>=0;i--){
    const pickup=s.battlePickups[i];
    pickup.life-=dt;
    pickup.bob+=dt*4.2;
    pickup.spin+=dt*2.8;
    if(pickup.life<=0){s.battlePickups.splice(i,1);continue;}
    const pdx=p.x-pickup.x,pdy=p.y-pickup.y,distSq=pdx*pdx+pdy*pdy;
    if(distSq<150*150){
      const dist=Math.sqrt(distSq)||1;
      pickup.x+=pdx/dist*220*dt;
      pickup.y+=pdy/dist*220*dt;
    }
    if(distSq<(p.r+pickup.r+10)*(p.r+pickup.r+10)){
      applyBattlePickup(s,pickup);
      s.battlePickups.splice(i,1);
    }
  }

  // Chests
  for(let i=s.chests.length-1;i>=0;i--){
    const c=s.chests[i];c.bob=(c.bob||0)+dt*3;
    if(Math.hypot(p.x-c.x,p.y-c.y)<p.r+c.r){
      s.chests.splice(i,1);
      openChest(s,c.isMilestone);
    }
  }

  // XP orbs
  let _xpDirty=false;
  const _surgeMagnet=(p._surgeVacuumTimer||0)>0?240:0;
  const _magRange=p._magnetRange+_surgeMagnet;
  const _magRangeSq=_magRange*_magRange;
  const _pickupSize=p.r+((p._surgeVacuumTimer||0)>0?18:5);
  const _pickupR=_pickupSize*_pickupSize;
  for(let i=s.xpOrbs.length-1;i>=0;i--){
    const o=s.xpOrbs[i];
    o.life=(o.life!==undefined?o.life:8.0)-dt;
    if(o.life<=0){OrbPool.release(o);s.xpOrbs[i]=s.xpOrbs[s.xpOrbs.length-1];s.xpOrbs.pop();continue;}
    const odx=p.x-o.x,ody=p.y-o.y,odSq=odx*odx+ody*ody;
    if(odSq<_magRangeSq){
      const od=Math.sqrt(odSq)||1;
      // Speed ramps up exponentially as orb approaches — feels like a magnet snap
      const closeness=1.0-od/_magRange;
      const baseSpd=(p._surgeVacuumTimer||0)>0?10:5;
      const accel=(p._surgeVacuumTimer||0)>0?60:38;
      const maxSpd=(p._surgeVacuumTimer||0)>0?42:28;
      const spd=Math.min(maxSpd, baseSpd + closeness*closeness*accel);
      o.x+=odx/od*spd; o.y+=ody/od*spd;
    }
    if(odSq<_pickupR){
      p_addXp(s,o.value);
      s._totalGems=(s._totalGems||0)+o.value;
      OrbPool.release(o);s.xpOrbs[i]=s.xpOrbs[s.xpOrbs.length-1];s.xpOrbs.pop();_xpDirty=true;
    }
  }
  if(_xpDirty){updateXpHUD();checkLevelUp(s);}

  // Melee swing visuals decay
  if(s.meleeSwings){for(let i=s.meleeSwings.length-1;i>=0;i--){s.meleeSwings[i].life-=dt;if(s.meleeSwings[i].life<=0)s.meleeSwings.splice(i,1);}}
  // Laser beam decay
  if(s.laserBeams){for(let i=s.laserBeams.length-1;i>=0;i--){s.laserBeams[i].life-=dt;if(s.laserBeams[i].life<=0)s.laserBeams.splice(i,1);}}
  // Afterimage decay
  if(s.afterimages){for(let i=s.afterimages.length-1;i>=0;i--){s.afterimages[i].life-=dt;if(s.afterimages[i].life<=0)s.afterimages.splice(i,1);}}
  // Vine lines decay
  if(s.vineLines){for(let i=s.vineLines.length-1;i>=0;i--){s.vineLines[i].life-=dt;if(s.vineLines[i].life<=0)s.vineLines.splice(i,1);}}
  // Particles — update + pool release
  const _pa=s.particles;
  for(let _pi=_pa.length-1;_pi>=0;_pi--){
    const pt=_pa[_pi];pt.x+=pt.vx*60*dt;pt.y+=pt.vy*60*dt;pt.life-=dt;pt.vy+=.06;
    if(pt.life<=0){ParticlePool.release(pt);_pa[_pi]=_pa[_pa.length-1];_pa.pop();}
  }
  // Float texts — update + pool release
  const _ft=s.floatTexts;
  for(let _fi=_ft.length-1;_fi>=0;_fi--){
    _ft[_fi].life-=dt;_ft[_fi].y-=32*dt;
    if(_ft[_fi].life<=0){FloatPool.release(_ft[_fi]);_ft[_fi]=_ft[_ft.length-1];_ft.pop();}
  }
  // XP orbs — pool release on expiry/pickup (pickup handled inline; expire here)
  // Enemy/bullet pool flush handled inline in their loops above

  // ── BATCHED HUD UPDATE — avoid calling every frame ────────────────
  if(s._hudDirty>=HUD_INTERVAL){
    s._hudDirty=0;
    updateHpHUD();updateKillsHUD();
  }

  // ── CLEAR PER-FRAME FLAGS ─────────────────────────────────────────
  // Reset _critFloatThisFrame on all enemies so crits show again next frame
  for(let _ci=0;_ci<s.enemies.length;_ci++) s.enemies[_ci]._critFloatThisFrame=false;
}

function updateBossAI(s,e,dt){
  const p=s.player,exd=p.x-e.x,eyd=p.y-e.y,ed=Math.sqrt(exd*exd+eyd*eyd)||1;
  // ═══════════════════════════════════════════════════════════
  //  BOSS AI PATTERNS
  // ═══════════════════════════════════════════════════════════

  // ── KING SLIME: charges, shoots globs, splits at 50% ─────────
  if(e.pattern==='charge'){
    if(e.charging){
      e.x+=e.chargeVx*60*dt; e.y+=e.chargeVy*60*dt;
      e.chargeTimer-=dt;
      // Scatter globs mid-charge
      if(Math.random()<dt*4){
        const ra=Math.random()*Math.PI*2;
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ra)*3.5,vy:Math.sin(ra)*3.5,r:8,dmg:20,life:2.0,color:e.color,sourceName:e.name});
      }
      if(e.chargeTimer<=0||e.x<e.r||e.x>W-e.r||e.y<e.r||e.y>H-e.r){
        e.charging=false; e.chargeTimer=e.chargeCooldown*(0.7+Math.random()*0.6);
        // Splat ring on impact
        for(let i=0;i<8;i++){const a=i/8*Math.PI*2;spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,r:7,dmg:18,life:1.8,color:e.color,sourceName:e.name});}
        spawnParticles(s,e.x,e.y,e.color,3); triggerShake(4);
      }
    } else {
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      e.chargeTimer-=dt;
      if(e.chargeTimer<=0){
        e.charging=true; e.chargeTimer=0.9+(Math.random()*0.4);
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        e.chargeVx=Math.cos(ang)*7; e.chargeVy=Math.sin(ang)*7;
        spawnParticles(s,e.x,e.y,e.color,2); addFloat(e.x,e.y,'CHARGE!',e.color);
      }
    }
    e.shootTimer-=dt;
    if(e.shootTimer<=0){ e.shootTimer=e.shootCooldown; fireBoss(s,e,p,5.5,24); }
    // Split at 50%: 2 mini-slimes
    if(!e._slimeSplit&&e.hp/e.maxHp<0.5){
      e._slimeSplit=true;
      for(let i=0;i<2;i++){
        enemyPush(s, EnemyPool.acquire({x:e.x+(i===0?-60:60),y:e.y,r:e.r*0.6,hp:e.maxHp*0.10,maxHp:e.maxHp*0.10,
          speed:e.speed*1.4,dmgPs:e.dmgPs*0.7,color:'#88ffaa',name:'SLIME SPAWN',shape:'circle',
          alpha:1,hitFlash:0,isBoss:true,_isMiniboss:true,xp:Math.floor(e.xp/4),gold:Math.floor(e.gold/4),
          pattern:'charge',charging:false,chargeTimer:1.2,chargeCooldown:1.2,chargeVx:0,chargeVy:0,
          shootCooldown:1.2,shootTimer:0.5,_slimeSplit:true}));
      }
      spawnParticles(s,e.x,e.y,e.color,2); abilityRing(s,e.x,e.y,e.color,80,.4);
      triggerShake(7); addFloat(e.x,e.y,'SPLITS!',e.color);
    }
    // Enrage at 30%: speed up, shoot triple
    if(e.hp/e.maxHp<0.3&&!e._slimeEnrage){ e._slimeEnrage=true; e.speed*=1.5; e.chargeCooldown*=0.6; }
  }

  // ── DEATH STAR: 3-phase orbital weapons platform ─────────────
  // Phase 1 (100–66%): orbits arena, burst rings + tracking laser
  // Phase 2 (66–33%): stops orbiting, sweeping beam + aimed spreads
  // Phase 3 (<33%):   teleports to corners, superlaser cross + spiral hell
  else if(e.pattern==='orbit'){
    const hpPct=e.hp/e.maxHp;
    if(!e._dsPhase)e._dsPhase=1;

    // ── Phase transitions ──────────────────────────────────────
    if(e._dsPhase===1&&hpPct<0.66){
      e._dsPhase=2;
      addFloat(e.x,e.y,'WEAPON SYSTEMS ONLINE','#ff2266');
      triggerShake(10);
      spawnParticles(s,e.x,e.y,e.color,3);
      abilityRing(s,e.x,e.y,'#ff2266',120,.5);
      e._sweepAngle=0; e._sweepDir=1;
    }
    if(e._dsPhase===2&&hpPct<0.33){
      e._dsPhase=3;
      addFloat(e.x,e.y,'⚠ SUPERLASER CHARGED ⚠','#ff0044');
      triggerShake(16);
      spawnParticles(s,e.x,e.y,'#ffffff',3);
      spawnParticles(s,e.x,e.y,e.color,3);
      abilityRing(s,e.x,e.y,'#ff2266',200,.7);
      e._cornerIdx=0; e._cornerTimer=0;
    }

    // ── PHASE 1: orbit + burst rings + homing laser shots ─────
    if(e._dsPhase===1){
      e.orbitAngle=(e.orbitAngle||0)+dt*0.9;
      const ox=W/2+Math.cos(e.orbitAngle)*190, oy=H/2+Math.sin(e.orbitAngle)*190;
      e.x+=(ox-e.x)*dt*4; e.y+=(oy-e.y)*dt*4;
      // Burst ring every ~2.2s
      e.shootTimer=(e.shootTimer||0)-dt;
      if(e.shootTimer<=0){
        e.shootTimer=2.2;
        const cnt=10;
        for(let i=0;i<cnt;i++){
          const a=i/cnt*Math.PI*2+e.orbitAngle*2;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5,vy:Math.sin(a)*5,r:7,dmg:20,life:2.4,color:e.color,sourceName:e.name});
        }
      }
      // Aimed shots at player every 1.0s
      e._laserTimer=(e._laserTimer||1.0)-dt;
      if(e._laserTimer<=0){
        e._laserTimer=1.0;
        fireBoss(s,e,p,6,24);
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:e.x,y1:e.y,x2:e.x+Math.cos(ang)*320,y2:e.y+Math.sin(ang)*320,color:e.color,w:5,life:.12,maxLife:.12});
      }
    }

    // ── PHASE 2: stop + sweep beam + spread shots ─────────────
    else if(e._dsPhase===2){
      // Drift slowly toward arena centre
      e.x+=(W/2-e.x)*dt*1.2; e.y+=(H/2-e.y)*dt*1.2;
      // Sweeping laser beam that rotates back and forth
      e._sweepAngle=(e._sweepAngle||0)+dt*1.8*e._sweepDir;
      if(Math.abs(e._sweepAngle)>Math.PI*0.8)e._sweepDir*=-1;
      const baseAng=Math.atan2(p.y-e.y,p.x-e.x);
      const sweepAng=baseAng+e._sweepAngle;
      if(!s.laserBeams)s.laserBeams=[];
      s.laserBeams.push({x1:e.x,y1:e.y,x2:e.x+Math.cos(sweepAng)*440,y2:e.y+Math.sin(sweepAng)*440,color:'#ff4488',w:8,life:.05,maxLife:.05});
      // If sweep beam points near player, damage
      if(Math.abs(e._sweepAngle)<0.18){
        if(!e._sweepHitCd||e._sweepHitCd<=0){
          const bd=Math.hypot(p.x-e.x,p.y-e.y);
          if(bd<440&&!s._adminMode){p.hp-=22;p.immune=0.15;updateHpHUD();}
          e._sweepHitCd=0.12;
        }
      }
      e._sweepHitCd=(e._sweepHitCd||0)-dt;
      // 3-way aimed spread every 1.6s
      e.shootTimer=(e.shootTimer||0)-dt;
      if(e.shootTimer<=0){
        e.shootTimer=1.6;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-1;i<=1;i++){
          const a=ang+i*0.28;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*6.5,vy:Math.sin(a)*6.5,r:7,dmg:22,life:2.2,color:e.color,sourceName:e.name});
        }
        // Outer slow ring every other shot
        if(!e._ringToggle){
          for(let i=0;i<8;i++){const a=i/8*Math.PI*2;spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*3,vy:Math.sin(a)*3,r:8,dmg:18,life:3.0,color:'#ff6699',sourceName:e.name});}
        }
        e._ringToggle=!e._ringToggle;
      }
    }

    // ── PHASE 3: corner teleports + cross superlaser + spiral ─
    else if(e._dsPhase===3){
      e._cornerTimer=(e._cornerTimer||0)-dt;
      if(e._cornerTimer<=0){
        // Teleport to next corner
        const corners=[[80,80],[W-80,80],[W-80,H-80],[80,H-80]];
        e._cornerIdx=(e._cornerIdx+1)%4;
        const [cx,cy]=corners[e._cornerIdx];
        e.x=cx; e.y=cy;
        e._cornerTimer=3.2;
        triggerShake(6);
        spawnParticles(s,e.x,e.y,e.color,2);
        // On teleport: fire 4-arm cross superlaser toward player
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let arm=0;arm<4;arm++){
          const ba=ang+arm*Math.PI/2;
          // Each arm: 3 bullets in a tight spread
          for(let j=-1;j<=1;j++){
            const a=ba+j*0.12;
            spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,r:8,dmg:26,life:2.8,color:'#ff0044',sourceName:e.name});
          }
          if(!s.laserBeams)s.laserBeams=[];
          s.laserBeams.push({x1:e.x,y1:e.y,x2:e.x+Math.cos(ba)*500,y2:e.y+Math.sin(ba)*500,color:'#ff0044',w:10,life:.2,maxLife:.2});
        }
        abilityRing(s,e.x,e.y,'#ff0044',100,.35);
      }
      // Continuous double spiral between teleports
      e._spiralA=(e._spiralA||0)+dt*5.5;
      e._spiralTimer=(e._spiralTimer||0)-dt;
      if(e._spiralTimer<=0){
        e._spiralTimer=0.08;
        for(let i=0;i<2;i++){
          const a=e._spiralA+i*Math.PI;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*4.5,vy:Math.sin(a)*4.5,r:7,dmg:20,life:2.6,color:'#ff6699',sourceName:e.name});
        }
      }
      // Also still fires aimed shots at player
      e._laserTimer=(e._laserTimer||0)-dt;
      if(e._laserTimer<=0){
        e._laserTimer=0.9;
        fireBoss(s,e,p,7,26);
      }
    }
  }

  // ── VOID TITAN: gravity pull, 4-arm cross shots, void collapse phase ─
  else if(e.pattern==='summon'){
    e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
    // Gravity pull — drags player toward it
    if(ed>80){
      const pull=Math.min(1.5, 300/ed) * 0.5;
      p.x+=(e.x-p.x)/ed*pull*60*dt; p.y+=(e.y-p.y)/ed*pull*60*dt;
    }
    // 4-arm cross shots aimed at player
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=0;i<4;i++){
        const a=ang+i*Math.PI/2;
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5,vy:Math.sin(a)*5,r:10,dmg:26,life:2.6,color:e.color,sourceName:e.name});
      }
    }
    // Summon burst every 6s
    e.summonTimer-=dt;
    if(e.summonTimer<=0){
      e.summonTimer=e.summonCooldown;
      for(let i=0;i<4;i++) spawnEnemy(s);
      spawnParticles(s,e.x,e.y,e.color,3); addFloat(e.x,e.y,'SUMMONING!',e.color);
    }
    // VOID COLLAPSE at 50%: snap to centre, ring burst, go faster
    if(!e._voidPhase&&e.hp/e.maxHp<0.5){
      e._voidPhase=true;
      e.x=W/2; e.y=H/2;
      for(let i=0;i<24;i++){const a=i/24*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,r:9,dmg:32,life:2.6,color:e.color,sourceName:e.name});}
      // Outer slower ring
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2+0.26; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*3.5,vy:Math.sin(a)*3.5,r:11,dmg:28,life:3.2,color:'#aa44ff',sourceName:e.name});}
      spawnParticles(s,e.x,e.y,e.color,11); abilityRing(s,e.x,e.y,e.color,200,.7);
      triggerShake(12); addFloat(e.x,e.y,'VOID COLLAPSE!',e.color);
      e.speed*=1.5; e.shootCooldown*=0.6;
    }
  }

  // ── FROST LICH: drifts, fires ice lances + spiral arms, freeze shatter ─
  else if(e.pattern==='frost'){
    e._ft=(e._ft||0)+dt;
    // Slow drifting approach with figure-8 weave
    e.x+=exd/ed*e.speed*60*dt*0.35 + Math.sin(e._ft*0.8)*1.6;
    e.y+=eyd/ed*e.speed*60*dt*0.35 + Math.cos(e._ft*0.55)*1.1;
    e._spiralA=(e._spiralA||0)+dt*1.6;
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      // Triple aimed lance
      for(let i=-1;i<=1;i++) spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.2)*6.5,vy:Math.sin(ang+i*0.2)*6.5,r:7,dmg:22,life:2.6,color:'#88ddff',sourceName:e.name});
      // 2-arm rotating spiral
      for(let i=0;i<2;i++){const a=e._spiralA+i*Math.PI; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,r:9,dmg:16,life:3.2,color:'#44aaff',sourceName:e.name});}
    }
    // Lay ice walls periodically
    e._iceWallTimer=(e._iceWallTimer||2.5)-dt;
    if(e._iceWallTimer<=0){
      e._iceWallTimer=2.2+Math.random()*1.5;
      if(!s.firePatches)s.firePatches=[];
      // Place a line of freeze patches across the player's path
      const wallAng=Math.atan2(p.y-e.y,p.x-e.x)+Math.PI/2; // perpendicular
      for(let i=-3;i<=3;i++){
        s.firePatches.push({x:p.x+Math.cos(wallAng)*i*44,y:p.y+Math.sin(wallAng)*i*44,r:26,life:4.0,maxLife:4.0,dmgPs:0,isFrost:true});
      }
      addFloat(e.x,e.y,'ICE WALL!','#44ccff');
    }
    // FROST SHATTER at 50%: stop, ring + ice field
    if(!e._frostShatter&&e.hp/e.maxHp<0.5){
      e._frostShatter=true;
      // Bullet ring
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,r:8,dmg:26,life:2.8,color:'#aaffff',sourceName:e.name});}
      // Ice field ring around player
      if(!s.firePatches)s.firePatches=[];
      for(let i=0;i<10;i++){const a=i/10*Math.PI*2,d=70+Math.random()*90; s.firePatches.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:32,life:6.0,maxLife:6.0,dmgPs:0,isFrost:true});}
      spawnParticles(s,e.x,e.y,'#aaffff',3); abilityRing(s,e.x,e.y,'#44ccff',160,.75);
      triggerShake(9); addFloat(e.x,e.y,'FROST SHATTER!','#aaffff');
      e.shootCooldown*=0.65; e.speed*=1.3;
    }
  }

  // ── BLOOD MOON: accelerates with rage, spiral + clone, blood rage at 30% ─
  else if(e.pattern==='bloodmoon'){
    const hr=e.hp/e.maxHp;
    // Gets faster as HP falls
    const spd=1+(1-hr)*1.8;
    e.x+=exd/ed*e.speed*spd*60*dt; e.y+=eyd/ed*e.speed*spd*60*dt;
    // Rotating 3-arm spiral + direct aimed shot
    e._bA=(e._bA||0)+dt*3.5;
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown/(1+(1-hr)*0.8);
      fireBoss(s,e,p,5.5+spd,28);
      for(let i=0;i<3;i++){const a=e._bA+i/3*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,r:7,dmg:20,life:2.2,color:'#ff4444',sourceName:e.name});}
    }
    // Spawn blood clones at 65% — they mirror the spiral pattern
    if(!e._clone1&&hr<0.65){
      e._clone1=true;
      for(let i=0;i<2;i++){
        enemyPush(s, EnemyPool.acquire({x:e.x+(i===0?-90:90),y:e.y,r:e.r*0.55,hp:e.maxHp*0.18,maxHp:e.maxHp*0.18,
          speed:e.speed*1.9,dmgPs:e.dmgPs*0.55,color:'#ff6666',name:'BLOOD CLONE',shape:'circle',
          alpha:0.8,hitFlash:0,isBoss:true,_isMiniboss:true,xp:0,gold:0,
          pattern:'bloodmoon',_bA:Math.random()*Math.PI*2,shootTimer:0.8,shootCooldown:0.65,
          _clone1:true,_clone2:true}));
      }
      spawnParticles(s,e.x,e.y,'#cc0000',3); addFloat(e.x,e.y,'BLOOD SPLIT!','#ff4444'); triggerShake(7);
    }
    // BLOOD RAGE at 35%: stop briefly, full-screen ring burst + speed spike
    if(!e._clone2&&hr<0.35){
      e._clone2=true;
      const bc=24;
      for(let i=0;i<bc;i++){const a=i/bc*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,r:8,dmg:28,life:2.4,color:'#ff0000',sourceName:e.name});}
      // Second slower ring
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2+0.26; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,r:9,dmg:22,life:2.8,color:'#880000',sourceName:e.name});}
      spawnParticles(s,e.x,e.y,'#ff0000',2); abilityRing(s,e.x,e.y,'#ff0000',180,.6);
      triggerShake(10); addFloat(e.x,e.y,'BLOOD RAGE!','#ff0000');
      e.speed*=1.4; e.shootCooldown*=0.55;
    }
  }

  // ── SHADOW HYDRA: triple-dash with poison trail, 5-spread shots, splits ─
  else if(e.pattern==='hydra'){
    if(e._dashing){
      e.x+=e._dashVx*60*dt; e.y+=e._dashVy*60*dt;
      // Poison trail during dash
      if(Math.random()<0.3&&!e.hasSplit){
        if(!s.firePatches)s.firePatches=[];
        s.firePatches.push({x:e.x,y:e.y,r:18,life:3.2,maxLife:3.2,dmgPs:16,isAcid:true});
      }
      e._dashTimer-=dt;
      if(e._dashTimer<=0){
        e._dashing=false; e._dashCount=(e._dashCount||0)+1;
        // Fire spread burst at end of each dash
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-2;i<=2;i++) spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.3)*6,vy:Math.sin(ang+i*0.3)*6,r:7,dmg:20,life:2.4,color:'#66ff44',sourceName:e.name});
        e._dashCooldown=e._dashCount<3?0.18:2.5+Math.random()*1.5;
      }
    } else {
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      e._dashCooldown=(e._dashCooldown||2.5)-dt;
      if(e._dashCooldown<=0){
        // Start a new 3-dash combo
        e._dashing=true; e._dashTimer=0.42; e._dashCount=0;
        const ang=Math.atan2(p.y-e.y,p.x-e.x)+(Math.random()-.5)*0.5;
        e._dashVx=Math.cos(ang)*11; e._dashVy=Math.sin(ang)*11;
    }
    // Re-trigger next dash in combo automatically
    if(!e._dashing&&(e._dashCount||0)>0&&(e._dashCount||0)<3&&e._dashCooldown<=0.18){
      e._dashing=true; e._dashTimer=0.40;
      const ang=Math.atan2(p.y-e.y,p.x-e.x)+(Math.random()-.5)*0.4;
      e._dashVx=Math.cos(ang)*11; e._dashVy=Math.sin(ang)*11;
      spawnParticles(s,e.x,e.y,e.color,2);
    }
    // Ranged shots between dashes
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      const sp=e.hasSplit?0.45:0.22;
      for(let i=-2;i<=2;i++) spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*sp)*5.5,vy:Math.sin(ang+i*sp)*5.5,r:7,dmg:20,life:2.5,color:'#66ff44',sourceName:e.name});
    }
    // SPLIT at 50%: two faster heads with different spread
    if(!e.hasSplit&&e.hp/e.maxHp<0.5){
      e.hasSplit=true;
      for(let i=0;i<2;i++){
        const base=JSON.parse(JSON.stringify(e));
        base.r=e.r*0.65; base.hp=e.maxHp*0.38; base.maxHp=e.maxHp*0.38;
        base.x=e.x+(i===0?-75:75); base.y=e.y; base.speed=e.speed*1.7;
        base.hasSplit=true; base._dashCount=0; base._dashing=false; base._dashCooldown=0.6;
        base.name='HYDRA HEAD'; base.xp=Math.floor(e.xp/3); base.gold=Math.floor(e.gold/3);
        base.isBoss=true; base._isMiniboss=true; base.hitFlash=0;
        enemyPush(s, base);
      }
      spawnParticles(s,e.x,e.y,e.color,9); abilityRing(s,e.x,e.y,e.color,100,.45);
      addFloat(e.x,e.y,'SPLITS!',e.color); triggerShake(11);
    }
  }
  } // end hydra

  // ── INFERNAL COLOSSUS: stomp/meteor phases, fire trail charge ─
  else if(e.pattern==='colossus'){
    // Phase system: 'hunt' → 'stomp' → 'meteor' → 'hunt' ...
    e._phase=e._phase||'hunt'; e._phaseTimer=(e._phaseTimer||0)-dt;
    if(e._phase==='hunt'){
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      if(e._phaseTimer<=0){ e._phase='stomp'; e._phaseTimer=5.0; addFloat(e.x,e.y,'STOMP PHASE!','#ff6600'); triggerShake(5); }
    } else if(e._phase==='stomp'){
      // Charge toward player, stomp repeatedly
      e.x+=exd/ed*e.speed*1.4*60*dt; e.y+=eyd/ed*e.speed*1.4*60*dt;
      e.stompTimer-=dt;
      if(e.stompTimer<=0){
        e.stompTimer=e.stompCooldown;
        explodeAt(s,e.x,e.y,130,e.hp/e.maxHp<0.5?70:45);
        for(let i=0;i<10;i++){const a=i/10*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,r:9,dmg:28,life:2.0,color:'#ff6600',sourceName:e.name});}
        spawnParticles(s,e.x,e.y,'#ff6600',3); abilityRing(s,e.x,e.y,'#ff6600',130,.5); triggerShake(7); addFloat(e.x,e.y,'STOMP!','#ff6600');
      }
      if(e._phaseTimer<=0){ e._phase='meteor'; e._phaseTimer=6.0; addFloat(e.x,e.y,'METEOR PHASE!','#ff4400'); }
    } else if(e._phase==='meteor'){
      // Stop moving, rain meteors on player's position
      e._meteorTimer=(e._meteorTimer||0)-dt;
      if(e._meteorTimer<=0){
        e._meteorTimer=0.9+Math.random()*0.6;
        const mx=p.x+(Math.random()-.5)*100, my=p.y+(Math.random()-.5)*100;
        abilityRing(s,mx,my,'#ff4400',52,.85);
        setTimeout(()=>{ if(state&&!state.gameOver){ explodeAt(state,mx,my,52,15); spawnParticles(state,mx,my,'#ff6600',10); triggerShake(4); }},850);
      }
      if(e._phaseTimer<=0){ e._phase='charge'; e._phaseTimer=0; addFloat(e.x,e.y,'INCOMING!','#ffaa00'); }
    } else if(e._phase==='charge'){
      // One big charge with fire trail, then back to hunt
      if(!e._charging){
        e._charging=true; e._chargeTimer=0.8;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        e._cVx=Math.cos(ang)*10; e._cVy=Math.sin(ang)*10;
        spawnParticles(s,e.x,e.y,'#ff6600',2); triggerShake(5);
      }
      e.x+=e._cVx*60*dt; e.y+=e._cVy*60*dt;
      if(Math.random()<0.4){ if(!s.firePatches)s.firePatches=[]; s.firePatches.push({x:e.x,y:e.y,r:28,life:4.0,maxLife:4.0,dmgPs:24}); }
      e._chargeTimer-=dt;
      if(e._chargeTimer<=0||e.x<e.r||e.x>W-e.r||e.y<e.r||e.y>H-e.r){
        e._charging=false; e._phase='hunt'; e._phaseTimer=4.0+Math.random()*2;
      }
    }
    e.shootTimer-=dt; if(e.shootTimer<=0){ e.shootTimer=e.shootCooldown; fireBoss(s,e,p,5.5,10); }
  }

  // ── STORM WITCH: teleport + mines, triple bolts, edge storm at 40% ─
  else if(e.pattern==='stormwitch'){
    e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
    // Teleport — leaves lightning mine, fires cross on arrival
    e.teleportTimer-=dt;
    if(e.teleportTimer<=0){
      e.teleportTimer=e.teleportCooldown*(0.5+Math.random()*0.7);
      spawnParticles(s,e.x,e.y,'#aaff00',3);
      // Mine at old position
      if(!s.firePatches)s.firePatches=[];
      s.firePatches.push({x:e.x,y:e.y,r:32,life:5.0,maxLife:5.0,dmgPs:30,_lightningMine:true});
      spawnParticles(s,e.x,e.y,'#ffff00',2);
      e.x=80+Math.random()*(W-160); e.y=80+Math.random()*(H-160);
      spawnParticles(s,e.x,e.y,'#aaff00',2); abilityRing(s,e.x,e.y,'#aaff00',65,.35);
      addFloat(e.x,e.y,'WARP!','#aaff00');
      // Cross of bolts aimed at player on arrival
      const ta=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=0;i<4;i++){const a=ta+i*Math.PI/2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,r:7,dmg:24,life:2.5,color:'#aaff00',sourceName:e.name});}
    }
    // Aimed triple lightning bolts
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=-1;i<=1;i++) spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.22)*7,vy:Math.sin(ang+i*0.22)*7,r:6,dmg:22,life:2.2,color:'#aaff00',sourceName:e.name});
      if(!s.laserBeams)s.laserBeams=[];
      s.laserBeams.push({x1:e.x,y1:e.y,x2:e.x+Math.cos(ang)*260,y2:e.y+Math.sin(ang)*260,color:'#aaff00',w:4,life:.1,maxLife:.1});
    }
    // SCREEN STORM at <40% HP: 8 bolts converging from edges every 3s
    e.lightningTimer-=dt;
    if(e.lightningTimer<=0){
      if(e.hp/e.maxHp<0.4){
        e.lightningTimer=e.lightningCooldown*0.55;
        for(let i=0;i<8;i++){
          const a=i/8*Math.PI*2;
          const sx=W/2+Math.cos(a)*(W*0.65), sy=H/2+Math.sin(a)*(H*0.65);
          const ta=Math.atan2(p.y-sy,p.x-sx);
          spawnBossBullet_pool(s, {x:sx,y:sy,vx:Math.cos(ta)*9,vy:Math.sin(ta)*9,r:7,dmg:30,life:2.0,color:'#ffff88',sourceName:e.name});
        }
        spawnParticles(s,p.x,p.y,'#ffff00',3); addFloat(e.x,e.y,'STORM!','#aaff00');
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:e.x,y1:e.y,x2:p.x,y2:p.y,color:'#ffff00',w:5,life:.25,maxLife:.25});
      } else {
        e.lightningTimer=e.lightningCooldown;
      }
    }
  }

  // ── PLAGUE LORD: spreading puddles, infection bullets, mega-wave at 50% ─
  else if(e.pattern==='plaguelord'){
    e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
    // Drop plague puddles while moving
    e.plagueTimer-=dt;
    if(e.plagueTimer<=0){
      e.plagueTimer=e.plagueCooldown;
      if(!s.firePatches)s.firePatches=[];
      for(let i=0;i<3;i++){
        const a=Math.random()*Math.PI*2, d=15+Math.random()*55;
        s.firePatches.push({x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d,r:30,life:5.5,maxLife:5.5,dmgPs:22,isAcid:true});
      }
      spawnParticles(s,e.x,e.y,'#44ff44',3);
    }
    // MEGA WAVE at 50%: 8 buffed horde + speed boost
    if(!e._plagueWave&&e.hp/e.maxHp<0.5){
      e._plagueWave=true;
      const hpS=1+(s.wave-1)*0.35;
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;
        const t=ENEMY_TYPES[0];
        enemyPush(s, EnemyPool.acquire({x:e.x+Math.cos(a)*85,y:e.y+Math.sin(a)*85,r:t.r,hp:t.hp*hpS*1.6,maxHp:t.hp*hpS*1.6,speed:t.speed*1.5,dmgPs:t.dmgPs*1.3,xp:4,gold:2,color:'#88ff44',name:'PLAGUE HORDE',shape:'circle',alpha:1,hitFlash:0,isBoss:false}));
      }
      spawnParticles(s,e.x,e.y,'#44ff44',11); abilityRing(s,e.x,e.y,'#44ff44',170,.65);
      triggerShake(11); addFloat(e.x,e.y,'PLAGUE WAVE!','#44ff44');
      e.speed*=1.35; e.plagueCooldown*=0.55;
    }
    // Infection triple shots (leave acid patches on hit via bossBullets acid flag)
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=-1;i<=1;i++){
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.28)*5.5,vy:Math.sin(ang+i*0.28)*5.5,r:9,dmg:22,life:2.6,color:'#44ff44',sourceName:e.name,
          _plagueBullet:true}); // handled in bullet hit logic
      }
    }
    // Regular small minion trickle
    e.minionTimer-=dt;
    if(e.minionTimer<=0){
      e.minionTimer=e.minionCooldown;
      const t=ENEMY_TYPES[0]; const hpS=1+(s.wave-1)*0.35;
      for(let i=0;i<2;i++){
        const a=i/2*Math.PI*2;
        enemyPush(s, EnemyPool.acquire({x:e.x+Math.cos(a)*65,y:e.y+Math.sin(a)*65,r:t.r,hp:t.hp*hpS,maxHp:t.hp*hpS,speed:t.speed*(1+(s.wave-1)*0.1),dmgPs:t.dmgPs,xp:2,gold:1,color:'#aa44ff',name:'PLAGUE SPAWN',shape:'circle',alpha:1,hitFlash:0,isBoss:false}));
      }
    }
  }

  // ── TITAN WORM: burrows, erupts near player, surface volley ──────
  else if(e.pattern==='titanworm'){
    // Segment trail: record head position history at fixed intervals
    if(!e._segments) e._segments=[];
    if(!e._segTimer) e._segTimer=0;
    e._segTimer-=dt;
    if(e._segTimer<=0){
      e._segTimer=0.045; // sample ~22/sec → smooth trail
      e._segments.unshift({x:e.x,y:e.y,burrowed:!!e.isBurrowed});
      if(e._segments.length>18) e._segments.length=18;
    }
    if(e.isBurrowed){
      // Underground — silently track player
      e.burrowedTimer-=dt;
      e.x+=exd/ed*e.speed*2.0*60*dt; e.y+=eyd/ed*e.speed*2.0*60*dt;
      e.eruptTimer=(e.eruptTimer||0)-dt;
      if(e.eruptTimer<=0||e.burrowedTimer<=0){
        // ERUPT just outside player
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        e.x=p.x-Math.cos(ang)*(e.r+p.r+22); e.y=p.y-Math.sin(ang)*(e.r+p.r+22);
        e.x=Math.max(e.r,Math.min(W-e.r,e.x)); e.y=Math.max(e.r,Math.min(H-e.r,e.y));
        e.isBurrowed=false;
        e.burrowTimer=e.burrowCooldown*(0.75+Math.random()*0.5);
        explodeAt(s,e.x,e.y,130,55);
        // Ring of dirt shots
        const rc=e.hp/e.maxHp<0.4?14:10;
        for(let i=0;i<rc;i++){const a=i/rc*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,r:9,dmg:34,life:2.2,color:'#aa6600',sourceName:e.name});}
        spawnParticles(s,e.x,e.y,'#aa6600',2); spawnParticles(s,e.x,e.y,'#ffcc00',3);
        abilityRing(s,e.x,e.y,'#aa6600',130,.5); triggerShake(10);
        addFloat(e.x,e.y,'ERUPTION!','#ff8800');
      }
    } else {
      // Surface — chase and shoot, then burrow
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=e.shootCooldown;
        fireBoss(s,e,p,5.5,36);
        // At 50% also fire spread
        if(e.hp/e.maxHp<0.5){
          const ang=Math.atan2(p.y-e.y,p.x-e.x);
          for(let i=-1;i<=1;i+=2) spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.3)*5,vy:Math.sin(ang+i*0.3)*5,r:8,dmg:26,life:2.4,color:'#cc8800',sourceName:e.name});
        }
      }
      e.burrowTimer-=dt;
      if(e.burrowTimer<=0){
        e.isBurrowed=true; e.burrowedTimer=1.6; e.eruptTimer=1.6;
        spawnParticles(s,e.x,e.y,'#aa6600',5); addFloat(e.x,e.y,'BURROWING!','#aa6600');
      }
    }
  } // end titanworm

  // ── MIRROR KNIGHT: parry shield + riposte, punishes sustained fire ──────
  // Shield raises for 1.2s every 3s. While raised, incoming bullets are absorbed
  // and on shield-drop fires them ALL back in a ring plus a aimed riposte lance.
  // Between shields: dashes at player + aimed triple-shot.
  else if(e.pattern==='mirrorknight'){
    const hr=e.hp/e.maxHp;
    e._mkShieldCd=(e._mkShieldCd===undefined?2.0:e._mkShieldCd)-dt;
    e._mkShieldUp=(e._mkShieldUp||false);
    e._mkAbsorbed=(e._mkAbsorbed||0);

    if(!e._mkShieldUp){
      // Chase player
      e.x+=exd/ed*e.speed*60*dt;
      e.y+=eyd/ed*e.speed*60*dt;
      // Triple aimed shots
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=e.shootCooldown*(0.7+hr*0.5);
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-1;i<=1;i++)
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.24)*7,vy:Math.sin(ang+i*0.24)*7,r:7,dmg:24,life:2.4,color:'#88ccff',sourceName:e.name});
      }
      // Dash toward player every 3.5s (leaves mirror shards)
      e._mkDashCd=(e._mkDashCd===undefined?3.5:e._mkDashCd)-dt;
      if(e._mkDashCd<=0){
        e._mkDashCd=3.5-hr*1.2;
        e._mkDashing=true; e._mkDashT=0.38;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        e._mkDvx=Math.cos(ang)*13; e._mkDvy=Math.sin(ang)*13;
        spawnParticles(s,e.x,e.y,'#c0e8ff',2);
      }
      if(e._mkDashing){
        e.x+=e._mkDvx*60*dt; e.y+=e._mkDvy*60*dt;
        e._mkDashT-=dt;
        if(e._mkDashT<=0){ e._mkDashing=false; spawnParticles(s,e.x,e.y,'#c0e8ff',2); }
      }
      // Raise shield
      if(e._mkShieldCd<=0){
        e._mkShieldUp=true; e._mkShieldT=1.2+hr*0.4; e._mkAbsorbed=0;
        addFloat(e.x,e.y,'PARRY!','#c0e8ff'); triggerShake(4);
        abilityRing(s,e.x,e.y,'#c0e8ff',e.r+12,.3);
      }
    } else {
      // Shield is up — stop moving, face player
      e._mkShieldT-=dt;
      // Absorb any player bullets that hit (handled below via _mkShieldUp flag read in bullet collision)
      if(e._mkShieldT<=0){
        e._mkShieldUp=false; e._mkShieldCd=2.8-hr*0.8;
        // RIPOSTE: fire absorbed count as extra ring bullets + aimed lance
        const reflectCount=Math.max(6, Math.min(16, e._mkAbsorbed*2+6));
        for(let i=0;i<reflectCount;i++){
          const a=i/reflectCount*Math.PI*2;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7.5,vy:Math.sin(a)*7.5,r:8,dmg:26,life:2.2,color:'#ffffff',sourceName:e.name});
        }
        // Aimed lance
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-1;i<=1;i++)
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.15)*9,vy:Math.sin(ang+i*0.15)*9,r:9,dmg:30,life:2.0,color:'#c0e8ff',sourceName:e.name});
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:e.x,y1:e.y,x2:e.x+Math.cos(ang)*400,y2:e.y+Math.sin(ang)*400,color:'#ffffff',w:6,life:.18,maxLife:.18});
        spawnParticles(s,e.x,e.y,'#ffffff',2); triggerShake(6);
        addFloat(e.x,e.y,'RIPOSTE!','#ffffff');
      }
    }
    // Store shield state for bullet collision (read in updateBullets)
    e._shieldActive=e._mkShieldUp;
    // Phase 2 at 50%: shield raises faster, riposte adds spiral burst
    if(!e._mkPhase2&&hr<0.5){
      e._mkPhase2=true;
      e.speed*=1.35; e.shootCooldown*=0.7;
      addFloat(e.x,e.y,'MIRROR SHATTER!','#c0e8ff'); triggerShake(10);
      // Shatter burst ring
      for(let i=0;i<20;i++){const a=i/20*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,r:7,dmg:22,life:2.5,color:'#c0e8ff',sourceName:e.name});}
      spawnParticles(s,e.x,e.y,'#ffffff',3); abilityRing(s,e.x,e.y,'#c0e8ff',160,.7);
    }
  }

  // ── NETHER ARCHITECT: constructs fire-wall cages, methodical zone denial ──
  // Pattern: IDLE drift → BUILD (place geometric fire wall) → SHOOT burst → repeat
  // At 66%: walls become larger + acid. At 33%: adds converging cross walls on player.
  else if(e.pattern==='architect'){
    e._naPhase=e._naPhase||'drift'; e._naPhaseT=(e._naPhaseT===undefined?2.0:e._naPhaseT)-dt;
    if(!s.firePatches)s.firePatches=[];

    if(e._naPhase==='drift'){
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=e.shootCooldown;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-1;i<=1;i++)
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.3)*6,vy:Math.sin(ang+i*0.3)*6,r:7,dmg:22,life:2.4,color:'#ff8844',sourceName:e.name});
      }
      if(e._naPhaseT<=0){ e._naPhase='build'; e._naPhaseT=0.5; addFloat(e.x,e.y,'CONSTRUCTING...','#ff8844'); }
    } else if(e._naPhase==='build'){
      // Stop and build a wall pattern around the player
      if(e._naPhaseT<=0){
        const hr=e.hp/e.maxHp;
        const isAcid=hr<0.66; const isCross=hr<0.33;
        const wallLife=5.5; const patchR=isAcid?32:28; const dmgPs=isAcid?20:0;
        // Circle of fire around player (ring cage)
        const count=10+Math.floor((1-hr)*8);
        const ringR=100+Math.random()*60;
        for(let i=0;i<count;i++){
          const a=i/count*Math.PI*2;
          s.firePatches.push({x:p.x+Math.cos(a)*ringR,y:p.y+Math.sin(a)*ringR,r:patchR,life:wallLife,maxLife:wallLife,dmgPs,isAcid});
        }
        // Cross walls through the arena
        const wallAng=Math.random()*Math.PI;
        for(let i=-5;i<=5;i++){
          s.firePatches.push({x:e.x+Math.cos(wallAng)*i*50,y:e.y+Math.sin(wallAng)*i*50,r:patchR,life:wallLife,maxLife:wallLife,dmgPs,isAcid});
        }
        if(isCross){
          // Second perpendicular wall aimed at player
          const ca=Math.atan2(p.y-e.y,p.x-e.x);
          for(let i=-4;i<=4;i++){
            s.firePatches.push({x:p.x+Math.cos(ca+Math.PI/2)*i*48,y:p.y+Math.sin(ca+Math.PI/2)*i*48,r:patchR+4,life:wallLife,maxLife:wallLife,dmgPs:dmgPs+8,isAcid:true});
          }
        }
        spawnParticles(s,e.x,e.y,'#ff8844',3); triggerShake(5);
        e._naPhase='burst'; e._naPhaseT=1.8+Math.random();
      }
    } else if(e._naPhase==='burst'){
      // Burst shoot while stationary
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=0.22;
        e._naBurstCount=(e._naBurstCount||0)+1;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang)*7.5,vy:Math.sin(ang)*7.5,r:7,dmg:20,life:2.2,color:'#ffaa66',sourceName:e.name});
      }
      if(e._naPhaseT<=0){ e._naBurstCount=0; e._naPhase='drift'; e._naPhaseT=2.5+Math.random()*1.5; }
    }
  }

  // ── TWIN SERPENTS: two linked serpents sharing an HP pool ───────────────
  // The boss entry is the ALPHA serpent. On spawn it creates a BETA companion.
  // Beta orbits wide of the player and intercepts bullets (like a moving shield).
  // If either dies before the other hits 30%: survivor ENRAGES (2× speed, 0.4× cooldown).
  else if(e.pattern==='serpent'){
    // Spawn beta companion on first tick
    if(!e._betaSpawned){
      e._betaSpawned=true;
      e._betaId=Date.now();
      const beta={
        x:e.x+120,y:e.y,r:e.r*0.85,hp:e.hp*0.5,maxHp:e.maxHp*0.5,
        speed:e.speed*1.2,dmgPs:e.dmgPs*0.8,color:'#ff44cc',name:'BETA SERPENT',
        shape:'circle',alpha:0.9,hitFlash:0,isBoss:true,_isMiniboss:true,
        xp:Math.floor(e.xp/3),gold:Math.floor(e.gold/3),
        pattern:'serpent_beta',shootCooldown:0.8,shootTimer:0.5,
        _alphaRef:e,_betaId:e._betaId,_betaOrbitAngle:0,
      };
      enemyPush(s, beta);
      e._betaRef=beta;
      addFloat(e.x,e.y,'TWIN SERPENTS!','#44ffcc'); triggerShake(8);
      abilityRing(s,e.x,e.y,'#44ffcc',160,.6);
    }
    // Alpha: aggressive chaser — 5-way spread + dash combo
    e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown*(0.6+e.hp/e.maxHp*0.6);
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=-2;i<=2;i++)
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.22)*6.5,vy:Math.sin(ang+i*0.22)*6.5,r:7,dmg:22,life:2.3,color:'#44ffcc',sourceName:e.name});
    }
    // Quick dash every 4s
    e._sDashCd=(e._sDashCd===undefined?4.0:e._sDashCd)-dt;
    if(e._sDashCd<=0){
      e._sDashCd=4.0; e._sDashing=true; e._sDashT=0.35;
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      e._sDvx=Math.cos(ang)*12; e._sDvy=Math.sin(ang)*12;
      spawnParticles(s,e.x,e.y,'#44ffcc',2);
    }
    if(e._sDashing){ e.x+=e._sDvx*60*dt; e.y+=e._sDvy*60*dt; e._sDashT-=dt; if(e._sDashT<=0)e._sDashing=false; }
    // Enrage if beta is dead and alpha > 30% HP
    if(!e._enraged&&e._betaRef&&e._betaRef.hp<=0&&e.hp/e.maxHp>0.3){
      e._enraged=true; e.speed*=2.0; e.shootCooldown*=0.35;
      e.color='#ff2200'; addFloat(e.x,e.y,'SERPENT RAGE!','#ff2200'); triggerShake(14);
      abilityRing(s,e.x,e.y,'#ff2200',200,.8);
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2; spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*8,vy:Math.sin(a)*8,r:8,dmg:28,life:2.5,color:'#ff2200',sourceName:e.name});}
    }
    // Sync HP: alpha and beta share damage pool (beta takes alpha's hits proportionally)
    if(e._betaRef&&e._betaRef.hp>0){
      e._betaRef.hp=e._betaRef.maxHp*(e.hp/e.maxHp);
    }
  }

  // ── SERPENT BETA: orbits defensively, intercepts bullets by moving into them ─
  else if(e.pattern==='serpent_beta'){
    const alpha=e._alphaRef;
    if(!alpha||alpha.hp<=0){ e.hp=0; } // die with alpha
    e._betaOrbitAngle=(e._betaOrbitAngle||0)+dt*1.1;
    // Orbit a shifting point between alpha and player
    const midX=(alpha?alpha.x:p.x)/2+p.x/2, midY=(alpha?alpha.y:p.y)/2+p.y/2;
    const orbitR=160+Math.sin(e._betaOrbitAngle*0.4)*40;
    const tx=midX+Math.cos(e._betaOrbitAngle)*orbitR;
    const ty=midY+Math.sin(e._betaOrbitAngle)*orbitR;
    e.x+=(tx-e.x)*dt*3.5; e.y+=(ty-e.y)*dt*3.5;
    // Shoots spiral behind player to cut off retreat
    e.shootTimer-=dt;
    if(e.shootTimer<=0){
      e.shootTimer=e.shootCooldown;
      // Behind-player aimed shot
      const ang=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=-1;i<=1;i++)
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.35)*5.5,vy:Math.sin(ang+i*0.35)*5.5,r:7,dmg:18,life:2.5,color:'#ff44cc',sourceName:e.name});
    }
    // Enrage if alpha is dead
    if(!e._enraged&&alpha&&alpha.hp<=0&&e.hp/e.maxHp>0.3){
      e._enraged=true; e.speed*=2.0; e.shootCooldown*=0.35;
      e.color='#ff0088'; addFloat(e.x,e.y,'SERPENT RAGE!','#ff0088'); triggerShake(14);
      abilityRing(s,e.x,e.y,'#ff0088',200,.8);
    }
  }

  // ── THE RECURSION: fractal splitter, floods arena with smaller copies ────
  // Depth 0 (boss): large, slow, high HP, fires 4-way aimed spirals
  // On death at depth 0 → 2× depth-1 halves (faster, smaller)
  // On death at depth 1 → 2× depth-2 quarters (very fast, tiny)
  // Depth-2 fragments: fast zigzag, contact damage only — no further splits
  else if(e.pattern==='recursion'){
    const depth=e._recurseDepth||0;
    const hr=e.hp/e.maxHp;
    // Movement: depth-0 drifts with weave; depth-1 chases; depth-2 zigzags
    if(depth===0){
      e._rft=(e._rft||0)+dt;
      e.x+=exd/ed*e.speed*60*dt*0.5+Math.sin(e._rft*0.9)*1.8;
      e.y+=eyd/ed*e.speed*60*dt*0.5+Math.cos(e._rft*0.65)*1.2;
    } else if(depth===1){
      e.x+=exd/ed*e.speed*60*dt;
      e.y+=eyd/ed*e.speed*60*dt;
    } else {
      // Zigzag: bounce off walls
      if(!e._rzvx){const a=Math.atan2(p.y-e.y,p.x-e.x)+(Math.random()-.5)*1.2;e._rzvx=Math.cos(a)*e.speed*60;e._rzvy=Math.sin(a)*e.speed*60;}
      e.x+=e._rzvx*dt; e.y+=e._rzvy*dt;
      if(e.x<e.r||e.x>W-e.r){e._rzvx*=-1;e.x=Math.max(e.r,Math.min(W-e.r,e.x));}
      if(e.y<e.r||e.y>H-e.r){e._rzvy*=-1;e.y=Math.max(e.r,Math.min(H-e.r,e.y));}
    }
    // Shooting: spiral spread for depth 0-1, none for depth 2
    if(depth<2){
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=e.shootCooldown*(0.5+hr*0.7)*(1+depth*0.3);
        e._rSA=(e._rSA||0)+0.42;
        const arms=4-depth;
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=0;i<arms;i++){
          const a=e._rSA+i/arms*Math.PI*2;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,r:7-depth,dmg:20-depth*4,life:2.4,color:e.color,sourceName:e.name});
        }
        // Also direct aimed shot at player
        spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang)*7,vy:Math.sin(ang)*7,r:7,dmg:22,life:2.0,color:e.color,sourceName:e.name});
      }
    }
    // SPLIT at 50% for depth 0, instant-split-on-death handled in death code below
    if(depth===0&&!e._rSplit&&hr<0.5){
      e._rSplit=true;
      addFloat(e.x,e.y,'RECURSION SPLIT!','#ee44ff'); triggerShake(10);
      abilityRing(s,e.x,e.y,'#ee44ff',140,.55);
      // Spawn 2 depth-1 halves immediately
      for(let i=0;i<2;i++){
        enemyPush(s, EnemyPool.acquire({
          x:e.x+(i===0?-70:70),y:e.y,
          r:Math.round(e.r*0.65),hp:e.maxHp*0.28,maxHp:e.maxHp*0.28,
          speed:e.speed*1.6,dmgPs:e.dmgPs*0.7,color:'#dd22ff',
          name:'RECURSION ½',shape:'circle',alpha:0.9,hitFlash:0,
          isBoss:true,_isMiniboss:true,xp:Math.floor(e.xp/4),gold:Math.floor(e.gold/4),
          pattern:'recursion',shootCooldown:e.shootCooldown*0.85,shootTimer:0.4,
          _recurseDepth:1,_rSA:Math.random()*Math.PI*2
        }));
      }
      spawnParticles(s,e.x,e.y,'#ee44ff',2);
    }
    // On depth-1 death: spawn 2 tiny depth-2 fragments (handled in kill code)
    if(depth===1&&e.hp<=0&&!e._rFragSpawned){
      e._rFragSpawned=true;
      for(let i=0;i<2;i++){
        enemyPush(s, EnemyPool.acquire({
          x:e.x+(i===0?-40:40),y:e.y,
          r:14,hp:e.maxHp*0.3,maxHp:e.maxHp*0.3,
          speed:e.speed*1.8,dmgPs:e.dmgPs*0.8,color:'#cc00ff',
          name:'RECURSION ¼',shape:'diamond',alpha:0.85,hitFlash:0,
          isBoss:true,_isMiniboss:true,xp:Math.floor(e.xp/3),gold:Math.floor(e.gold/3),
          pattern:'recursion',shootCooldown:1.2,shootTimer:0,
          _recurseDepth:2,_rzvx:null,_rzvy:null
        }));
      }
    }
  }

  // ── OMEGA CORE: 3-phase ultimate boss ───────────────────────────────────
  // Phase 1 (100-66%): GRAVITY WELL — pulls player + orbiting bullet satellites
  // Phase 2 (66-33%): ORBITAL CANNON — 4 rotating laser cannons fire timed bursts
  // Phase 3 (<33%):   BERSERKER OVERLOAD — massive speed + bullet storm + nova loop
  else if(e.pattern==='omegacore'){
    const hr=e.hp/e.maxHp;
    if(!e._ocPhase)e._ocPhase=1;

    // Phase transitions
    if(e._ocPhase===1&&hr<0.66){
      e._ocPhase=2;
      addFloat(e.x,e.y,'ORBITAL CANNONS ONLINE','#ffaa00'); triggerShake(14);
      spawnParticles(s,e.x,e.y,'#ffffff',4); abilityRing(s,e.x,e.y,'#ffaa00',180,.7);
      e._ocOrbitAngle=0;
      // Cancel all gravity pull
      e._ocGravity=false;
    }
    if(e._ocPhase===2&&hr<0.33){
      e._ocPhase=3;
      addFloat(e.x,e.y,'⚠ OVERLOAD ⚠','#ff2200'); triggerShake(18);
      spawnParticles(s,e.x,e.y,'#ff4400',5); abilityRing(s,e.x,e.y,'#ff2200',220,.9);
      e.speed*=2.8; e.color='#ff4400';
      if(!s.laserBeams)s.laserBeams=[];
    }

    if(e._ocPhase===1){
      // Slow drift toward centre
      e.x+=(W/2-e.x)*dt*0.8; e.y+=(H/2-e.y)*dt*0.8;
      // Gravity: pull player toward boss
      const pull=Math.min(2.2, 280/Math.max(ed,1)) * 0.7;
      p.x+=(e.x-p.x)/Math.max(ed,1)*pull*60*dt;
      p.y+=(e.y-p.y)/Math.max(ed,1)*pull*60*dt;
      // Orbiting satellite bullets (6 that rotate around boss)
      e._ocSatA=(e._ocSatA||0)+dt*1.4;
      e._ocSatTimer=(e._ocSatTimer||0)-dt;
      if(e._ocSatTimer<=0){
        e._ocSatTimer=0.55;
        for(let i=0;i<6;i++){
          const a=e._ocSatA+i/6*Math.PI*2;
          const sx=e.x+Math.cos(a)*90, sy=e.y+Math.sin(a)*90;
          const outAng=Math.atan2(sy-e.y,sx-e.x);
          spawnBossBullet_pool(s, {x:sx,y:sy,vx:Math.cos(outAng)*4.5,vy:Math.sin(outAng)*4.5,r:8,dmg:22,life:2.8,color:'#aaaaff',sourceName:e.name});
        }
      }
      // Direct aimed shots
      e.shootTimer-=dt;
      if(e.shootTimer<=0){
        e.shootTimer=0.9; fireBoss(s,e,p,6,26);
      }
    }
    else if(e._ocPhase===2){
      // Slow movement
      e.x+=exd/ed*e.speed*60*dt*0.5; e.y+=eyd/ed*e.speed*60*dt*0.5;
      // 4 rotating orbital cannons fire in sequence
      e._ocOrbitAngle=(e._ocOrbitAngle||0)+dt*1.1;
      e._ocCannonTimer=(e._ocCannonTimer||0)-dt;
      if(e._ocCannonTimer<=0){
        e._ocCannonTimer=0.35;
        e._ocCannonIdx=(e._ocCannonIdx||0);
        const cannonAng=e._ocOrbitAngle+e._ocCannonIdx/4*Math.PI*2;
        const cx=e.x+Math.cos(cannonAng)*80, cy=e.y+Math.sin(cannonAng)*80;
        // Fire 3 bullets in a tight burst from this cannon
        const aimAng=Math.atan2(p.y-cy,p.x-cx);
        for(let j=-1;j<=1;j++)
          spawnBossBullet_pool(s, {x:cx,y:cy,vx:Math.cos(aimAng+j*0.18)*8,vy:Math.sin(aimAng+j*0.18)*8,r:7,dmg:24,life:2.2,color:'#ffaa00',sourceName:e.name});
        // Laser flash from cannon to edge
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:cx,y1:cy,x2:cx+Math.cos(cannonAng)*380,y2:cy+Math.sin(cannonAng)*380,color:'#ffdd44',w:4,life:.1,maxLife:.1});
        e._ocCannonIdx=(e._ocCannonIdx+1)%4;
      }
      // Slow aimed shot from centre
      e.shootTimer-=dt;
      if(e.shootTimer<=0){ e.shootTimer=1.2; fireBoss(s,e,p,5,22); }
    }
    else if(e._ocPhase===3){
      // Aggressive chase
      e.x+=exd/ed*e.speed*60*dt; e.y+=eyd/ed*e.speed*60*dt;
      // Rapid double spiral
      e._ocSpA=(e._ocSpA||0)+dt*7;
      e._ocSpTimer=(e._ocSpTimer||0)-dt;
      if(e._ocSpTimer<=0){
        e._ocSpTimer=0.07;
        for(let i=0;i<3;i++){
          const a=e._ocSpA+i/3*Math.PI*2;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*5,vy:Math.sin(a)*5,r:7,dmg:20,life:2.4,color:'#ff4400',sourceName:e.name});
        }
      }
      // Nova burst every 2.5s
      e._ocNovaTimer=(e._ocNovaTimer===undefined?2.5:e._ocNovaTimer)-dt;
      if(e._ocNovaTimer<=0){
        e._ocNovaTimer=2.5;
        const cnt=20;
        for(let i=0;i<cnt;i++){
          const a=i/cnt*Math.PI*2;
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(a)*7,vy:Math.sin(a)*7,r:8,dmg:28,life:2.2,color:'#ff2200',sourceName:e.name});
        }
        abilityRing(s,e.x,e.y,'#ff2200',120,.4); triggerShake(8);
        addFloat(e.x,e.y,'NOVA!','#ff2200');
        // Aimed burst at player
        const ang=Math.atan2(p.y-e.y,p.x-e.x);
        for(let i=-2;i<=2;i++)
          spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang+i*0.2)*9,vy:Math.sin(ang+i*0.2)*9,r:8,dmg:30,life:1.8,color:'#ffaa00',sourceName:e.name});
      }
      // Aimed shots between novas
      e.shootTimer-=dt;
      if(e.shootTimer<=0){ e.shootTimer=0.3; fireBoss(s,e,p,8,22); }
    }
  }


  // Boss enrage flash at 30% HP
  if(e.isBoss&&!e._enrageShown&&e.hp/e.maxHp<0.3){
    e._enrageShown=true;
    addFloat(e.x,e.y,'⚠ ENRAGED! ⚠',e.color);
    spawnParticles(state,e.x,e.y,e.color,6);triggerShake(8);
    const af=document.getElementById('ability-flash');
    if(af){af.style.background=`${e.color}33`;af.classList.remove('active');void af.offsetWidth;af.classList.add('active');}
  }
}


// ── MELEE MULTI-SWING HELPERS ───────────────────────────────────────
// Groups enemies in reach by angle sector and returns [{ang, enemies[]}]
function getMeleeGroups(p, enemies, reach, sectorSize) {
  const groups = [];
  const inRange = enemies.filter(e => Math.hypot(e.x-p.x,e.y-p.y) < reach+e.r);
  if(!inRange.length) return groups;
  // Build angle buckets
  const buckets = {};
  for(const e of inRange){
    const ang = Math.atan2(e.y-p.y, e.x-p.x);
    const key = Math.round(ang / sectorSize);
    if(!buckets[key]) buckets[key] = {ang: key*sectorSize, enemies:[]};
    buckets[key].enemies.push(e);
  }
  return Object.values(buckets);
}

// Fires one swing arc group and schedules staggered follow-ups if >1 group
function doMeleeSwings(s, p, groups, opts){
  // opts: {reach, dmg, arcHalf, color, life, staggerMs, dmgFalloff}
  const {reach, dmg, arcHalf, color, life=0.18, staggerMs=80, dmgFalloff=0.8} = opts;
  if(!s.meleeSwings) s.meleeSwings=[];
  groups.forEach((g, idx) => {
    const delay = idx * staggerMs / 1000;
    const hitDmg = dmg * Math.pow(dmgFalloff, idx);
    if(delay === 0){
      _strikeGroup(s, p, g, {reach, dmg:hitDmg, arcHalf, color, life});
    } else {
      // Stagger via a pending swing list processed in update
      if(!s._pendingSwings) s._pendingSwings=[];
      s._pendingSwings.push({delay, g, reach, dmg:hitDmg, arcHalf, color, life, _t:0});
    }
  });
}

function _strikeGroup(s, p, g, opts){
  const {reach, dmg, arcHalf, color, life} = opts;
  if(!s.meleeSwings) s.meleeSwings=[];
  // Hit all enemies in this angular group
  for(const e of g.enemies){
    e.hp -= dmg; e.hitFlash=1; s.totalDamageDealt += dmg;
    applyMeleeEffects(s, p, e, dmg);
    spawnParticles(s, e.x, e.y, color, 5,2);
    addFloat(e.x, e.y, `-${fmtBig(dmg)}`, color);
  }
  s.meleeSwings.push({x:p.x, y:p.y, ang:g.ang, arcHalf, r:reach, life, maxLife:life, color});
}

function applyMeleeEffects(s,p,e,dmg){
  if(!e||e.isBoss)return;
  if(p._meleeBleed){
    const bleedLv=p._bleedLevel||1;
    const bleedDur=[0,4,6,6,6,6][Math.min(5,bleedLv)];
    const bleedMax=[0,1,1,3,5,8][Math.min(5,bleedLv)];
    const bleedStacks=Math.min(bleedMax,(e._bleedStacks||0)+1);
    e._bleedStacks=bleedStacks;
    e._bleeding=true;e._bleedTimer=bleedDur;
    e._bleedDmg=p.damage*0.18*bleedStacks;
    // Level 4+: spread bleed to nearby enemies
    if(bleedLv>=4){for(const ne of s.enemies){if(ne!==e&&Math.hypot(ne.x-e.x,ne.y-e.y)<80&&!ne._bleeding){ne._bleeding=true;ne._bleedTimer=bleedDur*0.5;ne._bleedDmg=p.damage*0.18;ne._bleedStacks=1;}}}
  }
  if(p._meleeStun&&!e._stunned){
    const dur=p._stunDur||0.6;
    e._stunned=true;e._stunTimer=dur;if(!e._frozenSpeed)e._frozenSpeed=e.speed;e.speed=0;
    spawnParticles(s,e.x,e.y,'#ffff00',2);addFloat(e.x,e.y,'STUNNED!','#ffff00');
  }
  // WHIP CRACK: melee crit
  if(p._meleeCrit&&Math.random()<(p._meleeCritChance||0.15)){
    const cd=dmg*1.5;e.hp-=cd;e.hitFlash=1;s.totalDamageDealt+=cd;
    spawnParticles(s,e.x,e.y,'#ffffff',2);addFloat(e.x,e.y,'CRIT!','#ffffff');
  }
  // SHOCKWAVE: every Nth swing emits an AoE wave
  if(p._shockwave){
    p._shockSwingCount=(p._shockSwingCount||0)+1;
    const every=p._shockLevel>=2?2:3;
    if(p._shockSwingCount>=every){
      p._shockSwingCount=0;
      const shockR=80+(p._shockLevel||1)*20;
      const shockDmg=dmg*0.6*(p._shockLevel>=4?1.5:1.0);
      for(const se of s.enemies){
        const sd=Math.hypot(se.x-p.x,se.y-p.y);
        if(sd<shockR){
          se.hp-=shockDmg;se.hitFlash=1;s.totalDamageDealt+=shockDmg;
          if(p._shockKnock){const a=Math.atan2(se.y-p.y,se.x-p.x);se.x+=Math.cos(a)*60;se.y+=Math.sin(a)*60;}
          if(p._shockLevel>=4&&!se._stunned){se._stunned=true;se._stunTimer=0.5;if(!se._frozenSpeed)se._frozenSpeed=se.speed;se.speed=0;}
        }
      }
      spawnParticles(s,p.x,p.y,'#88ddff',2);
      spawnParticle_pool(s, {x:p.x,y:p.y,vx:0,vy:0,color:'#88ddff',r:shockR,life:.3,isRing:true});
    }
  }
  if(p._meleeIgnite){
    const igniteDmg=p._igniteBonus?(dmg*0.20):(dmg*0.14);
    if(!e._onFire){e._onFire=true;e._fireTimer=3.5+(p._fireLevel||0)*0.5;e._fireDmg=igniteDmg;spawnParticles(s,e.x,e.y,'#ff6600',2);}
    else{e._fireDmg=Math.max(e._fireDmg,igniteDmg);}
  }
  if(p._meleeChain){
    const mchLv=p._mChainLevel||1;
    const mchChance=[0,.35,.50,.65,.80,.80][Math.min(5,mchLv)];
    const mchDmgPct=[0,.50,.65,.80,.80,.80][Math.min(5,mchLv)];
    const mchArcs=[0,1,1,2,3,6][Math.min(5,mchLv)];
    if(Math.random()<mchChance){
      let arced=0,chainSet=new Set([e]);
      while(arced<mchArcs){
        let cn=null,cd=Infinity;
        for(const ce of s.enemies){if(!chainSet.has(ce)&&Math.hypot(ce.x-e.x,ce.y-e.y)<160){const d=Math.hypot(ce.x-e.x,ce.y-e.y);if(d<cd){cn=ce;cd=d;}}}
        if(!cn)break; chainSet.add(cn);
        const _mcd=dmg*mchDmgPct;cn.hp-=_mcd;cn.hitFlash=0.7;s.totalDamageDealt+=_mcd;
        spawnParticles(s,cn.x,cn.y,'#ffff00',2);
        if(!s.laserBeams)s.laserBeams=[];
        s.laserBeams.push({x1:e.x,y1:e.y,x2:cn.x,y2:cn.y,color:'#ffff00',w:2,life:.2,maxLife:.2});
        if(p._mChainLevel>=4&&!cn._onFire){cn._onFire=true;cn._fireTimer=3.0;cn._fireDmg=dmg*0.10;}
        if(cn.hp<=0)killEnemy(s,cn,s.enemies.indexOf(cn));
        arced++;
      }
    }
  }
  if(p._executioner&&e.hp>0){
    const execThresh=[0,.30,.40,.50,.50][Math.min(4,p._execLevel||1)];
    const execBonus=[0,.35,.50,.70,.70][Math.min(4,p._execLevel||1)];
    if(e.hp/e.maxHp<execThresh){
      if(p._execInstakill&&e.hp/e.maxHp<0.15&&!e.isBoss){e.hp=0;}
      else{const xd=dmg*execBonus;e.hp-=xd;s.totalDamageDealt+=xd;}
    }
  }
  // EARTHQUAKE: every N hits = screen-wide AoE
  if(p._quakeOnHit&&!e.isBoss){
    p._quakeCount=(p._quakeCount||0)+1;
    if(p._quakeCount>=(p._quakeInterval||5)){
      p._quakeCount=0;
      explodeAt(s,p.x,p.y,400,dmg*2.0);
      addFloat(p.x,p.y-30,'🌍 EARTHQUAKE!','#aa8800');
    }
  }
} // end applyMeleeEffects

// drawEdgeArrows removed — minimap covers offscreen tracking

function fireBoss(s,e,p,speed,dmg){
  const ang=Math.atan2(p.y-e.y,p.x-e.x);
  spawnBossBullet_pool(s, {x:e.x,y:e.y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r:7,dmg,life:2.5,color:e.color,sourceName:e.name});
}

function explodeAt(s,x,y,radius,dmg){
  if(s&&s._explBudget!==undefined){if(s._explBudget<=0)return;s._explBudget--;}
  spawnParticles(s,x,y,'#ff6600',2);
  spawnParticle_pool(s, {x,y,vx:0,vy:0,color:'#ff6600',r:radius,life:.22,isRing:true});
  for(let _ei=0,_el=s.enemies.length;_ei<_el;_ei++){
    const e=s.enemies[_ei];if(e._dead)continue;
    if(Math.hypot(e.x-x,e.y-y)<radius+e.r){
      e.hp-=dmg;e.hitFlash=1;s.totalDamageDealt+=dmg;
      if(e.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(e))s._deferredKills.push(e);}
    }
  }
}


function healPlayer(s,amt){
  if(amt<=0)return;
  if(s._modNoHeal)return;  // Blood Pact modifier blocks all healing
  s.player.hp=Math.min(s.player.maxHp,s.player.hp+amt);
}
function killEnemy(s,e,idx){
  const p=s.player;p.kills++;
  // Life leech: 3% max HP on kill (applies to all weapon types)
  // life leech is now on-hit (see bullet collision)
  p.gold+=e.gold+(p._goldBonus||0)+(p._bonusGold||0);
  p._totalGoldEarned=(p._totalGoldEarned||0)+e.gold+(p._goldBonus||0)+(p._bonusGold||0);
  sndKill();
  if(e._elite)sndEliteKill();
  s.combo=s.combo+1;  // no cap — let it go wild
  s.comboTimer=s.comboMaxTime;
  updateComboHUD();
  // Kill streak milestone VFX
  if(s.combo===5)  {addFloat(p.x,p.y-30,'5 KILLS!','#ffd700');triggerShake(2);}
  if(s.combo===10) {sndCombo10();addFloat(p.x,p.y-35,'×10 UNSTOPPABLE!','#ff8800');triggerShake(4);abilityRing(s,p.x,p.y,'#ff8800',80,.3,{glow:20,lw:2});}
  if(s.combo===20) {addFloat(p.x,p.y-40,'×20 GODLIKE!','#ff4400');triggerShake(6);abilityRing(s,p.x,p.y,'#ff4400',120,.35,{glow:30,lw:3});}
  if(s.combo===50) {addFloat(p.x,p.y-45,'×50 MASSACRE!!','#ff0000');triggerShake(10);abilityRing(s,p.x,p.y,'#ff0000',200,.5,{glow:40,lw:4});}
  if(s.combo>50&&s.combo%25===0){addFloat(p.x,p.y-45,`×${s.combo} GODS FEAR YOU`,'#ff0000');triggerShake(8);}
  if(e.isBoss&&!e._isMiniboss){
    spawnBattlePickup(s,e.x,e.y,'nova');
  }else if(e._elite&&Math.random()<0.55){
    spawnBattlePickup(s,e.x,e.y);
  }else if(s.combo>=(s._nextComboPickup||8)){
    spawnBattlePickup(s,e.x,e.y);
    s._nextComboPickup=(s._nextComboPickup||8)+10;
  }
  if(p._vampiric){healPlayer(s,p._vampHpPerKill||1);updateHpHUD();}
  if(p._endlessHunger){p.damage+=0.1;}
  if(p._soulLink){
    const healAmt=p._soulLinkAmt||3;
    healPlayer(s,healAmt);updateHpHUD();
    if(e.isBoss&&p._soulLinkBoss){healPlayer(s,Math.ceil(p.maxHp*0.15));updateHpHUD();addFloat(p.x,p.y-20,'SOUL DRAIN!','#ff88ff');}
  }
  // Rage stacks: increment on kill, reset decay timer
  if(p._rageStacks){p._rageStackCount=Math.min(p._rageMax||10,(p._rageStackCount||0)+1);p._rageDecayTimer=5;}
  // ABYSSAL ECHO: every N kills fire homing burst
  if(p._abyssalEcho){
    p._abyssalCount=(p._abyssalCount||0)+1;
    if(p._abyssalCount>=(p._abyssalInterval||5)){p._abyssalCount=0;p._abyssalFire=true;}
  }
  // SOUL FORGE: tracked in passive update
  // RAMPAGE: +5% dmg per kill stacks for 5s
  if(p._rampageKills){
    p._rampageStacks=Math.min(10,(p._rampageStacks||0)+1);
    p._rampageTimer=5.0;
    p._rampageMult=1+p._rampageStacks*0.05;
  }
  // KILL STREAK: every N kills trigger power shot
  if(p._killStreakPower){
    p._ksCount=(p._ksCount||0)+1;
    if(p._ksCount>=(p._killStreakNeeded||5)){p._ksCount=0;p._ksReady=true;addFloat(p.x,p.y-20,'⚡ KILL STREAK!','#ffff00');}
  }
  // Doom Explosion
  if(p._doomExplosion&&!e.isBoss&&Math.random()<0.08){
    explodeAt(s,e.x,e.y,120,p.damage*1.5);
    addFloat(e.x,e.y-20,'💀 DOOM!','#ff2200');
  }
  // Lucky gold: 20% chance on kill if lucky charm lv3+
  if(p._luckyGold&&Math.random()<0.20){p.gold+=5;updateKillsHUD();}
  // SPORE CLOUD: on-kill chance to leave toxic cloud
  if(p._sporeClouds&&!e.isBoss){
    const sporeChance=[0,0.35,0.50,0.65,0.80][Math.min(4,p._sporeLevel||1)];
    if(Math.random()<sporeChance){
      if(!s.sporePatches)s.sporePatches=[];
      const sporeR=[0,50,70,70,90][Math.min(4,p._sporeLevel||1)];
      const sporeDur=[0,4,6,6,10][Math.min(4,p._sporeLevel||1)];
      const sporeDmg=p.damage*0.20;
      const slow=p._sporeLevel>=3;
      s.sporePatches.push({x:e.x,y:e.y,r:sporeR,life:sporeDur,dmg:sporeDmg,slow});
      spawnParticles(s,e.x,e.y,'#44ff44',2);
    }
  }
  // Druid Overgrowth: kills while plant active stack +0.5% damage (max 30%)
  if(p._charId==='druid'&&s.leechPlants&&s.leechPlants.length>0){
    p._overgrowthStacks=(p._overgrowthStacks||0)+1;
    if(p._overgrowthStacks<=60)p.damage=Math.floor(p.damage*(1+0.005));
    if(p._overgrowthStacks%10===0)addFloat(p.x,p.y,'🌿 OVERGROWTH!','#44ff66');
  }
  // Death Shroud: 15% chance to chain-kill nearest non-boss enemy
  if(p._deathShroud&&!e.isBoss){
    const reaperChance=[0,.15,.25,.40,.60,.80][Math.min(5,p._reaperLevel||1)];
    if(Math.random()<reaperChance){
      let nearest=null,nd=Infinity;
      for(const ce of s.enemies){if(!ce.isBoss){const cd=Math.hypot(ce.x-e.x,ce.y-e.y);if(cd<nd){nearest=ce;nd=cd;}}}
      if(nearest){
        if(p._reaperLevel>=3){explodeAt(s,nearest.x,nearest.y,60,p.damage*([0,0,0,.30,.60,.60][Math.min(5,p._reaperLevel||3)]));}
        nearest.hp=0;spawnParticles(s,nearest.x,nearest.y,'#aa00ff',2);addFloat(nearest.x,nearest.y,'💀 SHROUD','#aa00ff');
      }
    }
  }
  // Nova on-kill: level-scaled explosion
  if(p._novaOnKill&&!e.isBoss){
    const novaChance=[0,.20,.35,.55,.80,1.0][Math.min(5,p._novaLevel||1)];
    if(Math.random()<novaChance){
      const novaDmgMult=[0,.6,.7,.8,1.0,1.2][Math.min(5,p._novaLevel||1)];
      const novaR=[0,50,60,80,100,120][Math.min(5,p._novaLevel||1)];
      explodeAt(s,e.x,e.y,novaR,p.damage*novaDmgMult);
      spawnParticles(s,e.x,e.y,'#ff8800',3);
      if(p._novaHeal){healPlayer(s,p.damage*novaDmgMult*0.08);updateHpHUD();}
      // Level 3+: chain explosion
      if(p._novaLevel>=3&&Math.random()<0.5){
        let cn2=null,cd2=Infinity;
        for(const ce of s.enemies){if(ce!==e){const d=Math.hypot(ce.x-e.x,ce.y-e.y);if(d<180&&d<cd2){cn2=ce;cd2=d;}}}
        if(cn2){explodeAt(s,cn2.x,cn2.y,novaR*0.7,p.damage*novaDmgMult*0.6);}
      }
    }
  }
  // Chronoshift: 12% chance to slow all enemies for 2s
  if(p._chronoshift&&!p._chronoshiftActive&&Math.random()<0.12){
    p._chronoshiftActive=true;p._chronoshiftTimer=2.0;
    /* time stop slow removed */
    spawnParticles(s,p.x,p.y,'#00ccff',3);abilityRing(s,p.x,p.y,'#00ccff',300,.5);
    addFloat(p.x,p.y,'⏳ CHRONOSHIFT!','#00ccff');
  }
  // Midas Touch: +5 gold per kill, every 100 gold → +3 damage
  if(p._midasTouch){
    p.gold+=5;p._midasGoldAcc=(p._midasGoldAcc||0)+5;
    if(p._midasGoldAcc>=100){p._midasGoldAcc-=100;p.damage+=3;addFloat(p.x,p.y,'🪙 MIDAS +3 DMG','#ffd700');}
  }
  if(p._syn_hungerMidas){p.gold+=2;}
  // Void Rift: 20% chance to spawn a gravity pull
  if(p._voidRift&&!e.isBoss&&Math.random()<0.20){
    if(!s.voidRifts)s.voidRifts=[];
    s.voidRifts.push({x:e.x,y:e.y,r:80,life:1.8,maxLife:1.8,pull:220});
    spawnParticles(s,e.x,e.y,'#00ccff',3);
    addFloat(e.x,e.y,'🌀 RIFT','#00ccff');
  }
  // RAMPAGE: 10 kills in 6s
  s.killStreak=(s.killStreak||0)+1;s.killStreakTimer=6.0;
  if(s.killStreak>=10&&!p._rampageActive){
    p._rampageActive=true;p._rampageTimer=8.0;s.killStreak=0;
    spawnParticles(s,p.x,p.y,'#ff4500',3);spawnParticles(s,p.x,p.y,'#ffd700',3);
    abilityRing(s,p.x,p.y,'#ff4500',100,.5);abilityRing(s,p.x,p.y,'#ffd700',160,.65);
    addFloat(p.x,p.y,'🔥 RAMPAGE! 🔥','#ff4500');triggerShake(5);p._rampageEver=true;
  }
  // Release from any leech plant
  if(s.leechPlants){for(const pl of s.leechPlants){if(pl.latchedEnemies)pl.latchedEnemies=pl.latchedEnemies.filter(le=>le!==e);}}
  // BERSERKER BLOODLUST: kills during rage cut next CD
  if(p._charId==='berserker'&&p._berserkerRage){
    p._abilityCooldown=Math.max(0,p._abilityCooldown-1.5);
    spawnParticles(s,e.x,e.y,'#ff0033',2);
  }
  // NINJA BACKSTAB: mark this enemy as hit so next enemy is fresh
  if(p._charId==='ninja')e._ninjaHit=true;
  const xpBonus=e.xp*(s.combo>=5?1.4:s.combo>=3?1.15:1.0)*(1+(p._killXpBonus||0));
  spawnXpOrbs(s,e.x,e.y,Math.ceil(xpBonus));
  // Meta death explosion (Chain Reaction upgrade)
  if((p._deathExplChance||0)>0 && !e.isBoss && Math.random()<p._deathExplChance){
    explodeAt(s,e.x,e.y,60,p.damage*0.8);
  }
  // Soul Shard: 20% chance for a bonus 3× XP orb
  if(p._soulShard&&Math.random()<0.35){
    spawnXpOrbs(s,e.x,e.y,Math.ceil(e.xp*4));
    addFloat(e.x,e.y-14,'💠 SOUL!','#4488ff');
  }
  spawnParticles(s,e.x,e.y,e.color,2);
  // Echo modifier: spawn weak copy on death
  if(s._modEcho&&!e.isBoss&&!e._isEchoCopy){
    const ec={...e,hp:Math.ceil(e.maxHp*0.3),maxHp:Math.ceil(e.maxHp*0.3),
      x:e.x+(Math.random()-.5)*30,y:e.y+(Math.random()-.5)*30,
      hitFlash:0,_isEchoCopy:true,alpha:0.5,xp:0,gold:0};
    enemyPush(s, ec);
    spawnParticles(s,ec.x,ec.y,'#aaaaff',2);
  }
  // Death burst: expanding ring
  if(e.isBoss){
    abilityRing(s,e.x,e.y,e.color,e.r*4,0.6);
    abilityRing(s,e.x,e.y,'#ffffff',e.r*6,0.8);
  } else {
    spawnParticle_pool(s, {x:e.x,y:e.y,vx:0,vy:0,color:e._zoneTint||e.color,r:e.r*2.5,
      life:0.28,maxLife:0.28,isExpandRing:true});
  }
  addFloat(e.x,e.y,`+${e.gold}💰`,'#ffd700');
  // NECROMANCER: raise skeleton from soul-bolt kills
  if(p._charId==='necromancer_hero'&&e._killedBySoulBolt&&!e.isBoss){
    if(!s._skeletons)s._skeletons=[];
    if(s._skeletons.length<8){
      const sk={
        x:e.x+(Math.random()-.5)*20, y:e.y+(Math.random()-.5)*20,
        r:9, speed:1.9, life:30, maxLife:30,
        dmg:p.damage*0.4,
      };
      s._skeletons.push(sk);
      spawnParticles(s,e.x,e.y,'#aa44ff',2);
      addFloat(e.x,e.y-16,'💀 RISEN!','#aa44ff');
    }
  }
  if(s.combo>=3)addFloat(e.x,e.y-20,`x${s.combo} COMBO!`,'#00ffa3');
  if(e.isBoss&&!e._isMiniboss){
    s.bossAlive=false;
    s._bossKills=(s._bossKills||0)+1;
    s._lastBossName=e.name;
    // Log for death screen timeline
    if(!s._bossKillLog) s._bossKillLog=[];
    sndBossDie();
    s._bossKillLog.push({name:e.name, wave:s.wave});
    document.getElementById('boss-bar-wrap').classList.remove('active');
    // Track fight stats
    if(s._bossStartDmg!==undefined&&s.totalDamageTaken===s._bossStartDmg)s._bossKillNoHit=true;
    s._bossFightDmgDealt=s._bossFightDmgStart!=null?s.totalDamageDealt-s._bossFightDmgStart:null;
    s._bossFightDmgTaken=s._bossStartDmg!=null?s.totalDamageTaken-s._bossStartDmg:null;
    // Big gold reward + full heal
    const bossGoldBonus=50+s.wave*8;
    p.gold+=bossGoldBonus;
    if(!s._modNoHeal){p.hp=p.maxHp;}updateHpHUD();updateKillsHUD();
    // Dramatic explosion sequence
    spawnParticles(s,e.x,e.y,'#ffffff',5);
    spawnParticles(s,e.x,e.y,'#ffd700',3);
    spawnParticles(s,e.x,e.y,e.color,3);
    spawnParticles(s,e.x,e.y,'#ff8800',2);
    abilityRing(s,e.x,e.y,'#ffffff',80,.4);
    abilityRing(s,e.x,e.y,'#ffd700',160,.7);
    abilityRing(s,e.x,e.y,'#ff8800',260,1.0);
    abilityRing(s,e.x,e.y,'#ff4400',360,1.3);
    // XP explosion from boss position
    const bossXp=e.xp*3;
    for(let _xi=0;_xi<12;_xi++){const _xa=Math.random()*Math.PI*2,_xd=10+Math.random()*80;spawnOrb_pool(s, {x:e.x+Math.cos(_xa)*_xd,y:e.y+Math.sin(_xa)*_xd,r:7,value:Math.ceil(bossXp/12),life:10.0});}
    addFloat(e.x,e.y,'★ BOSS SLAIN ★','#ffd700');
    triggerShake(18);
    // Screen flash
    const fl=document.getElementById('ability-flash');
    if(fl){fl.style.background='rgba(255,220,0,0.35)';fl.classList.add('active');setTimeout(()=>fl.classList.remove('active'),300);}
    // Achievement: warlord crown heal on boss kill
    if(p._warlordCrown){healPlayer(s,Math.ceil(p.maxHp*0.20));updateHpHUD();}
    // Check char unlocks based on boss kills
    const bk=s._bossKills;
    if(bk>=1){unlockChar('ironclad');unlockChar('vampire_hero');}
    if(bk>=3){const wasNew=unlockChar('spellblade');if(wasNew)showAchievementToast('🔮 SPELLBLADE UNLOCKED!');}
    if(bk>=5){const wasNew=unlockChar('riftwalker');if(wasNew)showAchievementToast('🌌 RIFTWALKER UNLOCKED!');}
    if(bk>=7){const wasNew=unlockChar('chronomancer');if(wasNew)showAchievementToast('⏳ CHRONOMANCER UNLOCKED!');}
    // Open boss loot screen after death particles play
    setTimeout(()=>{ if(state&&!state.gameOver)openBossLoot(state); },1100);
  }
  if(e.splits&&!e.wasSplit){
    for(let i=0;i<2;i++){const sm={...e,r:e.r*.6,hp:e.maxHp*.3,maxHp:e.maxHp*.3,x:e.x+(Math.random()-.5)*32,y:e.y+(Math.random()-.5)*32,speed:e.speed*1.5,wasSplit:true,splits:false,gold:1,xp:2};enemyPush(s, sm);}
  }
  e._dead = true;
  EnemyPool.release(e);
  if(idx >= 0 && idx < s.enemies.length){
    s.enemies[idx] = s.enemies[s.enemies.length-1];
    s.enemies.pop();
  }
  updateKillsHUD();
}

function autoShoot(s,dmg){
  const p=s.player;if(!s.enemies.length)return;
  if(s.char.customShoot){s.char.customShoot(s,dmg||p.damage);return;}
  let near=null,nd=Infinity;
  for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){near=e;nd=d;}}
  if(!near)return;
  const ang=Math.atan2(near.y-p.y,near.x-p.x);
  const effectiveShots=p.multishot; // hard cap at 4
  const spread=(effectiveShots-1)*.18;
  // Compensate damage when multishot is capped: spread the full DPS across fewer bullets
  const dmgMult=p.multishot>4?(p.multishot/4):1;
  for(let i=0;i<effectiveShots;i++){
    const a=ang+(i-(effectiveShots-1)/2)*spread;
    const bDmg=(i===0)?dmg*dmgMult:dmg*dmgMult*(p._noPenalty?1:(1-MULTISHOT_DMG_PENALTY));
    spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(a)*p.bulletSpeed,vy:Math.sin(a)*p.bulletSpeed,r:p.bulletSize,dmg:bDmg,pierce:p.piercing,life:1.4});
    // Echo Chamber: only on first bullet to avoid exponential blowup
    if(p._echoChamber&&i===0){const ea=a+Math.PI/4;spawnBullet_pool(s, {x:p.x,y:p.y,vx:Math.cos(ea)*p.bulletSpeed,vy:Math.sin(ea)*p.bulletSpeed,r:p.bulletSize*0.8,dmg:bDmg*0.4,pierce:0,life:1.1,_isEcho:true});}
  }
}

function spawnXpOrbs(s,x,y,total){
  const crowd=s.xpOrbs.length;
  const c=crowd>360?1:crowd>220?2:Math.min(total,4); // collapse drops under load
  const val=Math.ceil(total/c);
  for(let i=0;i<c;i++){
    const a=Math.random()*Math.PI*2,d=4+Math.random()*18;
    spawnOrb_pool(s, {x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,r:5,value:val,life:8.0});
  }
  // Hard cap — drop oldest if somehow flooded
  if(s.xpOrbs.length>520){s.xpOrbs.splice(0,s.xpOrbs.length-440);}
}
function dealDamageToEnemy(s,e,dmg){
  if(!e||e._dead)return;
  e.hp-=dmg;e.hitFlash=Math.min(1,(e.hitFlash||0)+0.1);
  s.totalDamageDealt+=dmg;
  if(e.hp<=0){if(!s._deferredKills)s._deferredKills=[];if(!s._deferredKills.includes(e))s._deferredKills.push(e);}
}
function p_addXp(s,val){
  const p=s.player;
  const xpMult=(p.hp/p.maxHp<0.30)?1.5:1.0;
  const waveXpBonus=s.wave>=10?1+(s.wave-10)*0.12:1.0;
  const soulMult=p._xpMult||1.0; // soulstone passive
  p.xp+=Math.ceil(val*xpMult*waveXpBonus*soulMult);
}

function spawnParticles(s,x,y,color,count,opts={}){
  if(s.particles.length>60) return;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,sp=1+Math.random()*3.5;
    spawnParticle_pool(s, {x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color,r:1.5+Math.random()*3,life:.25+Math.random()*.55});
  }
}

function addFloat(x,y,text,color){
  if(state) spawnFloat_pool_obj(state,{x,y:y-10,text,color:color||'#fff',life:1.0,scale:1});
}

function checkLevelUp(s){
  const p=s.player;
  if(p.xp>=p.xpNext){
    p.xp-=p.xpNext;p.level++;p.xpNext=Math.floor(p.xpNext*1.15);p.maxHp+=3;p.hp=Math.min(p.hp+3,p.maxHp);
    sndLevelUp();
    // Level up VFX
    spawnParticles(s,p.x,p.y,'#ffd700',6);spawnParticles(s,p.x,p.y,'#ffffff',3);
    abilityRing(s,p.x,p.y,'#ffd700',60,.35,{glow:28,lw:3,noEcho:true});
    triggerShake(2);updateLevelHUD();updateHpHUD();
    // SOULSTONE: heal on level-up
    if(p._levelHeal){healPlayer(s,Math.ceil(p.maxHp*0.10));updateHpHUD();}
    const bonus=(p._luckyClover>0?2:0)+(p._extraChoice?1:0);
    if(p._luckyClover>0)p._luckyClover--;
    pauseForUpgrade(s,3+bonus,false);
  }
}

function openChest(s,isMilestone){pauseForUpgrade(s,isMilestone?5:9,true);}

// Boss icon lookup
const BOSS_ICONS={
  'KING SLIME':'🟢','DEATH STAR':'🔴','VOID TITAN':'🟣','FROST LICH':'🔵',
  'BLOOD MOON':'🌑','SHADOW HYDRA':'🐍','INFERNAL COLOSSUS':'🔥','STORM WITCH':'🧙',
  'PLAGUE LORD':'☣️','TITAN WORM':'🪱','MIRROR KNIGHT':'🪞','NETHER ARCHITECT':'🏗️',
  'TWIN SERPENTS':'🐉','THE RECURSION':'♾️','OMEGA CORE':'⭐',
};
const BOSS_SUBTITLES={
  'KING SLIME':'THE GELATINOUS TYRANT','DEATH STAR':'THE VOID WEAPON',
  'VOID TITAN':'HERALD OF THE ABYSS','FROST LICH':'MASTER OF PERMAFROST',
  'BLOOD MOON':'THE SCARLET ASCENDANT','SHADOW HYDRA':'VENOMOUS MANY-HEADED',
  'INFERNAL COLOSSUS':'THE LAVA-FORGED GIANT','STORM WITCH':'WIELDER OF TEMPESTS',
  'PLAGUE LORD':'THE FESTERING ONE','TITAN WORM':'THE GREAT BURROWER',
  'MIRROR KNIGHT':'THE UNBREAKABLE BLADE','NETHER ARCHITECT':'BUILDER OF HELLSCAPES',
  'TWIN SERPENTS':'BOUND BY SHARED FATE','THE RECURSION':'INFINITE DIVISION',
  'OMEGA CORE':'THE FINAL MACHINE',
};

function openBossLoot(s){
  s.paused=true;
  const p=s.player;
  const bossName=s._lastBossName||'BOSS';
  const choices=getBossLootChoices();
  const screen=document.getElementById('boss-loot-screen');
  const splash=document.getElementById('bloot-splash');
  const picker=document.getElementById('bloot-picker');
  const container=document.getElementById('boss-loot-cards');

  // ── Phase 1: Victory splash ──────────────────────────────────────
  splash.style.display='flex';
  picker.style.display='none';

  // Boss icon + name
  const bicon=document.getElementById('bloot-boss-icon');
  const btitle=document.getElementById('bloot-title');
  const bsub=document.getElementById('bloot-subtitle');
  bicon.textContent=BOSS_ICONS[bossName]||'💀';
  bicon.style.animation='bossVictoryPop 0.5s cubic-bezier(.17,.67,.35,1.3) both';
  btitle.textContent=bossName+' SLAIN';
  btitle.style.animation='bossVictoryPop 0.55s 0.1s cubic-bezier(.17,.67,.35,1.3) both';
  bsub.textContent=BOSS_SUBTITLES[bossName]||'DEFEATED';

  // Stats row — time, damage dealt, damage taken
  const statsRow=document.getElementById('bloot-stats-row');
  statsRow.innerHTML='';
  const bossFightTime=s._bossFightStart!=null?Math.round(s.totalTime-s._bossFightStart):null;
  const dmgDealt=s._bossFightDmgDealt!=null?Math.floor(s._bossFightDmgDealt):null;
  const dmgTaken=s._bossFightDmgTaken!=null?Math.floor(s._bossFightDmgTaken):null;
  const noHit=s._bossKillNoHit;
  const statItems=[
    {icon:'⚔️',label:'BOSS KILLS',val:s._bossKills},
    bossFightTime!=null?{icon:'⏱',label:'FIGHT TIME',val:bossFightTime+'s'}:null,
    dmgDealt!=null?{icon:'💥',label:'DAMAGE DEALT',val:dmgDealt.toLocaleString()}:null,
    dmgTaken!=null?{icon:'🛡',label:'DAMAGE TAKEN',val:noHit?'✦ NO HIT ✦':dmgTaken.toLocaleString()}:null,
  ].filter(Boolean);
  statItems.forEach((st,i)=>{
    const d=document.createElement('div');
    d.style.cssText=`text-align:center;animation:statSlideIn 0.4s ${0.25+i*0.08}s both;`;
    d.innerHTML=`<div style="font-size:20px;">${st.icon}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:${noHit&&st.label==='DAMAGE TAKEN'?'#ffd700':'#fff'};">${st.val}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;color:#888;letter-spacing:1px;">${st.label}</div>`;
    statsRow.appendChild(d);
  });

  // Rewards row: gold gained + full heal badge + no-hit bonus
  const rewardsRow=document.getElementById('bloot-rewards-row');
  rewardsRow.innerHTML='';
  const bossGold=50+s.wave*8;
  const badges=[
    {icon:'💰',text:`+${bossGold} GOLD`,col:'#ffd700'},
    {icon:'❤️',text:'FULLY HEALED',col:'#ff6688'},
    noHit?{icon:'✦',text:'NO-HIT BONUS',col:'#00ffcc'}:null,
  ].filter(Boolean);
  badges.forEach((b,i)=>{
    const d=document.createElement('div');
    d.style.cssText=`display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.07);
      border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:6px 14px;
      font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:${b.col};
      animation:statSlideIn 0.4s ${0.5+i*0.1}s both;`;
    d.innerHTML=`<span>${b.icon}</span><span>${b.text}</span>`;
    rewardsRow.appendChild(d);
  });

  // Any key / click → phase 2
  screen.classList.add('active');
  showScreen('boss-loot-screen');

  const advance=()=>{
    screen.removeEventListener('click',advance);
    document.removeEventListener('keydown',_keyAdvance);
    _showBossLootPicker(s,choices,screen,splash,picker,container);
  };
  const _keyAdvance=(ev)=>{
    if(['Escape','Tab'].includes(ev.key))return;
    advance();
  };
  setTimeout(()=>{
    screen.addEventListener('click',advance);
    document.addEventListener('keydown',_keyAdvance);
  },600);
}

function _showBossLootPicker(s,choices,screen,splash,picker,container){
  splash.style.display='none';
  picker.style.display='flex';
  container.innerHTML='';

  choices.forEach((item,i)=>{
    const card=document.createElement('div');
    card.className='upgrade-card legendary';
    card.style.cssText=`min-width:210px;max-width:250px;cursor:pointer;
      border:2px solid #ff8c00;padding:20px 16px;text-align:center;
      animation:cardDeal 0.35s ${i*0.09}s cubic-bezier(.17,.67,.35,1.3) both;
      transition:transform 0.15s,box-shadow 0.15s,border-color 0.15s;`;
    card.innerHTML=`<div style="font-size:38px;margin-bottom:10px;">${item.icon}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:#ffd700;letter-spacing:1px;margin-bottom:8px;">${item.name}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;color:#bbb;line-height:1.6;">${item.desc}</div>
      <div style="margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:8px;color:#ff8c00;letter-spacing:2px;">✦ LEGENDARY ✦</div>`;
    card.onmouseenter=()=>{card.style.transform='scale(1.05) translateY(-4px)';card.style.boxShadow='0 0 24px rgba(255,140,0,0.5)';card.style.borderColor='#ffd700';};
    card.onmouseleave=()=>{card.style.transform='';card.style.boxShadow='';card.style.borderColor='#ff8c00';};
    card.onclick=()=>{
      item.apply(s.player);
      s.collectedItems.push({...item,_count:(s.collectedItems.filter(c=>c.id===item.id).length+1)});
      if(!s._pickedBossItems) s._pickedBossItems=[];
      s._pickedBossItems.push(item.id);
      updateHpHUD();checkSynergies(s);updateSlotHUD(s);
      for(const k in keys) keys[k]=false;
      showScreen('game-screen');
      s.paused=false;
      // Big XP dump on claim
      const xpDump=60+s.wave*12;
      for(let i=0;i<8;i++){
        const a=Math.random()*Math.PI*2,d=20+Math.random()*60;
        spawnOrb_pool(state, {x:state.player.x+Math.cos(a)*d,y:state.player.y+Math.sin(a)*d,r:6,value:Math.ceil(xpDump/8),life:10.0});
      }
    };
    container.appendChild(card);
  });
}


let damageFlashTimer=0;
function triggerDamageFlash(pct=1.0){
  const el=document.getElementById('damage-flash');
  el.style.opacity=Math.min(0.85,0.35+pct*0.5);
  el.classList.add('active');
  clearTimeout(damageFlashTimer);
  damageFlashTimer=setTimeout(()=>{el.classList.remove('active');el.style.opacity='';},100+pct*80);
}

function triggerShake(intensity){
  if(!state)return;
  state.shakeX=(Math.random()-.5)*intensity;
  state.shakeY=(Math.random()-.5)*intensity;
  state.shakeTimer=.15;
}
function flashEl(id){
  const node=el(id);
  if(!node)return;
  node.classList.remove('active');
  void node.offsetWidth;
  node.classList.add('active');
}
function abilityRing(s,x,y,color,r=80,life=.45,opts={}){
  // Primary expanding ring
  spawnParticle_pool(s, {x,y,vx:0,vy:0,color,r,life,maxLife:life,isExpandRing:true,maxR:r,glowBlur:opts.glow||22,lineW:opts.lw||3.5});
  // Echo ring — thin, slightly delayed, fades faster
  if(!opts.noEcho){
    spawnParticle_pool(s, {x,y,vx:0,vy:0,color,r:r*0.6,life:life*0.7,maxLife:life*0.7,isExpandRing:true,maxR:r*0.6,glowBlur:opts.glow||14,lineW:1.5,_echo:true});
  }
}



// ═══════════════════════════════════════════════════════════════
//  SOUND — Procedural Web Audio (no files needed)
// ═══════════════════════════════════════════════════════════════
let _audioCtx=null;
function getAudio(){
  if(!_audioCtx){try{_audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
  return _audioCtx;
}
function playTone(freq, type='sine', dur=0.08, vol=0.15, decay=0.06){
  const ctx=getAudio();if(!ctx)return;
  try{
    const g=ctx.createGain(),o=ctx.createOscillator();
    o.connect(g);g.connect(ctx.destination);
    o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq*0.5,ctx.currentTime+dur);
    g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur+decay);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+dur+decay+0.01);
  }catch(e){}
}
function sndShoot(){playTone(280,'square',0.04,0.06,0.02);}
function sndHit(){playTone(180,'sawtooth',0.05,0.08,0.03);}
function sndKill(){playTone(320,'triangle',0.07,0.10,0.05);}
function sndEliteKill(){playTone(500,'triangle',0.12,0.14,0.08);setTimeout(()=>playTone(700,'sine',0.08,0.10,0.06),60);}
function sndLevelUp(){
  [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.12,0.18,0.08),i*60));
}
function sndAbility(){playTone(600,'sine',0.15,0.20,0.12);setTimeout(()=>playTone(400,'triangle',0.10,0.15,0.10),80);}
function sndBossSpawn(){
  [80,60,50].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.25,0.25,0.15),i*120));
}
function sndBossDie(){
  [200,300,400,600,800].forEach((f,i)=>setTimeout(()=>playTone(f,'triangle',0.15,0.20,0.12),i*80));
}
function sndDamage(){playTone(120,'sawtooth',0.06,0.18,0.05);}
function sndCombo10(){[300,400,500].forEach((f,i)=>setTimeout(()=>playTone(f,'square',0.08,0.14,0.06),i*40));}
function sndUpgradePick(rarity){
  const f={common:220,rare:330,epic:550,legendary:880,boss:660}[rarity]||220;
  const v={common:0.12,rare:0.15,epic:0.20,legendary:0.25,boss:0.22}[rarity]||0.12;
  playTone(f,'sine',0.18,v,0.15);
  if(rarity==='legendary'||rarity==='epic'){setTimeout(()=>playTone(f*1.5,'sine',0.12,v*0.7,0.10),100);}
}
// ═══════════════════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════════════════
function draw(){
  const s=state;if(!s)return;
  const dt=s.lastDt||0.016;
  s._sfTick=(s._sfTick||0)+1;if(s._sfTick%2===0)drawStarfield(dt);
  ctx.save();
  if(s.shakeTimer>0){ctx.translate(s.shakeX,s.shakeY);}
  ctx.clearRect(-20,-20,W+40,H+40);

  if(s.laserBeams){for(const lb of s.laserBeams){
    const t=lb.life/lb.maxLife;
    ctx.save();
    // Outer glow pass
    ctx.globalAlpha=t*0.5;
    ctx.strokeStyle=lb.color;ctx.lineWidth=lb.w*t*3.5;
    ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(lb.x1,lb.y1);ctx.lineTo(lb.x2,lb.y2);ctx.stroke();
    // Core bright pass
    ctx.globalAlpha=t*0.95;
    ctx.lineWidth=lb.w*t*0.85;ctx.shadowBlur=0;
    ctx.strokeStyle='#ffffff';
    ctx.beginPath();ctx.moveTo(lb.x1,lb.y1);ctx.lineTo(lb.x2,lb.y2);ctx.stroke();
    ctx.restore();ctx.shadowBlur=0;ctx.globalAlpha=1;
  }}

  if(s.afterimages){for(const ai of s.afterimages){
    ctx.save();ctx.globalAlpha=(ai.life/ai.maxLife)*0.5;ctx.translate(ai.x,ai.y);
    ctx.beginPath();ctx.arc(0,0,ai.r,0,Math.PI*2);
    ctx.fillStyle=ai.color;ctx.shadowBlur=0;ctx.fill();
    ctx.restore();ctx.shadowBlur=0;
  }}

  if(s.slowOrbs){for(const so of s.slowOrbs){
    ctx.globalAlpha=(so.life/1.5)*.4;
    ctx.beginPath();ctx.arc(so.x,so.y,so.r,0,Math.PI*2);ctx.fillStyle='#4488aa';ctx.fill();
    ctx.globalAlpha=1;
  }}

  if(s.firePatches){for(const fp of s.firePatches){
    ctx.globalAlpha=(fp.life/fp.maxLife)*.7;
    const isAcid=fp.isAcid;const isGhost=fp.isGhost;const isFrost=fp.isFrost;
    const g=ctx.createRadialGradient(fp.x,fp.y,0,fp.x,fp.y,fp.r);
    if(isFrost){g.addColorStop(0,'#eef8ff');g.addColorStop(.5,'#44aaee');g.addColorStop(1,'transparent');}
    else if(isGhost){g.addColorStop(0,'#ccccff');g.addColorStop(.6,'#6644bb');g.addColorStop(1,'transparent');}
    else if(isAcid){g.addColorStop(0,'#aaff22');g.addColorStop(.6,'#44aa00');g.addColorStop(1,'transparent');}
    else{g.addColorStop(0,'#ff8800');g.addColorStop(.6,'#ff4400');g.addColorStop(1,'transparent');}
    ctx.beginPath();ctx.arc(fp.x,fp.y,fp.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.globalAlpha=1;
  }}

  if(s.vineLines){for(const vl of s.vineLines){
    ctx.save();ctx.globalAlpha=(vl.life/vl.maxLife)*0.7;
    ctx.strokeStyle='#44ff66';ctx.lineWidth=2;ctx.shadowBlur=0;
    ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(vl.x1,vl.y1);ctx.lineTo(vl.x2,vl.y2);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();ctx.shadowBlur=0;
  }}

  // XP orbs — flat diamond, no gradient/shadow/rotation
  ctx.fillStyle='#00ffaa';
  // XP orbs — glowing diamonds
  for(const o of s.xpOrbs){
    ctx.save();ctx.translate(o.x,o.y);
    const sz = o.r||4;
    const lifeRatio = Math.min(1,(o.life||8)/8);
    // Outer glow
    ctx.globalAlpha = 0.25*lifeRatio;
    ctx.beginPath();ctx.arc(0,0,sz*2.2,0,Math.PI*2);
    ctx.fillStyle='#00ffcc';ctx.fill();
    // Diamond body
    ctx.globalAlpha = 0.9*lifeRatio;
    ctx.beginPath();
    ctx.moveTo(0,-sz*1.4);ctx.lineTo(sz*0.9,0);ctx.lineTo(0,sz*1.4);ctx.lineTo(-sz*0.9,0);ctx.closePath();
    ctx.fillStyle='#00ffcc';ctx.fill();
    // Bright center
    ctx.globalAlpha = lifeRatio;
    ctx.beginPath();ctx.arc(0,0,sz*0.5,0,Math.PI*2);
    ctx.fillStyle='#ffffff';ctx.fill();
    ctx.restore();
  }

  for(const pickup of s.battlePickups){
    const def=SURGE_PICKUPS[pickup.type];
    if(!def)continue;
    const bob=Math.sin(pickup.bob)*5;
    const lifeRatio=Math.min(1,pickup.life/pickup.maxLife);
    ctx.save();
    ctx.translate(pickup.x,pickup.y+bob);
    ctx.rotate(pickup.spin);
    ctx.globalAlpha=0.22*lifeRatio;
    ctx.beginPath();
    ctx.arc(0,0,pickup.r*1.9,0,Math.PI*2);
    ctx.fillStyle=def.color;
    ctx.fill();
    ctx.globalAlpha=0.95*lifeRatio;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+Math.PI/6;
      ctx.lineTo(Math.cos(a)*pickup.r,Math.sin(a)*pickup.r);
    }
    ctx.closePath();
    ctx.fillStyle='#091018';
    ctx.fill();
    ctx.strokeStyle=def.color;
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.rotate(-pickup.spin);
    ctx.font='bold 14px "Barlow Condensed", sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillStyle='#ffffff';
    ctx.fillText(def.icon,0,1);
    ctx.restore();
  }
  
  ctx.globalAlpha=1.0;

  for(const c of s.chests){
    const bob=Math.sin(c.bob)*4;
    ctx.save();ctx.translate(c.x,c.y+bob);
    const pulse=0.7+Math.sin(s.totalTime*3+c.x)*0.3;
    // Ground glow
    ctx.save();ctx.globalAlpha=0.2*pulse;
    ctx.beginPath();ctx.ellipse(0,8,c.r*2,c.r*0.8,0,0,Math.PI*2);ctx.fillStyle='rgba(255,160,0,0.18)';ctx.fill();
    ctx.restore();
    if(c.isMilestone){
      // Outer glow ring
      ctx.beginPath();ctx.arc(0,0,c.r*1.8,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,220,0,0.3)';ctx.lineWidth=8*pulse;ctx.shadowBlur=0;ctx.stroke();ctx.shadowBlur=0;
      // Chest body — clipped hex shape
      ctx.beginPath();
      for(let k=0;k<6;k++){const a=k/6*Math.PI*2-Math.PI/6;ctx.lineTo(Math.cos(a)*c.r*1.1,Math.sin(a)*c.r*1.1);}
      ctx.closePath();
      ctx.fillStyle='#d99d14';ctx.shadowBlur=0;ctx.fill();
      // Dividing band
      ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(-c.r*1.05,-c.r*.07,c.r*2.1,c.r*.14);
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,c.r*.28,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.font='bold 13px serif';ctx.textAlign='center';ctx.fillText('⭐',0,-c.r-12);
    } else {
      // Regular chest
      ctx.beginPath();ctx.roundRect(-c.r,-c.r*.75,c.r*2,c.r*1.5,3);
      ctx.fillStyle=c.isMilestone?'#cc8800':'#aa6600';ctx.shadowBlur=0;ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(-c.r,-c.r*.08,c.r*2,c.r*.16);
      ctx.fillStyle='rgba(255,220,100,0.9)';ctx.beginPath();ctx.arc(0,0,c.r*.22,0,Math.PI*2);ctx.fill();
      ctx.font='11px serif';ctx.textAlign='center';ctx.fillText('🎁',0,-c.r-7);
    }
    ctx.restore();ctx.shadowBlur=0;
  }

  // Boss bullets — flat diamond, no gradients/shadows
  for(const b of s.bossBullets){
    const bAng2=Math.atan2(b.vy,b.vx);
    const bc=b.color||'#ff4488';
    // Flat trail (rect behind bullet direction)
    const tlen=b.r*5;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(bAng2);
    ctx.globalAlpha=0.35;ctx.fillStyle=bc;
    ctx.fillRect(-tlen,-b.r*0.45,tlen,b.r*0.9);
    ctx.globalAlpha=1;
    // Flat diamond core
    ctx.beginPath();ctx.moveTo(0,-b.r*1.1);ctx.lineTo(b.r*0.75,0);ctx.lineTo(0,b.r*1.1);ctx.lineTo(-b.r*0.75,0);ctx.closePath();
    ctx.fillStyle=bc;ctx.fill();
    // White tip
    ctx.beginPath();ctx.arc(0,0,b.r*0.35,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.restore();
  }

  if(s.turrets){for(const t of s.turrets){
    ctx.save();ctx.globalAlpha=.5+(t.life/t.maxLife)*.5;ctx.translate(t.x,t.y);
    const pulse=0.8+Math.sin(s.totalTime*4+t.x)*0.2;
    // Base glow pool
    ctx.save();ctx.globalAlpha=0.2*pulse;
    ctx.beginPath();ctx.ellipse(0,4,t.r*2,t.r*0.7,0,0,Math.PI*2);ctx.fillStyle='rgba(0,200,255,0.15)';ctx.fill();
    ctx.restore();
    // Rotated square body
    ctx.rotate(Math.PI/4);
    ctx.fillStyle='#008899';ctx.shadowBlur=0;ctx.fill();ctx.rotate(-Math.PI/4);
    // Gun barrel
    ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillRect(-t.r*.12,-t.r*.85,t.r*.24,t.r*1.0);
    ctx.shadowBlur=0;
    // Life bar
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-t.r,-t.r-8,t.r*2,3.5);
    ctx.fillStyle='#4af';ctx.fillRect(-t.r,-t.r-8,t.r*2*(t.life/t.maxLife),3.5);
    ctx.restore();ctx.shadowBlur=0;
  }}

  // Leech plants
  if(s.leechPlants){for(const pl of s.leechPlants){
    ctx.save();
    const lifeRatio=pl.life/pl.maxLife;
    const pulse=Math.sin(pl.pulse)*0.18+0.82;
    const latched=pl.latchedEnemies||[];
    const isFeeding=latched.length>0;
    const glow=isFeeding?'#00ff88':'#44ff66';
    ctx.translate(pl.x,pl.y);
    ctx.globalAlpha=0.25+lifeRatio*0.25;
    // Range indicator
    ctx.beginPath();ctx.arc(0,0,pl.leechRange,0,Math.PI*2);
    ctx.strokeStyle=glow;ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=1;
    // Vine tendrils — 5 little arms
    for(let k=0;k<5;k++){
      const a=k/5*Math.PI*2+pl.pulse*.18;
      const len=(10+pl.feedCount*2)*pulse;
      ctx.save();ctx.rotate(a);
      ctx.strokeStyle=isFeeding?'#00cc55':'#228833';ctx.lineWidth=2;ctx.shadowBlur=0;
      ctx.beginPath();ctx.moveTo(0,0);
      ctx.bezierCurveTo(len*.4,-len*.2,len*.7,len*.3,len,0);
      ctx.stroke();
      // Leaf tip
      ctx.beginPath();ctx.arc(len,0,3+pl.feedCount*.5,0,Math.PI*2);
      ctx.fillStyle=isFeeding?'#00ff88':'#44cc44';ctx.fill();
      ctx.restore();ctx.shadowBlur=0;
    }
    // Central bulb
    ctx.beginPath();ctx.arc(0,0,(8+pl.feedCount*1.5)*pulse,0,Math.PI*2);
    ctx.fillStyle='#44cc44';ctx.shadowBlur=0;ctx.fill();
    // Glowing core when feeding
    if(isFeeding){
      ctx.beginPath();ctx.arc(0,0,4*pulse,0,Math.PI*2);
      ctx.fillStyle='#ffffff';ctx.shadowBlur=0;ctx.fill();
    }
    ctx.shadowBlur=0;
    // Life bar
    const bw=36;ctx.fillStyle='#001100';ctx.fillRect(-bw/2,-22,bw,4);
    ctx.fillStyle=lifeRatio>0.4?'#44ff66':'#ffaa00';
    ctx.fillRect(-bw/2,-22,bw*lifeRatio,4);
    // Feed count badge
    if(pl.feedCount>0){
      ctx.font='bold 9px monospace';ctx.fillStyle='#00ff88';ctx.textAlign='center';
      ctx.fillText(`×${pl.feedCount}`,0,-28);
    }
    // Latch count badge (e.g. "2/3")
    if(latched.length>0){
      ctx.font='bold 8px monospace';ctx.fillStyle='#aaffcc';ctx.textAlign='center';
      ctx.fillText(`${latched.length}/3`,0,26);
    }
    ctx.restore();
    // Leech lines to all latched enemies (drawn in world space)
    for(const le of latched){
      ctx.save();
      ctx.strokeStyle='#00ff88';ctx.lineWidth=1.5;ctx.globalAlpha=0.55+Math.sin(pl.pulse*4)*0.2;
      ctx.shadowBlur=0;ctx.setLineDash([3,4]);
      ctx.beginPath();ctx.moveTo(pl.x,pl.y);ctx.lineTo(le.x,le.y);ctx.stroke();
      ctx.setLineDash([]);ctx.shadowBlur=0;
      ctx.restore();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }}

  // ── ENEMY DRAW — simple shapes only ─────────────────────────────
  for(const e of s.enemies){
    if(e._dead) continue;
    const flash = e.hitFlash > 0;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = e.alpha || 1;

    // Body color
    const col = flash ? '#ffffff'
      : e._frozen  ? '#aaddff'
      : e._inferno ? '#ff3300'
      : e._onFire  ? '#ff8800'
      : e.color;

    // Shadow (cheap)
    if(!flash){
      ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.ellipse(0, 5, e.r*1.2, e.r*0.4, 0, 0, Math.PI*2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.globalAlpha = e.alpha || 1;
    }

    // Shape
    ctx.fillStyle = col;
    ctx.beginPath();
    const sh = e.shape || 'circle';
    if(sh === 'triangle'){
      const r=e.r; ctx.moveTo(0,-r); ctx.lineTo(r*0.87,r*0.5); ctx.lineTo(-r*0.87,r*0.5); ctx.closePath();
    } else if(sh === 'square'){
      const r=e.r*0.82; ctx.rect(-r,-r,r*2,r*2);
    } else if(sh === 'diamond'){
      const r=e.r; ctx.moveTo(0,-r); ctx.lineTo(r,0); ctx.lineTo(0,r); ctx.lineTo(-r,0); ctx.closePath();
    } else {
      ctx.arc(0, 0, e.r, 0, Math.PI*2);
    }
    ctx.fill();

    // Thin outline
    if(!flash){
      ctx.strokeStyle = e._onFire ? '#ffaa00' : e._frozen ? '#88ccff' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Status rings (cheap: single arc)
    if(e._frozen){
      ctx.strokeStyle='#aaddff'; ctx.lineWidth=2; ctx.globalAlpha=0.7;
      ctx.beginPath(); ctx.arc(0,0,e.r+3,0,Math.PI*2); ctx.stroke();
    }
    if(e._onFire||e._inferno){
      ctx.strokeStyle=e._inferno?'#ff2200':'#ff8800'; ctx.lineWidth=2; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.arc(0,0,e.r+2,0,Math.PI*2); ctx.stroke();
    }
    if(e._poisoned){
      ctx.strokeStyle='#44ff44'; ctx.lineWidth=1.5; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.arc(0,0,e.r+2,0,Math.PI*2); ctx.stroke();
    }
    if(e._bleeding){
      ctx.strokeStyle='#ff4444'; ctx.lineWidth=1.5; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.arc(0,0,e.r+1,0,Math.PI*2); ctx.stroke();
    }

    // Boss name label
    if(e.isBoss&&!e._isMiniboss){
      ctx.globalAlpha=0.9; ctx.fillStyle='#fff';
      ctx.font='bold 11px "Barlow Condensed",sans-serif';
      ctx.textAlign='center'; ctx.fillText(e.name, 0, -e.r-6);
    }
    // Elite marker
    if(e._elite&&!e.isBoss){
      ctx.globalAlpha=0.8; ctx.fillStyle='#ffd700';
      ctx.font='9px "Barlow Condensed",sans-serif';
      ctx.textAlign='center'; ctx.fillText('★', 0, -e.r-4);
    }

    ctx.restore();

    // HP bar (only enemies below 99% HP, skip tiny bars)
    if(e.hp < e.maxHp*0.99 && e.r > 6){
      const bw=e.r*2, bx=e.x-e.r, by=e.y-e.r-7;
      const pct=Math.max(0,e.hp/e.maxHp);
      ctx.globalAlpha=0.75;
      ctx.fillStyle='#1a1a2e'; ctx.fillRect(bx,by,bw,3);
      ctx.fillStyle=pct>0.5?'#44ff44':pct>0.25?'#ffaa00':'#ff2244';
      ctx.fillRect(bx,by,bw*pct,3);
      ctx.globalAlpha=1;
    }
  }

  // ── SKELETON ALLIES (Necromancer) ───────────────────────────────
  if(s._skeletons && s._skeletons.length){
    for(const sk of s._skeletons){
      if(sk._dead||sk._poolDead) continue;
      ctx.save();
      ctx.translate(sk.x, sk.y);
      const pulse = 0.7+Math.sin(s.totalTime*3+sk.x)*0.3;
      // Glow
      ctx.globalAlpha=0.18*pulse;
      ctx.beginPath();ctx.arc(0,0,sk.r*2.2,0,Math.PI*2);
      ctx.fillStyle='#aa00ff';ctx.fill();
      ctx.globalAlpha=1;
      // Body — dark purple circle
      ctx.beginPath();ctx.arc(0,0,sk.r,0,Math.PI*2);
      ctx.fillStyle='#220033';ctx.fill();
      ctx.strokeStyle='#aa44ff';ctx.lineWidth=1.5;ctx.stroke();
      // Skull symbol
      ctx.fillStyle='#cc88ff';ctx.globalAlpha=0.9;ctx.font='bold '+(sk.r*1.4)+'px serif';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💀',0,0);
      ctx.globalAlpha=1;
      // Life bar (skeletons use .life)
      const lifeRatio = sk.life/sk.maxLife;
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(-sk.r,-sk.r-6,sk.r*2,3);
      ctx.fillStyle='#aa44ff';ctx.fillRect(-sk.r,-sk.r-6,sk.r*2*lifeRatio,3);
      ctx.restore();
    }
  }

  // ── MELEE SWING VISUALS ──────────────────────────────────────────
  if(s.meleeSwings&&s.meleeSwings.length){
    ctx.save();
    for(const sw of s.meleeSwings){
      const t=sw.life/(sw.maxLife||0.22);
      if(t<=0) continue;
      ctx.globalAlpha=t*0.85;
      ctx.strokeStyle=sw.color||'#ffcc44';
      ctx.lineWidth=3+t*5;
      ctx.beginPath();
      if(sw.full){
        ctx.arc(sw.x,sw.y,sw.r,0,Math.PI*2);
      } else {
        ctx.arc(sw.x,sw.y,sw.r,sw.ang-sw.arcHalf,sw.ang+sw.arcHalf);
      }
      ctx.stroke();
      // Bright inner edge
      ctx.globalAlpha=t*0.5;
      ctx.lineWidth=1;
      ctx.strokeStyle='#ffffff';
      ctx.beginPath();
      if(sw.full){
        ctx.arc(sw.x,sw.y,sw.r,0,Math.PI*2);
      } else {
        ctx.arc(sw.x,sw.y,sw.r,sw.ang-sw.arcHalf,sw.ang+sw.arcHalf);
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  // ── BULLET DRAW ───────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha=0.92;
  const _blen=s.bullets.length;
  for(let _bi=0;_bi<_blen;_bi++){
    const b=s.bullets[_bi];
    if(b._dead||b._poolDead)continue;
    const bAng=Math.atan2(b.vy,b.vx);
    const fade=Math.min(1,b.life*3); // fade out near end of life
    ctx.globalAlpha=0.92*fade;

    if(b.isSniper||b.isHeadshot){
      // Sniper: bright elongated streak
      const len=b.r*(b.isHeadshot?14:10);
      ctx.strokeStyle=b.isHeadshot?'#ffee00':'#ff8800';
      ctx.lineWidth=b.r*(b.isHeadshot?2.2:1.6);
      ctx.beginPath();ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-Math.cos(bAng)*len,b.y-Math.sin(bAng)*len);
      ctx.stroke();
      // bright core
      ctx.strokeStyle='#ffffff';ctx.lineWidth=b.r*0.5;
      ctx.beginPath();ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-Math.cos(bAng)*len*0.4,b.y-Math.sin(bAng)*len*0.4);
      ctx.stroke();

    } else if(b.isAoEOrb||b._arcaneOrb||b._isNecroOrb){
      // Magic orb: pulsing circle with inner glow
      const col=b._isNecroOrb?'#aa00ff':b._arcaneOrb?'#cc44ff':'#cc44ff';
      ctx.fillStyle=col;
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
      // Rotating inner star
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(s.totalTime*4);
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath();
      for(let k=0;k<4;k++){const a=k/4*Math.PI*2;ctx.lineTo(Math.cos(a)*b.r*0.6,Math.sin(a)*b.r*0.6);}
      ctx.fill();ctx.restore();

    } else if(b.isAcidFlask){
      // Acid: green teardrop
      ctx.fillStyle='#88ff00';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(200,255,100,0.5)';
      ctx.beginPath();ctx.arc(b.x-Math.cos(bAng)*b.r*0.6,b.y-Math.sin(bAng)*b.r*0.6,b.r*0.5,0,Math.PI*2);ctx.fill();

    } else if(b._flameBullet){
      // Flame: hot core fading to orange
      const t=b.life/(b._maxLife||0.7);
      ctx.fillStyle=t>0.6?'#ffffff':t>0.3?'#ffaa00':'#ff4400';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r*(0.8+t*0.4),0,Math.PI*2);ctx.fill();

    } else if(b._iceShard||b._cryoRound){
      // Ice: pale blue diamond
      ctx.fillStyle=b.color||'#aaddff';
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(bAng);
      ctx.beginPath();ctx.moveTo(0,-b.r*1.3);ctx.lineTo(b.r*0.7,0);ctx.lineTo(0,b.r*0.9);ctx.lineTo(-b.r*0.7,0);ctx.closePath();
      ctx.fill();ctx.restore();

    } else if(b.isPhantom){
      // Phantom: translucent oval with trail
      ctx.globalAlpha*=0.7;
      ctx.fillStyle='#aaaaff';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
      // Ghost trail
      ctx.globalAlpha*=0.4;
      ctx.beginPath();ctx.arc(b.x-Math.cos(bAng)*b.r*2,b.y-Math.sin(bAng)*b.r*2,b.r*0.7,0,Math.PI*2);ctx.fill();

    } else if(b._isSoulBolt){
      // Soul bolt: dark purple with skull core
      ctx.fillStyle='#6600aa';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r*0.45,0,Math.PI*2);ctx.fill();

    } else if(b._isHolyBolt){
      // Holy: white/gold cross shape
      ctx.fillStyle='#ffffaa';
      ctx.save();ctx.translate(b.x,b.y);
      ctx.fillRect(-b.r*1.5,-b.r*0.4,b.r*3,b.r*0.8);
      ctx.fillRect(-b.r*0.4,-b.r*1.5,b.r*0.8,b.r*3);
      ctx.restore();

    } else if(b._trickCard){
      // Trick card: color by card type
      const cardColors={fire:'#ff4400',ice:'#44aaff',void:'#aa44ff',acid:'#88ff00',bolt:'#ffff44'};
      ctx.fillStyle=cardColors[b._trickCard]||'#ffffff';
      // Rotating diamond
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(s.totalTime*6+_bi);
      ctx.beginPath();ctx.moveTo(0,-b.r*1.2);ctx.lineTo(b.r,0);ctx.lineTo(0,b.r*1.2);ctx.lineTo(-b.r,0);ctx.closePath();
      ctx.fill();ctx.restore();

    } else if(b._druidThorn){
      // Druid thorn: green spike
      ctx.fillStyle='#44ff66';
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(bAng);
      ctx.beginPath();ctx.moveTo(b.r*1.6,0);ctx.lineTo(-b.r*0.5,b.r*0.7);ctx.lineTo(-b.r*0.5,-b.r*0.7);ctx.closePath();
      ctx.fill();ctx.restore();

    } else if(b._isMinigunBullet){
      // Minigun: small fast tracer
      ctx.strokeStyle='#ffaa44';ctx.lineWidth=b.r*1.2;
      ctx.beginPath();ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-Math.cos(bAng)*b.r*5,b.y-Math.sin(bAng)*b.r*5);
      ctx.stroke();

    } else {
      // Default: plain circle with color
      ctx.fillStyle=b.color||'#ffffff';
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha=1;


  for(const pt of s.particles){
    if(pt.isRing){
      const prog=Math.max(0,1-pt.life/.25);
      ctx.globalAlpha=Math.max(0,pt.life/.25)*0.7;
      ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r*prog,0,Math.PI*2);
      ctx.strokeStyle=pt.color;ctx.lineWidth=2;ctx.stroke();
    }else if(pt.isExpandRing){
      const prog=1-(pt.life/(pt.maxLife||.45));
      ctx.globalAlpha=Math.max(0,(pt.life/(pt.maxLife||.45))*(pt._echo?0.4:0.8));
      ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(0.5,pt.r*prog),0,Math.PI*2);
      ctx.strokeStyle=pt.color;ctx.lineWidth=pt._echo?1:2.5;ctx.stroke();
    }else{
      ctx.globalAlpha=Math.max(0,pt.life/.7);
      ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.fillStyle=pt.color;ctx.fill();
    }
  }
  ctx.globalAlpha=1;

  // Necromancer skeletons
  if(s._skeletons){for(const sk of s._skeletons){
    const skLifeRatio=sk.life/sk.maxLife;
    ctx.save();ctx.globalAlpha=Math.min(1,skLifeRatio*3)*0.85;ctx.translate(sk.x,sk.y);
    // Skeleton body — cross/bone shape
    ctx.strokeStyle='#aa44ff';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(-sk.r,0);ctx.lineTo(sk.r,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-sk.r);ctx.lineTo(0,sk.r);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,sk.r*0.6,0,Math.PI*2);ctx.strokeStyle='rgba(170,68,255,0.5)';ctx.lineWidth=1.5;ctx.shadowBlur=0;ctx.stroke();
    // Life bar
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-sk.r,-sk.r-7,sk.r*2,3);
    ctx.fillStyle='#aa44ff';ctx.fillRect(-sk.r,-sk.r-7,sk.r*2*skLifeRatio,3);
    ctx.restore();ctx.shadowBlur=0;
  }}

  // Player
  const p=s.player;
  const blinking=p.immune>0&&Math.floor(s.totalTime*14)%2===0;
  if(!blinking){
    ctx.save();ctx.translate(p.x,p.y);
    if(p._cloaked)ctx.globalAlpha=.28;
    if(p._barrier){ctx.beginPath();ctx.arc(0,0,p.r+12,0,Math.PI*2);ctx.strokeStyle='#ffaa00';ctx.lineWidth=2.5;ctx.shadowBlur=0;ctx.stroke();}
    if(p._berserkerRage){ctx.beginPath();ctx.arc(0,0,p.r+10,0,Math.PI*2);ctx.strokeStyle='#ff3355';ctx.lineWidth=2.5;ctx.stroke();}
    if(p._reaperHarvest){ctx.beginPath();ctx.arc(0,0,p.r+8,0,Math.PI*2);ctx.strokeStyle='#aa00ff';ctx.lineWidth=2;ctx.stroke();}
    if(p._counterActive){ctx.beginPath();ctx.arc(0,0,p.r+6,0,Math.PI*2);ctx.strokeStyle='#ffff00';ctx.lineWidth=2;ctx.stroke();}
    if(p._alchemyBoost&&p._alchemyBoost>1){ctx.beginPath();ctx.arc(0,0,p.r+9,0,Math.PI*2);ctx.strokeStyle='#aaff44';ctx.lineWidth=2;ctx.stroke();}
    if(p._rampageActive){
      const pulse=Math.sin(state.totalTime*8)*3;
      ctx.beginPath();ctx.arc(0,0,p.r+14+pulse,0,Math.PI*2);ctx.strokeStyle='#ff4500';ctx.lineWidth=3;ctx.shadowBlur=0;ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,p.r+20+pulse,0,Math.PI*2);ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;ctx.shadowBlur=0;ctx.stroke();
    }
    if((p._surgeFuryTimer||0)>0){
      ctx.beginPath();ctx.arc(0,0,p.r+11+Math.sin(state.totalTime*10)*2,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,124,43,0.9)';ctx.lineWidth=2.5;ctx.stroke();
    }
    if((p._surgeBlitzTimer||0)>0){
      ctx.beginPath();ctx.arc(0,0,p.r+16+Math.cos(state.totalTime*12)*2,0,Math.PI*2);
      ctx.strokeStyle='rgba(56,195,245,0.8)';ctx.lineWidth=1.5;ctx.stroke();
    }
    if((p._surgeVacuumTimer||0)>0){
      ctx.beginPath();ctx.arc(0,0,p.r+24+Math.sin(state.totalTime*7)*3,0,Math.PI*2);
      ctx.strokeStyle='rgba(30,255,160,0.45)';ctx.lineWidth=1.5;ctx.stroke();
    }
    // ── Garlic Aura visual ────────────────────────────────────
    if(p._garlicAura){
      const gLv=p._garlicLevel||1;
      const gR=[0,90,120,150,190][Math.min(4,gLv)];
      const pulse=0.55+Math.sin(state.totalTime*3.5)*0.25;
      const pulse2=0.35+Math.cos(state.totalTime*2.1)*0.15;
      // Outer haze ring
      ctx.beginPath();ctx.arc(0,0,gR,0,Math.PI*2);
      ctx.strokeStyle=`rgba(180,255,80,${pulse*0.45})`;ctx.lineWidth=gLv>=3?3.5:2;
      ctx.shadowBlur=0;ctx.stroke();ctx.shadowBlur=0;
      // Inner pulsing fill
      ctx.beginPath();ctx.arc(0,0,gR,0,Math.PI*2);
      ctx.fillStyle=`rgba(120,220,40,${pulse2*0.06})`;ctx.fill();
      // Rotating garlic clove dots
      const numDots=3+gLv;
      const rot=state.totalTime*0.8;
      for(let k=0;k<numDots;k++){
        const a=rot+k/numDots*Math.PI*2;
        const dr=gR*0.82+Math.sin(state.totalTime*2+k)*gR*0.08;
        ctx.beginPath();ctx.arc(Math.cos(a)*dr,Math.sin(a)*dr,3.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,255,100,${0.5+Math.sin(state.totalTime*3+k)*0.3})`;
        ctx.shadowBlur=0;ctx.fill();ctx.shadowBlur=0;
      }
    }
    const col=s.char.color||'#d4a000';
    // ── Shadow pool under player ──────────────────────────────
    ctx.save();ctx.globalAlpha=0.25;
    ctx.beginPath();ctx.ellipse(p.x,p.y+p.r*0.6,p.r*1.3,p.r*0.45,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fill();ctx.restore();
    // ── Direction to nearest enemy (aim line) ─────────────────
    if(s.enemies.length){
      let nr=null,nd=Infinity;
      for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nd){nr=e;nd=d;}}
      if(nr){
        const aimAng=Math.atan2(nr.y-p.y,nr.x-p.x);
        ctx.save();ctx.globalAlpha=0.22;
        ctx.beginPath();ctx.moveTo(Math.cos(aimAng)*(p.r+2),Math.sin(aimAng)*(p.r+2));
        ctx.lineTo(Math.cos(aimAng)*(p.r+12),Math.sin(aimAng)*(p.r+12));
        ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.shadowBlur=0;ctx.stroke();
        ctx.restore();ctx.shadowBlur=0;
      }
    }
    // ── Body: pentagon shape (unique, not a circle) ────────────
    const bodyRot=s.totalTime*0.0; // static for readability
    ctx.beginPath();
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2-Math.PI/2;ctx.lineTo(Math.cos(a)*p.r,Math.sin(a)*p.r);}
    ctx.closePath();
    ctx.fillStyle=col;ctx.shadowBlur=0;ctx.fill();
    // Outline
    ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.shadowBlur=0;ctx.stroke();
    // ── Inner core dot ────────────────────────────────────────
    ctx.beginPath();ctx.arc(0,0,p.r*0.28,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.shadowBlur=0;ctx.fill();ctx.shadowBlur=0;
    // ── Character color stripe ────────────────────────────────
    ctx.save();ctx.globalAlpha=0.5;
    ctx.beginPath();ctx.arc(0,0,p.r*0.62,0,Math.PI*2);
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
    ctx.globalAlpha=1;ctx.restore();ctx.shadowBlur=0;
  }

  ctx.textAlign='center';
  for(const f of s.floatTexts){
    const fsc=f.scale||1;
    const sz=Math.floor(13*fsc);
    ctx.globalAlpha=Math.max(0,Math.min(1,f.life));
    // Drop shadow for legibility
    ctx.font=`bold ${sz}px "Bebas Neue",sans-serif`;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillText(f.text,f.x+1,f.y+1);
    ctx.fillStyle=f.color;ctx.shadowBlur=0;
    ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.textAlign='left';
  ctx.restore();

  // ── MINIMAP ──────────────────────────────────────────────────────
  const mmEl=document.getElementById('minimap');
  if(mmEl){
    let mc=mmEl.querySelector('canvas');
    if(!mc){mc=document.createElement('canvas');mmEl.appendChild(mc);}
    mc.width=90;mc.height=62;
    const mx=mc.getContext('2d');
    // Dark background
    mx.fillStyle='rgba(4,4,16,0.85)';mx.fillRect(0,0,90,62);
    // Subtle grid
    mx.strokeStyle='rgba(60,60,100,0.35)';mx.lineWidth=0.5;
    for(let gx=0;gx<90;gx+=18){mx.beginPath();mx.moveTo(gx,0);mx.lineTo(gx,62);mx.stroke();}
    for(let gy=0;gy<62;gy+=12){mx.beginPath();mx.moveTo(0,gy);mx.lineTo(90,gy);mx.stroke();}
    const sx=90/W,sy=62/H;
    // Enemy blips — boss gets pulsing ring
    for(const e of s.enemies){
      if(e.isBoss&&e.isBurrowed)continue;
      const ex=e.x*sx,ey=e.y*sy;
      if(e.isBoss){
        mx.beginPath();mx.arc(ex,ey,5,0,Math.PI*2);
        mx.fillStyle='#ff0066';mx.shadowColor='#ff0066';mx.shadowBlur=8;mx.globalAlpha=0.95;mx.fill();
        mx.shadowBlur=0;
      } else {
        mx.beginPath();mx.arc(ex,ey,e._elite?2.8:1.8,0,Math.PI*2);
        mx.fillStyle=e._elite?'#ffd700':e.color;mx.globalAlpha=0.85;mx.fill();
      }
    }
    // Chest blips
    for(const c of s.chests){
      mx.beginPath();mx.arc(c.x*sx,c.y*sy,2.5,0,Math.PI*2);
      mx.fillStyle='#ffd700';mx.shadowColor='#ffd700';mx.shadowBlur=4;mx.globalAlpha=0.9;mx.fill();mx.shadowBlur=0;
    }
    // Player — bright cross
    const px2=s.player.x*sx,py2=s.player.y*sy;
    mx.strokeStyle='#ffffff';mx.lineWidth=1.5;mx.globalAlpha=1;mx.shadowColor='#ffffff';mx.shadowBlur=5;
    mx.beginPath();mx.moveTo(px2-3.5,py2);mx.lineTo(px2+3.5,py2);mx.stroke();
    mx.beginPath();mx.moveTo(px2,py2-3.5);mx.lineTo(px2,py2+3.5);mx.stroke();
    mx.shadowBlur=0;
    mx.globalAlpha=1;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════════════════════════
function updateHpHUD(){
  const p=state.player,pct=Math.max(0,p.hp/p.maxHp*100);
  const bar=document.getElementById('hp-bar');
  bar.style.width=pct+'%';
  bar.className='hud-bar-fill hp'+(pct<25?' low':pct<50?' mid':'');
  document.getElementById('hp-val').textContent=`${Math.max(0,Math.floor(p.hp))}/${p.maxHp}`;
  // Danger vignette — pulses red when low HP
  const _hpRatio = state ? state.player.hp/state.player.maxHp : 1;
  const _dv = document.getElementById('danger-vignette');
  if(_dv){
    if(_hpRatio < 0.3){
      _dv.style.opacity = (0.3-_hpRatio)/0.3 * 0.85;
      _dv.style.animation = _hpRatio<0.15?'dangerPulse .5s ease-in-out infinite':'dangerPulse 1s ease-in-out infinite';
    } else { _dv.style.opacity=0; _dv.style.animation=''; }
  }
}
function updateXpHUD(){
  const p=state.player;
  el('xp-bar').style.width=(p.xp/p.xpNext*100)+'%';
  el('xp-val').textContent=`${p.xp}/${p.xpNext} (Lv${p.level})`;
}
function updateKillsHUD(){
  el('kills-display').textContent=(state.player.kills||0).toLocaleString();
  const _g=state.player.gold||0;
  el('gold-display').textContent=_g>=1000?(_g/1000).toFixed(1)+'K':_g;
}
function updateLevelHUD(){el('level-display').textContent=state.player.level;}
function updateWaveHUD(){
  if(state){
    const _zh=el('zone-display');
    if(_zh){const _z=getZone(state.wave);_zh.textContent=_z.icon+' '+_z.name;_zh.style.color=_z.accent;}
  }
  el('wave-display').textContent=`WAVE ${state.wave}`;
}
function updateTimerHUD(){
  const t = Math.floor(state.totalTime);
  const timerEl = el('timer');
  timerEl.textContent = `${Math.floor(t/60)}:${(t%60).toString().padStart(2,'0')}`;
  timerEl.className = '';
  timerEl.title = 'Time survived';
  // Wave progress bar: how far through this 30s wave
  const WAVE_DURATION = 30;
  const waveProgress = (state.totalTime % WAVE_DURATION) / WAVE_DURATION;
  const secLeft = WAVE_DURATION - (state.totalTime % WAVE_DURATION);
  const fill = el('wave-timer-fill');
  if(fill){
    fill.style.width = (waveProgress * 100) + '%';
    // Color shifts red as wave ends — danger feel
    if(secLeft < 5 && state.wave%5!==0){
      fill.style.background = '#ff3344';
      fill.style.boxShadow = '0 0 8px rgba(255,50,68,0.6)';
    } else if(secLeft < 10){
      fill.style.background = '#ff8800';
      fill.style.boxShadow = '0 0 5px rgba(255,136,0,0.4)';
    } else {
      fill.style.background = 'var(--accent2)';
      fill.style.boxShadow = '';
    }
  }
}
function updateComboHUD(){
  if(!state)return;
  const c=state.combo;
  el('combo-hud').textContent=`×${c}`;
  el('combo-hud').style.color=c>=10?'#ff2200':c>=5?'#ff8800':c>=3?'#ffd700':'#00ffa3';
  const comboEl=el('combo-display');
  const txt=el('combo-text');
  if(c>1){
    comboEl.className='active'+(c>=20?' fire':c>=8?' hot':'');
    txt.textContent=c>=20?`×${c} 🔥`:c>=10?`×${c} HOT`:c>=5?`×${c} COMBO`:`×${c}`;
  } else {
    if(comboEl) comboEl.className='';
  }
}
function updateAbilityHUD(p){
  const cd=p._abilityCooldown,max=p._abilityMaxCd,ready=cd<=0;
  const fill=el('ability-cooldown-fill');
  fill.style.width=(ready?100:(1-cd/max)*100)+'%';
  fill.style.background=ready?'var(--accent3)':'#225533';
  const rt=el('ability-ready-text');
  rt.textContent=ready?'READY':`${cd.toFixed(1)}s`;
  rt.className=ready?'':'charging';
}
function initAbilityHUD(ch){
  el('ability-icon').textContent=ch.abilityIcon;
  const sapperEl=el('ability-name');if(sapperEl)sapperEl.dataset.base=ch.abilityName;
  el('ability-name').textContent=ch.abilityName;
}

// ═══════════════════════════════════════════════════════════════════
//  LEVEL UP / CHEST
// ═══════════════════════════════════════════════════════════════════
function pauseForUpgrade(s,count=3,isChest=false){
  s.paused=true;
  const pool=buildUpgradePool();
  let choices;
  if(isChest){
    const zone=getZone(s.wave);
    const zItems=(ZONE_ITEMS[zone.id]||[]);
    const owned=new Set(s.collectedItems.map(c=>c.id));
    const available=zItems.filter(u=>!owned.has(u.id));
    if(available.length&&Math.random()<0.45){
      const zi=available[Math.floor(Math.random()*available.length)];
      const base=getUpgradeChoices(pool,count-1);
      choices=[zi,...base].slice(0,count);
    } else {
      choices=getUpgradeChoices(pool,count);
    }
  } else {
    choices=getUpgradeChoices(pool,count);
  }
  if(!choices||!choices.length){showScreen('game-screen');s.paused=false;return;}

  const container=document.getElementById('upgrade-cards');
  const title=document.getElementById('levelup-title');
  container.innerHTML='';
  if(isChest){
    title.innerHTML='🎁 CHEST — CHOOSE AN UPGRADE 🎁';
    container.style.cssText='display:flex;flex-wrap:wrap;max-width:800px;justify-content:center;gap:9px;';
  }else{
    title.innerHTML='⚡ LEVEL '+s.player.level+'! CHOOSE AN UPGRADE ⚡';
    container.style.cssText='display:flex;flex-wrap:wrap;gap:12px;justify-content:center;';
  }

  choices.forEach(u=>{
    const card=document.createElement('div');
    card.className='upgrade-card '+(isChest?'chest-card ':'')+u.rarity;
    card.innerHTML=`<div class="ucard-icon">${u.icon}</div><div class="ucard-name" style="${u.cursed?'color:#ff4444':u.zone?'color:#00ccff':''}">${u.name}</div><div class="ucard-desc">${getCardDesc(u,s.player)}</div><div class="ucard-rarity ${u.rarity}">${u.rarity.toUpperCase()}${u.unique?' · ✦ UNIQUE':''}${u.cursed?' · ⚠ CURSED':''}${u.zone?' · 📍 ZONE':''}${SYNERGIES.some(syn=>syn.needs.some(id=>id===u.id))?' · ✨ SYNERGY':''}</div>`;
    card.onclick=()=>{
      u.apply(s.player);
      s.collectedItems.push({...u,_count:(s.collectedItems.filter(c=>c.id===u.id).length+1)});
      updateHpHUD();
      checkSynergies(s);
      updateSlotHUD(s);
      for(const k in keys) keys[k]=false;
      showScreen('game-screen');s.paused=false;
    };
    container.appendChild(card);
  });

  updateSlotHUD(s);
  const hint=document.querySelector('#levelup-screen .levelup-hint');
  if(hint){
    const rerollCost=s._rerollCost||15;
    hint.innerHTML=`CLICK A CARD · <button onclick="doReroll()" style="font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--surface2);color:var(--gold);border:1px solid var(--gold);padding:4px 10px;cursor:pointer;">🔄 REROLL (${rerollCost}💰)</button>`;
  }
  window._pendingIsChest=isChest;
  window._pendingCount=count;
  showScreen('levelup-screen');
}

function doReroll(){
  const s=state;if(!s)return;
  const cost=Math.round((s._rerollCost||15)*(s.player._cheapReroll?0.5:1));
  if(s.player.gold<cost){addFloat(s.player.x,s.player.y,'NOT ENOUGH GOLD!','#ff4400');return;}
  s.player.gold-=cost;
  updateKillsHUD();
  s._rerollCost=(s._rerollCost||15)*2;
  for(const k in keys) keys[k]=false;
  pauseForUpgrade(s,window._pendingCount||3,window._pendingIsChest||false);
}

function updateSlotHUD(s){
  const el=document.getElementById('slot-hud');
  if(!el||!s)return;
  // Show flat list of collected items as icons
  const seen=new Map();
  for(const c of s.collectedItems){
    seen.set(c.id,(seen.get(c.id)||0)+1);
  }
  if(!seen.size){el.innerHTML='';return;}
  let html='<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:820px">';
  for(const [id,count] of seen){
    const u=ALL_UPGRADES.find(x=>x.id===id)||BOSS_ITEMS.concat(EXTRA_BOSS_ITEMS||[]).find(x=>x.id===id);
    if(!u)continue;
    const rarityColor={common:'#aaaaaa',rare:'#38c3f5',epic:'#b060ff',legendary:'#f5c842'}[u.rarity]||'#aaa';
    html+=`<div title="${u.name}${count>1?' ×'+count:''}" style="width:26px;height:26px;border:1px solid ${rarityColor};background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;position:relative">${u.icon}${count>1?`<span style="position:absolute;bottom:0;right:1px;font-size:7px;color:${rarityColor};font-family:'JetBrains Mono',monospace">${count}</span>`:''}`;
    html+='</div>';
  }
  html+='</div>';
  el.innerHTML=html;
}

// ═══════════════════════════════════════════════════════════════════
//  STATS PANEL
// ═══════════════════════════════════════════════════════════════════
function openStats(){
  if(!state||state.gameOver)return;
  if(state.paused&&document.getElementById('levelup-screen').classList.contains('active'))return;
  state.paused=true;
  const p=state.player,ch=state.char;
  document.getElementById('char-info-wrap').innerHTML=`
    <div class="char-info-box">
      <div class="cib-icon">${ch.icon}</div>
      <div class="cib-text">
        <div class="cib-name">${ch.name} — ${ch.tag}</div>
        <div class="cib-desc">${ch.desc}</div>
        <div class="cib-ability">${ch.abilityIcon} ${ch.abilityName} · CD: ${p._abilityMaxCd.toFixed(1)}s</div>
      </div>
    </div>`;
  const s=state;
  const isMelee=s.char.weaponType==='melee';
  const sl=(k,v,next='')=>`<div class="stat-line"><span class="sl-key">${k}</span><span><span class="sl-val">${v}</span>${next?` <span class="sl-next">(+${next})</span>`:''}</span></div>`;
  document.getElementById('combat-stats').innerHTML=
    sl('Damage',`${Math.floor(p.damage)}${p._berserkerRage?` ×${p._berserkerDmgBoost} 🔥`:''}`,Math.max(3,Math.round(16*Math.pow(DR_DMG,p._dmgStacks||0))))+
    sl(isMelee?'Attack Speed':'Fire Rate',`${(1000/p.fireRate).toFixed(2)}/sec`)+
    (isMelee?sl('Swing Range',`${Math.floor(p.bulletSize*8+40)} px`):sl('Bullet Speed',p.bulletSpeed.toFixed(1)))+
    (isMelee?'':sl('Bullet Size',p.bulletSize.toFixed(1)))+
    sl(isMelee?'Multi-Hit':'Multi-Shot',`${p.multishot}${p.multishot>1?' (extra=40% dmg)':''}`)+
    sl('Piercing',p.piercing)+
    sl('Total Dealt',Math.floor(state.totalDamageDealt).toLocaleString());
  document.getElementById('defense-stats').innerHTML=
    sl('HP',`${Math.max(0,Math.floor(p.hp))} / ${p.maxHp}`)+
    sl('HP Regen',`${p._regen.toFixed(1)}/sec`)+
    sl('Move Speed',p.speed.toFixed(2))+
    sl('XP Magnet',p._magnetRange)+
    sl('Orbitals',p._orbitalCount)+
    sl('Vampiric',p._vampiric?'✓ YES':'—')+
    sl('Thorns',p._thorns?'✓ YES':'—')+
    sl('Explosive',p._explosiveBullets?'✓ YES':'—')+
    sl('Chain Lgtn',p._chainLightning?'✓ YES':'—')+
    sl('Slow Field',p._slowField?'✓ YES':'—')+
    sl('Wave',`${state.wave}`)+
    sl('Combo',`x${state.combo}`)+
    sl('Time',`${Math.floor(state.totalTime/60)}:${Math.floor(state.totalTime%60).toString().padStart(2,'0')}`);

  // Flat collected items display
  const items=state.collectedItems;
  document.getElementById('item-count').textContent=items.length;
  const seen=new Map();
  for(const c of items) seen.set(c.id,(seen.get(c.id)||0)+1);
  const grid=document.getElementById('items-grid');
  let html='';
  for(const [id,count] of seen){
    const u=ALL_UPGRADES.find(x=>x.id===id)||BOSS_ITEMS.concat(EXTRA_BOSS_ITEMS||[]).find(x=>x.id===id);
    if(!u)continue;
    html+=`<div class="item-badge ${u.rarity}"><div class="ib-icon">${u.icon}</div><div class="ib-name">${u.name}${count>1?' ×'+count:''}</div><div class="ib-tooltip">${u.icon} <strong>${u.name}</strong>${count>1?' ×'+count:''}<br>${u.desc||''}</div></div>`;
  }
  grid.innerHTML=html||'<div style="color:var(--muted);font-size:12px;padding:4px">No items yet...</div>';
  showScreen('stats-screen');
}

function closeStats(){if(!state)return;state.paused=false;document.getElementById('pause-overlay').classList.remove('active');showScreen('game-screen');}

function togglePause(){
  if(!state||state.gameOver)return;
  if(document.getElementById('stats-screen').classList.contains('active'))return closeStats();
  if(document.getElementById('levelup-screen').classList.contains('active'))return;
  state.paused=!state.paused;
  document.getElementById('pause-overlay').classList.toggle('active',state.paused);
}

// ═══════════════════════════════════════════════════════════════════
//  WAVE ANNOUNCE / GAME OVER / WIN
// ═══════════════════════════════════════════════════════════════════
function announceWave(msg, cls=''){
  const waveEl=el('wave-announce');
  waveEl.textContent=typeof msg==='number'?`⚔ WAVE ${msg} ⚔`:msg;
  waveEl.className='';void waveEl.offsetWidth;
  waveEl.classList.add('show');
  if(cls) waveEl.classList.add(cls);
  setTimeout(()=>{waveEl.className='';},2800);
}

function fmtTime(t){const s=Math.floor(t);return`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;}

function getHighScore(){try{return JSON.parse(localStorage.getItem('spudgeon_hs')||'{}');}catch(e){return{};}}
function saveHighScore(wave,kills,level,charName){
  const hs=getHighScore();
  let changed=false;
  if(!hs.wave||wave>hs.wave){hs.wave=wave;hs.waveChar=charName;changed=true;}
  if(!hs.kills||kills>hs.kills){hs.kills=kills;hs.killsChar=charName;changed=true;}
  if(!hs.level||level>hs.level){hs.level=level;hs.levelChar=charName;changed=true;}
  try{localStorage.setItem('spudgeon_hs',JSON.stringify(hs));}catch(e){}
  return changed;
}
function tryRevive(s, killerName){
  const p=s.player;
  // Phoenix Feather / Phoenix Crown / any revive item
  if((p._phoenix||p._phoenixCharges>0)&&!p._phoenixUsed){
    p._phoenixUsed=false; // allow re-trigger if more charges remain
    p._phoenix=false;
    p._phoenixCharges=Math.max(0,(p._phoenixCharges||1)-1);
    if(p._phoenixCharges>0)p._phoenix=true; // re-arm if charges left
    p.hp=Math.floor(p.maxHp*(p._phoenixCrown?0.80:0.35));
    p.immune=2.5;
    p._phoenixEver=true;
    // Big dramatic revive effect
    spawnParticles(s,p.x,p.y,'#ff8800',2);
    spawnParticles(s,p.x,p.y,'#ffdd00',2);
    spawnParticles(s,p.x,p.y,'#ffffff',3);
    abilityRing(s,p.x,p.y,'#ff8800',100,.6);
    abilityRing(s,p.x,p.y,'#ffdd00',180,.9);
    explodeAt(s,p.x,p.y,120,p.damage*2); // revive explosion hurts enemies
    triggerShake(10);
    flashEl('ability-flash');
    document.getElementById('ability-flash').style.background='rgba(255,140,0,0.45)';
    addFloat(p.x,p.y-20,'🔥 PHOENIX REVIVE!','#ff8800');
    updateHpHUD();
    return true; // survived
  }
  // VOLATILE: death explosion
  if(p._deathExplosion){
    p._deathExplosion=false;
    const pow=p._deathExplosionPower||5;
    explodeAt(s,p.x,p.y,250,p.damage*pow*10);
    abilityRing(s,p.x,p.y,'#ff4400',250,.5,{glow:40,lw:6});
    triggerShake(12);
    addFloat(p.x,p.y,'💣 VOLATILE!','#ff4400');
  }
  triggerGameOver(killerName);
  return false;
}

function calcRunGrade(s){
  const p=s.player;
  let score=0;
  score += s.wave * 14;
  score += (p.kills||0) * 0.3;
  score += (s._bossKills||0) * 40;
  score += Math.floor(s.totalTime/8);
  const dmgRatio = s.totalDamageTaken>0 ? s.totalDamageDealt/s.totalDamageTaken : 10;
  score += Math.min(60, dmgRatio*4);
  score += Math.min(40, (s.collectedItems||[]).length * 2);
  if(score>=400) return 'S';
  if(score>=250) return 'A';
  if(score>=130) return 'B';
  if(score>=60)  return 'C';
  return 'D';
}

function fmtBig(n){
  // Format large numbers: 1.2M, 450K, etc.
  if(n>=1e9) return (n/1e9).toFixed(2)+'B';
  if(n>=1e6) return (n/1e6).toFixed(2)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n).toLocaleString();
}

function goRetryChar(){
  // Retry with same character
  if(state&&state.char) selectedChar=state.char;
  startGame();
}

function triggerGameOver(killerName){
  state.gameOver=true;
  const s=state, p=s.player, t=s.totalTime;

  const earned=calcShardReward(s);
  addShards(earned);
  saveRunHistory(s);
  const newBest=saveHighScore(s.wave,p.kills,p.level,s.char.name);
  const hs=getHighScore();
  const grade=calcRunGrade(s);

  // ── Grade ──────────────────────────────────────────────────────
  const gradeEl=document.getElementById('run-grade');
  if(gradeEl){
    gradeEl.textContent=grade;
    gradeEl.className=grade; // set color class
    setTimeout(()=>gradeEl.classList.add('revealed'),300);
  }

  // ── Header ─────────────────────────────────────────────────────
  const charIcon=document.getElementById('go-char-icon');
  const charName=document.getElementById('go-char-name');
  if(charIcon) charIcon.textContent=s.char.icon;
  if(charName) charName.textContent=s.char.name;

  // Title: S rank gets special treatment
  const titleEl=document.getElementById('go-title');
  if(titleEl){
    if(grade==='S') titleEl.textContent='LEGENDARY RUN';
    else if(grade==='A') titleEl.textContent='IMPRESSIVE RUN';
    else if(grade==='B') titleEl.textContent='SOLID RUN';
    else titleEl.textContent='YOU DIED';
    const colors={S:'#ffd700',A:'var(--green)',B:'var(--blue)',C:'var(--purple)',D:'var(--red)'};
    titleEl.style.color=colors[grade]||'var(--red)';
  }

  // ── Killer banner ──────────────────────────────────────────────
  const killerEl=document.getElementById('go-killer');
  if(killerEl&&killerName){
    killerEl.style.display='block';
    killerEl.textContent=`💀 KILLED BY ${killerName.toUpperCase()}`;
  }

  // ── New best banner ────────────────────────────────────────────
  const bestEl=document.getElementById('go-newbest');
  if(bestEl&&newBest) bestEl.style.display='block';

  // ── Left stats column ──────────────────────────────────────────
  const sr=(label,val,trophy=false,color='')=>`<div class="stat-row">${color?`<span style="color:${color}">${label}</span>`:`<span>${label}</span>`}<span${trophy?' style="color:#ffd700"':''}>${val}${trophy?' 🏆':''}</span></div>`;
  const waveRecord = hs.wave && s.wave>=hs.wave;
  const killRecord = hs.kills && p.kills>=hs.kills;

  document.getElementById('go-stats-left').innerHTML=
    sr('WAVE REACHED', s.wave, waveRecord)+
    sr('KILLS', (p.kills||0).toLocaleString(), killRecord)+
    sr('BOSSES KILLED', s._bossKills||0)+
    sr('LEVEL', p.level)+
    sr('TIME SURVIVED', fmtTime(t))+
    sr('ITEMS COLLECTED', (s.collectedItems||[]).length)+
    sr('GOLD EARNED', (p._totalGoldEarned||p.gold||0).toLocaleString());

  // ── Right combat column ────────────────────────────────────────
  const dps = t>0 ? Math.round(s.totalDamageDealt/t) : 0;
  const ratio = s.totalDamageTaken>0 ? (s.totalDamageDealt/s.totalDamageTaken).toFixed(1) : '∞';
  document.getElementById('go-stats-right').innerHTML=
    sr('DAMAGE DEALT',    fmtBig(s.totalDamageDealt), false, '')+
    sr('DAMAGE TAKEN',    fmtBig(s.totalDamageTaken), false, '')+
    sr('DAMAGE RATIO',    ratio+'×')+
    sr('PEAK DPS',        fmtBig(s._peakDps||dps)+'/sec')+
    sr('BEST COMBO',      '×'+Math.max(s._bestCombo||1, s.combo||1))+
    sr('SHARDS EARNED',   '+'+earned, false, '#cc88ff')+
    sr('TOTAL SHARDS',    getShards(), false, '#cc88ff');

  // ── Items grid ─────────────────────────────────────────────────
  const itemsEl=document.getElementById('go-items');
  if(itemsEl){
    if(!s.collectedItems||!s.collectedItems.length){
      itemsEl.innerHTML='<span style="color:var(--muted2);font-size:11px">No items collected</span>';
    } else {
      // Count duplicates
      const seen=new Map();
      for(const c of s.collectedItems) seen.set(c.id,(seen.get(c.id)||0)+1);
      // Sort: legendary first, then epic, rare, common
      const rarityOrder={legendary:0,epic:1,rare:2,common:3};
      const unique=[...seen.entries()].map(([id,count])=>{
        const u=ALL_UPGRADES.find(x=>x.id===id)||BOSS_ITEMS.concat(EXTRA_BOSS_ITEMS||[]).find(x=>x.id===id);
        return u?{u,count}:null;
      }).filter(Boolean).sort((a,b)=>(rarityOrder[a.u.rarity]||3)-(rarityOrder[b.u.rarity]||3));

      itemsEl.innerHTML=unique.map(({u,count})=>
        `<div class="go-item-badge ${u.rarity||'common'}" title="${u.name}: ${u.desc||''}">
          <span>${u.icon}</span>
          <span style="font-size:10px">${u.name}</span>
          ${count>1?`<span class="go-ib-count">×${count}</span>`:''}
        </div>`
      ).join('');
    }
  }

  // ── Bosses timeline ────────────────────────────────────────────
  const bossesEl=document.getElementById('go-bosses');
  if(bossesEl){
    const bossLog=s._bossKillLog||[];
    if(!bossLog.length){
      bossesEl.innerHTML='<span style="color:var(--muted2);font-size:11px">No bosses defeated</span>';
    } else {
      const BOSS_ICONS_MAP={'KING SLIME':'🟢','DEATH STAR':'🔴','VOID TITAN':'🟣','FROST LICH':'🔵',
        'BLOOD MOON':'🌑','SHADOW HYDRA':'🐍','INFERNAL COLOSSUS':'🔥','STORM WITCH':'🧙',
        'PLAGUE LORD':'☣️','TITAN WORM':'🪱','MIRROR KNIGHT':'🪞','NETHER ARCHITECT':'🏗️',
        'TWIN SERPENTS':'🐉','THE RECURSION':'♾️','OMEGA CORE':'⚡'};
      bossesEl.innerHTML=bossLog.map(b=>{
        const icon=BOSS_ICONS_MAP[b.name]||'💀';
        return `<div class="go-boss-chip">${icon} <span style="color:var(--gold)">${b.name}</span> <span style="color:var(--muted2);font-size:9px">W${b.wave}</span></div>`;
      }).join('');
    }
  }

  // ── Shards + achievements ──────────────────────────────────────
  const shardsEl=document.getElementById('go-shards');
  if(shardsEl) shardsEl.textContent=`💠 +${earned} SHARDS  (${getShards()} total)`;
  const unlockedAch=getUnlockedAchievements();
  const achEl=document.getElementById('gameover-ach');
  if(achEl) achEl.textContent=`🏆 ${unlockedAch.length}/${ACHIEVEMENTS.length} ACHIEVEMENTS`;

  document.getElementById('boss-bar-wrap').classList.remove('active');
  setTimeout(()=>showScreen('gameover-screen'), 700);
}


function triggerWin(){
  // No win in infinite mode — show milestone banner
  announceWave(`🏆 WAVE ${state.wave} MILESTONE!`);
  spawnParticles(state,W/2,H/2,'#ffd700',4);
}


// ═══════════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  el(id).classList.add('active');
}
function showTitle(){
  if(raf){cancelAnimationFrame(raf);raf=null;}
  // Award shards for the run if quitting mid-game
  if(state&&!state.gameOver&&state.wave>1){
    const earned=calcShardReward(state);
    addShards(earned);
    saveRunHistory(state);
    saveHighScore(state.wave,state.player.kills,state.player.level,state.char.name);
  }
  state=null;
  const surgeHud=el('surge-hud');
  if(surgeHud){surgeHud.dataset.state='';surgeHud.innerHTML='';}
  const modsHud=el('active-mods-hud');
  if(modsHud)modsHud.innerHTML='';
  renderRunHistory();

  // Display highscores on title
  const hs=getHighScore();
  const hsel=document.getElementById('title-hs');
  if(hsel){
    if(hs.wave){hsel.innerHTML=`🏆 BEST: WAVE ${hs.wave} (${hs.waveChar||'?'}) &nbsp;|&nbsp; ☠ ${hs.kills||0} KILLS &nbsp;|&nbsp; ⚡ LVL ${hs.level||1}`;}
    else{hsel.innerHTML='— NO HIGH SCORE YET — PLAY TO SET ONE —';}
  // Show achievement count
  const achCount=getUnlockedAchievements().length;
  if(achCount>0&&hsel){hsel.innerHTML+=`<br><span style="color:#ffd700;font-size:9px">🏆 ${achCount}/${ACHIEVEMENTS.length} ACHIEVEMENTS UNLOCKED</span>`;}
  }
  document.getElementById('boss-bar-wrap').classList.remove('active');
  document.getElementById('pause-overlay').classList.remove('active');
  showScreen('title-screen');
}
function showCharSelect(){
  buildCharSelect();
  // Always start on step 1
  const s1=document.getElementById('char-step-1');
  const s2=document.getElementById('char-step-2');
  if(s1){s1.style.display='flex';s1.style.flexDirection='column';}
  if(s2){s2.classList.remove('visible');}
  showScreen('char-screen');
}
function showHowToPlay(){showScreen('howtoplay-screen');}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════
let _adminWave=1;
let _adminItems='none';

function adminSetWave(w){
  _adminWave=w;
  document.querySelectorAll('.admin-wave-btn').forEach(b=>{
    b.style.borderColor=parseInt(b.dataset.wave)===w?'#ffd700':'';
    b.style.color=parseInt(b.dataset.wave)===w?'#ffd700':'';
  });
}
function adminSetItems(v){
  _adminItems=v;
  document.querySelectorAll('.admin-items-btn').forEach(b=>{
    b.style.borderColor=b.dataset.items===v?'#ffd700':'';
    b.style.color=b.dataset.items===v?'#ffd700':'';
  });
}
function openAdminPanel(){
  const el=document.getElementById('admin-panel');
  el.style.display='flex';
  // Animate in
  el.style.opacity='0';
  el.style.transition='opacity 0.3s';
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.style.opacity='1'));
  adminSetWave(_adminWave);
  adminSetItems(_adminItems);
  // ESC closes
  const _esc=(ev)=>{if(ev.key==='Escape'){closeAdminPanel();document.removeEventListener('keydown',_esc);}};
  document.addEventListener('keydown',_esc);
  // little console easter egg
  console.log('%c👑 ADMIN MODE ACTIVATED 👑','color:#ffd700;font-size:18px;font-weight:bold;');
}
function closeAdminPanel(){
  const el=document.getElementById('admin-panel');
  el.style.opacity='0';
  setTimeout(()=>el.style.display='none',300);
}

const ADMIN_CHARACTER={
  id:'admin',name:'THE ADMIN',icon:'🛡️',tag:'GOD MODE',
  desc:'Unkillable bureaucrat. Infinite power, zero accountability.',
  abilityName:'ADMIN OVERRIDE',abilityCooldown:0.1,
  passive:'🔒 Immune to all damage. All items active.',
  weaponType:'ranged',
  pip:[5,5,5,5],
  statMods:{speed:2.4,damage:9985,fireRate:-9999,maxHp:99899},
  ability(s){
    const p=s.player;
    // Area nuke — explodeAt handles the damage, deferred kills handle cleanup
    explodeAt(s,p.x,p.y,600,99999);
    spawnParticles(s,p.x,p.y,'#ffd700',5);
    abilityRing(s,p.x,p.y,'#ffd700',500,0.8);
    addFloat(p.x,p.y,'👑 ADMIN OVERRIDE','#ffd700');
    triggerShake(20);
  },
};


// ═══════════════════════════════════════════════════════════════════
//  ZONES
// ═══════════════════════════════════════════════════════════════════
const ZONES=[
  {id:'dungeon',name:'THE DUNGEON', waves:[1,33],  icon:'🏰',
   hexColor:'rgba(60,45,100,0.22)',  dustColor:'255,255,255', accent:'#8866ff',
   enemyTint:null,   enemyHpMult:1.0,  entryMsg:'⚔️ ENTER THE DUNGEON'},
  {id:'volcano',name:'THE VOLCANO', waves:[34,66], icon:'🌋',
   hexColor:'rgba(120,40,10,0.28)', dustColor:'255,140,60',  accent:'#ff6600',
   enemyTint:'#ff4400', enemyHpMult:1.40, entryMsg:'🌋 DESCEND INTO THE VOLCANO'},
  {id:'void',   name:'THE VOID',   waves:[67,100],icon:'🌀',
   hexColor:'rgba(0,60,80,0.32)',   dustColor:'80,220,255',  accent:'#00ccff',
   enemyTint:'#0044ff', enemyHpMult:1.80, entryMsg:'🌀 ENTER THE VOID'},
];
function getZone(wave){return ZONES.find(z=>wave>=z.waves[0]&&wave<=z.waves[1])||ZONES[0];}
function getZoneIndex(wave){return ZONES.findIndex(z=>wave>=z.waves[0]&&wave<=z.waves[1]);}

// Zone-exclusive items
const ZONE_ITEMS={
  dungeon:[
    {id:'zi_dungeon_shadow',name:'SHADOW CLOAK',icon:'🌑',rarity:'epic',zone:'dungeon',unique:true,
     desc:'Every 8s auto-cloak for 1.5s. Attacks from cloak deal +60% damage.',
     apply(p){p._autoCloakItem=true;p._autoCloakTimer=8.0;}},
    {id:'zi_dungeon_blood', name:'CURSED BLADE', icon:'🗡️',rarity:'epic',zone:'dungeon',unique:true,cursed:true,
     desc:'⚠ CURSED: -40 Max HP. 8% lifesteal on hit, +2 HP per kill.',
     apply(p){p.maxHp=Math.max(30,p.maxHp-40);p.hp=Math.min(p.hp,p.maxHp);p._lifeLeech=true;p._leechLevel=4;p._vampiric=true;p._vampHpPerKill=2;}},
  ],
  volcano:[
    {id:'zi_volcano_magma', name:'MAGMA CORE',  icon:'🔥',rarity:'epic',zone:'volcano',unique:true,
     desc:'Bullets leave fire patches on hit. Fire damage +40% in the Volcano.',
     apply(p){p._magmaCore=true;p._incendiaryBullets=true;}},
    {id:'zi_volcano_fury',  name:'BERSERKER FURY',icon:'😡',rarity:'epic',zone:'volcano',unique:true,cursed:true,
     desc:'⚠ CURSED: Taking damage boosts damage +8% for 4s, stacking up to 5×.',
     apply(p){p._berserkFury=true;}},
  ],
  void:[
    {id:'zi_void_rift',     name:'VOID RIFT',  icon:'🌀',rarity:'epic',zone:'void',unique:true,
     desc:'Kills have 20% chance to spawn a rift that pulls nearby enemies in.',
     apply(p){p._voidRift=true;}},
    {id:'zi_void_anchor',   name:'NULL ANCHOR', icon:'⚓',rarity:'epic',zone:'void',unique:true,cursed:true,
     desc:'⚠ CURSED: You cannot move. +4 orbitals, orbitals deal 3× damage.',
     apply(p){p._nullAnchor=true;p._orbitalCount+=4;p._orbitalDmgBonus=(p._orbitalDmgBonus||0)+p.damage*3;}},
  ],
};

// ═══════════════════════════════════════════════════════════════════
//  ITEM SYNERGIES
// ═══════════════════════════════════════════════════════════════════
const SYNERGIES=[
  // All needs IDs must exactly match items in ALL_UPGRADES or BOSS_ITEMS
  {id:'syn_cryo_chain',     name:'FROZEN THUNDER',  icon:'⚡❄️',
   needs:['freeze1','chain1'],
   desc:'Chain Lightning guaranteed to proc on frozen enemies.',
   apply(p){p._syn_cryoChain=true;}},
  {id:'syn_cryo_chain2',    name:'PERMAFROST STORM',icon:'🌩️',
   needs:['cryo2','chain2'],
   desc:'Chains also freeze hit enemies.',
   apply(p){p._syn_cryoChain2=true;}},
  {id:'syn_phoenix_leech',  name:'ETERNAL FLAME',   icon:'🔥',
   needs:['bi_phoenix','p_leech'],
   desc:'Phoenix revive fully heals you.',
   apply(p){p._syn_phoenixLeech=true;p._phoenixCrown=true;}},
  {id:'syn_seeker_ricochet',name:'HOMING RICOCHET', icon:'🎯',
   needs:['seeker1','ricochet1'],
   desc:'Ricocheted bullets home to nearest enemy.',
   apply(p){p._syn_seekerRicochet=true;}},
  {id:'syn_garlic_orb',     name:'THORNRING',       icon:'🧄',
   needs:['garlic1','orb1'],
   desc:'Orbitals pulse garlic damage outward every 0.5s.',
   apply(p){p._syn_garlicOrb=true;}},
  {id:'syn_nova_explosive', name:'CHAIN REACTION',  icon:'💥',
   needs:['nova1','expl1'],
   desc:'Nova explosions trigger bullet explosions.',
   apply(p){p._syn_novaBoom=true;}},
  {id:'syn_nova2_explosive2',name:'SUPERNOVA',      icon:'🌟',
   needs:['nova2','expl2'],
   desc:'Nova also spawns 3 seeking bullets at full damage.',
   apply(p){p._syn_novaSeeker=true;}},
  {id:'syn_bleed_execute',  name:'HEMORRHAGIC DEATH',icon:'🩸',
   needs:['bleed1','new_executioner'],
   desc:'Executioner bonus doubled on bleeding enemies.',
   apply(p){p._syn_bleedExecute=true;}},
  {id:'syn_storm_aegis',    name:'AEGIS STORM',     icon:'🛡️⚡',
   needs:['bi_aegis','chain1'],
   desc:'Each Aegis block releases a chain lightning burst.',
   apply(p){p._syn_aegisStorm=true;}},
  {id:'syn_reaper_nova',    name:'DEATH BLOOM',     icon:'💀',
   needs:['reaper1','nova1'],
   desc:'Chain-killed enemies also trigger Nova.',
   apply(p){p._syn_reaperNova=true;}},
  {id:'syn_gold_armor',     name:'GILDED FORTRESS', icon:'🏰',
   needs:['gold2','p_armor2'],
   desc:'+1 gold per kill for each 10% armor you have.',
   apply(p){p._syn_goldArmor=true;}},
  {id:'syn_garlic_thorns',  name:'TOXIC THORNS',    icon:'🌵',
   needs:['garlic1','p_thorns'],
   desc:'Thorns reflect damage + apply garlic burn.',
   apply(p){p._syn_garlicThorns=true;}},
];
function checkSynergies(s){
  const p=s.player;
  const owned=new Set(s.collectedItems.map(c=>c.id));
  for(const syn of SYNERGIES){
    if(!p['_synOwned_'+syn.id]&&syn.needs.every(id=>owned.has(id))){
      p['_synOwned_'+syn.id]=true;syn.apply(p);
      p._anySynergy=true;p._synergyCount=(p._synergyCount||0)+1;
      addFloat(p.x,p.y-40,'✨ SYNERGY: '+syn.name+'!','#ffd700');
      spawnParticles(s,p.x,p.y,'#ffd700',3);
      showAchievementToast('✨ SYNERGY: '+syn.name);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  RUN HISTORY
// ═══════════════════════════════════════════════════════════════════
function getRunHistory(){try{return JSON.parse(localStorage.getItem('spudgeon_history')||'[]');}catch(e){return [];}}
function saveRunHistory(s){
  const p=s.player;
  const run={date:new Date().toLocaleDateString(),char:s.char.icon+' '+s.char.name,
    wave:s.wave,kills:p.kills,level:p.level,grade:calcRunGrade(s),
    zone:getZone(s.wave).icon,items:s.collectedItems.map(i=>i.icon).join('').slice(0,10),
    time:Math.floor(s.totalTime)};
  const hist=getRunHistory();hist.unshift(run);if(hist.length>5)hist.length=5;
  try{localStorage.setItem('spudgeon_history',JSON.stringify(hist));}catch(e){}
}
function renderRunHistory(){
  const hist=getRunHistory();
  const el=document.getElementById('title-run-history');
  if(!el)return;
  if(!hist.length){el.innerHTML='';return;}
  el.innerHTML='<div style="font-family:&quot;Barlow Condensed&quot;,sans-serif;font-size:9px;color:#444;letter-spacing:2px;margin-bottom:5px;text-align:center;">RECENT RUNS</div>'+
  hist.map(r=>'<div style="display:flex;gap:8px;align-items:center;font-family:&quot;JetBrains Mono&quot;,monospace;font-size:8px;padding:3px 0;border-bottom:1px solid #12122a;">'+
    '<span style="color:#bbb;min-width:55px;overflow:hidden;">'+r.char+'</span>'+
    '<span style="color:#ffd700;min-width:26px;">W'+r.wave+'</span>'+
    '<span style="color:#ff8800;min-width:16px;">'+r.grade+'</span>'+
    '<span style="color:#888;min-width:12px;">'+r.zone+'</span>'+
    '<span style="color:#666;letter-spacing:-1px;">'+r.items+'</span>'+
    '<span style="color:#444;margin-left:auto;">'+r.date+'</span>'+
  '</div>').join('');
}

function startAdminRun(){
  closeAdminPanel();
  for(const k in keys) keys[k]=false;

  // Swap in admin character
  selectedChar=ADMIN_CHARACTER;
  resize();
  state=initState();
  const p=state.player;
  p.x=W/2;p.y=H/2;

  // God-mode overrides — damage is so high everything dies in 1 hit anyway
  p.hp=99999;p.maxHp=99999;
  p._regen=999;
  p.damage=9999;
  p.speed=4.5;
  p.fireRate=120;      // fast but not frame-melting
  p.bulletSpeed=10;
  p.bulletSize=8;
  p.piercing=3;        // 3 is enough — 9999 dmg kills everything in 1 hit
  p.multishot=3;       // 3 shots spread, not 5
  p._magnetRange=300;

  // Passive survivability — no expensive per-hit procs
  p._vampiric=true;p._vampHpPerKill=10;
  p._thorns=true;
  p._bossBarrierMax=1;p._bossBarrierReady=true;
  p._warlordCrown=true;
  p._phoenix=true;p._phoenixCrown=true;p._phoenixCharges=99;
  p._tyrantFist=true;p._tyrantContactDmg=500;
  p._orbitalCount=3;
  p._endlessHunger=true;
  p._stormMantle=true;p._stormMantleTimer=0.1;
  p._soulShard=true;
  p._goldBonus=100;
  p._executioner=true;
  p._novaCore=true;p._novaCoreTimer=3.0;
  // Skip the chain lightning / explosive / echo / seeker — they cause O(n²) blowup
  // Nova core + high damage + orbital is more than enough

  // Skip to chosen wave
  if(_adminWave>1){
    state.wave=_adminWave;
    state.totalTime=(_adminWave-1)*30; // jump totalTime so wave calc matches
  }

  // Apply max shard upgrades
  if(_adminItems==='meta'||_adminItems==='all'){
    applyShardUpgradesToPlayer(p,state);
  }
  if(_adminItems==='all'){
    // Give every upgrade in the pool once
    const pool=ALL_UPGRADES;
    for(const u of pool){try{u.apply(p);}catch(ex){}}
  }

  applyRunModifier(state);
  updateShardHUD();updateRunModHUD();
  updateSurgeHUD(state);
  const modsHud=el('active-mods-hud');if(modsHud)modsHud.innerHTML='';
  const shardHudEl=document.getElementById('shard-hud');if(shardHudEl)shardHudEl.style.display='block';
  const rmodHud=document.getElementById('run-mod-hud');if(rmodHud)rmodHud.style.display='block';
  showScreen('game-screen');
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('boss-bar-wrap').classList.remove('active');

  // Admin has no real ability HUD needed but init it anyway
  initAbilityHUD(ADMIN_CHARACTER);
  updateWaveHUD();updateHpHUD();updateXpHUD();updateLevelHUD();updateKillsHUD();updateComboHUD();
  announceWave(`👑 ADMIN RUN — WAVE ${_adminWave}`);
  initStarfield();
  if(raf)cancelAnimationFrame(raf);
  state.lastTime=performance.now();
  raf=requestAnimationFrame(gameLoop);

  // Admin is immune to damage — patch the damage intake
  state._adminMode=true;
}

function startGame(){
  // Clear all held keys so movement doesn't carry over from menus
  for(const k in keys) keys[k]=false;
  resize();
  state=initState();
  state.player.x=W/2;state.player.y=H/2;
  applyShardUpgradesToPlayer(state.player,state);
  // Apply start shield from meta upgrades
  if(state.player._startShield>0){
    state.player._barrier=true;
    state.player._barrierHp=state.player._startShield;
    state.player._barrierMax=state.player._startShield;
  }
  applyRunModifier(state);
  updateShardHUD();
  updateRunModHUD();
  updateSurgeHUD(state);
  const modsHud=el('active-mods-hud');if(modsHud)modsHud.innerHTML='';
  const shardHudEl=document.getElementById('shard-hud');if(shardHudEl)shardHudEl.style.display='block';
  const rmodHud=document.getElementById('run-mod-hud');if(rmodHud)rmodHud.style.display='block';
  showScreen('game-screen');
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('boss-bar-wrap').classList.remove('active');
  initAbilityHUD(selectedChar);
  updateWaveHUD();updateHpHUD();updateXpHUD();updateLevelHUD();updateKillsHUD();updateComboHUD();
  announceWave('WAVE 1 — BEGIN!');
  initStarfield();
  if(raf)cancelAnimationFrame(raf);
  state.lastTime=performance.now();
  raf=requestAnimationFrame(gameLoop);
}

// ── STARFIELD ──────────────────────────────────────────────────────
let stars=[];
function initStarfield(){
  if(!starfieldCanvas)return;
  starfieldCanvas.width=W;
  starfieldCanvas.height=H;
  stars=[];
  for(let i=0;i<150;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.3,spd:Math.random()*0.4+0.05,bright:Math.random()});
}
// Cached hex grid — drawn once to an offscreen canvas
let _hexCache=null;
let _zoneHexColor='rgba(60,45,100,0.22)';
let _zoneDustColor='255,255,255';
function buildHexCache(W2,H2){
  const oc=document.createElement('canvas');oc.width=W2;oc.height=H2;
  const octx=oc.getContext('2d');
  const HEX=36,hh=HEX*Math.sqrt(3)/2;
  octx.lineWidth=0.7;octx.strokeStyle=_zoneHexColor;
  octx.globalAlpha=0.35+Math.min(0.25,((state&&state.combo)||1)*0.01);
  for(let row=-1;row<H2/hh+2;row++){
    for(let col=-1;col<W2/(HEX*1.5)+2;col++){
      const cx=col*HEX*1.5;
      const cy=(col%2===0)?row*hh:row*hh+hh/2;
      octx.beginPath();
      for(let k=0;k<6;k++){
        const a=Math.PI/180*(60*k-30);
        octx.lineTo(cx+HEX*0.5*Math.cos(a),cy+HEX*0.5*Math.sin(a));
      }
      octx.closePath();octx.stroke();
    }
  }
  return oc;
}
function drawStarfield(dt){
  if(!starfieldCanvas||!starfieldCtx)return;
  const sctx=starfieldCtx;
  const W2=starfieldCanvas.width,H2=starfieldCanvas.height;
  sctx.clearRect(0,0,W2,H2);
  const t=state?state.totalTime:0;
  // ── Cached hex tile grid ─────────────────────────────────────
  if(!_hexCache||_hexCache.width!==W2)_hexCache=buildHexCache(W2,H2);
  sctx.drawImage(_hexCache,0,0);
  // ── Dust motes drifting up ───────────────────────────────────
  for(const st of stars){
    st.y-=st.spd*(60*dt); // drift UP
    st.x+=Math.sin(t*0.3+st.bright*6)*0.2; // gentle sway
    if(st.y<-4){st.y=H2+4;st.x=Math.random()*W2;}
    const tw=0.25+Math.sin(t*1.5+st.bright*8)*0.2;
    sctx.globalAlpha=tw;
    // Color motes: mostly white but occasional tinted
    const hue=_zoneDustColor||'255,255,255';
    sctx.fillStyle=`rgb(${hue})`;
    sctx.beginPath();sctx.arc(st.x,st.y,st.r,0,Math.PI*2);sctx.fill();
  }
  sctx.globalAlpha=1;
  // Fog of War (BLACKOUT modifier)
  if(state&&state._modFog){
    const px=state.player.x,py=state.player.y;
    const grad=sctx.createRadialGradient(px,py,60,px,py,260);
    grad.addColorStop(0,'rgba(0,0,0,0)');
    grad.addColorStop(0.5,'rgba(0,0,0,0.6)');
    grad.addColorStop(1,'rgba(0,0,0,0.94)');
    sctx.fillStyle=grad;sctx.fillRect(0,0,W2,H2);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('keydown',e=>{

  keys[e.key]=true;

  // ── SECRET ADMIN: press L five times ────────────────────────────
  if(e.key==='l'||e.key==='L'){
    window._lPresses=(window._lPresses||0)+1;
    clearTimeout(window._lTimer);
    window._lTimer=setTimeout(()=>{window._lPresses=0;},2000);
    if(window._lPresses>=5){
      window._lPresses=0;
      openAdminPanel();
    }
  }
  if(e.key===' '){
    e.preventDefault();
    if(state&&!state.paused&&!state.gameOver){
      const p=state.player;
      if(p._abilityCooldown<=0&&!p._sapperDebuff){
        state.char.ability(state);
        if((p._abilityCharges||0)>1){
          p._abilityCharges--;
          p._abilityCooldown=p._abilityMaxCd*0.15;
          addFloat(p.x,p.y-30,`⚡ ${p._abilityCharges} CHARGES`,'#00ffff');
        } else {
          p._abilityCooldown=p._abilityMaxCd*(state._modSapper?2.0:1.0);
        }
      }
    }
  }
  if(e.key==='Tab'){
    e.preventDefault();
    if(state&&!state.gameOver){
      if(state.paused&&document.getElementById('stats-screen').classList.contains('active'))closeStats();
      else if(!state.paused)openStats();
    }
  }
  if(e.key==='p'||e.key==='P'){if(state&&!state.gameOver)togglePause();}
  if(e.key==='Escape'){
    if(state&&!state.gameOver){
      if(document.getElementById('stats-screen').classList.contains('active'))closeStats();
      else togglePause();
    }
  }
});
window.addEventListener('keyup',e=>{keys[e.key]=false;});
window.addEventListener('resize',()=>{if(state&&!state.gameOver)resize();});

// ═══════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════
resize();
buildCharSelect();

