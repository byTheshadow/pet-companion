// ============================================================
// 区块：EventBus 类定义
// ============================================================

class EventBus {
    constructor() {
        this.events = {};
    }

    // ============================================================
    // 区块结束：EventBus 类定义
    // ============================================================


    // ============================================================
    // 区块：事件订阅
    // ============================================================

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        // 返回取消订阅函数
        return () => this.off(eventName, callback);
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(eventName, wrapper);
        };
        
        this.on(eventName, wrapper);
    }

    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        this.events[eventName] = this.events[eventName].filter(
            cb => cb !== callback
        );
    }

    // ============================================================
    // 区块结束：事件订阅
    // ============================================================


    // ============================================================
    // 区块：事件发布
    // ============================================================

    emit(eventName, ...args) {
        if (!this.events[eventName]) return;
        
        this.events[eventName].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`[EventBus] Error in event handler for ${eventName}:`, error);
            }
        });
    }

    // ============================================================
    // 区块结束：事件发布
    // ============================================================


    // ============================================================
    // 区块：清理
    // ============================================================

    clear(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
    }

    // ============================================================
    // 区块结束：清理
    // ============================================================
}

// ============================================================
// 区块：导出
// ============================================================

if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.petEventBus = new EventBus();
}

// ============================================================
// 区块结束：导出
// ============================================================
