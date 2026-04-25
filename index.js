// ============================================================
// 区块：导入和全局变量
// ============================================================

const MODULE_NAME = 'pet-companion';
let petWindow = null;
let petEngine = null;
let petDatabase = null;
let isInitialized = false;

// ============================================================
// 区块结束：导入和全局变量
// ============================================================


// ============================================================
// 区块：插件初始化
// ============================================================

async function initPlugin() {
    if (isInitialized) {
        console.log('[Pet Companion] Already initialized');
        return;
    }

    console.log('[Pet Companion] Initializing plugin...');

    try {
        // 初始化数据库
        petDatabase = new PetDatabase();
        await petDatabase.init();
        console.log('[Pet Companion] Database initialized');

        // 创建桌宠窗口
        await createPetWindow();
        console.log('[Pet Companion] Pet window created');

        // 初始化桌宠引擎
        petEngine = new PetEngine(petWindow, petDatabase);
        await petEngine.init();
        console.log('[Pet Companion] Pet engine initialized');

        // 注册事件监听
        registerEventListeners();
        console.log('[Pet Companion] Event listeners registered');

        isInitialized = true;
        console.log('[Pet Companion] Plugin initialized successfully!');
    } catch (error) {
        console.error('[Pet Companion] Initialization failed:', error);
    }
}

// ============================================================
// 区块结束：插件初始化
// ============================================================


// ============================================================
// 区块：创建桌宠窗口
// ============================================================

async function createPetWindow() {
    // 检查窗口是否已存在
    if (document.getElementById('pet-companion-window')) {
        console.log('[Pet Companion] Window already exists');
        return;
    }

    // 加载 HTML 模板
    const response = await fetch(`/scripts/extensions/third-party/pet-companion/ui/pet-window.html`);
    const html = await response.text();

    // 创建容器
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);

    petWindow = document.getElementById('pet-companion-window');
    
    // 默认隐藏
    petWindow.style.display = 'none';

    // 设置拖拽功能
    makeDraggable(petWindow);
}

// ============================================================
// 区块结束：创建桌宠窗口
// ============================================================


// ============================================================
// 区块：拖拽功能
// ============================================================

function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    const dragHandle = element.querySelector('.pet-drag-handle') || element;

    dragHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.closest('.pet-controls')) return; // 不拖拽控制按钮

        initialX = e.clientX - (parseInt(element.style.left) || 0);
        initialY = e.clientY - (parseInt(element.style.top) || 0);
        isDragging = true;
        element.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
    }

    function dragEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.cursor = 'grab';

        // 保存位置
        if (petEngine) {
            petEngine.savePosition(currentX, currentY);
        }
    }
}

// ============================================================
// 区块结束：拖拽功能
// ============================================================


// ============================================================
// 区块：事件监听器注册
// ============================================================

function registerEventListeners() {
    // 监听 AI 生成开始
    eventSource.on(event_types.GENERATION_STARTED, handleGenerationStarted);
    
    // 监听 AI 生成结束
    eventSource.on(event_types.GENERATION_ENDED, handleGenerationEnded);
    
    // 监听应用准备就绪
    eventSource.on(event_types.APP_READY, handleAppReady);

    console.log('[Pet Companion] Registered ST event listeners');
}

function handleGenerationStarted() {
    console.log('[Pet Companion] Generation started - showing pet');
    if (petEngine) {
        petEngine.show();
        petEngine.playAnimation('waiting');
    }
}

function handleGenerationEnded(text) {
    console.log('[Pet Companion] Generation ended - hiding pet');
    if (petEngine) {
        petEngine.hide();
        // 可选：根据回复内容触发表情
        // petEngine.reactToMessage(text);
    }
}

function handleAppReady() {
    console.log('[Pet Companion] App ready');
}

// ============================================================
// 区块结束：事件监听器注册
// ============================================================


// ============================================================
// 区块：插件入口点
// ============================================================

// SillyTavern 插件加载时会调用这个函数
jQuery(async () => {
    console.log('[Pet Companion] Plugin script loaded');
    
    // 等待 SillyTavern 完全加载
    if (typeof eventSource === 'undefined') {
        console.warn('[Pet Companion] EventSource not ready, waiting...');
        setTimeout(() => jQuery(initPlugin), 1000);
        return;
    }

    // 延迟初始化，确保所有依赖都加载完成
    setTimeout(initPlugin, 500);
});

// ============================================================
// 区块结束：插件入口点
// ============================================================


// ============================================================
// 区块：导出（供其他模块使用）
// ============================================================

window.petCompanion = {
    getEngine: () => petEngine,
    getDatabase: () => petDatabase,
    getWindow: () => petWindow
};

// ============================================================
// 区块结束：导出
// ============================================================
