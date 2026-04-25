// ============================================================
// 区块：PetDatabase 类定义
// ============================================================

class PetDatabase {
    constructor() {
        this.db = null;
        this.dbName = 'PetCompanionDB';
        this.version = 1;
    }

    // ============================================================
    // 区块结束：PetDatabase 类定义
    // ============================================================


    // ============================================================
    // 区块：数据库初始化
    // ============================================================

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[PetDB] Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[PetDB] Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                console.log('[PetDB] Database upgrade needed');
                const db = event.target.result;

                // ObjectStore 1: custom_layers
                if (!db.objectStoreNames.contains('custom_layers')) {
                    const layerStore = db.createObjectStore('custom_layers', { keyPath: 'id' });
                    layerStore.createIndex('category', 'category', { unique: false });
                    layerStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    console.log('[PetDB] Created custom_layers store');
                }

                // ObjectStore 2: custom_sounds
                if (!db.objectStoreNames.contains('custom_sounds')) {
                    const soundStore = db.createObjectStore('custom_sounds', { keyPath: 'id' });
                    soundStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    console.log('[PetDB] Created custom_sounds store');
                }

                // ObjectStore 3: pet_saves
                if (!db.objectStoreNames.contains('pet_saves')) {
                    const saveStore = db.createObjectStore('pet_saves', { keyPath: 'saveId' });
                    saveStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('[PetDB] Created pet_saves store');
                }
            };
        });
    }

    // ============================================================
    // 区块结束：数据库初始化
    // ============================================================


    // ============================================================
    // 区块：图层操作
    // ============================================================

    async saveLayer(file, category, name) {
        const arrayBuffer = await file.arrayBuffer();
        const data = {
            id: `layer_${category}_${Date.now()}`,
            category: category,
            name: name || file.name,
            imageBlob: arrayBuffer,
            width: 512,
            height: 512,
            uploadDate: Date.now(),
            metadata: { author: 'user', tags: [] }
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['custom_layers'], 'readwrite');
            const store = transaction.objectStore('custom_layers');
            const request = store.add(data);

            request.onsuccess = () => {
                console.log('[PetDB] Layer saved:', data.id);
                resolve(data.id);
            };

            request.onerror = () => {
                console.error('[PetDB] Failed to save layer');
                reject(request.error);
            };
        });
    }

    async getLayersByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['custom_layers'], 'readonly');
            const store = transaction.objectStore('custom_layers');
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deleteLayer(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['custom_layers'], 'readwrite');
            const store = transaction.objectStore('custom_layers');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('[PetDB] Layer deleted:', id);
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // ============================================================
    // 区块结束：图层操作
    // ============================================================


    // ============================================================
    // 区块：存档操作
    // ============================================================

    async savePetState(saveId, petState, character, achievements) {
        const data = {
            saveId: saveId || 'save_1',
            timestamp: Date.now(),
            petState: petState,
            character: character,
            achievements: achievements || []
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pet_saves'], 'readwrite');
            const store = transaction.objectStore('pet_saves');
            const request = store.put(data);

            request.onsuccess = () => {
                console.log('[PetDB] Pet state saved');
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async loadPetState(saveId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pet_saves'], 'readonly');
            const store = transaction.objectStore('pet_saves');
            const request = store.get(saveId || 'save_1');

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // ============================================================
    // 区块结束：存档操作
    // ============================================================


    // ============================================================
    // 区块：音频操作
    // ============================================================

    async saveSound(file, name) {
        const arrayBuffer = await file.arrayBuffer();
        const data = {
            id: `sound_${Date.now()}`,
            name: name || file.name,
            audioBuffer: arrayBuffer,
            duration: 0, // 需要解码后才能获取
            uploadDate: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['custom_sounds'], 'readwrite');
            const store = transaction.objectStore('custom_sounds');
            const request = store.add(data);

            request.onsuccess = () => {
                console.log('[PetDB] Sound saved:', data.id);
                resolve(data.id);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAllSounds() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['custom_sounds'], 'readonly');
            const store = transaction.objectStore('custom_sounds');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // ============================================================
    // 区块结束：音频操作
    // ============================================================
}

// ============================================================
// 区块：导出
// ============================================================

// 使其在全局可用
if (typeof window !== 'undefined') {
    window.PetDatabase = PetDatabase;
}

// ============================================================
// 区块结束：导出
// ============================================================
