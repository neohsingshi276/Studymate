import Phaser from 'phaser';

const BOSS_THEMES = {
    Math: { emoji: '👹', name: 'Algebra Beast', color: 0xef4444 },
    Science: { emoji: '🐙', name: 'Chem Kraken', color: 0x10b981 },
    History: { emoji: '🗿', name: 'Ancient Warden', color: 0xf59e0b },
    English: { emoji: '📖', name: 'Grammar Golem', color: 0x8b5cf6 },
    'Computer Science': { emoji: '🤖', name: 'Bug Overlord', color: 0x06b6d4 },
    default: { emoji: '👾', name: 'Study Fiend', color: 0x6366f1 }
};

const WIDTH = 800;
const HEIGHT = 380;

export default class BossScene extends Phaser.Scene {
    constructor() {
        super('BossScene');
        this.playerMaxHP = 100;
        this.bossMaxHP = 100;
    }

    // Called when Phaser starts the scene. React data is stored in the registry first.
    init(data) {
        const registryData = this.game?.registry?.get('bossBattle') || {};
        this.subject = data?.subject || registryData.subject || 'default';
        this.onReady = data?.onReady || registryData.onReady || (() => {});
    }

    _canAct() {
        return Boolean(this.sys?.isActive?.() && this.add && this.tweens && this.time);
    }

    _safeDelayedCall(delay, callback) {
        if (!this._canAct()) return null;

        return this.time.delayedCall(delay, () => {
            if (this._canAct()) callback();
        });
    }

    create() {
        const theme = BOSS_THEMES[this.subject] || BOSS_THEMES.default;
        this.theme = theme;

        // Background
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x1e1b4b);
        this.add.rectangle(WIDTH / 2, HEIGHT - 30, WIDTH, 60, 0x111033);

        // Boss name banner
        this.add.text(WIDTH - 200, 30, theme.name, {
            fontSize: '22px', fontFamily: 'sans-serif', color: '#fca5a5', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(150, 30, 'YOU', {
            fontSize: '22px', fontFamily: 'sans-serif', color: '#93c5fd', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Health bar backgrounds
        this.add.rectangle(150, 55, 220, 18, 0x374151).setStrokeStyle(2, 0x6b7280);
        this.add.rectangle(WIDTH - 200, 55, 220, 18, 0x374151).setStrokeStyle(2, 0x6b7280);

        this.playerHPBar = this.add.rectangle(150 - 108, 55, 216, 14, 0x22c55e).setOrigin(0, 0.5);
        this.bossHPBar = this.add.rectangle(WIDTH - 200 - 108, 55, 216, 14, theme.color).setOrigin(0, 0.5);

        this.playerHPText = this.add.text(150, 55, '100/100', { fontSize: '11px', color: '#fff' }).setOrigin(0.5);
        this.bossHPText = this.add.text(WIDTH - 200, 55, '100/100', { fontSize: '11px', color: '#fff' }).setOrigin(0.5);

        // Sprites (emoji text as simple, asset-free sprites)
        this.playerSprite = this.add.text(150, 220, '🧙', { fontSize: '96px' }).setOrigin(0.5);
        this.bossSprite = this.add.text(WIDTH - 200, 200, theme.emoji, { fontSize: '120px' }).setOrigin(0.5);

        // Idle bob animation
        this.tweens.add({ targets: this.bossSprite, y: 190, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.playerSprite, y: 212, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.statusText = this.add.text(WIDTH / 2, HEIGHT - 30, '', {
            fontSize: '26px', fontFamily: 'sans-serif', color: '#fde68a', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.onReady?.(this);
    }

    setHP(playerHP, bossHP, playerMax = 100, bossMax = 100) {
        if (!this._canAct()) return;

        this.playerMaxHP = playerMax;
        this.bossMaxHP = bossMax;
        this.playerHPBar.width = Math.max(0, (playerHP / playerMax) * 216);
        this.bossHPBar.width = Math.max(0, (bossHP / bossMax) * 216);
        this.playerHPText.setText(`${Math.max(0, playerHP)}/${playerMax}`);
        this.bossHPText.setText(`${Math.max(0, bossHP)}/${bossMax}`);
    }

    _floatingDamage(x, y, amount, color) {
        if (!this._canAct()) return;

        const txt = this.add.text(x, y, `-${amount}`, {
            fontSize: '28px', fontFamily: 'sans-serif', color, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    playerAttack(damage, newBossHP, bossMax) {
        if (!this._canAct()) return;

        // Lunge toward boss
        this.tweens.add({
            targets: this.playerSprite, x: this.playerSprite.x + 40, duration: 150, yoyo: true, ease: 'Quad.easeOut'
        });
        this._safeDelayedCall(120, () => {
            this.cameras.main.shake(120, 0.004);
            this.bossSprite.setTint(0xff4444);
            this._safeDelayedCall(150, () => this.bossSprite.clearTint());
            this._floatingDamage(this.bossSprite.x, this.bossSprite.y - 60, damage, '#fca5a5');
            this.tweens.add({ targets: this.bossHPBar, width: Math.max(0, (newBossHP / bossMax) * 216), duration: 400 });
            this.bossHPText.setText(`${Math.max(0, newBossHP)}/${bossMax}`);
        });
    }

    bossAttack(damage, newPlayerHP, playerMax) {
        if (!this._canAct()) return;

        this.tweens.add({
            targets: this.bossSprite, x: this.bossSprite.x - 40, duration: 150, yoyo: true, ease: 'Quad.easeOut'
        });
        this._safeDelayedCall(120, () => {
            this.cameras.main.shake(120, 0.006);
            this.playerSprite.setTint(0xff4444);
            this._safeDelayedCall(150, () => this.playerSprite.clearTint());
            this._floatingDamage(this.playerSprite.x, this.playerSprite.y - 70, damage, '#fca5a5');
            this.tweens.add({ targets: this.playerHPBar, width: Math.max(0, (newPlayerHP / playerMax) * 216), duration: 400 });
            this.playerHPText.setText(`${Math.max(0, newPlayerHP)}/${playerMax}`);
        });
    }

    victory() {
        if (!this._canAct()) return;

        this.tweens.add({ targets: this.bossSprite, alpha: 0, angle: 90, y: this.bossSprite.y + 40, duration: 800, ease: 'Cubic.easeIn' });
        this.statusText.setText('🏆 VICTORY!').setColor('#fde68a').setAlpha(1).setScale(0.5);
        this.tweens.add({ targets: this.statusText, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }

    defeat() {
        if (!this._canAct()) return;

        this.tweens.add({ targets: this.playerSprite, alpha: 0.3, angle: -20, y: this.playerSprite.y + 30, duration: 800, ease: 'Cubic.easeIn' });
        this.statusText.setText('💀 DEFEATED').setColor('#f87171').setAlpha(1).setScale(0.5);
        this.tweens.add({ targets: this.statusText, scale: 1, duration: 400, ease: 'Back.easeOut' });
    }
}

export { WIDTH, HEIGHT };
