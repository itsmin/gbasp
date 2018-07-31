////
// Axe.js
// Tile Object type
////

function Axe() {
	// class constructor
}

Axe.prototype = new Tile();
Axe.prototype.__name = 'Axe';
Axe.prototype.collisions = true;
Axe.prototype.solid = false;
Axe.prototype.ground = false;

Axe.prototype.onHit = function(source) {
	// something touched us

	if ((source.type == 'Character') && (Effect.Game.getState() == 'run')) {
		// set axe mode
		source.state = 'axe';
		source.holdFrameX = 0; // just in case
		
		if (source.star) {
			source.star = false;
			source.flash = 0;
			source.setFrameY( 0 );
			if (source.flower) source.setImage( source.brother + '_flower_power.gif' );
			else source.setImage( source.brother + '_' + (source.size ? 'large' : 'small') + '.gif' );
			source.category = 'character';
		} // kill star power
		
		if (level.bowser_killed) {
			// bowser already killed, so skip first part
			Effect.Game.fireHandler( 'onWorldComplete' );
		}
		else {
			// bowser still alive, so cut bridge
			// play end of level sounds
			Effect.Audio.playSound( 'music_defeat_bowser' );
		
			// change game state so timer countdown stops
			Effect.Game.setState('world_complete_a');
			
			// set pointer to bridge tile
			source.bridge_tx = this.tx - 1;
			source.bridge_ty = this.ty + 2;
			
			// stop all sprites except mario
			this.plane.spritePlane.setSoloSprite( source );
		}
	} // character
};
////
// BonusDisplay.js
// Sprite Object
////

function BonusDisplay() {
	// class constructor

	// sprite members
	this.url = '100.gif';
	this.width = 16;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = -1;
	this.timer = 30;
	this.stick = false;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

BonusDisplay.prototype = new Sprite();
BonusDisplay.prototype.__name = 'BonusDisplay';

BonusDisplay.prototype.init = function() {
	// override sprite init
	this.require('amount');

	// set sprite members
	if ((typeof(this.tx) != 'undefined') && (typeof(this.ty) != 'undefined')) {
		this.x = this.tx * this.plane.tilePlane.tileSizeX;
		this.y = (this.ty * this.plane.tilePlane.tileSizeY) + 4;
	}
	this.require('x', 'y');

	this.url = this.amount + '.gif';

	// call super's init
	Sprite.prototype.init.call(this);
};

BonusDisplay.prototype.logic = function() {
	// logic loop
	this.y += this.yd;
	this.x += this.xd;

	this.timer--;
	if (this.timer < 1) {
		// time to die (or just stop moving)
		this.xd = 0;
		this.yd = 0;
		if (!this.stick) this.destroy();
	}
};
////
// BouncerTile.js
// Sprite Object
////

function BouncerTile() {
	// class constructor

	// sprite members
	this.url = '';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = -3;

	// behavior attributes
	this.solid = true;
	this.ground = true;
	this.collisions = true;
	this.dieOffscreen = false;
	this.category = 'projectile'; // so it kills enemies
}

BouncerTile.prototype = new Sprite();
BouncerTile.prototype.__name = 'BouncerTile';

BouncerTile.prototype.init = function() {
	// override sprite init
	this.require('tileIdx', 'tx', 'ty');

	// set sprite members
	this.url = this.plane.tilePlane.tileImagePath + '/' + this.tileIdx;
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	this.finalY = this.y;

	// call super's init
	Sprite.prototype.init.call(this);
};

BouncerTile.prototype.logic = function() {
	// logic loop
	if (this.yd < 0) {
		// headed upwards
		var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
		if (hit && (hit.target.type != 'Character')) {
			// hit something
			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
		}
	}
	this.y += this.yd;
	this.yd++;
	
	if (this.y >= this.finalY) {
		// we reached our final resting place
		// restore original tile and die
		this.plane.tilePlane.setTile( this.tx, this.ty, this.tileIdx, 'data' );
		this.destroy();
	}
};
////
// Bowser.js
// Enemy Object
////

function Bowser() {
	// class constructor

	// sprite members
	this.url = 'bowser.gif';
	this.width = 32;
	this.height = 32;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = -1;
	this.yd = 0;
	this.state = 'roam';
	this.facing = 4; // 0 = right, 4 = left
	this.mouth = 0; // 0 = open, 2 = closed
	this.energy = 5; // 5 hits to kill us with fireballs
	this.x_min = 0;
	this.x_max = 0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'enemy';
}

Bowser.prototype = new Sprite();
Bowser.prototype.__name = 'Bowser';

Bowser.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = ((this.ty * this.plane.tilePlane.tileSizeY) + this.plane.tilePlane.tileSizeY) - this.height;
	
	if (this.minTileX) this.x_min = this.minTileX * this.plane.tilePlane.tileSizeX;
	if (this.maxTileX) this.x_max = ((this.maxTileX * this.plane.tilePlane.tileSizeY) + this.plane.tilePlane.tileSizeY) - this.width;

	// call super's init
	Sprite.prototype.init.call(this);
};

Bowser.prototype.logic = function(logicClock) {
	// perform logic routine
	this[ 'logic_' + this.state ](logicClock);
};

Bowser.prototype.logic_roam = function(logicClock) {
	// roam around
	this.setFrameX( this.facing + this.mouth + parseInt(logicClock / 14, 10) % 2 );
	
	var onGround = false;
	
	// gravity
	if (this.yd < 0) {
		// headed upwards
		var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
		if (hit) {
			// hit head
			// this.y = hit.correctedY;
			// this.y += this.yd;
			// if (hit.target.solid) this.yd = 0;

			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		// bowser has no upward solid collision detection
		this.y += this.yd;
		this.yd += 0.5;
	}
	else {
		// headed downwards
		if (!this.yd) this.yd = 1;

		var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		if (hit) {
			// landed on something
			this.y = (hit.correctedY - this.height) + 1;
			
			if (hit.target.solid || hit.target.ground) {
				this.yd = 0;
				onGround = true;
			}

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else {
			// still falling
			this.y += this.yd;
			this.yd += 0.1;
			if (this.yd > 4) this.yd = 4;
		}
	}
	
	// horizontal movement
	if (this.xd < 0) {
		var hit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
		if (hit && (hit.target.type != 'Platform')) {
			this.x = hit.correctedX;
			if (hit.target.solid) this.xd = 0 - this.xd;

			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		var hit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
		if (hit && (hit.target.type != 'Platform')) {
			this.x = (hit.correctedX - this.width) + 1;
			if (hit.target.solid) this.xd = 0 - this.xd;

			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else this.x += this.xd;
	}
	
	// always face mario
	var character = this.plane.findSprite({ type: 'Character' });
	if (character) {
		if ((character.x < this.x) && !this.facing) this.facing = 4;
		else if (character.x > this.x + this.width) {
			this.facing = 0;
			this.xd = 1;
		}
	}
	
	// if on ground, change direction, jump randomly
	if (onGround) {
		if (this.facing && (Math.random() * 100 < 4)) this.xd = 0 - this.xd; // change direction
		if (Math.random() * 100 < 5) this.yd = -6; // jump
	}
	
	// shoot fireballs randomly
	if (this.facing && !this.mouth) { // mouth open
		if (Math.random() * 100 < 2) {
			this.mouth = 2; // close mouth, get ready to fire
			this.fireAt = logicClock + 20;
		}
	}
	else if (this.fireAt && (logicClock >= this.fireAt)) {
		this.mouth = 0; // open mouth and fire
		
		var sprite = this.plane.createSprite('BowserFireball', {
			x: parseInt(this.x - 18, 10),
			y: this.y + 10,
			yd: parseInt(Math.random() * 3, 10) - 1
		});
		
		// play bowser fireball sound
		Effect.Audio.playSound( 'bowser_fireball' );
		
		this.fireAt = 0;
	}
	
	// keep bowser in his little arena
	if (this.x_min && (this.x < this.x_min)) {
		this.x = this.x_min;
		if (this.xd < 0) this.xd = 0 - this.xd;
	}
	else if (this.x_max && (this.x > this.x_max)) {
		this.x = this.x_max;
		if (this.xd > 0) this.xd = 0 - this.xd;
	}
};

Bowser.prototype.logic_death = function(logicClock) {
	// we're dead, fall offscreen
	this.y += this.yd;
};

Bowser.prototype.onHit = function(source) {
	// something hit us
	if (this.state != 'roam') return 0;
	
	if (source.type != 'BowserFireball') {
		switch (source.category) {
			case 'projectile':
				// projectiles kill us eventually
				this.energy--;
				if (this.energy <= 0) {
					this.state = 'death';
					this.collisions = false;
					this.yd = 4;
				
					level.bowser_killed = true; // to prevent respawn
				
					// when bowser is killed via fireballs, he turns into goomba
					// at least, the world 1-4 bowser does...
					this.setImage( 'goomba.gif' );
					this.width = 16;
					this.height = 16;
					this.y += 8;
					this.x += 8;
					this.setFrame( 3, level.environment ); // upside down and grey
					
					// we don't have a sound for this, so just play something
					Effect.Audio.playSound('kill_enemy');
			
					if (source.character) {
						// give score
						source.character.addScore( 5000 );
				
						// show bonus
						this.plane.createSprite('BonusDisplay', {
							amount: 5000,
							x: this.x + 8,
							y: this.y
						});
					} // character
				}
				return 1;
				break;
		} // switch type
	}
	
	return 0;
};
////
// BowserFireball.js
// Sprite Object
////

function BowserFireball() {
	// class constructor

	// sprite members
	this.url = 'bowser_fireball.gif';
	this.width = 24;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = -2;
	this.yd = 0;
	this.yd_timer = 16;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'projectile';
}

BowserFireball.prototype = new Sprite();
BowserFireball.prototype.__name = 'BowserFireball';

BowserFireball.prototype.logic = function() {
	// logic loop
	var hit = this.plane.movePointX( this.x, this.y + 4, this.xd );
	if (hit) {
		if (hit.target.onHitRight) hit.target.onHitRight(this);
		else if (hit.target.onHit) hit.target.onHit(this);
	}
	
	// always move, regardless of collision
	this.x += this.xd;
	this.y += this.yd;
	
	if (this.yd_timer) {
		this.yd_timer--;
		if (!this.yd_timer) this.yd = 0;
	}
};
////
// BowserFireballSpawn.js
// Tile Object type
////

function BowserFireballSpawn() {
	// class constructor
	this.spriteID = 0;
}

BowserFireballSpawn.prototype = new Tile();
BowserFireballSpawn.prototype.__name = 'BowserFireballSpawn';
BowserFireballSpawn.prototype.solid = false;
BowserFireballSpawn.prototype.collisions = false;

BowserFireballSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID )) && (Math.random() * 100 < 50)) {
		// make sure mario is heading right, not left
		// the real SMB never had to deal with this ;-)
		var character = this.plane.spritePlane.findSprite({ type: 'Character' });
		if (character && (character.xd >= 0)) {
			// create new sprite
			var sprite = this.plane.spritePlane.createSprite('BowserFireball', {
				x: parseInt(this.tx * this.plane.tileSizeX, 10),
				y: parseInt(this.ty * this.plane.tileSizeY, 10)
			});
				
			// keep track so we don't keep spawning
			this.spriteID = sprite.id;
			
			// play bowser fireball sound
			Effect.Audio.playSound( 'bowser_fireball' );
		} // mario is going rightward
	} // create new sprite
};
////
// BowserSpawn.js
// Tile Object type
////

function BowserSpawn() {
	// class constructor
	this.spriteID = 0;
	this.minTileX = 0;
	this.maxTileX = 0;
}

BowserSpawn.prototype = new Tile();
BowserSpawn.prototype.__name = 'BowserSpawn';
BowserSpawn.prototype.solid = false;
BowserSpawn.prototype.collisions = false;

BowserSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite	
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID )) && !level.bowser_killed) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Bowser', {
			tx: this.tx,
			ty: this.ty,
			minTileX: this.minTileX,
			maxTileX: this.maxTileX
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// BreakableBlock.js
// Tile Object type
////

function BreakableBlock() {
	// class constructor
}

BreakableBlock.prototype = new Tile();
BreakableBlock.prototype.__name = 'BreakableBlock';
BreakableBlock.prototype.solid = true;
BreakableBlock.prototype.ground = true;
BreakableBlock.prototype.collisions = true;

// todo - what about koopa shells running into blocks from the side?

BreakableBlock.prototype.onHitBottom = function(source) {
	// object hit bottom of breakable block

	if (source.type == 'Character') {
		if (source.size) {
			// big character -- break block
			// set tile to empty
			this.plane.setTile( this.tx, this.ty, 0, 'data' );

			// set object tile to empty as well
			this.plane.setTile( this.tx, this.ty, 0, 'objectData' );

			// create 4 particle sprites
			var x = this.tx * this.plane.tileSizeX;
			var y = this.ty * this.plane.tileSizeY;

			for (var ix=0; ix<2; ix++) {
				for (var iy=0; iy<2; iy++) {
					this.plane.spritePlane.createSprite('Particle', {
						x: x + (ix * 8),
						y: y + (iy * 8),
						xd: ix ? 2 : -2,
						yd: iy ? -16 : -32
					});
				} // iy loop
			} // ix loop
			
			// kill enemies above us
			var hit = this.plane.spritePlane.moveLineY( y, x, x + this.plane.tileSizeX, -1 );
			if (hit) {
				// hit something
				this.category = 'projectile';
				this.character = source;
				
				if (hit.target.onHitBottom) hit.target.onHitBottom(this);
				else if (hit.target.onHit) hit.target.onHit(this);
				
				this.category = null;
				this.character = null;
			}

			// play sound
			Effect.Audio.playSound( 'destroy_block' );
		} // big
		else {
			// small character -- bounce block
			// save tile at our location
			var tileIdx = this.plane.lookupTile( this.tx, this.ty, 'data' );
			
			if (tileIdx) {
				// set tile to empty
				this.plane.setTile( this.tx, this.ty, 0, 'data' );

				// create bouncer sprite
				this.plane.spritePlane.createSprite('BouncerTile', {
					tileIdx: tileIdx,
					tx: this.tx,
					ty: this.ty,
					character: source
				});
			} // real tile

			// play sound
			Effect.Audio.playSound( 'hit_head' );
		} // small
	} // character hit block
};
////
// CastleDoor.js
// Tile Object type
////

function CastleDoor() {
	// class constructor
}

CastleDoor.prototype = new Tile();
CastleDoor.prototype.__name = 'CastleDoor';
CastleDoor.prototype.collisions = true;
CastleDoor.prototype.solid = false;
CastleDoor.prototype.ground = false;

CastleDoor.prototype.onHit = function(source) {
	// something touched us

	if (source.type == 'Character') {
		Effect.Game.scheduleEvent( 4, "onLevelComplete" );
		
		this.plane.setTile( this.tx, this.ty, 0, 'objectData' );
	} // character
};
////
// CastleFlag.js
// Sprite Object
////

function CastleFlag() {
	// class constructor

	// sprite members
	this.url = 'castle_flag.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.state = 'rise';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

CastleFlag.prototype = new Sprite();
CastleFlag.prototype.__name = 'CastleFlag';

CastleFlag.prototype.init = function() {
	// override sprite init
	this.zIndex = this.plane.tilePlane.zIndex - 1; // behind tiles

	// call super's init
	Sprite.prototype.init.call(this);
};

CastleFlag.prototype.logic = function() {
	// logic loop
	this[ 'logic_' + this.state ]();
};

CastleFlag.prototype.logic_rise = function() {
	// rise until we are above ye castle
	this.yd = -2;
	
	var tileIdx = this.plane.tilePlane.lookupTileFromGlobal( this.x, this.y + this.height - 1 );
	if (tileIdx == 0) this.state = 'idle';
	else this.y += this.yd;
};

CastleFlag.prototype.logic_idle = function() {
	// just sit there
};
////
// Character.js
// Sprite Object
////

function Character() {
	// class constructor
	this.brother = 'mario';
	this.size = 0;
	this.flower = 0;
	this.star = 0;
	this.flash = 0; // 1=fast, 2=slow, 3=slower, etc.
	this.state = 'idle';
	this.facing = 0; // 0=right, 14=left
	this.invincible = false;
	this.xd = 0;
	this.yd = 0;
	this.xdmax_walk = 4;
	this.xdmax_run = 6;
	this.ydmax_fall = 16;
	this.ydmax_jump = 12;
	this.max_fireballs = 0;

	// sprite members
	this.url = this.brother + '_small.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.offsetX = 0;
	this.offsetY = 1; // down by 1 pixel to mimic SMB

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = false;
	this.category = 'character';
	this.character = this;

	// stats
	this.score = 0;
	this.coins = 0;
	this.lives = 0;
	this.dirtyDisplay = true;
	
	// key handlers
	this.setKeyHandler( 'button_1', 'button_2' );
	this.requestJump = false;
	this.requsetFireball = false;
}

Character.prototype = new Sprite();
Character.prototype.__name = 'Character';

Character.prototype.logic = function(logicClock) {
	// perform logic routine
	this[ 'logic_' + this.state ](logicClock);
	
	// invincible timer
	if (this.invincible && (logicClock >= this.invincibleEnd)) {
		this.invincible = false;
		// this.setOpacity( 1.0 );
		this.show(true);
	}
	
	// star timer
	if (this.star) {
		if (logicClock >= this.starEnd) {
			// end of star power
			this.star = false;
			this.flash = 0;
			this.setFrameY( 0 );
			if (this.flower) this.setImage( this.brother + '_flower_power.gif' );
			else this.setImage( this.brother + '_' + (this.size ? 'large' : 'small') + '.gif' );
			this.category = 'character';
			
			// restore music
			Effect.Audio.getTrack('music_starpower').stop();
			Effect.Audio.getTrack( level.background_music ).play();
		}
		else if (logicClock >= this.starEnd - 32) {
			this.flash = 3;
		}
		else if (logicClock >= this.starEnd - 64) {
			this.flash = 2;
		}
	}
	
	// hold pose
	if (this.holdFrameX) {
		if (logicClock >= this.holdEnd) this.holdFrameX = 0;
		else this.setFrameX( this.holdFrameX );
	}
	
	// limit to level bounds horiz
	if (this.x < 0) this.x = 0;
	else if (this.x >= this.port.virtualWidth - this.width) this.x = this.port.virtualWidth - this.width;
};

Character.prototype.logic_none = function(logicClock) {
	// do "nothing" (end of level, etc.)
};

Character.prototype.logic_idle = function(logicClock) {
	// perform logic while standing idle
	this.xd = parseInt( this.xd / 2, 10 );
	this.yd = 0;

	// set frame
	this.setFrameX( 0 + this.facing );
	
	// gravity check
	var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 2 );
	if (!hit || !hit.target.ground) {
		this.saveFrameX = this.frameX;
		this.state = 'falling';
		return;
	}
	
	this.y = (hit.correctedY - this.height) + 1;
	if (hit.target.onStanding) hit.target.onStanding(this);
	
	// key presses
	if (this.requestFireball) this.fireball();
	else if (this.requestJump) this.jump();
	else if (Effect.Game.isKeyDown('move_right')) { this.state = 'running'; this.xd = 1; }
	else if (Effect.Game.isKeyDown('move_left')) { this.state = 'running'; this.xd = -1; }
	else if (Effect.Game.isKeyDown('move_down')) {
		if (this.size) this.state = 'ducking';
		if (hit.target.onDuck) return hit.target.onDuck(this);
	}
};

Character.prototype.logic_running = function(logicClock) {
	// perform logic while running
	this.yd = 0;

	// set facing
	if (this.xd > 0) this.facing = 0;
	else if (this.xd < 0) this.facing = 14;
	
	// set frame
	var xdmax = Effect.Game.isKeyDown('button_1') ? this.xdmax_run : this.xdmax_walk;
	if (Effect.Game.getState() == 'walk_pipe') xdmax = 2; // special, walk slow to pipe
	
	var rate = 5 - parseInt( (Math.abs(this.xd) / this.xdmax_run) * 5, 10 ); if (!rate) rate = 1;
	var step = 4 - ((parseInt(logicClock / rate, 10) % 3) + 1);
	this.setFrameX( step + this.facing );
	
	// gravity check, and support mario's 1-block-gap-fall-if-walking thing
	var hit;
	if (Math.abs(this.xd) <= this.xdmax_walk) hit = this.plane.moveLineY( this.y + this.height - 1, this.x + 2, this.x + this.width - 2, 2 );
	else hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 2 );
	if (!hit || !hit.target.ground) {
		// adjust for walls on both sides
		hit = this.plane.moveLineX( this.x, this.y + 1, this.y + this.height + 1, -1 );
		if (hit && hit.target.solid) this.x = hit.correctedX;
		else {
			hit = this.plane.moveLineX( this.x + this.width - 1, this.y + 1, this.y + this.height + 1, 1 );
			if (hit && hit.target.solid) this.x = hit.correctedX - (this.width - 1);
		}
		
		this.saveFrameX = this.frameX;
		this.state = 'falling';
		return;
	}
	
	this.y = (hit.correctedY - this.height) + 1;
	if (hit.target.onStanding) hit.target.onStanding(this);

	// horiz movement
	if (this.xd < 0) {
		var xHit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
		if (xHit) {
			if (Effect.Game.isKeyDown('move_left') && xHit.target.onEnterRight) {
				var result = xHit.target.onEnterRight(this);
				if (result) return;
			}
			else if (Effect.Game.isKeyDown('move_left') && xHit.target.onEnter) {
				var result = xHit.target.onEnter(this);
				if (result) return;
			}
			else if (xHit.target.onHitRight) xHit.target.onHitRight(this);
			else if (xHit.target.onHit) xHit.target.onHit(this);
			
			this.x = xHit.correctedX;
			if (this.onHit(xHit.target)) return;
			
			if (xHit.target.solid) {
				this.xd = 0;
				this.state = 'idle';
				this.setFrameX( 0 + this.facing );
				return;
			}
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		var xHit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
		if (xHit) {
			if (Effect.Game.isKeyDown('move_right') && xHit.target.onEnterLeft) {
				var result = xHit.target.onEnterLeft(this);
				if (result) return;
			}
			else if (Effect.Game.isKeyDown('move_right') && xHit.target.onEnter) {
				var result = xHit.target.onEnter(this);
				if (result) return;
			}
			else if (xHit.target.onHitLeft) xHit.target.onHitLeft(this);
			else if (xHit.target.onHit) xHit.target.onHit(this);
			
			this.x = (xHit.correctedX - this.width) + 1;
			if (this.onHit(xHit.target)) return;
			
			if (xHit.target.solid) {
				this.xd = 0;
				this.state = 'idle';
				this.setFrameX( 0 + this.facing );
				return;
			}
		}
		else this.x += this.xd;
	}
	
	// onHit can be sent back to us causing death, etc.
	// if state has changed from running, return now
	if (this.state != 'running') return;
	
	// key presses
	if (Effect.Game.isKeyDown('move_down')) {
		if (this.size) this.state = 'ducking';
		if (hit.target.onDuck) return hit.target.onDuck(this);
	}
	else if (this.requestFireball) this.fireball();
	else if (this.requestJump) {
		this.jump();
		return;
	}

	if (Effect.Game.isKeyDown('move_right')) {
		if (this.xd <= 0) this.setFrameX( 5 + this.facing ); // slide
		this.xd += 0.5;
		if (this.xd > xdmax) this.xd = xdmax;
	}
	else if (Effect.Game.isKeyDown('move_left')) {
		if (this.xd >= 0) this.setFrameX( 5 + this.facing ); // slide
		this.xd -= 0.5;
		if (this.xd < 0 - xdmax) this.xd = 0 - xdmax;
	}
	else {
		// this.xd = parseInt( this.xd / 2 );
		this.xd = easeOutInt( this.xd, 8 );

		if (this.xd == 0) {
			this.state = 'idle';
		}
	}
};

Character.prototype.logic_ducking = function(logicClock) {
	// perform logic while ducking
	// this.xd = parseInt( this.xd / 2 );
	// this.xd = easeFloat( this.xd, 10 );
	if (this.xd > 0) {
		this.xd -= 0.5;
		if (this.xd < 0) this.xd = 0;
	}
	else if (this.xd < 0) {
		this.xd += 0.5;
		if (this.xd > 0) this.xd = 0;
	}
	this.yd = 0;

	// set frame
	this.setFrameX( this.size ? 12 + this.facing : 0 + this.facing );

	// adjusted hit rect
	var yTemp = this.y;
	if (this.size) yTemp = this.y + 16;
	
	// gravity check
	var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 2 );
	if (!hit || !hit.target.ground) {
		this.saveFrameX = this.frameX;
		this.state = 'falling';
		return;
	}
	
	this.y = (hit.correctedY - this.height) + 1;
	if (hit.target.onStanding) hit.target.onStanding(this);

	// sliding
	if (this.xd < 0) {
		var hit = this.plane.moveLineX( this.x, yTemp, this.y + this.height, this.xd );
		if (hit) {
			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			this.x = hit.correctedX;
			if (this.onHit(hit.target)) return;
			if (hit.target.solid) this.xd = 0;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		var hit = this.plane.moveLineX( this.x + this.width - 1, yTemp, this.y + this.height, this.xd );
		if (hit) {
			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			this.x = (hit.correctedX - this.width) + 1;
			if (this.onHit(hit.target)) return;
			if (hit.target.solid) this.xd = 0;
		}
		else this.x += this.xd;
	}
	
	// key presses
	if (this.requestJump) {
		this.jump();
		// force a duck-jump
		this.setFrameX( this.size ? 12 + this.facing : 0 + this.facing );
		this.saveFrameX = this.frameX;
		this.jumpTimer = 3;
		return;
	}
	if (!Effect.Game.isKeyDown('move_down')) {
		// make sure we have head room to stand up
		hit = this.plane.moveLineY( yTemp, this.x, this.x + this.width, -15 );
		if (1 || !hit) {
			if (this.xd) this.state = 'running';
			else this.state = 'idle';
		}
	} // stop ducking
};

Character.prototype.jump = function() {
	// change state to jumping and play sound
	this.state = 'falling';
	this.setFrameX( 4 + this.facing );
	this.saveFrameX = this.frameX;
	this.jumpTimer = 4;
	this.yd = 0 - this.ydmax_jump;
	Effect.Audio.playSound( this.size ? 'jump_big' : 'jump_small' );
	this.requestJump = false;
};

Character.prototype.fireball = function() {
	// shoot fireball
	this.requestFireball = false;
	
	if (this.flower) {
		// enforce max simultaneous fireballs
		if (this.max_fireballs) {
			var fireballs = this.plane.findSprites({ type: 'Fireball' });
			if (fireballs.length >= this.max_fireballs) return;
		}
		
		// create fireball sprite
		this.plane.createSprite('Fireball', {
			x: this.facing ? (this.x - 8) : (this.x + this.width),
			xd: this.facing ? -8 : 8,
			y: this.y + 4,
			character: this
		});
		
		// play fireball sound
		Effect.Audio.playSound( "fireball" );
		
		// hold pose for a couple of frames
		this.holdFrameX = 13 + this.facing;
		this.holdEnd = Effect.Game.logicClock + 2; 
	}
};

Character.prototype.logic_falling = function(logicClock) {
	// perform logic while jumping/falling

	// ajust hit rect if ducking
	var yTemp = this.y;
	if (this.size && (this.frameX == 12 + this.facing)) yTemp = this.y + 16;
	
	this.setFrameX( this.saveFrameX );
	
	// gravity
	if (this.yd < 0) {
		// headed upwards
		// var hit = this.plane.moveLineY( yTemp, this.x, this.x + this.width, this.yd );
		var hit = this.plane.movePointY( this.x + (this.width / 2), yTemp, this.yd );
		if (hit) {
			// hit head
			this.jumpTimer = 0;
			this.y = hit.correctedY - (yTemp - this.y);

			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
			if (hit.target.solid) this.yd = 0;
		}
		else {
			// still flying
			this.y += this.yd;
			if (this.jumpTimer) this.jumpTimer--;
			else this.yd = easeFloat(this.yd, (Math.abs(this.xd) > this.xdmax_walk) ? 2.6 : 2);

			// adjust for walls on both sides
			hit = this.plane.moveLineX( this.x, yTemp, this.y + this.height, -1 );
			if (hit && hit.target.solid) this.x = hit.correctedX;
			else {
				hit = this.plane.moveLineX( this.x + this.width - 1, yTemp, this.y + this.height, 1 );
				if (hit && hit.target.solid) this.x = hit.correctedX - (this.width - 1);
			}
		}
	}
	else {
		// headed downwards
		if (!this.yd) this.yd = 1;

		var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		if (hit) {
			// landed on something
			this.y = (hit.correctedY - this.height) + 1;

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
			
			if (hit.target.solid || hit.target.ground) {
				this.yd = 0;
				if (this.xd) this.state = 'running';
				else if (this.size && (this.frameX == 12 + this.facing)) this.state = 'ducking';
				else this.state = 'idle';
				
				if (hit.target.onStanding) hit.target.onStanding(this);
			}
		}
		else {
			// still falling
			this.y += this.yd;
			// this.yd *= 2;
			this.yd = easeFloat(this.yd, 2.25, 1);
			if (this.yd > this.ydmax_fall) this.yd = this.ydmax_fall;
		}
	}

	// movement in air
	if (this.xd < 0) {
		var hit = this.plane.moveLineX( this.x, yTemp, this.y + this.height, this.xd );
		if (hit) {
			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			this.x = hit.correctedX;
			if (this.onHit(hit.target)) return;
			if (hit.target.solid) this.xd = 0;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		var hit = this.plane.moveLineX( this.x + this.width - 1, yTemp, this.y + this.height, this.xd );
		if (hit) {
			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);

			this.x = (hit.correctedX - this.width) + 1;
			if (this.onHit(hit.target)) return;
			if (hit.target.solid) this.xd = 0;
		}
		else this.x += this.xd;
	}
	
	// onHit can be sent back to us causing death, etc.
	// if state has changed from running, return now
	if (this.state != 'falling') return;

	// key presses
	var xdmax = Effect.Game.isKeyDown('button_1') ? this.xdmax_run : this.xdmax_walk;

	if (Effect.Game.isKeyDown('move_right')) {
		this.xd += 0.5;
		if (this.xd > xdmax) this.xd = xdmax;
	}
	else if (Effect.Game.isKeyDown('move_left')) {
		this.xd -= 0.5;
		if (this.xd < 0 - xdmax) this.xd = 0 - xdmax;
	}
	else {
		// this.xd = parseInt( this.xd / 2 );
		this.xd = easeOutInt( this.xd, 4 );
	}

	if (this.requestFireball) this.fireball();
	if (!Effect.Game.isKeyDown('button_2')) this.jumpTimer = 0;
	this.requestJump = false;
	
	// check for death
	if (this.y > this.port.virtualHeight) {
		this.state = 'death';
		
		// stop music and play death march
		Effect.Audio.getTrack( level.background_music ).stop();
		Effect.Audio.getTrack('music_starpower').stop();
		Effect.Audio.playSound( 'music_die' );
		
		Effect.Game.scheduleEvent( 150, "onDeath" );
	}
};

Character.prototype.logic_growing = function(logicClock) {
	// animation while growing
	var facingTemp = this.facing ? 3 : 0;

	if (logicClock - this.soloStart < 8) {
		// stage 1
		this.setFrameX( (logicClock % 2) + facingTemp );
	}
	else if (logicClock - this.soloStart < 16) {
		// stage 2
		this.setFrameX( (logicClock % 3) + facingTemp );
	}
	else if (logicClock - this.soloStart < 24) {
		// stage 3
		this.setFrameX( (logicClock % 2) + 1 + facingTemp );
	}
	else {
		// end of animation
		this.state = this.saveState;
		this.setFrame( this.saveFrameX, 0 );
		if (this.star) {
			this.flash = 1;
			this.setImage( 'star_power_large.gif' );
		}
		else this.setImage( this.brother + '_large.gif' );
		this.plane.clearSoloSprite();
	}
	this.requestJump = false;
	this.requestFireball = false;
};

Character.prototype.logic_shrinking = function(logicClock) {
	// animation while shrinking
	var facingTemp = this.facing ? 3 : 0;

	if (logicClock - this.soloStart < 8) {
		// stage 3
		this.setFrameX( (1 - (logicClock % 2)) + 1 + facingTemp );
	}
	else if (logicClock - this.soloStart < 16) {
		// stage 2
		this.setFrameX( (2 - (logicClock % 3)) + facingTemp );
	}
	else if (logicClock - this.soloStart < 24) {
		// stage 1
		this.setFrameX( (1 - (logicClock % 2)) + facingTemp );
	}
	else {
		// end of animation
		this.state = this.saveState;
		this.setFrame( this.saveFrameX, 0 );
		this.height = 16;
		if (this.star) {
			this.flash = 1;
			this.setImage( 'star_power_small.gif' );
		}
		else this.setImage( this.brother + '_small.gif' );
		
		this.y += 16;
		this.size = 0;
		this.plane.clearSoloSprite();
		
		// character is invincible for short period after getting hit
		this.invincible = true;
		this.invincibleEnd = logicClock + 80;
		// this.setOpacity( 0.5 );
	}
	this.requestJump = false;
	this.requestFireball = false;
};

Character.prototype.logic_flowering = function(logicClock) {
	// animation while receiving flower power

	if (logicClock - this.soloStart < 8) {
		// stage 1
		this.flash = 1;
	}
	else if (logicClock - this.soloStart < 16) {
		// stage 2
		this.flash = 2;
	}
	else if (logicClock - this.soloStart < 24) {
		// stage 3
		this.flash = 3;
	}
	else {
		// end of animation
		this.state = this.saveState;
		this.setFrame( this.frameX, 0 );
		if (this.star) {
			this.flash = 1;
			this.setImage( 'star_power_large.gif' );
		}
		else {
			this.flash = 0;
			this.setImage( this.brother + '_flower_power.gif' );
		}
		
		this.plane.clearSoloSprite();
		this.flower = 1;
	}
	this.requestJump = false;
	this.requestFireball = false;
};

Character.prototype.logic_death = function(logicClock) {
	// we're dead, fall offscreen
	this.setFrame( 12 + this.facing, 0 );
	
	if ((logicClock - this.soloStart >= 20) && (this.y < this.port.virtualHeight)) {
		if (this.yd < 0) this.yd = easeOutInt( this.yd, 3 );
		else if (this.yd == 0) this.yd = 1;
		else this.yd *= 2;
		if (this.yd > 12) this.yd = 12;

		this.y += this.yd;
		// this.x += this.xd;
	}
};

Character.prototype.logic_flagpole = function(logicClock) {
	// slide down flagpole
	this.xd = 0;
	this.yd = 4;
	this.setFrame( 7 + this.facing, 0 );

	var hit = this.plane.movePointY( this.x + this.width - 1, this.y + this.height - 1, this.yd );
	if (hit) {
		// landed on something
		this.y = (hit.correctedY - this.height) + 1;
		if (hit.target.solid || hit.target.ground) this.yd = 0;
	}
	else {
		// still falling
		this.y += this.yd;
	}
	
	if (logicClock >= this.flagEnd) {
		// walk to castle and end level
		this.state = 'climbing';
		
		// take over keyboard control
		Effect.Game.setKeysActive( false );
		Effect.Game.resetKeys();
		Effect.Game.keys.move_right.down = true;
		
		// final music
		Effect.Audio.playSound('music_level_complete');
	}
};

Character.prototype.logic_climbing = function(logicClock) {
	// climb on vine
	this.xd = 0;
	
	// up/down keys
	if (Effect.Game.isKeyDown('move_up')) this.yd = -2;
	else if (Effect.Game.isKeyDown('move_down')) this.yd = 4;
	else this.yd = 0;

	// set frame
	if (this.yd != 0) {
		var step = 7 - ((parseInt(logicClock / (this.yd == 4 ? 3 : 5), 10) % 2) + 1);
		this.setFrameX( step + this.facing );
	}
	else this.setFrameX( 7 + this.facing );
	
	// make sure climbable is still with us
	var cx = 0;
	var cxd = 0;
	if (!this.facing) { cx = this.x + this.width - 1; cxd = 1; } // facing right
	else { cx = this.x; cxd = -1; } // facing left
	
	// handle movement
	if (this.yd < 0) {
		// headed upwards
		var xHit = this.plane.movePointX( cx, this.y, cxd );
		if (!xHit || !xHit.target.climb) this.yd = 0;
		else {
			var hit = this.plane.movePointY( this.x + (this.width / 2), this.y, this.yd );
			if (hit) {
				// hit head
				this.y = hit.correctedY;

				if (hit.target.onHitBottom) hit.target.onHitBottom(this);
				else if (hit.target.onHit) hit.target.onHit(this);
			
				if (this.onHit(hit.target)) return;
				if (hit.target.solid) this.yd = 0;
			}
			else {
				// still climbing
				this.y += this.yd;
			}
		} // still clinging to whatever
	} // yd < 0
	else if (this.yd > 0) {
		// headed downward
		var xHit = this.plane.movePointX( cx, this.y + this.height - 1, cxd );
		if (!xHit || !xHit.target.climb) {
			// uh oh, ran out of climbable below us!  fall!
			this.state = 'falling';
			this.saveFrameX = 1 + this.facing;
			return;
		}
		else {
			var hit = this.plane.movePointY( this.x + (this.width / 2), this.y + this.height - 1, this.yd );
			if (hit) {
				// landed on something
				this.y = (hit.correctedY - this.height) + 1;

				if (hit.target.onHitTop) hit.target.onHitTop(this);
				else if (hit.target.onHit) hit.target.onHit(this);
			
				if (this.onHit(hit.target)) return;
			
				if (hit.target.solid || hit.target.ground) {
					this.yd = 0;
				}
			}
			else {
				// still climbing
				this.y += this.yd;
			}
		} // still clinging to whatever
	} // yd > 0
	
	// left/right key presses
	if (Effect.Game.isKeyDown('move_right')) {
		if (!this.facing) {
			// facing right, so switch sides
			this.facing = 14;
			this.x += this.width;
			this.climbEnd = logicClock + 8;
		}
		else if (!this.climbEnd || (logicClock >= this.climbEnd)) {
			// still holding key and small delay has passed, so fall off
			this.state = 'falling';
			this.facing = 0;
			this.saveFrameX = 1 + this.facing;
			return;
		}
	} // move_right
	else if (Effect.Game.isKeyDown('move_left')) {
		if (this.facing) {
			// facing left, so switch sides
			this.facing = 0;
			this.x -= this.width;
			this.climbEnd = logicClock + 8;
		}
		else if (!this.climbEnd || (logicClock >= this.climbEnd)) {
			// still holding key and small delay has passed, so fall off
			this.state = 'falling';
			this.facing = 14;
			this.saveFrameX = 1 + this.facing;
			return;
		}
	} // move_left
	else this.climbEnd = 0;
};

Character.prototype.logic_pipe_enter = function(logicClock) {
	// entering pipe
	if (this.yd) {
		// entering vertically
		if (this.yd > 0) this.setFrameX( this.size ? 12 + this.facing : 0 + this.facing );
		else this.setFrameX( 0 + this.facing );
		
		var cy = (this.yd > 0) ? (this.y) : (this.y + this.height - 1);
		var hit = this.plane.movePointY( this.x + (this.width / 2), cy, (this.yd > 0) ? -1 : 1 );
		if (hit && (hit.target.type == 'Pipe')) this.yd = 0;
		else this.y += this.yd;
	}
	else if (this.xd) {
		// entering horizontally
		var xdmax = this.xdmax_walk;
		var rate = 5 - parseInt( (Math.abs(this.xd) / this.xdmax_run) * 5, 10 ); if (!rate) rate = 1;
		var step = 4 - ((parseInt(logicClock / rate, 10) % 3) + 1);
		this.setFrameX( step + this.facing );
		
		var cx = (this.xd > 0) ? (this.x) : (this.x + this.width - 1);
		var hit = this.plane.movePointX( cx, this.y + (this.height / 2), (this.xd > 0) ? -1 : 1 );
		if (hit && (hit.target.type == 'Pipe')) this.xd = 0;
		else this.x += this.xd;
	}
};

Character.prototype.logic_pipe_exit = function(logicClock) {
	// exiting pipe
	if (this.yd) {
		// exiting vertically
		this.setFrameX( 0 + this.facing );
		
		var cy = (this.yd > 0) ? (this.y) : (this.y + this.height - 1);
		var hit = this.plane.movePointY( this.x + (this.width / 2), cy, (this.yd > 0) ? -1 : 1 );
		if (!hit || !hit.target.solid) {
			this.yd = 0;
			this.state = (this.yd > 0) ? 'falling' : 'idle';
			this.setZIndex( this.plane.zIndex );
		}
		else this.y += this.yd;
	}
	else if (this.xd) {
		// exiting horizontally
		var xdmax = this.xdmax_walk;
		var rate = 5 - parseInt( (Math.abs(this.xd) / this.xdmax_run) * 5, 10 ); if (!rate) rate = 1;
		var step = 4 - ((parseInt(logicClock / rate, 10) % 3) + 1);
		this.setFrameX( step + this.facing );
		
		var cx = (this.xd > 0) ? (this.x) : (this.x + this.width - 1);
		var hit = this.plane.movePointX( cx, this.y + (this.height / 2), (this.xd > 0) ? -1 : 1 );
		if (!hit || !hit.target.solid) {
			this.xd = 0;
			this.state = 'idle';
			this.setZIndex( this.plane.zIndex );
		}
		else this.x += this.xd;
	}
};

Character.prototype.logic_axe = function(logicClock) {
	// do nothing, waiting for bridge, bowser etc.
};

Character.prototype.draw = function(drawClock) {
	// override sprite draw
	// animate star power if applicable
	if (this.flash) this.setFrameY( Math.floor(drawClock / this.flash) % 2 );
	if (this.invincible) {
		if (this.invincibleEnd >= Effect.Game.logicClock + 10) this.show( !!(drawClock % 2) );
		else this.show();
	}

	Sprite.prototype.draw.call(this);
};

Character.prototype.ptIn = function(px, py) {
	// check if point is inside our hit rect
	// override this because we can "duck"
	var yTemp = this.y;
	if (this.size && (this.frameX == 12 + this.facing)) yTemp = this.y + 16; // ducking

	return(
		(px >= this.x) && (py >= yTemp) && 
		(px < this.x + this.width) && (py < this.y + this.height)
	);
};

Character.prototype.addScore = function(amount) {
	// increase score
	this.score += amount;
	this.dirtyDisplay = true;
};

Character.prototype.addCoins = function(amount) {
	// increase coins
	this.coins += amount;
	if (this.coins > 99) {
		this.coins = this.coins % 100;
		Effect.Audio.playSound( '1up' );
	}
	this.dirtyDisplay = true;
};

Character.prototype.addLives = function(amount) {
	// increase lives
	this.lives += amount;
};

Character.prototype.canReceiveHit = function() {
	// make sure character isn't in the middle of a special animation
	switch (this.state) {
		case 'idle':
		case 'running':
		case 'ducking':
		case 'falling':
		case 'climbing':
			return 1; // yes
			break;
		default:
			return 0; // no
			break;
	}
};

Character.prototype.powerUp = function(powerType) {
	// receive power-up
	switch (powerType) {
		case 'mushroom':
			if (this.canReceiveHit()) {
				// set solo sprite and setup grow animation
				if (!this.size) {
					this.plane.setSoloSprite(this);
					this.saveState = this.state;
					this.saveFrameX = this.frameX;
					this.state = 'growing';
					this.height = 32;
					this.setImage( 'grow.gif' );
					this.size = 1;
					this.y -= 16;
					this.setFrame( 0, (this.brother == 'luigi') ? 1 : 0 );
					this.flash = 0;
					this.soloStart = Effect.Game.logicClock;
				} // is small

				// create bonus display
				this.plane.createSprite('BonusDisplay', {
					x: this.x,
					y: this.y - 8,
					amount: 1000
				});

				// add to score
				this.addScore( 1000 );
			
				// play grow sound
				Effect.Audio.playSound( 'bigness' );
			} // canReceiveHit
			break;
		
		case '1up_mushroom':
			// create 1up bonus display
			this.plane.createSprite('BonusDisplay', {
				x: this.x,
				y: this.y - 8,
				amount: '1up'
			});

			// play 1up sound
			Effect.Audio.playSound( '1up' );
			
			// give us a life
			this.addLives( 1 );
			break;
		
		case 'flower':
			// flower power
			if (this.canReceiveHit()) {
				// set solo sprite and setup grow animation
				if (!this.flower) {
					this.plane.setSoloSprite(this);
					this.saveState = this.state;
					this.state = 'flowering';
					this.setImage( 'star_power_' + (this.size ? 'large' : 'small') + '.gif' );
					this.setFrame( this.frameX, 0 );
					this.flash = 1;
					this.soloStart = Effect.Game.logicClock;
				} // doesn't have flower yet

				// create bonus display
				this.plane.createSprite('BonusDisplay', {
					x: this.x,
					y: this.y - 8,
					amount: 1000
				});

				// add to score
				this.addScore( 1000 );
			
				// play grow sound
				Effect.Audio.playSound( 'bigness' );
			} // canReceiveHit
			break;
		
		case 'star':
			// star power
			if (this.canReceiveHit()) {
				this.setImage( 'star_power_' + (this.size ? 'large' : 'small') + '.gif' );
				this.setFrame( this.frameX, 0 );
				this.flash = 1;
				this.star = true;
				this.category = 'projectile';
				this.starEnd = Effect.Game.logicClock + 280;

				// create bonus display
				this.plane.createSprite('BonusDisplay', {
					x: this.x,
					y: this.y - 8,
					amount: 1000
				});

				// add to score
				this.addScore( 1000 );

				// play grow sound
				Effect.Audio.playSound( 'bigness' );
				
				// stop game music, start star music
				Effect.Audio.getTrack( level.background_music ).stop().rewind();
				Effect.Audio.getTrack('music_starpower').rewind().play();
			} // canReceiveHit
			break;
	} // switch powerType
};

Character.prototype.onHit = function(source) {
	// something else hit us
	if (this.invincible || this.star) return 0;
	
	switch (source.category) {
		case 'enemy':
		case 'projectile':
			if (this.canReceiveHit() && (source.type != 'Fireball') && (source.type != 'BouncerTile')) {
				if (this.size) {
					// get small
					this.plane.setSoloSprite(this);
					if (this.state == 'climbing') {
						// if hit while climbing, fall off
						this.saveState = 'falling';
						this.saveFrameX = 1 + this.facing;
					}
					else {
						this.saveState = this.state;
						this.saveFrameX = this.frameX;
					}
					this.state = 'shrinking';
					this.setImage( 'grow.gif' );
					this.setFrame( 0, (this.brother == 'luigi') ? 1 : 0 );
					this.flash = 0;
					this.flower = 0; // also lose flower on hit
					this.soloStart = Effect.Game.logicClock;
			
					// play shrink sound
					Effect.Audio.playSound( 'down_pipe' );
				} // big
				else {
					// death
					this.die();
				} // small
				return 1;
			} // canReceiveHit
			break;
	} // switch category
	
	return 0;
};

Character.prototype.die = function() {
	// make character die, with animated fall offscreen
	// also schedule level reset event
	this.plane.setSoloSprite(this);
	this.soloStart = Effect.Game.logicClock;
	this.state = 'death';
	this.setImage( this.brother + '_small.gif' );
	this.setFrame( 12 + this.facing, 0 );
	this.flash = 0;
	this.dieOffscreen = false;
	this.xd = 0;
	this.yd = -16;
	
	// stop music and play death march
	Effect.Audio.quiet();
	Effect.Audio.playSound( 'music_die' );
	
	Effect.Game.scheduleEvent( 150, "onDeath" );
};

Character.prototype.onKeyDown = function(key) {
	// handle immediate key down event
	switch (key) {
		case 'button_1': this.requestFireball = true; break;
		case 'button_2': this.requestJump = true; break;
	}
};
////
// Coin.js
// Tile Object type
////

function Coin() {
	// class constructor
}

Coin.prototype = new Tile();
Coin.prototype.__name = 'Coin';
Coin.prototype.collisions = true;
Coin.prototype.solid = false;
Coin.prototype.ground = false;

Coin.prototype.onHit = function(source) {
	// something touched us
	if ((source.type == 'Character') || (source.type == 'BouncerTile') || (source.type == 'BreakableBlock')) {
		// set tile to empty (tile 0)
		this.plane.setTile( this.tx, this.ty, 0, 'data' );

		// set object tile to empty as well
		this.plane.setTile( this.tx, this.ty, 0, 'objectData' );
		
		if ((source.type == 'BouncerTile') || (source.type == 'BreakableBlock')) {
			// create coin spinner
			this.plane.spritePlane.createSprite('CoinSpinner', {
				tx: this.tx,
				ty: this.ty
			});
		}

		// increase score and coins
		if (source.character) {
			source.character.addScore( 200 );
			source.character.addCoins( 1 );
		}
		else if (source.addScore) {
			source.addScore( 200 );
			source.addCoins( 1 );
		}

		// play sound
		Effect.Audio.playSound( 'coin' );
	} // character
};
////
// CoinSpinner.js
// Sprite Object
////

function CoinSpinner() {
	// class constructor

	// sprite members
	this.url = 'coin_spinner.gif';
	this.width = 8;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = -32;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

CoinSpinner.prototype = new Sprite();
CoinSpinner.prototype.__name = 'CoinSpinner';

CoinSpinner.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = (this.tx * this.plane.tilePlane.tileSizeX) + 4;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	this.finalY = this.y;

	// call super's init
	Sprite.prototype.init.call(this);
};

CoinSpinner.prototype.logic = function() {
	// logic loop
	if (this.yd < 0) this.yd = easeOutInt( this.yd, 2 );
	else if (this.yd == 0) this.yd = 1;
	else this.yd *= 2;
	if (this.yd > 16) this.yd = 16;

	this.y += this.yd;
	this.x += this.xd;

	if (this.y >= this.finalY) {
		// we reached our final resting place
		// show bonus floater and die
		this.plane.createSprite('BonusDisplay', {
			amount: 200,
			tx: this.tx,
			ty: this.ty - 1
		});

		this.destroy();
	}
};
////
// Explosion.js
// Sprite Object
////

function Explosion() {
	// class constructor

	// sprite members
	this.url = 'explosion.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	
	this.frameFloat = 0.0;
	this.frameDelta = 1.0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

Explosion.prototype = new Sprite();
Explosion.prototype.__name = 'Explosion';

Explosion.prototype.logic = function() {
	// logic loop
	this.frameFloat += this.frameDelta;
	if (this.frameFloat < 3) this.setFrameX( parseInt(this.frameFloat, 10) );
	else this.destroy();
};
////
// Fireball.js
// Sprite Object
////

function Fireball() {
	// class constructor

	// sprite members
	this.url = 'fireball.gif';
	this.width = 8;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 8;
	this.yd = 8;
	this.ydmax = 8;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false; // testing this...
	this.dieOffscreen = true;
	this.category = 'projectile';
}

Fireball.prototype = new Sprite();
Fireball.prototype.__name = 'Fireball';

Fireball.prototype.init = function() {
	// override sprite init
	this.require('x', 'y');

	// call super's init
	Sprite.prototype.init.call(this);
};

Fireball.prototype.logic = function() {
	// gravity
	if (this.yd < 0) {
		// headed upwards
		// var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
		var hit = this.plane.movePointY( this.x + 4, this.y, this.yd );
		if (hit && (hit.target != this.character) && (hit.target.type != 'Fireball')) {
			// hit head
			this.y = hit.correctedY;
			if (hit.target.solid) this.yd = 0;

			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			// fireballs bounce off solid objects, but if hit anything else then explode
			if (!hit.target.solid && this.onHit(hit.target)) return;
		}
		else {
			// still flying
			this.y += this.yd;
			// this.yd = parseInt( this.yd / 2 );
			this.yd++;
		}
	}
	else {
		// headed downwards
		if (!this.yd) this.yd = 1;

		// var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		var hit = this.plane.movePointY( this.x + 4, this.y + this.height - 1, this.yd );
		if (hit && (hit.target != this.character) && (hit.target.type != 'Fireball')) {
			// landed on something
			if (hit.target.solid || hit.target.ground) {
				this.y = (hit.correctedY - this.height) + 1;
				this.yd = -5;
			}
			
			// if (hit.target.solid || hit.target.ground) this.yd = 0;

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			// fireballs bounce off solid objects, but if hit anything else then explode
			if (!hit.target.solid && this.onHit(hit.target)) return;
		}
		else {
			// still falling
			this.y += this.yd;
			this.yd *= 2;
			if (this.yd > this.ydmax) this.yd = this.ydmax;
		}
	}
	
	// horizontal movement
	if (this.xd < 0) {
		// var hit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x, this.y + 4, this.xd );
		if (hit && (hit.target != this.character) && (hit.target.type != 'Fireball')) {
			this.x = hit.correctedX;
			
			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
		
			if (this.onHit(hit.target)) return;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		// var hit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x + this.width - 1, this.y + 4, this.xd );
		if (hit && (hit.target != this.character) && (hit.target.type != 'Fireball')) {
			this.x = (hit.correctedX - this.width) + 1;
			
			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);
		
			if (this.onHit(hit.target)) return;
		}
		else this.x += this.xd;
	}
};

Fireball.prototype.onHit = function(source) {
	// something hit us
	if ((source != this.character) && (source.type != 'Fireball')) {
		if (source.solid) Effect.Audio.playSound( 'hit_head' );
		this.explode();
		return 1;
	}
	return 0;
};

Fireball.prototype.explode = function() {
	// end of life for us
	this.plane.createSprite('Explosion', {
		x: this.x - 4,
		y: this.y - 4
	});
	
	this.destroy();
};
////
// Firerod.js
// Sprite Object
////

function Firerod() {
	// class constructor

	// sprite members
	this.url = 'fireball.gif';
	this.width = 8;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.rodSprites = 6;
	this.andleDelta = 8;
	this.angle = 0;
	this.sprites = [];
	
	this.clipX = 0;
	this.clipY = 0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false; // handled manually
	this.dieOffscreen = true;
	this.category = 'projectile';
}

Firerod.prototype = new MultiSprite();
Firerod.prototype.__name = 'Firerod';

Firerod.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty', 'width', 'height', 'url');
	
	this.x = (this.tx * this.plane.tilePlane.tileSizeX) + 4;
	this.y = (this.ty * this.plane.tilePlane.tileSizeY) + 4;
	
	// call super's init
	MultiSprite.prototype.init.call(this);
	
	for (var idx=0; idx<this.rodSprites; idx++) {
		var pt = new Point(this.x + (this.width / 2), this.y + (this.height / 2));
		pt.project( this.angle, idx * this.width );
		
		this.sprites[idx] = new FirerodBall();
		var sprite = this.sprites[idx];
		sprite.id = this.globalID + '_' + idx;
		sprite.rod = this;
		sprite.ballIdx = idx;
		
		sprite.x = parseInt(pt.x - (this.width / 2), 10);
		sprite.y = parseInt(pt.y - (this.height / 2), 10);
		
		sprite.plane = this.plane;
		sprite.port = this.port;
		sprite.zIndex = this.zIndex;
		sprite.init();
	}
};

Firerod.prototype.logic = function() {
	this.angle += this.angleDelta;
	if (this.angle >= 360) this.angle -= 360;
	else if (this.angle < 0) this.angle += 360;
	
	// invoke logic on all sub-sprites
	MultiSprite.prototype.logic.call(this);
	
	// manually check character collisions (for performance)
	var character = this.plane.findSprite({ type: 'Character' });
	if (character) {
		var charRect = new Rect( character.x, character.y, character.x + character.width, character.y + character.height );
		for (var idx=1; idx<this.sprites.length; idx++) { // skipping 0, redundant
			var sprite = this.sprites[idx];
			if (charRect.ptIn(sprite.x + (sprite.width / 2), sprite.y + (sprite.height / 2))) {
				return character.onHit(this);
			} // hit character
		}
	} // manual character check
};

//
// FirerodBall (sub-sprite)
//

function FirerodBall() {
	// class constructor

	// sprite members
	this.url = 'fireball.gif';
	this.width = 8;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false; // handled by parent
	this.dieOffscreen = false; // handled by parent
	this.category = 'projectile';
}

FirerodBall.prototype = new Sprite();
FirerodBall.prototype.__name = 'FirerodBall';

FirerodBall.prototype.init = function() {
	// override sprite init
	this.require('x', 'y');

	// call super's init
	Sprite.prototype.init.call(this);
};

FirerodBall.prototype.logic = function() {
	var pt = new Point(this.rod.x + (this.rod.width / 2), this.rod.y + (this.rod.height / 2));
	pt.project( this.rod.angle, this.ballIdx * this.width );
	
	this.x = pt.x - (this.width / 2);
	this.y = pt.y - (this.height / 2);
	
	// debugstr("rod debug: " + this.zoom( (Math.floor(this.x + this.offsetX) - this.clipX) - this.plane.scrollX ) );
};
////
// FirerodSpawn.js
// Tile Object type
////

function FirerodSpawn() {
	// class constructor
	this.spriteID = 0;
	this.rodSprites = 6;
	this.angleDelta = 4;
	this.startingAngle = 0;
}

FirerodSpawn.prototype = new Tile();
FirerodSpawn.prototype.__name = 'FirerodSpawn';
FirerodSpawn.prototype.solid = true;
FirerodSpawn.prototype.ground = true;
FirerodSpawn.prototype.collisions = true;

FirerodSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID ))) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Firerod', {
			tx: this.tx,
			ty: this.ty,
			rodSprites: this.rodSprites,
			angleDelta: this.angleDelta,
			angle: this.startingAngle
		});
		
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};

FirerodSpawn.prototype.onHitBottom = function(source) {
	// object hit bottom of block
	if (source.type == 'Character') {
		// play sound
		Effect.Audio.playSound( 'hit_head' );
	}
};
////
// Flag.js
// Sprite Object
////

function Flag() {
	// class constructor

	// sprite members
	this.url = 'flag.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.state = 'idle';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

Flag.prototype = new Sprite();
Flag.prototype.__name = 'Flag';

Flag.prototype.init = function() {
	// override sprite init
	this.zIndex = this.plane.tilePlane.zIndex - 1; // behind tiles

	// call super's init
	Sprite.prototype.init.call(this);
};

Flag.prototype.logic = function() {
	// logic loop
	this[ 'logic_' + this.state ]();
};

Flag.prototype.logic_idle = function() {
	// just sit there
};

Flag.prototype.logic_drop = function() {
	// drop until we hit the base of the pole
	this.yd = 4;

	var hit = this.plane.movePointY( this.x + this.width - 1, this.y + this.height - 1, this.yd );
	if (hit) {
		// landed on something
		this.y = (hit.correctedY - this.height) + 1;
		if (hit.target.solid || hit.target.ground) this.yd = 0;
	}
	else {
		// still falling
		this.y += this.yd;
	}
};
////
// Flagpole.js
// Tile Object type
////

function Flagpole() {
	// class constructor
}

Flagpole.prototype = new Tile();
Flagpole.prototype.__name = 'Flagpole';
Flagpole.prototype.collisions = true;
Flagpole.prototype.solid = false;
Flagpole.prototype.ground = false;
Flagpole.prototype.climb = true;

Flagpole.prototype.onHit = function(source) {
	// something touched us

	if ((source.type == 'Character') && (Effect.Game.getState() == 'run')) {
		var cx = (this.tx * this.plane.tileSizeX) + (this.plane.tileSizeX / 2);
		
		if ((source.x + source.width >= cx) && (source.x < cx)) {
			// position character right on flagpole
			source.x = (cx + 1) - source.width;
			source.xd = 0;
			source.yd = 0;
			source.state = 'flagpole';
			source.flagEnd = Effect.Game.logicClock + 47;
			source.holdFrameX = 0; // just in case
			
			if (source.star) {
				source.star = false;
				source.flash = 0;
				source.setFrameY( 0 );
				if (source.flower) source.setImage( source.brother + '_flower_power.gif' );
				else source.setImage( source.brother + '_' + (source.size ? 'large' : 'small') + '.gif' );
				source.category = 'character';
			} // kill star power
			
			// locate flag and drop it
			var flag = this.plane.spritePlane.findSprite({ type: 'Flag' });
			if (flag) flag.state = 'drop';
			else return alert('Could not locate Flag sprite');
			
			// measure flagpole length and give appropriate bonus
			var bonusIdx = 9;
			var done = false;
			var y = this.ty;
			
			while (!done) {
				var tile = this.plane.lookupTile(this.tx, y, 'objectData');
				if (!tile || (tile.type != 'Flagpole')) done = true;
				else {
					bonusIdx--;
					y--;
				}
			}
			if (bonusIdx > 7) bonusIdx = 7;
			if (bonusIdx < 0) bonusIdx = 0;
			
			// create bonus display
			this.plane.spritePlane.createSprite('BonusDisplay', {
				x: cx + 3,
				y: (this.ty * this.plane.tileSizeY) - 8,
				amount: game_def.BonusStack.Amount[bonusIdx],
				stick: true // stick around
			});

			// add to score
			source.addScore( game_def.BonusStack.Amount[bonusIdx] );
			
			// play end of level sounds
			Effect.Audio.quiet();
			Effect.Audio.playSound( 'flagpole_slide' );
			
			// change game state so timer countdown stops
			Effect.Game.setState( 'level_complete_a' );
		} // real collision
	} // character
};

Flagpole.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if (!this.plane.lookupTile(this.tx, this.ty - 1, 'objectData') && (!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID ))) {
		// create flag sprite
		var sprite = this.plane.spritePlane.createSprite('Flag', {
			x: (this.tx * this.plane.tileSizeX) - 8,
			y: (this.ty * this.plane.tileSizeY)
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// Flower.js
// Sprite Object
////

function Flower() {
	// class constructor

	// sprite members
	this.url = 'flower.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.state = 'rise';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'powerup';
}

Flower.prototype = new Sprite();
Flower.prototype.__name = 'Flower';

Flower.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	this.url = 'flower.gif';

	this.zIndex = this.plane.tilePlane.zIndex - 1; // under tiles
	this.visible = false; // for a few frames
	this.showMe = Effect.Game.logicClock + 5;

	// call super's init
	Sprite.prototype.init.call(this);
};

Flower.prototype.logic = function(logicClock) {
	// logic loop
	switch (this.state) {
		case 'rise':
			// rise up from under item block
			this.y--;
			
			// see if we are risen enough
			var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 1 );
			if (!hit) {
				this.y++;
				this.state = 'roam';
				this.setZIndex( this.plane.zIndex ); // move to foreground
			}
			
			// show after a few frames
			if (!this.visible && (logicClock >= this.showMe)) this.show();
			break;
		
		case 'roam':
			// this thing don't move
			break;
	} // switch state
};

Flower.prototype.onHit = function(source) {
	// something hit us
	if (source.powerUp) {
		if (source.size) source.powerUp('flower');
		else source.powerUp('mushroom');
		this.destroy();
		return;
	}
};
////
// Goomba.js
// Enemy Object
////

function Goomba() {
	// class constructor

	// sprite members
	this.url = 'goomba.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 2; // will be set at create time
	this.yd = 0;
	this.state = 'roam'; // will be set at create time

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'enemy';
}

Goomba.prototype = new Sprite();
Goomba.prototype.__name = 'Goomba';

Goomba.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');
	
	// environment color
	this.setFrameY( level.environment );

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;

	// call super's init
	Sprite.prototype.init.call(this);
};

Goomba.prototype.logic = function(logicClock) {
	// perform logic routine
	this[ 'logic_' + this.state ](logicClock);
};

Goomba.prototype.logic_rise = function() {
	// rise up from pipe
	this.y--;
	
	// see if we are risen enough
	var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 1 );
	if (!hit) {
		this.y++;
		this.state = 'roam';
		this.setZIndex( this.plane.zIndex ); // move to foreground
	}
};

Goomba.prototype.logic_roam = function(logicClock) {
	// roam around
	this.setFrameX( parseInt(logicClock / 7, 10) % 2 );
	
	// gravity
	if (this.yd < 0) {
		// headed upwards
		var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
		if (hit) {
			// hit head
			this.y = hit.correctedY;
			if (hit.target.solid) this.yd = 0;

			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitTop(hit.target)) return;
		}
		else {
			// still flying
			this.y += this.yd;
			this.yd = parseInt( this.yd / 2, 10 );
		}
	}
	else {
		// headed downwards
		if (!this.yd) this.yd = 1;

		var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		if (hit) {
			// landed on something
			this.y = (hit.correctedY - this.height) + 1;
			
			if (hit.target.solid || hit.target.ground) this.yd = 0;

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else {
			// still falling
			this.y += this.yd;
			this.yd *= 2;
			if (this.yd > 8) this.yd = 8;
		}
	}
	
	// horizontal movement
	if (this.xd < 0) {
		// var hit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x, this.y + (this.height / 2), this.xd );
		if (hit) {
			this.x = hit.correctedX;
			if (hit.target.solid) this.xd = 0 - this.xd;

			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitLeft(hit.target)) return;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		// var hit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x + this.width - 1, this.y + (this.height / 2), this.xd );
		if (hit) {
			this.x = (hit.correctedX - this.width) + 1;
			if (hit.target.solid) this.xd = 0 - this.xd;

			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitRight(hit.target)) return;
		}
		else this.x += this.xd;
	}
};

Goomba.prototype.logic_squish = function() {
	// squished
	if (!this.yd) this.yd = 1;

	var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
	if (hit) {
		// landed on something
		this.y = (hit.correctedY - this.height) + 1;
		if (hit.target.solid || hit.target.ground) this.yd = 0;
	}
	else {
		// still falling
		this.y += this.yd;
		this.yd *= 2;
		if (this.yd > 16) this.yd = 16;
	}
	
	this.destroyTimer--;
	if (this.destroyTimer < 1) this.destroy();
};

Goomba.prototype.logic_death = function() {
	// we're dead, fall offscreen
	if (this.yd < 0) this.yd = easeOutInt( this.yd, 3 );
	else if (this.yd == 0) this.yd = 1;
	else this.yd *= 2;
	if (this.yd > 16) this.yd = 16;

	this.y += this.yd;
	this.x += this.xd;
};

Goomba.prototype.onHit = function(source) {
	// something hit us
	if (this.state != 'roam') return 0;
	
	switch (source.category) {
		case 'projectile':
			// projectiles kill us
			this.state = 'death';
			this.collisions = false;
			this.yd = -8;
			this.setFrameX( 3 );
			
			// inherit direction from whatever hit us
			if ((this.xd < 0) && (source.xd > 0)) this.xd = 0 - this.xd;
			else if ((this.xd > 0) && (source.xd < 0)) this.xd = 0 - this.xd;
			
			// play kill sound
			Effect.Audio.playSound( 'kill_enemy' );
			
			if (source.character) {
				// give score
				source.character.addScore( 100 );
				
				// show bonus
				this.plane.createSprite('BonusDisplay', {
					amount: 100,
					x: this.x,
					y: this.y - 16
				});
			} // character
			
			return 1;
			break;
	} // switch type
	
	return 0;
};

Goomba.prototype.onHitLeft = function(source) {
	// something hit our left side
	if (this.state != 'roam') return 0;
	
	switch (source.category) {
		case 'enemy':
			// enemies bounce off each other
			if (this.xd < 0) this.xd = 0 - this.xd;
			return 1;
			break;
		default:
			return this.onHit(source);
			break;
	} // switch type
	
	return 0;
};

Goomba.prototype.onHitRight = function(source) {
	// something hit our right side
	if (this.state != 'roam') return;
	
	switch (source.category) {
		case 'enemy':
			// enemies bounce off each other
			if (this.xd > 0) this.xd = 0 - this.xd;
			return 1;
			break;
		default:
			return this.onHit(source);
			break;
	} // switch type
	
	return 0;
};

Goomba.prototype.onHitTop = function(source) {
	// something hit our head
	if (this.state != 'roam') return 0;
	
	if (source.type == 'Character') {
		// squish
		this.setFrameX( 2 );
		this.setZIndex( this.plane.zIndex - 1 ); // under other sprites, above tiles
		this.state = 'squish';
		this.collisions = false;
		this.yd = 1;
		this.destroyTimer = 45;
		
		// play squish sound
		Effect.Audio.playSound( 'squish_enemy' );
		
		// character bounce
		source.yd = -8;
		source.state = 'falling';
		
		// prevent hit from nearby enemies for 4 frames
		source.invincible = true;
		source.invincibleEnd = Effect.Game.logicClock + 4;
		return 1;
	}
	else return this.onHit(source);
	
	return 0;
};
////
// GoombaSpawn.js
// Tile Object type
////

function GoombaSpawn() {
	// class constructor
	this.spriteID = 0;
	this.startingState = 'roam';
	this.startingDir = -1.5;
}

GoombaSpawn.prototype = new Tile();
GoombaSpawn.prototype.__name = 'GoombaSpawn';
GoombaSpawn.prototype.solid = false;
GoombaSpawn.prototype.collisions = false;

GoombaSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID )) && this.plane.spritePlane.checkFreeTile(this.tx, this.ty)) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Goomba', {
			tx: this.tx,
			ty: this.ty,
			state: this.startingState,
			xd: parseFloat(this.startingDir)
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// Ground.js
// Tile Object type
////

function Ground() {
	// class constructor
}

Ground.prototype = new Tile();
Ground.prototype.__name = 'Ground';
Ground.prototype.solid = true;
Ground.prototype.ground = true;
Ground.prototype.collisions = true;

Ground.prototype.onHitBottom = function(source) {
	// object hit bottom of block
	if (source.type == 'Character') {
		// play sound
		Effect.Audio.playSound( 'hit_head' );
	}
};
////
// ItemBlock.js
// Tile Object type
////

function ItemBlock() {
	// class constructor
	this.blockType = 'coin';
}

ItemBlock.prototype = new Tile();
ItemBlock.prototype.__name = 'ItemBlock';
ItemBlock.prototype.solid = true;
ItemBlock.prototype.ground = true;
ItemBlock.prototype.collisions = true;

// TODO - what about koopa shells running into blocks from the side?

ItemBlock.prototype.onHitBottom = function(source) {
	// object hit bottom of item block

	if (source.type == 'Character') {
		// save tile at our location and set to empty
		var tileIdx = this.plane.lookupTile( this.tx, this.ty, 'data' );
		this.plane.setTile( this.tx, this.ty, 0, 'data' );

		switch (this.blockType) {
			case 'coin':
				// create bouncer sprite
				this.plane.spritePlane.createSprite('BouncerTile', {
					tileIdx: 'dead.gif',
					tx: this.tx,
					ty: this.ty,
					character: source
				});

				// create coin spinner
				this.plane.spritePlane.createSprite('CoinSpinner', {
					tx: this.tx,
					ty: this.ty - 1
				});

				// play sound
				Effect.Audio.playSound( 'coin' );

				// set object tile to solid ground
				this.plane.setTile( this.tx, this.ty, new Ground(), 'objectData' );

				// increase score and coins
				source.addScore( 200 );
				source.addCoins( 1 );
				break;
			
			case 'multicoin':
				if (!this.startTime) this.startTime = Effect.Game.logicClock;
				var newTile = tileIdx;
				
				if (newTile) {
					if (Effect.Game.logicClock >= this.startTime + 100) {
						// times up
						newTile = 'dead.gif';

						// set object tile to solid ground
						this.plane.setTile( this.tx, this.ty, new Ground(), 'objectData' );
					}

					// create bouncer tile sprite
					this.plane.spritePlane.createSprite('BouncerTile', {
						tileIdx: newTile,
						tx: this.tx,
						ty: this.ty,
						character: source
					});

					// create coin spinner
					this.plane.spritePlane.createSprite('CoinSpinner', {
						tx: this.tx,
						ty: this.ty - 1
					});

					// play sound
					Effect.Audio.playSound( 'coin' );
					
					// increase score and coins
					source.addScore( 200 );
					source.addCoins( 1 );
				}
				break;
			
			case 'powerup':
				// create bouncer sprite
				this.plane.spritePlane.createSprite('BouncerTile', {
					tileIdx: 'dead.gif',
					tx: this.tx,
					ty: this.ty,
					character: source
				});

				// create mushroom or flower sprite
				this.plane.spritePlane.createSprite(source.size ? 'Flower' : 'Mushroom', {
					mushType: 'mushroom', // not 1up
					tx: this.tx,
					ty: this.ty,
					xd: 2 // TODO -- how does SMB set this?
				});

				// play sound
				Effect.Audio.playSound( 'item_rise' );

				// set object tile to solid ground
				this.plane.setTile( this.tx, this.ty, new Ground(), 'objectData' );
				break;
			
			case 'star':
				// create bouncer sprite
				this.plane.spritePlane.createSprite('BouncerTile', {
					tileIdx: 'dead.gif',
					tx: this.tx,
					ty: this.ty,
					character: source
				});

				// create star sprite
				this.plane.spritePlane.createSprite('Star', {
					tx: this.tx,
					ty: this.ty,
					xd: 3 // TODO -- how does SMB set this?
				});

				// play sound
				Effect.Audio.playSound( 'item_rise' );

				// set object tile to solid ground
				this.plane.setTile( this.tx, this.ty, new Ground(), 'objectData' );
				break;
			
			case '1up':
				// create bouncer sprite
				this.plane.spritePlane.createSprite('BouncerTile', {
					tileIdx: 'dead.gif',
					tx: this.tx,
					ty: this.ty,
					character: source
				});

				// create 1up mushroom sprite
				this.plane.spritePlane.createSprite('Mushroom', {
					mushType: '1up_mushroom',
					tx: this.tx,
					ty: this.ty,
					xd: 2 // TODO -- how does SMB set this?
				});

				// play sound
				Effect.Audio.playSound( 'item_rise' );

				// set object tile to solid ground
				this.plane.setTile( this.tx, this.ty, new Ground(), 'objectData' );
				break;
		} // switch

		// play hit_head sound
		Effect.Audio.playSound( 'hit_head' );
	} // character
};
////
// Koopa.js
// Enemy Object
////

function Koopa() {
	// class constructor

	// sprite members
	this.url = 'koopa.gif';
	this.width = 16;
	this.height = 24;
	this.hitRect = new Rect(0, 8, 16, 24);
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 2; // will be set at create time
	this.yd = 0;
	this.float_dir = 0.15;
	this.state = 'walking'; // will be set at create time

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'enemy';
}

Koopa.prototype = new Sprite();
Koopa.prototype.__name = 'Koopa';

Koopa.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');
	
	// environment color
	this.setFrameY( this.color );
	
	// might start out as projectile or shell
	if (this.state == 'projectile') this.category = 'projectile';
	else if (this.state == 'shell') {
		this.category = 'object';
		this.recoverTimer = 300;
	}

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = (this.ty * this.plane.tilePlane.tileSizeY) - 8;

	// call super's init
	Sprite.prototype.init.call(this);
};

Koopa.prototype.logic = function(logicClock) {
	// perform logic routine
	this[ 'logic_' + this.state ](logicClock);
};

Koopa.prototype.logic_rise = function() {
	// rise up from pipe
	this.y--;
	
	// see if we are risen enough
	var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 1 );
	if (!hit) {
		this.y++;
		this.state = 'walking';
		this.setZIndex( this.plane.zIndex ); // move to foreground
	}
};

Koopa.prototype.basicMovement = function() {
	// handle basic horiz movement + gravity
	
	// gravity
	if (this.yd < 0) {
		// headed upwards
		var hit = this.plane.moveLineY( this.y + 8, this.x, this.x + this.width, this.yd );
		if (hit) {
			// hit head
			this.y = hit.correctedY - 8;
			if (hit.target.solid) this.yd = 0;

			if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitTop(hit.target)) return;
		}
		else {
			// still flying
			this.y += this.yd;
			this.yd = parseInt( this.yd / 2, 10 );
		}
	}
	else {
		// headed downwards
		if (!this.yd) this.yd = 1;

		var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		if (hit) {
			// landed on something
			this.y = (hit.correctedY - this.height) + 1;
			
			if (hit.target.solid || hit.target.ground) this.yd = 0;

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else {
			// still falling
			this.y += this.yd;
			this.yd *= 2;
			if (this.yd > 8) this.yd = 8;
		}
	}
	
	// horizontal movement
	if (this.xd < 0) {
		// var hit = this.plane.moveLineX( this.x, this.y + 8, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x, this.y + 16, this.xd );
		if (hit) {
			this.x = hit.correctedX;
			if (hit.target.solid) {
				this.xd = 0 - this.xd;
				this.facing = 4 - this.facing;
				if (this.state == 'projectile') Effect.Audio.playSound( 'hit_head' );
			}

			if (hit.target.onHitRight) hit.target.onHitRight(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitLeft(hit.target)) return;
		}
		else this.x += this.xd;
	}
	else if (this.xd > 0) {
		// var hit = this.plane.moveLineX( this.x + this.width - 1, this.y + 8, this.y + this.height, this.xd );
		var hit = this.plane.movePointX( this.x + this.width - 1, this.y + 16, this.xd );
		if (hit) {
			this.x = (hit.correctedX - this.width) + 1;
			if (hit.target.solid) {
				this.xd = 0 - this.xd;
				this.facing = 4 - this.facing;
				if (this.state == 'projectile') Effect.Audio.playSound( 'hit_head' );
			}

			if (hit.target.onHitLeft) hit.target.onHitLeft(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitRight(hit.target)) return;
		}
		else this.x += this.xd;
	}
};

Koopa.prototype.logic_walking = function(logicClock) {
	// roam around
	this.setFrameX( (parseInt(logicClock / 7, 10) % 2) + this.facing );
	this.basicMovement();
	
	// red koopas are a bit smarter -- they don't walk off edges
	if ((this.color == 1) && !this.yd) {
		var cx = (this.xd > 0) ? this.x + this.width : this.x - 1;
		var hit = this.plane.movePointY( cx, this.y + this.height, 1 );
		if (!hit || !hit.target.ground) {
			this.xd = 0 - this.xd;
			this.facing = 4 - this.facing;
		}
	} // red koopa
};

Koopa.prototype.logic_floating = function(logicClock) {
	// float up/down smoothly
	this.xd = 0;
	this.setFrameX( (parseInt(logicClock / 7, 10) % 2) + 2 + this.facing );
	
	this.yd += this.float_dir;
	if (Math.abs(this.yd) >= 4) this.float_dir = 0 - this.float_dir;
	
	if (this.yd < 0) {
		// headed upwards
		var hit = this.plane.moveLineY( this.y + 8, this.x, this.x + this.width, this.yd );
		if (hit) {
			// hit head
			this.y = hit.correctedY - 8;
			if (hit.target.solid) {
				this.yd = 0;
				if (this.float_dir < 0) this.float_dir = 0 - this.float_dir;
			}

			// if (hit.target.onHitBottom) hit.target.onHitBottom(this);
			// else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHitTop(hit.target)) return;
		}
		else {
			// still flying
			this.y += this.yd;
		}
	}
	else if (this.yd > 0) {
		// headed downwards
		var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
		if (hit) {
			// landed on something
			this.y = (hit.correctedY - this.height) + 1;
			
			if (hit.target.solid || hit.target.ground) {
				this.yd = 0;
				if (this.float_dir > 0) this.float_dir = 0 - this.float_dir;
			}

			if (hit.target.onHitTop) hit.target.onHitTop(this);
			else if (hit.target.onHit) hit.target.onHit(this);
			
			if (this.onHit(hit.target)) return;
		}
		else {
			// still falling
			this.y += this.yd;
		}
	}
};

Koopa.prototype.logic_shell = function(logicClock) {
	// shelled
	this.xd = easeOutInt( this.xd, 8 );
	this.basicMovement();
	
	// shells recover after while
	this.recoverTimer--;
	if (this.recoverTimer < 50) {
		// feet starting to show through shell
		this.setFrameX( (parseInt(logicClock / 7, 10) % 2) + 8 );
	}
	if (!this.recoverTimer) {
		this.state = 'walking';
		this.category = 'enemy'; // we are dangerous again
		this.xd = this.facing ? -1.5 : 1.5;
	}
};

Koopa.prototype.logic_projectile = function() {
	// kicked shell
	this.basicMovement();
};

Koopa.prototype.logic_death = function() {
	// we're dead, fall offscreen
	if (this.yd < 0) this.yd = easeOutInt( this.yd, 3 );
	else if (this.yd == 0) this.yd = 1;
	else this.yd *= 2;
	if (this.yd > 16) this.yd = 16;

	this.y += this.yd;
	this.x += this.xd;
};

Koopa.prototype.onHit = function(source) {
	// something hit us
	
	switch (source.category) {
		case 'projectile':
			// projectiles kill us
			this.state = 'death';
			this.collisions = false;
			this.yd = -8;
			this.setFrameX( 10 );
			
			// inherit direction from whatever hit us
			if ((this.xd < 0) && (source.xd > 0)) this.xd = 0 - this.xd;
			else if ((this.xd > 0) && (source.xd < 0)) this.xd = 0 - this.xd;
			
			// play kill sound
			Effect.Audio.playSound( 'kill_enemy' );
			
			if (source.character) {
				// give score
				source.character.addScore( 100 );
				
				// show bonus
				this.plane.createSprite('BonusDisplay', {
					amount: 100,
					x: this.x,
					y: this.y - 8
				});
			} // character
			
			return 1;
			break;
		case 'character':
			if ((this.state == 'shell') && !source.invincible) {
				// kick shell
				this.category = 'projectile';
				this.state = 'projectile';
				this.setFrameX( 8 );
				
				// if shell hits other things, characters gets score
				this.character = source;
				
				// calculate our direction
				this.xd = 8;
				if (source.centerPointX() > this.centerPointX()) this.xd = -8;
				
				// play kick sound
				Effect.Audio.playSound( 'kill_enemy' );
				
				// give score
				source.addScore( 400 );
				
				// show bonus
				this.plane.createSprite('BonusDisplay', {
					amount: 400,
					x: this.x,
					y: this.y
				});

				// prevent hit from nearby enemies for 4 frames
				source.invincible = true;
				source.invincibleEnd = Effect.Game.logicClock + 4;
				
				// prevent repeat shelling for a few frames
				this.kickFree = Effect.Game.logicClock + 8;
				
				return 1;
			}
			break;
	} // switch type
	
	return 0;
};

Koopa.prototype.onHitLeft = function(source) {
	// something hit our left side
	
	switch (source.category) {
		case 'enemy':
			// enemies bounce off each other
			if ((this.state != 'projectile') && (this.xd < 0)) {
				this.xd = 0 - this.xd;
				this.facing = 4 - this.facing;
			}
			return 1;
			break;
	
		default:
			return this.onHit(source);
			break;
	} // switch type
	
	return 0;
};

Koopa.prototype.onHitRight = function(source) {
	// something hit our right side
	
	switch (source.category) {
		case 'enemy':
			// enemies bounce off each other
			if ((this.state != 'projectile') && (this.xd > 0)) {
				this.xd = 0 - this.xd;
				this.facing = 4 - this.facing;
			}
			return 1;
			break;
	
		default:
			return this.onHit(source);
			break;
	} // switch type
	
	return 0;
};

Koopa.prototype.onHitTop = function(source) {
	// something hit our head
	
	if (source.type == 'Character') {
		switch (this.state) {
			case 'walking':
			case 'projectile':
				// we got shelled
				
				// prevent repeat shelling
				if ((this.state == 'projectile') && this.kickFree && (Effect.Game.logicClock < this.kickFree)) return 0;
				
				// set state
				this.setFrameX( 8 );
				this.state = 'shell';
				this.recoverTimer = 300;
				this.character = null;
				this.category = 'object'; // harmless object at this point
				
				// play squish sound
				Effect.Audio.playSound( 'squish_enemy' );

				// character bounce
				source.yd = -8;
				source.state = 'falling';

				// prevent hit from nearby enemies for 4 frames
				source.invincible = true;
				source.invincibleEnd = Effect.Game.logicClock + 4;
				
				return 1;
				break;
			case 'shell':
				// shell slide
				return this.onHit(source);
				break;
			case 'floating':
				// floating koopa looses its wings
				this.setFrameX( this.facing );
				this.state = 'walking';
				this.xd = this.facing ? -1.5 : 1.5;
				this.yd = 2;
				
				// 400 bonus points (TODO: accumulating bonuses!!!)
				
				// play squish sound
				Effect.Audio.playSound( 'squish_enemy' );
				
				// character bounce
				source.yd = -8;
				source.state = 'falling';

				// prevent hit from nearby enemies for 4 frames
				source.invincible = true;
				source.invincibleEnd = Effect.Game.logicClock + 8;
				
				return 1;
				break;
		} // state
	}
	else return this.onHit(source);
	
	return 0;
};
////
// KoopaSpawn.js
// Tile Object type
////

function KoopaSpawn() {
	// class constructor
	this.spriteID = 0;
	this.startingState = 'walking';
	this.startingDir = -1.5;
	this.startingColor = 0;
}

KoopaSpawn.prototype = new Tile();
KoopaSpawn.prototype.__name = 'KoopaSpawn';
KoopaSpawn.prototype.solid = false;
KoopaSpawn.prototype.collisions = false;

KoopaSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID )) && this.plane.spritePlane.checkFreeTile(this.tx, this.ty)) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Koopa', {
			tx: this.tx,
			ty: this.ty,
			state: this.startingState,
			xd: parseFloat(this.startingDir),
			facing: (this.startingDir > 0) ? 0 : 4,
			color: parseInt(this.startingColor, 10)
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// MainTitle.js
// Sprite Object
////

function MainTitle() {
	// class constructor

	// sprite members
	this.url = 'main_title.gif';
	this.width = 176;
	this.height = 96;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

MainTitle.prototype = new Sprite();
MainTitle.prototype.__name = 'MainTitle';

MainTitle.prototype.init = function() {
	// override sprite init
	this.zIndex = 99; // above everything

	// call super's init
	Sprite.prototype.init.call(this);
};

MainTitle.prototype.logic = function() {
	// logic loop
};
////
// Mushroom.js
// Sprite Object
////

function Mushroom() {
	// class constructor

	// sprite members
	this.url = 'mushroom.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.mushType = 'mushroom';
	this.state = 'rise';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'powerup';
}

Mushroom.prototype = new Sprite();
Mushroom.prototype.__name = 'Mushroom';

Mushroom.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	this.url = this.mushType + '.gif';

	this.zIndex = this.plane.tilePlane.zIndex - 1; // under tiles
	this.visible = false; // for a few frames
	this.showMe = Effect.Game.logicClock + 5;

	// call super's init
	Sprite.prototype.init.call(this);
};

Mushroom.prototype.logic = function(logicClock) {
	// logic loop
	switch (this.state) {
		case 'rise':
			// rise up from under item block
			this.y--;
			
			// see if we are risen enough
			var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 1 );
			if (!hit) {
				this.y++;
				this.state = 'roam';
				this.setZIndex( this.plane.zIndex ); // move to foreground
			}
			
			// show after a few frames
			if (!this.visible && (logicClock >= this.showMe)) this.show();
			break;
		
		case 'roam':
			// gravity
			if (this.yd < 0) {
				// headed upwards
				var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
				if (hit) {
					// hit head
					this.y = hit.correctedY;					
					if (hit.target.solid) this.yd = 0;

					if (hit.target.powerUp) {
						hit.target.powerUp(this.mushType);
						this.destroy();
						return;
					}
				}
				else {
					// still flying
					this.y += this.yd;
					this.yd = parseInt( this.yd / 2, 10 );
				}
			}
			else {
				// headed downwards
				if (!this.yd) this.yd = 1;
				
				var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
				if (hit) {
					// landed on something
					this.y = (hit.correctedY - this.height) + 1;
					
					if (hit.target.solid || hit.target.ground) this.yd = 0;

					if (hit.target.powerUp) {
						hit.target.powerUp(this.mushType);
						this.destroy();
						return;
					}
				}
				else {
					// still falling
					this.y += this.yd;
					this.yd *= 2;
					if (this.yd > 6) this.yd = 6;
				}
			}

			// horizontal movement
			if (this.xd < 0) {
				var hit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
				if (hit) {
					this.x = hit.correctedX;
					if (hit.target.solid) this.xd = 0 - this.xd;

					if (hit.target.powerUp) {
						hit.target.powerUp(this.mushType);
						this.destroy();
						return;
					}
				}
				else this.x += this.xd;
			}
			else if (this.xd > 0) {
				var hit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
				if (hit) {
					this.x = (hit.correctedX - this.width) + 1;
					if (hit.target.solid) this.xd = 0 - this.xd;

					if (hit.target.powerUp) {
						hit.target.powerUp(this.mushType);
						this.destroy();
						return;
					}
				}
				else this.x += this.xd;
			}
			break;
	} // switch state
};

Mushroom.prototype.onHit = function(source) {
	// something hit us
	if (source.powerUp) {
		source.powerUp(this.mushType);
		this.destroy();
		return;
	}
	else if (source.type == 'BouncerTile') {
		this.yd = -16;
	}
};
////
// Particle.js
// Sprite Object
////

function Particle() {
	// class constructor

	// sprite members
	this.url = 'particle.gif';
	this.width = 8;
	this.height = 8;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

Particle.prototype = new Sprite();
Particle.prototype.__name = 'Particle';

Particle.prototype.init = function() {
	// override sprite init
	this.setFrameY( level.environment );

	// call super's init
	Sprite.prototype.init.call(this);
};

Particle.prototype.logic = function(logicClock) {
	// logic loop
	if (this.yd < 0) this.yd = easeOutInt( this.yd, 3 );
	else if (this.yd == 0) this.yd = 1;
	else this.yd *= 2;
	if (this.yd > 16) this.yd = 16;

	this.y += this.yd;
	this.x += this.xd;

	this.setFrameX( parseInt(logicClock / 3, 10) % 4 );
};
////
// Pipe.js
// Tile Object type
////

function Pipe() {
	// class constructor
	this.pipeType = 'vert';
}

Pipe.prototype = new Tile();
Pipe.prototype.__name = 'Pipe';
Pipe.prototype.solid = true;
Pipe.prototype.ground = true;
Pipe.prototype.collisions = true;

Pipe.prototype.onDuck = function(source) {
	// object hit bottom of block
	if ((source.type == 'Character') && (this.pipeType == 'vert') && (source.state != 'pipe_enter')) {
		// down we go...
		
		// make sure character is *entirely* standing on pipe
		var hit = this.plane.spritePlane.movePointY( source.x - 4, source.y + source.height - 1, 1 );
		if (!hit || (hit.target.type != 'Pipe')) return;
		
		hit = this.plane.spritePlane.movePointY( source.x + source.width + 4, source.y + source.height - 1, 1 );
		if (!hit || (hit.target.type != 'Pipe')) return;
		
		// set state
		source.state = 'pipe_enter';
		source.yd = 2;
		source.xd = 0;
		source.setZIndex( this.plane.zIndex - 1 ); // under tiles
		source.pipe = this;
		
		// play sound
		Effect.Audio.quietCategory( 'music' );
		Effect.Audio.playSound( 'down_pipe' );
		
		// schedule event to transport
		Effect.Game.scheduleEvent( 50, 'onPipe' );
	}
};

Pipe.prototype.onEnter = function(source) {
	// object entering our left or right
	if ((source.type == 'Character') && (this.pipeType == 'horiz') && (source.state != 'pipe_enter')) {
		// enter pipe
		// set state
		source.state = 'pipe_enter';
		source.yd = 0;
		source.xd = this.facing ? -2 : 2;
		source.setZIndex( this.plane.zIndex - 1 ); // under tiles
		source.pipe = this;
		
		// play sound
		Effect.Audio.quietCategory( 'music' );
		Effect.Audio.playSound( 'down_pipe' );
		
		// schedule event to transport
		Effect.Game.scheduleEvent( 50, 'onPipe' );
		
		return 1;
	}
	
	return 0;
};
////
// Piranah.js
// Sprite Object
////

function Piranah() {
	// class constructor

	// sprite members
	this.url = 'piranah.gif';
	this.width = 16;
	this.height = 24;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.state = 'rise';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'enemy';
}

Piranah.prototype = new Sprite();
Piranah.prototype.__name = 'Piranah';

Piranah.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = (this.tx * this.plane.tilePlane.tileSizeX) + (this.plane.tilePlane.tileSizeX / 2);
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	
	// environment color
	this.setFrameY( level.environment );
	
	// zIndex
	this.zIndex = this.plane.tilePlane.zIndex - 1; // under tiles
	
	// set initial state
	this.state = 'idle';
	this.idleEnd = Effect.Game.logicClock + 1;
	this.nextState = 'rise';
	this.collisions = false;

	// call super's init
	Sprite.prototype.init.call(this);
};

Piranah.prototype.logic = function(logicClock) {
	// logic loop
	this.setFrameX( parseInt(logicClock / 7, 10) % 2 );
	
	switch (this.state) {
		case 'rise':
			// rise up from under item block
			this.y -= 1;
			
			// see if we are risen enough
			var hit = this.plane.movePointY( this.x + (this.width / 2), this.y + this.height - 1, 1 );
			if (!hit || !hit.target.solid) {
				this.y += 1;
				this.state = 'idle';
				this.idleEnd = logicClock + 40;
				this.nextState = 'fall';
				this.collisions = true;
			}
			break;
		
		case 'idle':
			// wait for next action
			if (logicClock >= this.idleEnd) {
				this.state = this.nextState;
				this.collisions = true;
			}
			
			// but wait, if new state is rise and character is too close by, abort
			if (this.state == 'rise') {
				var character = this.plane.findSprite({ type: 'Character' });
				if (character && (Math.abs(character.x - this.x) < 32)) {
					// character too close by, go idle again
					this.state = 'idle';
					this.idleEnd = logicClock + 40;
					this.collisions = false;
				}
			}
			break;
		
		case 'fall':
			// fall back into pipe
			this.y += 1;

			// see if we are risen enough
			var hit = this.plane.movePointY( this.x + (this.width / 2), this.y, -1 );
			if (hit && hit.target.solid) {
				this.state = 'idle';
				this.idleEnd = logicClock + 40;
				this.nextState = 'rise';
				this.collisions = false;
			}
			break;
	} // switch state
};

Piranah.prototype.onHit = function(source) {
	// something hit us
	switch (source.category) {
		case 'projectile':
			// projectiles kill us
			this.destroy();
			
			// play kill sound
			Effect.Audio.playSound( 'kill_enemy' );
			
			if (source.character) {
				// give score
				source.character.addScore( 200 );
				
				// show bonus
				this.plane.createSprite('BonusDisplay', {
					amount: 200,
					x: this.x,
					y: this.y - 16
				});
			} // character
			
			return 1;
			break;
	} // switch type
	
	return 0;
};
////
// PiranahSpawn.js
// Tile Object type
////

function PiranahSpawn() {
	// class constructor
	this.spriteID = 0;
}

PiranahSpawn.prototype = new Tile();
PiranahSpawn.prototype.__name = 'PiranahSpawn';
PiranahSpawn.prototype.solid = true;
PiranahSpawn.prototype.ground = true;
PiranahSpawn.prototype.collisions = true;

PiranahSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID ))) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Piranah', {
			tx: this.tx,
			ty: this.ty
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// Platform.js
// Sprite Object
////

function Platform() {
	// class constructor

	// sprite members
	this.url = 'metal_platform.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.state = 'elevator_down';

	// behavior attributes
	this.solid = true;
	this.ground = true;
	this.collisions = true;
	this.dieOffscreen = true;
	this.lateLogic = true;
	this.standings = [];
	this.category = 'platform';
}

Platform.prototype = new Sprite();
Platform.prototype.__name = 'Platform';

Platform.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	
	// zIndex
	this.zIndex = this.plane.zIndex - 1; // under sprites

	// call super's init
	Sprite.prototype.init.call(this);
};

Platform.prototype.logic = function() {
	// logic loop
	this[ 'logic_' + this.state ]();
	
	if (this.standings.length > 0) {
		for (var idx = 0; idx < this.standings.length; idx++) {
			var source = this.standings[idx];
			source.x += this.xd;
			source.y = this.y - source.height;
		}
		this.standings = [];
	}
};

Platform.prototype.logic_elevator_down = function() {
	// move down and loop at top of screen
	this.yd = 1;
	this.y += this.yd;
	if (this.y >= this.port.scrollY + this.port.portHeight) {
		this.y = this.port.scrollY - this.height;
		this.standings = [];
	}
};

Platform.prototype.logic_elevator_up = function() {
	// move down and loop at top of screen
	this.yd = -1;
	this.y += this.yd;
	if (this.y <= this.port.scrollY - this.height) {
		this.y = this.port.scrollY + this.port.portHeight;
		this.standings = [];
	}
};

Platform.prototype.logic_wave_vert = function() {
	// go up/down smoothly
	this.xd = 0;
	this.yd += this.deltaDelta;
	if (Math.abs(this.yd) >= this.maxDelta) this.deltaDelta = 0 - this.deltaDelta;
	
	this.y += this.yd;
};

Platform.prototype.logic_wave_horiz = function() {
	// go left/right smoothly
	this.xd += this.deltaDelta;
	this.yd = 0;
	if (Math.abs(this.xd) >= this.maxDelta) this.deltaDelta = 0 - this.deltaDelta;
	
	this.x += this.xd;
};

Platform.prototype.onStanding = function(source) {
	this.standings.push( source );
};

Platform.prototype.onHit = function(source) {
	// something hit us
	return 0;
};
////
// PlatformSpawn.js
// Tile Object type
////

function PlatformSpawn() {
	// class constructor
	this.spriteID = 0;
	this.platformStyle = 'metal';
	this.platformType = 'wave_horiz';
	this.platformWidth = 1;
}

PlatformSpawn.prototype = new Tile();
PlatformSpawn.prototype.__name = 'PlatformSpawn';
PlatformSpawn.prototype.solid = false;
PlatformSpawn.prototype.collisions = false;

PlatformSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID ))) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Platform', {
			tx: this.tx,
			ty: this.ty,
			url: this.platformStyle + '_platform.gif',
			state: this.platformType,
			width: (this.platformWidth * 16),
			spriteRepeat: this.platformWidth,
			deltaDelta: this.deltaDelta,
			maxDelta: this.maxDelta
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// Princess.js
// Sprite Object
////

function Princess() {
	// class constructor

	// sprite members
	this.url = 'princess.gif';
	this.width = 16;
	this.height = 24;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	
	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = false;
	this.dieOffscreen = true;
}

Princess.prototype = new Sprite();
Princess.prototype.__name = 'Princess';

Princess.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = ((this.ty * this.plane.tilePlane.tileSizeY) + this.plane.tilePlane.tileSizeY) - this.height;

	// call super's init
	Sprite.prototype.init.call(this);
};

Princess.prototype.logic = function() {
	// logic loop
};
////
// PrincessSpawn.js
// Tile Object type
////

function PrincessSpawn() {
	// class constructor
	this.spriteID = 0;
	this.princessStyle = 'fake';
}

PrincessSpawn.prototype = new Tile();
PrincessSpawn.prototype.__name = 'PrincessSpawn';

PrincessSpawn.prototype.solid = true;
PrincessSpawn.prototype.ground = true;
PrincessSpawn.prototype.collisions = true;

PrincessSpawn.prototype.onScreen = function() {
	// we just scrolled onscreen -- see if we need to create a new sprite
	if ((!this.spriteID || !this.plane.spritePlane.lookupSprite( this.spriteID ))) {
		// create new sprite
		var sprite = this.plane.spritePlane.createSprite('Princess', {
			tx: this.tx,
			ty: this.ty,
			frameX: (this.princessStyle == 'real') ? 1 : 0
		});
				
		// keep track so we don't keep spawning
		this.spriteID = sprite.id;
	} // create new sprite
};
////
// Star.js
// Sprite Object
////

function Star() {
	// class constructor

	// sprite members
	this.url = 'star.gif';
	this.width = 16;
	this.height = 16;
	this.frameX = 0;
	this.frameY = 0;
	this.xd = 0;
	this.yd = 0;
	this.ydmax = 16;
	this.mushType = 'star';
	this.state = 'rise';

	// behavior attributes
	this.solid = false;
	this.ground = false;
	this.collisions = true;
	this.dieOffscreen = true;
	this.category = 'powerup';
}

Star.prototype = new Sprite();
Star.prototype.__name = 'Star';

Star.prototype.init = function() {
	// override sprite init
	this.require('tx', 'ty');

	// set sprite members
	this.x = this.tx * this.plane.tilePlane.tileSizeX;
	this.y = this.ty * this.plane.tilePlane.tileSizeY;
	this.url = 'star.gif';

	this.zIndex = this.plane.tilePlane.zIndex - 1; // under tiles
	this.visible = false; // for a few frames
	this.showMe = Effect.Game.logicClock + 5;

	// call super's init
	Sprite.prototype.init.call(this);
};

Star.prototype.logic = function(logicClock) {
	// logic loop
	switch (this.state) {
		case 'rise':
			// rise up from under item block
			this.y--;
			
			// see if we are risen enough
			var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, 1 );
			if (!hit) {
				this.y++;
				this.state = 'roam';
				this.yd = 0 - this.ydmax;
				this.setZIndex( this.plane.zIndex ); // move to foreground
			}
			
			// show after a few frames
			if (!this.visible && (logicClock >= this.showMe)) this.show();
			break;
		
		case 'roam':
			// gravity
			if (this.yd < 0) {
				// headed upwards
				var hit = this.plane.moveLineY( this.y, this.x, this.x + this.width, this.yd );
				if (hit) {
					// hit head
					this.y = hit.correctedY;					
					if (hit.target.solid) this.yd = 0;

					if (hit.target.powerUp) {
						hit.target.powerUp('star');
						this.destroy();
						return;
					}
				}
				else {
					// still flying
					this.y += this.yd;
					this.yd = easeFloat( this.yd, 3 );
				}
			}
			else {
				// headed downwards
				if (!this.yd) this.yd = 1;
				
				var hit = this.plane.moveLineY( this.y + this.height - 1, this.x, this.x + this.width, this.yd );
				if (hit) {
					// landed on something
					this.y = (hit.correctedY - this.height) + 1;
					
					if (hit.target.solid || hit.target.ground) this.yd = 0 - this.ydmax;

					if (hit.target.powerUp) {
						hit.target.powerUp('star');
						this.destroy();
						return;
					}
				}
				else {
					// still falling
					this.y += this.yd;
					this.yd = easeFloat( this.yd, 4, 1 );
					if (this.yd > 8) this.yd = 8;
				}
			}

			// horizontal movement
			if (this.xd < 0) {
				var hit = this.plane.moveLineX( this.x, this.y, this.y + this.height, this.xd );
				if (hit) {
					this.x = hit.correctedX;
					if (hit.target.solid) this.xd = 0 - this.xd;

					if (hit.target.powerUp) {
						hit.target.powerUp('star');
						this.destroy();
						return;
					}
				}
				else this.x += this.xd;
			}
			else if (this.xd > 0) {
				var hit = this.plane.moveLineX( this.x + this.width - 1, this.y, this.y + this.height, this.xd );
				if (hit) {
					this.x = (hit.correctedX - this.width) + 1;
					if (hit.target.solid) this.xd = 0 - this.xd;

					if (hit.target.powerUp) {
						hit.target.powerUp('star');
						this.destroy();
						return;
					}
				}
				else this.x += this.xd;
			}
			break;
	} // switch state
};

Star.prototype.onHit = function(source) {
	// something hit us
	if (source.powerUp) {
		source.powerUp('star');
		this.destroy();
		return;
	}
};
//
// Mario Demo
// (c) 1985 Nintendo
//

// globals
var game_def = null;
var tile_plane = null;
var sprite_plane = null;
var mario = null;
var hud_plane = null;
var level = {};
var port = null;

Effect.Game.setHandler( 'onInit', 'mario_init' );

function mario_init() {
	
	Effect.ImageLoader.setMaxLoadsPerFrame( 8 );

	// sprite plane
	sprite_plane = new SpritePlane('sprites');
	sprite_plane.setZIndex( 4 );
	Effect.Port.attach(sprite_plane);
	
	// hud sprite plane
	hud_plane = new SpritePlane('hud_sprites');
	hud_plane.setZIndex( 6 );
	hud_plane.setScrollSpeed( 0 ); // fixed, do not scroll
	hud_plane.setLogic( false ); // no logic needed
	Effect.Port.attach(hud_plane);

	// set handlers
	Effect.Game.setHandler( 'onLogic', 'game_logic_loop' );
	Effect.Game.setHandler( 'onDeath', 'game_death' );
	Effect.Game.setHandler( 'onLevelComplete', 'game_level_complete' );
	Effect.Game.setHandler( 'onWorldComplete', 'game_world_complete' );
	Effect.Game.setHandler( 'onPipe', 'game_level_pipe' );
	Effect.Game.setHandler( 'onPause', 'game_pause' );
	Effect.Game.setHandler( 'onResume', 'game_resume' );
	Effect.Game.setHandler( 'onLoadGame', 'game_core_loaded' );
	Effect.Game.setHandler( 'onEnableMusic', 'game_resume' );
	Effect.Game.setHandler( 'onKeyDown', 'game_key_down' );
	
	Effect.Game.setStateHandler( 'run', 'game_state_run' );
	Effect.Game.setStateHandler( 'title', 'game_state_title' );
	Effect.Game.setStateHandler( 'level_complete_a', 'game_state_level_complete_a' );
	Effect.Game.setStateHandler( 'level_complete_b', 'game_state_level_complete_b' );
	Effect.Game.setStateHandler( 'level_complete_c', 'game_state_level_complete_c' );
	Effect.Game.setStateHandler( 'world_complete_a', 'game_state_world_complete_a' );
	Effect.Game.setStateHandler( 'world_complete_b', 'game_state_world_complete_b' );
	Effect.Game.setStateHandler( 'world_complete_c', 'game_state_world_complete_c' );
	
	Effect.Game.setKeyHandler('button_4', {
		onKeyDown: function() {
			switch (Effect.Game.getState()) {
				case 'title': game_start_new_game(); break;
				case 'run': Effect.Game.pause(); break;
			} // switch state
		}
	} );
	Effect.Game.setResumeKey( 'button_4' );
	
	Effect.Port.setHandler( 'onMouseDown', function() {
		if (Effect.Game.getState() == 'title') game_start_new_game();
		return false;
	} );
}

function game_core_loaded() {
	// now load level
	// HUD plane
	port = Effect.Port;
	
	var hud = null;
	
	if (!hud_plane.lookupSprite('hud')) {
		hud = new TextSprite();
		hud.id = 'hud';
		hud.zIndex = 6;
		hud.setTableSize( 26, 1 );
		hud.setPosition( 24, 24 );
		// hud.setFont( 'nes_classic' );
		hud.setCustomFont( '/fonts/nes_classic.gif', 8, 8 );
		hud_plane.attach(hud);
	}
	else {
		hud = hud_plane.lookupSprite('hud');
	}
	
	hud.setPadInt( 0, 0, mario ? mario.score : 0, 6 ); // score
	hud.setPadInt( 10, 0, mario ? mario.coins : 0, 2 ); // coins
	hud.setString( 16, 0, "1-1" );
	hud.setPadInt( 23, 0, 0, 3 ); // time
	
	hud_plane.createSprite( StaticImageSprite, {
		url: 'hud.gif',
		x: 24,
		y: 16
	});
	
	hud_plane.createSprite( StaticImageSprite, {
		url: 'small_coin.gif',
		x: 24 + (8 * 8),
		y: 16 + (1 * 8)
	});
	
	hud_plane.createSprite( StaticImageSprite, {
		url: 'x.gif',
		x: 24 + (9 * 8),
		y: 16 + (1 * 8)
	});
	
	game_def = Effect.Game.getXML( 'game.xml' );
	
	Effect.Game.loadLevel( 'world-1-1', 'game_main_title', true );
}

function game_main_title() {
	// setup planes with new level data
	level = Effect.Game.getLevelProps();
	
	tile_plane = Effect.Port.getPlane('tiles');
	
	// connect planes together (for collisions, etc.)
	sprite_plane.linkTilePlane( tile_plane );
	tile_plane.linkSpritePlane( sprite_plane );
	
	hud_plane.deleteSprites( 'temp_hud', 'temp_mario', 'temp_x' );
		
	// show main title
	sprite_plane.createSprite('MainTitle', {
		x: 40,
		y: 56
	});
	
	// show mario
	level.character_start.match(/^(\d+)\D+(\d+)$/);
	mario = sprite_plane.createSprite('Character', {
		x: parseInt(RegExp.$1, 10),
		y: parseInt(RegExp.$2, 10),
		state: 'none'
	});
	
	// scroll to where character will start
	var destScrollX = parseInt( (mario.x + (mario.width / 2)) - (port.portWidth / 2), 10 );
	var destScrollY = parseInt( (mario.y + (mario.height / 2)) - (port.portHeight / 2), 10 );
	port.setScroll( destScrollX, destScrollY );
	
	tile_plane.show();
	sprite_plane.show();

	port.draw(true);
	
	Effect.Game.logicClock = 0;
	
	game_def.konamiIdx = 0;
	
	// set game state for 'start' key action control
	Effect.Game.setState('title');
}

function game_reset() {
	// reset game after end
	sprite_plane.reset();
	sprite_plane.init();
	
	tile_plane.reset();
	tile_plane.init();
	
	hud_plane.reset();
	hud_plane.deleteSprite('thank_you');
	hud_plane.init();
	
	Effect.Game.setKeysActive( true );
	game_core_loaded();
}

function game_start_new_game() {
	// start brand new game
	sprite_plane.deleteAll();
	
	mario = sprite_plane.createSprite('Character', {
		x: 0,
		y: 0,
		visible: false
	});
	mario.lives = 3;
	
	var level_name = (game_def.konamiIdx == game_def.KonamiCode.Key.length) ? 'test' : 'world-1-1';
	Effect.Game.loadLevel( level_name, 'game_level_setup', true );
}

function is_pipe(tx, ty) {
	// checks if tile at tx, ty is a pipe
	var tile = tile_plane.lookupTile(tx, ty, 'objectData');
	return (tile && (tile.type == 'Pipe'));
}

function game_level_setup() {
	// get level props
	level = Effect.Game.getLevelProps();
	level.scroll_x_max = parseInt( level.scroll_x_max, 10 );
	level.time_remain = parseInt( level.time_remain, 10 );
	if (level.game_state == 'standard') level.game_state = 'run';
	
	// kill all sprites and temporary tiles
	for (var key in sprite_plane.sprites) {
		var sprite = sprite_plane.sprites[key];
		if (sprite.type != 'Character') sprite.destroy();
	}
	tile_plane.reset();
	tile_plane.init();
		
	mario.state = 'falling';
	
	if (level.character_start.match(/^(\d+)\D+(\d+)$/)) {
		mario.x = parseInt(RegExp.$1, 10);
		mario.y = parseInt(RegExp.$2, 10);
	}
	else {
		mario.x = 0;
		mario.y = 0;
	}
	
	if (mario.size) mario.y -= 16;
	mario.star = 0;
	mario.category = 'character';
	mario.flash = 0;
	mario.facing = 0; // 0=right, 14=left
	if (mario.flower) mario.setImage( mario.brother + '_flower_power.gif' );
	else mario.setImage( mario.brother + '_' + (mario.size ? 'large' : 'small') + '.gif' );
	mario.setFrame( 0, 0 );
	mario.invincible = false;
	mario.xd = 0;
	mario.yd = 0;
	mario.requestJump = false;
	mario.requsetFireball = false;
	mario.zIndex = sprite_plane.zIndex;
	mario.hide();
	
	if (mario.pipe) {
		// exiting thru pipe, determine pipe type and position
		var destPipeType = '';
		
		if (mario.pipe.destTileX && mario.pipe.destTileY) {
			var tx = mario.pipe.destTileX;
			var ty = mario.pipe.destTileY;
			
			if (is_pipe(tx, ty) && (is_pipe(tx + 1, ty) || is_pipe(tx - 1, ty))) {
				destPipeType = 'vert';
				if (!tile_plane.lookupTile(tx, ty - 1, 'objectData')) {
					mario.yd = -2;
					mario.y = ty * tile_plane.tileSizeY;
				}
				else {
					mario.yd = 2;
					mario.y = ((ty + 1) * tile_plane.tileSizeY) - mario.height;
				}
				if (is_pipe(tx + 1, ty)) mario.x = (tx * tile_plane.tileSizeX) + (tile_plane.tileSizeX / 2);
				else mario.x = (tx * tile_plane.tileSizeX) - (tile_plane.tileSizeX / 2);
			}
			else if (is_pipe(tx, ty) && (is_pipe(tx, ty + 1) || is_pipe(tx, ty - 1))) {
				destPipeType = 'horiz';
				mario.x = (tx * tile_plane.tileSizeX);
				if (!tile_plane.lookupTile(tx - 1, ty, 'objectData')) {
					mario.xd = -2;
					mario.facing = 14;
				}
				else {
					mario.xd = 2;
					mario.facing = 0;
				}
				if (is_pipe(tx, ty + 1)) mario.y = ty * tile_plane.tileSizeY;
				else mario.y = (ty - 1) * tile_plane.tileSizeY;
				if (!mario.size) mario.y += mario.height;
			}
		}
		
		if (destPipeType) {
			mario.state = 'pipe_exit';
			mario.zIndex = tile_plane.zIndex - 1; // under tiles
		}			
	} // from pipe
	
	mario.setZIndex( mario.zIndex );
	sprite_plane.clearSoloSprite();
	
	var destScrollX = parseInt( (mario.x + (mario.width / 2)) - (port.portWidth / 2), 10 );
	var destScrollY = parseInt( (mario.y + (mario.height / 2)) - (port.portHeight / 2), 10 );
	port.setScroll( destScrollX, destScrollY );
	
	if (mario.pipe) game_level_play();
	else game_level_intro();
}

function game_level_intro() {
	// show level intro
	Effect.Game.setState('intro');
	// port.setBackground({ color: 'black' });
	port.setBackgroundColor( 'black' );
	tile_plane.hide();
	sprite_plane.hide();
	
	var hud = hud_plane.lookupSprite('hud');
	
	// update world N-N in upper hud
	hud.setString( 16, 0, level.world_num );
	
	// create temp hud for "WORLD N-N" in center of screen
	var temp_hud = new TextSprite();
	temp_hud.id = 'temp_hud';
	temp_hud.zIndex = 6;
	temp_hud.setTableSize( 9, 5 );
	temp_hud.setPosition( 86, 80 );
	// temp_hud.setFont( 'nes_classic' );
	temp_hud.setCustomFont( '/fonts/nes_classic.gif', 8, 8 );
	hud_plane.attach( temp_hud );
	temp_hud.setString( 0, 0, "WORLD " + level.world_num );
	temp_hud.setString( 7, 4, mario.lives );
	// temp_hud.port = port;
	// temp_hud.init();
	
	hud_plane.createSprite( StaticImageSprite, {
		id: 'temp_x',
		url: 'x.gif',
		x: 86 + (4 * 8),
		y: 80 + (4 * 8)
	});
	
	// show little mario as well
	hud_plane.createSprite( 'Character', {
		id: 'temp_mario',
		state: 'none', // prevent falling
		x: 94,
		y: 106
	});
	
	sprite_plane.setLogic( false );
	
	// setTimeout( 'game_level_play()', 4000 );
	Effect.Game.scheduleEvent( 120, game_level_play );
}

function game_level_play() {
	// play level immediately
	sprite_plane.setLogic( true );
	
	hud_plane.deleteSprites( 'temp_hud', 'temp_mario', 'temp_x' );
	
	if (!mario.pipe) mario.levelStartTime = Effect.Game.logicClock; // start timer
	
	port.setBackground();
	tile_plane.show();
	tile_plane.activateScreenObjects();
	sprite_plane.show();
	mario.show();
	port.draw(true);
	
	mario.pipe = null;
	
	if (level.game_state) {
		// special game state (world-1-2-intro, etc.)
		switch (level.game_state) {
			case 'walk_pipe':
				Effect.Game.setKeysActive(false);
				Effect.Game.resetKeys();
				Effect.Game.keys.move_right.down = true;
				break;
			
			case 'run':
				Effect.Game.resetKeys();
				Effect.Game.setKeysActive( true );
				break;
		}
	}
	else {
		// standard level
		Effect.Game.resetKeys();
		Effect.Game.setKeysActive( true );
	}
	
	var music = Effect.Audio.getTrack( level.background_music );
	if (!music) alert( "Could not locate level music: " + level.background_music );
	music.rewind();
	music.play();
	
	if (mario.state == 'pipe_exit') Effect.Audio.playSound( 'down_pipe' );
	// Effect.Game.run();
	Effect.Game.setState( level.game_state ? level.game_state : 'run' );
}

function game_death() {
	Effect.Game.setState('died');
	
	// kill all sprites except character, and temp tiles
	for (var key in sprite_plane.sprites) {
		var sprite = sprite_plane.sprites[key];
		if (sprite.type != 'Character') sprite.destroy();
	}
	tile_plane.reset();
	tile_plane.init();
	
	// take a life away
	mario.lives--;
	if (!mario.lives) return game_over();
	
	Effect.Game.restoreLevelState();
	
	mario.state = 'falling';
	
	if (level.character_start.match(/^(\d+)\D+(\d+)$/)) {
		mario.x = parseInt(RegExp.$1, 10);
		mario.y = parseInt(RegExp.$2, 10);
	}
	else {
		mario.x = 0;
		mario.y = 0;
	}
	
	mario.height = 16;
	mario.setFrame( 0, 0 );
	mario.setImage( mario.brother + '_small.gif' );
	mario.size = 0;
	mario.flower = 0;
	mario.star = 0;
	mario.category = 'character';
	mario.flash = 0;
	mario.facing = 0; // 0=right, 14=left
	mario.invincible = false;
	mario.xd = 0;
	mario.yd = 0;
	mario.requestJump = false;
	mario.requsetFireball = false;
	mario.show();
	
	var destScrollX = parseInt( (mario.x + (mario.width / 2)) - (port.portWidth / 2), 10 );
	var destScrollY = parseInt( (mario.y + (mario.height / 2)) - (port.portHeight / 2), 10 );
	port.setScroll( destScrollX, destScrollY );
	// port.draw(true);
	
	sprite_plane.clearSoloSprite();
	
	game_level_intro();
}

function game_over() {
	// no more lives
	port.setBackgroundColor('black');
	tile_plane.hide();
	sprite_plane.hide();
	
	// create temp hud for "GAME OVER" in center of screen
	var game_over = new TextSprite();
	game_over.id = 'temp_hud';
	game_over.zIndex = 6;
	game_over.setTableSize( 9, 1 );
	game_over.setPosition( 86, 106 );
	// game_over.setFont( 'nes_classic' );
	game_over.setCustomFont( '/fonts/nes_classic.gif', 8, 8 );
	game_over.setString( 0, 0, "GAME OVER" );
	hud_plane.attach(game_over);
	
	Effect.Audio.playSound( 'music_game_over' );
	
	Effect.Game.scheduleEvent( 30 * 7, game_core_loaded );
}

function game_level_complete() {
	// mario has reached castle door, so hide him
	// and begin bonus stuff
	Effect.Game.setState('level_complete_b');
	
	mario.state = 'none';
	mario.hide();
	
	// mario gets fireworks?  depends on timer digit...
	mario.numFireworks = 0;
	switch (mario.secRemain % 10) {
		case 1:
		case 3:
		case 6:
			mario.numFireworks = mario.secRemain % 10;
			break;
	}
	
	Effect.Audio.playSound('music_bonus');
}

function game_next_level() {
	// load next level
	Effect.Game.loadLevel( level.next_level, 'game_level_setup', true );
}

function game_level_pipe() {
	// travel through pipe
	Effect.Game.loadLevel( mario.pipe.destLevel, 'game_level_setup', true );
}

function game_world_complete() {
	// completed world, walk to princess
	Effect.Game.setState('world_complete_c');
	
	// set mario to falling
	mario.state = 'falling';
	mario.yd = 0;
	mario.jumpTimer = 0;
	
	// kill keyboard control, set move_right to down
	Effect.Game.setKeysActive(false);
	Effect.Game.resetKeys();
	Effect.Game.keys.move_right.down = true;
	
	// unlock scroll_x_max
	level.scroll_x_max = 0;
	
	// switch music to world_complete
	Effect.Audio.quiet();
	Effect.Audio.getTrack('music_world_complete').play();
	
	// disable soloSprite
	sprite_plane.clearSoloSprite();
	
	// set time for final state
	mario.endFinalWalk = Effect.Game.logicClock + 46;
}

function game_pause() {
	// called when game is paused
	if (Effect.Game.getState() != 'title') {
		Effect.Audio.quiet();
		Effect.Audio.playSound( 'pause' );
	}
}

function game_resume() {
	// called when game is resumed
	switch (Effect.Game.getState()) {
		case 'run':
			if (mario.star) Effect.Audio.playSound( 'music_starpower' );
			else Effect.Audio.getTrack( level.background_music ).play();
			break;
	}
	
	if (Effect.Game.getState() != 'title') {
		Effect.Audio.playSound( 'pause' );
	}
}

function game_key_down(name, code) {
	// handle key down, only needed for title
	if (Effect.Game.getState() == 'title') {
		if (name == game_def.KonamiCode.Key[game_def.konamiIdx]) {
			game_def.konamiIdx++;
			if (game_def.konamiIdx == game_def.KonamiCode.Key.length) {
				Effect.Audio.playSound('firework');
			}
		}
	}
}

function game_logic_loop() {
	// in game logic loop
	if (!mario) return;
	
	if ((mario.state != 'death') && (Effect.Game.getState() != 'title')) {
		var destScrollX = parseInt( (mario.x + (mario.width / 2)) - (port.portWidth / 2), 10 );
		var destScrollY = parseInt( (mario.y + (mario.height / 2)) - (port.portHeight / 2), 10 );
		
		if (level.scroll_x_min && (destScrollX < level.scroll_x_min)) destScrollX = level.scroll_x_min;
		else if (level.scroll_x_max && (destScrollX > level.scroll_x_max)) destScrollX = level.scroll_x_max;
		
		if (level.scroll_y_min && (destScrollY < level.scroll_y_min)) destScrollY = level.scroll_y_min;
		else if (level.scroll_y_max && (destScrollY > level.scroll_y_max)) destScrollY = level.scroll_y_max;
	
		port.setScroll(
			parseInt( port.scrollX + ((destScrollX - port.scrollX) / 4), 10 ),
			parseInt( port.scrollY + ((destScrollY - port.scrollY) / 4), 10 )
		);
	}
	
	if (mario.dirtyDisplay) {
		// update HUD
		var hud = hud_plane.lookupSprite('hud');
		hud.setPadInt( 0, 0, mario.score, 6 );
		hud.setPadInt( 10, 0, mario.coins, 2 );
		mario.dirtyDisplay = false;
	}
	
	if (Effect.Game.getState() != 'title') {
		var hud = hud_plane.lookupSprite('hud');
		hud.setPadInt( 23, 0, mario.secRemain, 3 );
	}
	
	/* if (Effect.Game.logicClock % 8 == 0) {
		var html = '';
		// var total_sprites = num_keys(sprite_plane.sprites) + num_keys(particle_plane.sprites);
		// html += 'num_sprites: ' + total_sprites + ', ';
		html += 'fps: ' + Effect.Game.getCurrentFPS();
		// html += ', scroll: ' + port.scrollX + ' x ' + port.scrollY;
		el('d_info').innerHTML =  html;
	} */
}

function game_state_run() {
	// standard run mode -- decrease timer
	if (!mario) return;
	
	mario.secRemain = level.time_remain - parseInt( (Effect.Game.logicClock - mario.levelStartTime) / (30 / 2), 10 );
	if (mario.secRemain <= 0) {
		mario.secRemain = 0;
		var hud = hud_plane.lookupSprite('hud');
		hud.setPadInt( 23, 0, mario.secRemain, 3 );
		if (mario.state != 'death') {
			// ran out of time, die now
			mario.die();
		}
	}
}

function game_state_title() {
	// title logic
	if (ua.iphone) Effect.Port.setScroll( Effect.Game.logicClock, 0 );
}

function game_state_level_complete_a() {
	// level complete part one -- sliding down flagpole
	// handled elsewhere with sprites
}

function game_state_level_complete_b() {
	// level complete part two -- timer bonus
	mario.secRemain -= 2;
	mario.addScore( 50 * 2 );
	
	if (mario.secRemain <= 0) {
		mario.secRemain = 0;
		var hud = hud_plane.lookupSprite('hud');
		hud.setPadInt( 23, 0, mario.secRemain, 3 );
		Effect.Game.setState('level_complete_c');
		Effect.Audio.getTrack('music_bonus').stop();
		mario.nextFirework = Effect.Game.logicClock + 30;
		
		sprite_plane.createSprite('CastleFlag', {
			x: mario.x,
			y: mario.y
		});
	}
}

function game_state_level_complete_c() {
	// level complete part three -- fireworks
	if (Effect.Game.logicClock >= mario.nextFirework) {
		if (mario.numFireworks > 0) {
			sprite_plane.createSprite('Explosion', {
				frameDelta: 0.3,
				x: parseInt( port.scrollX + 32 + (Math.random() * (port.portWidth - 64)), 10 ),
				y: parseInt( port.scrollY + 32 + (Math.random() * (port.portHeight - 64)), 10 )
			});
			Effect.Audio.playSound( 'firework' );
			mario.numFireworks--;
			mario.nextFirework = Effect.Game.logicClock + 15;
		}
		else {
			Effect.Game.setState('level_complete_d');
			Effect.Game.scheduleEvent( 90, game_next_level );
		}
	}
}

function game_state_world_complete_a() {
	// destroy bridge
	if (Effect.Game.logicClock % 2 == 0) {
		tile_plane.setTile( mario.bridge_tx, mario.bridge_ty, 0, 'data' );
		tile_plane.setTile( mario.bridge_tx, mario.bridge_ty - 1, 0, 'data' ); // for chain
		mario.bridge_tx--;
		var tile_idx = tile_plane.lookupTile(mario.bridge_tx, mario.bridge_ty, 'data');
		if (tile_idx != '7.gif') { // 7.gif is bridge tile
			// bridge all gone, send bowser to hell
			Effect.Game.setState('world_complete_b');
			var bowser = sprite_plane.findSprite({ type: 'Bowser' });
			if (bowser) {
				bowser.state = 'death';
				bowser.collisions = false;
				bowser.yd = 4;
				
				sprite_plane.setSoloSprite( bowser );
				
				level.bowser_killed = true; // to prevent respawn
			}
			Effect.Game.scheduleEvent( 40, 'onWorldComplete');
		} // bridge all gone
	} // every other frame
}

function game_state_world_complete_b() {
	// waiting for bowser to fall, will go to _c via scheduled event
}

function game_state_world_complete_c() {
	// mario walking to princess
	if (Effect.Game.logicClock == mario.endFinalWalk) {
		Effect.Game.keys.move_right.down = false;
		
		var thank_you = new TextSprite();
		thank_you.id = 'thank_you';
		thank_you.setTableSize( 22, 7 );
		thank_you.setPosition( 40, 80 );
		// thank_you.setFont( 'nes_classic' );
		thank_you.setCustomFont( '/fonts/nes_classic.gif', 8, 8 );
		thank_you.setString( 3, 0, "THANK YOU MARIO!" );
		hud_plane.attach( thank_you );
	}
	
	if (Effect.Game.logicClock == mario.endFinalWalk + 90) {
		var thank_you = hud_plane.lookupSprite('thank_you');
		thank_you.setString( 0, 4, "BUT OUR PRINCESS IS IN" );
		thank_you.setString( 0, 6, "ANOTHER CASTLE!" );
		
		// end of demo, back to main title
		Effect.Game.scheduleEvent( 7 * 30, game_reset );
	}
}


