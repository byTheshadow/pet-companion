// ============================================================
// 区块：PetEngine 类定义
// ============================================================

class PetEngine {
    constructor(windowElement, database) {
        this.window = windowElement;
        this.database = database;
        this.canvas = document.getElementById('pet-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 状态数据
        this.state = {
            mood: 100,
            hunger: 50,
            intimacy: 0,
            energy: 100,
            lastUpdateTime: Date.now(),
            interactions: 0,
            feedCount: 0,
            chatCount: 0
        };
        
        // 角色配置
        this.character = {
            name: "小宠物",
            layers: {
                base: null,
                hair: null,
                face: null,
                clothes: null,
                accessories: null
            },
            position: { x: 100, y: 100 },
            scale: 1.0
        };
        
        // 图层图片缓存
        this.layerImages = {};
        
        // 动画状态
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        
        // 是否显示
        this.isVisible = false;
        
        // 更新定时器
        this.updateInterval = null;
    }

    // ============================================================
    // 区块结束：PetEngine 类定义
    // ============================================================


    // ============================================================
    // 区块：初始化
    // ============================================================

    async init() {
        console.log('[PetEngine] Initializing...');
        
        try {
            // 加载保存的数据
            await this.loadSavedData();
            
            // 加载默认图层
            await this.loadDefaultLayers();
            
            // 绑定事件
            this.bindEvents();
            
            // 开始渲染循环
            this.startRenderLoop();
            
            // 开始状态更新
            this.startStateUpdate();
            
            // 更新 UI
            this.updateUI();
            
            console.log('[PetEngine] Initialized successfully');
        } catch (error) {
            console.error('[PetEngine] Initialization failed:', error);
        }
    }

    async loadSavedData() {
        const savedData = await this.database.loadPetState('save_1');
        
        if (savedData) {
            console.log('[PetEngine] Loading saved data');
            this.state = savedData.petState || this.state;
            this.character = savedData.character || this.character;
            
            // 更新宠物名字
            document.querySelector('.pet-name').textContent = this.character.name;
        } else {
            console.log('[PetEngine] No saved data, using defaults');
        }
    }

    async loadDefaultLayers() {
        console.log('[PetEngine] Loading default layers...');
        
        // 这里加载默认图层
        // 实际项目中应该从 assets/default-layers/ 加载
        const defaultLayers = {
            base: '/scripts/extensions/third-party/pet-companion/assets/default-layers/base_01.png',
            face: '/scripts/extensions/third-party/pet-companion/assets/default-layers/face_smile.png'
        };
        
        for (const [layer, path] of Object.entries(defaultLayers)) {
            if (this.character.layers[layer] === null) {
                this.character.layers[layer] = path;
            }
        }
        
        // 预加载图片
        await this.preloadLayers();
    }

    async preloadLayers() {
        const loadPromises = [];
        
        for (const [layerName, layerPath] of Object.entries(this.character.layers)) {
            if (layerPath) {
                const promise = this.loadImage(layerPath).then(img => {
                    this.layerImages[layerName] = img;
                    console.log(`[PetEngine] Loaded layer: ${layerName}`);
                }).catch(err => {
                    console.warn(`[PetEngine] Failed to load layer ${layerName}:`, err);
                });
                
                loadPromises.push(promise);
            }
        }
        
        await Promise.all(loadPromises);
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // ============================================================
    // 区块结束：初始化
    // ============================================================


    // ============================================================
    // 区块：事件绑定
    // ============================================================

    bindEvents() {
        // Canvas 点击事件
        this.canvas.addEventListener('click', () => this.handleClick());
        
        // 控制按钮
        document.getElementById('pet-feed-btn')?.addEventListener('click', () => this.feed());
        document.getElementById('pet-play-btn')?.addEventListener('click', () => this.openGames());
        document.getElementById('pet-chat-btn')?.addEventListener('click', () => this.chat());
        document.getElementById('pet-customize-btn')?.addEventListener('click', () => this.openEditor());
        document.getElementById('pet-settings-btn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('pet-close-btn')?.addEventListener('click', () => this.hide());
        
        console.log('[PetEngine] Events bound');
    }

    // ============================================================
    // 区块结束：事件绑定
    // ============================================================


    // ============================================================
    // 区块：渲染循环
    // ============================================================

    startRenderLoop() {
        const render = (timestamp) => {
            this.render(timestamp);
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
        console.log('[PetEngine] Render loop started');
    }

    render(timestamp) {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景（可选）
        // this.ctx.fillStyle = '#f0f0f0';
        // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制图层
        this.renderLayers();
        
        // 更新动画帧
        if (timestamp - this.lastFrameTime > 100) { // 每100ms更新一次
            this.animationFrame = (this.animationFrame + 1) % 10;
            this.lastFrameTime = timestamp;
        }
    }

    renderLayers() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = this.character.scale;
        
        // 图层绘制顺序
        const layerOrder = ['base', 'clothes', 'hair', 'face', 'accessories'];
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        
        // 添加轻微的呼吸动画
        const breathScale = 1 + Math.sin(this.animationFrame * 0.3) * 0.02;
        this.ctx.scale(breathScale, breathScale);
        
        for (const layerName of layerOrder) {
            const img = this.layerImages[layerName];
            if (img) {
                this.ctx.drawImage(
                    img,
                    -img.width / 2,
                    -img.height / 2,
                    img.width,
                    img.height
                );
            }
        }
        
        this.ctx.restore();
    }

    // ============================================================
    // 区块结束：渲染循环
    // ============================================================


    // ============================================================
    // 区块：状态更新
    // ============================================================

    startStateUpdate() {
        // 每分钟更新一次状态
        this.updateInterval = setInterval(() => {
            this.updateState();
        }, 60000); // 60秒
        
        console.log('[PetEngine] State update started');
    }

    updateState() {
        const now = Date.now();
        const timeDiff = (now - this.state.lastUpdateTime) / 1000 / 60; // 分钟
        
        // 饥饿度增加
        this.state.hunger = Math.max(0, this.state.hunger - timeDiff * 0.5);
        
        // 心情根据饥饿度变化
        if (this.state.hunger < 20) {
            this.state.mood = Math.max(0, this.state.mood - timeDiff * 2);
        } else if (this.state.hunger > 80) {
            this.state.mood = Math.min(100, this.state.mood + timeDiff * 0.5);
        }
        
        // 精力恢复
        this.state.energy = Math.min(100, this.state.energy + timeDiff * 1);
        
        this.state.lastUpdateTime = now;
        
        // 更新 UI
        this.updateUI();
        
        // 自动保存
        this.autoSave();
    }

    updateUI() {
        // 更新状态条
        document.getElementById('mood-bar').style.width = this.state.mood + '%';
        document.getElementById('mood-value').textContent = Math.floor(this.state.mood);
        
        document.getElementById('hunger-bar').style.width = this.state.hunger + '%';
        document.getElementById('hunger-value').textContent = Math.floor(this.state.hunger);
        
        document.getElementById('intimacy-bar').style.width = (this.state.intimacy / 10) + '%';
        document.getElementById('intimacy-value').textContent = Math.floor(this.state.intimacy);
    }

    async autoSave() {
        try {
            await this.database.savePetState('save_1', this.state, this.character, []);
            console.log('[PetEngine] Auto-saved');
        } catch (error) {
            console.error('[PetEngine] Auto-save failed:', error);
        }
    }

    // ============================================================
    // 区块结束：状态更新
    // ============================================================


    // ============================================================
    // 区块：交互功能
    // ============================================================

    handleClick() {
        console.log('[PetEngine] Pet clicked!');
        
        // 增加互动次数
        this.state.interactions++;
        
        // 增加亲密度
        this.state.intimacy = Math.min(1000, this.state.intimacy + 1);
        
        // 增加心情
        this.state.mood = Math.min(100, this.state.mood + 2);
        
        // 播放音效（如果有）
        this.playSound('click');
        
        // 显示对话气泡
        this.showSpeechBubble(this.getRandomResponse());
        
        // 触发动画
        this.playAnimation('happy');
        
        // 更新 UI
        this.updateUI();
    }

    feed() {
        console.log('[PetEngine] Feeding pet');
        
        if (this.state.hunger >= 95) {
            this.showSpeechBubble('我已经很饱了！');
            return;
        }
        
        this.state.feedCount++;
        this.state.hunger = Math.min(100, this.state.hunger + 20);
        this.state.mood = Math.min(100, this.state.mood + 10);
        this.state.intimacy = Math.min(1000, this.state.intimacy + 5);
        
        this.showSpeechBubble('好好吃！谢谢你~ ❤️');
        this.playAnimation('eating');
        this.playSound('eat');
        
        this.updateUI();
    }

    async chat() {
        console.log('[PetEngine] Starting chat');
        
        this.state.chatCount++;
        this.state.intimacy = Math.min(1000, this.state.intimacy + 3);
        
        // 显示加载状态
        this.showSpeechBubble('让我想想...');
        
        try {
            // 使用 SillyTavern 的 generate API
            // 这里需要根据实际 ST API 调整
            const response = await this.generateResponse();
            this.showSpeechBubble(response);
        } catch (error) {
            console.error('[PetEngine] Chat failed:', error);
            this.showSpeechBubble('抱歉，我现在有点累...');
        }
        
        this.updateUI();
    }

    async generateResponse() {
        // 简单的随机回复（后续可以接入 LLM）
        const responses = [
            '今天天气真好呢！',
            '你今天过得怎么样？',
            '我好想和你一起玩！',
            '你是最好的主人！',
            '陪我聊聊天吧~',
            '我有点饿了...',
            '你喜欢我吗？'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getRandomResponse() {
        const responses = [
            '嘿嘿~',
            '好开心！',
            '再摸摸我！',
            '❤️',
            '呜呜~',
            '好舒服~'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showSpeechBubble(text, duration = 3000) {
        const bubble = document.getElementById('pet-speech-bubble');
        const content = bubble.querySelector('.speech-bubble-content');
        
        content.textContent = text;
        bubble.style.display = 'block';
        
        // 自动隐藏
        setTimeout(() => {
            bubble.style.display = 'none';
        }, duration);
    }

    // ============================================================
    // 区块结束：交互功能
    // ============================================================


    // ============================================================
    // 区块：动画控制
    // ============================================================

    playAnimation(animationName) {
        this.currentAnimation = animationName;
        this.animationFrame = 0;
        
        // 动画结束后恢复 idle
        setTimeout(() => {
            if (this.currentAnimation === animationName) {
                this.currentAnimation = 'idle';
            }
        }, 1000);
    }

    // ============================================================
    // 区块结束：动画控制
    // ============================================================


    // ============================================================
    // 区块：音频播放
    // ============================================================

    playSound(soundName) {
        // 简单的音效播放
        // 实际项目中应该使用 Web Audio API
        try {
            const audio = new Audio(`/scripts/extensions/third-party/pet-companion/assets/sounds/${soundName}.mp3`);
            audio.volume = 0.3;
            audio.play().catch(err => {
                console.warn('[PetEngine] Failed to play sound:', err);
            });
        } catch (error) {
            console.warn('[PetEngine] Sound not available:', soundName);
        }
    }

    // ============================================================
    // 区块结束：音频播放
    // ============================================================


    // ============================================================
    // 区块：窗口控制
    // ============================================================

    show() {
        this.window.style.display = 'block';
        this.window.classList.remove('hidden');
        this.isVisible = true;
        console.log('[PetEngine] Window shown');
    }

    hide() {
        this.window.classList.add('hidden');
        setTimeout(() => {
            this.window.style.display = 'none';
        }, 300);
        this.isVisible = false;
        console.log('[PetEngine] Window hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // ============================================================
    // 区块结束：窗口控制
    // ============================================================


    // ============================================================
    // 区块：编辑器和设置
    // ============================================================

    openEditor() {
        console.log('[PetEngine] Opening editor');
        const modal = document.getElementById('pet-editor-modal');
        modal.style.display = 'flex';
        
        // 初始化编辑器（后续实现）
        if (window.petEditor) {
            window.petEditor.open(this.character, this.layerImages);
        }
    }

    openGames() {
        console.log('[PetEngine] Opening games');
        const modal = document.getElementById('pet-game-modal');
        modal.style.display = 'flex';
    }

    openSettings() {
        console.log('[PetEngine] Opening settings');
        // TODO: 实现设置面板
        this.showSpeechBubble('设置功能开发中...');
    }

    // ============================================================
    // 区块结束：编辑器和设置
    // ============================================================


    // ============================================================
    // 区块：位置保存
    // ============================================================

    savePosition(x, y) {
        this.character.position = { x, y };
        // 延迟保存，避免频繁写入
        clearTimeout(this.positionSaveTimeout);
        this.positionSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, 1000);
    }

    // ============================================================
    // 区块结束：位置保存
    // ============================================================


    // ============================================================
    // 区块：清理
    // ============================================================

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        console.log('[PetEngine] Destroyed');
    }

    // ============================================================
    // 区块结束：清理
    // ============================================================
}

// ============================================================
// 区块：导出
// ============================================================

if (typeof window !== 'undefined') {
    window.PetEngine = PetEngine;
}

// ============================================================
// 区块结束：导出
// ============================================================
