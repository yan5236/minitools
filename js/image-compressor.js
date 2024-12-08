// 等待压缩库加载完成
function waitForImageCompression() {
    return new Promise((resolve, reject) => {
        if (typeof imageCompression === 'function') {
            resolve();
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            if (typeof imageCompression === 'function') {
                clearInterval(interval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('图片压缩库加载失败'));
            }
        }, 500);
    });
}

// 等待DOM元素加载完成
function waitForElements() {
    return new Promise((resolve, reject) => {
        const elements = {
            fileInput: document.getElementById('fileInput'),
            dropZone: document.getElementById('dropZone'),
            compressBtn: document.getElementById('compressBtn'),
            downloadBtn: document.getElementById('downloadBtn')
        };

        if (Object.values(elements).every(el => el)) {
            resolve(elements);
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            elements.fileInput = document.getElementById('fileInput');
            elements.dropZone = document.getElementById('dropZone');
            elements.compressBtn = document.getElementById('compressBtn');
            elements.downloadBtn = document.getElementById('downloadBtn');

            if (Object.values(elements).every(el => el)) {
                clearInterval(interval);
                resolve(elements);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                const missing = Object.entries(elements)
                    .filter(([_, el]) => !el)
                    .map(([name]) => name);
                reject(new Error(`DOM元素未找到: ${missing.join(', ')}`));
            }
        }, 500);
    });
}

class ImageCompressor {
    constructor() {
        this.imageQueue = new Map();
        this.compressedImages = new Map();
        this.previewUrls = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 文件输入处理
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');
        const compressBtn = document.getElementById('compressBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        if (!fileInput || !dropZone || !compressBtn || !downloadBtn) {
            console.error('必要的DOM元素未找到:', {
                fileInput: !!fileInput,
                dropZone: !!dropZone,
                compressBtn: !!compressBtn,
                downloadBtn: !!downloadBtn
            });
            return;
        }

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.handleFiles(files);
                fileInput.value = '';
            }
        });

        // 点击上传区域触发文件选择
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone || e.target.parentElement === dropZone) {
                fileInput.click();
            }
        });

        // 拖放处理
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleFiles(files);
            }
        });

        // 压缩按钮事件
        compressBtn.addEventListener('click', async () => {
            if (this.imageQueue.size === 0) {
                alert('请先添加图片！');
                return;
            }
            
            await this.clearPreviousResults();
            
            try {
                const batchCompress = document.getElementById('batchCompress').checked;
                if (batchCompress) {
                    await this.compressAllImages();
                } else {
                    const currentImage = this.imageQueue.values().next().value;
                    if (currentImage) {
                        await this.compressImage(currentImage.file);
                    }
                }
            } catch (error) {
                console.error('压缩过程出错:', error);
                alert('压缩过程出错，请重试！');
            }
        });

        // 下载按钮事件
        downloadBtn.addEventListener('click', async () => {
            try {
                await this.downloadImages();
            } catch (error) {
                console.error('下载失败:', error);
                alert('下载失败，请重试！');
            }
        });
    }

    handleFiles(files) {
        if (!files || files.length === 0) return;

        // 过滤出图片文件
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            alert('请选择图片文件！');
            return;
        }

        // 处理每个图片文件
        imageFiles.forEach(file => {
            const id = Date.now() + Math.random().toString(36).substr(2, 9);
            
            // 创建预览URL
            const previewUrl = URL.createObjectURL(file);
            this.previewUrls.add(previewUrl);
            
            this.imageQueue.set(id, {
                file: file,
                previewUrl: previewUrl,
                name: file.name,
                size: file.size
            });
        });

        // 更新界面显示
        this.updateImageList();
        
        // 显示设置面板和图片列表
        document.getElementById('settingsPanel').style.display = 'block';
        document.getElementById('imageList').style.display = 'block';
    }

    updateImageList() {
        const grid = document.getElementById('imageGrid');
        const count = document.getElementById('imageCount');
        
        // 清理之前的预览
        grid.innerHTML = '';
        count.textContent = this.imageQueue.size;

        this.imageQueue.forEach((item, id) => {
            const div = document.createElement('div');
            div.className = 'image-card';
            div.innerHTML = `
                <div class="card-img">
                    <img src="${item.previewUrl}" alt="预览">
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="card-info">
                    <div class="d-flex justify-content-between">
                        <span>${item.file.name}</span>
                        <span class="badge bg-secondary">${this.getFileFormat(item.file)}</span>
                    </div>
                    <div>${this.formatFileSize(item.file.size)}</div>
                </div>
            `;

            // 添加删除按钮事件
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(id);
            });

            grid.appendChild(div);
        });
    }

    // 清理之前的压缩结果
    async clearPreviousResults() {
        // 清理预览区域
        const resultGrid = document.getElementById('resultGrid');
        resultGrid.innerHTML = '';
        
        // 释放之前的Blob URLs
        for (const url of this.previewUrls) {
            URL.revokeObjectURL(url);
        }
        this.previewUrls.clear();
        
        // 释放压缩图片的内存
        for (const [_, blob] of this.compressedImages) {
            if (blob instanceof Blob) {
                blob.close?.(); // 如果支持的话，关闭blob
            }
        }
        this.compressedImages.clear();
        
        // 隐藏下载按钮
        document.getElementById('downloadBtn').style.display = 'none';
        document.getElementById('previewPanel').style.display = 'none';
    }

    async compressImage(file) {
        try {
            // 检查压缩库是否正确加载
            if (typeof imageCompression !== 'function') {
                throw new Error('图片压缩库未正确加载');
            }

            const options = {
                maxSizeMB: this.getMaxSize(),
                maxWidthOrHeight: this.getMaxDimension(),
                useWebWorker: true,
                fileType: this.getOutputFormat(),
                initialQuality: document.getElementById('qualitySlider').value / 100
            };

            const compressedBlob = await imageCompression(file, options);
            
            // 存储压缩后的图片
            this.compressedImages.set(file.name, compressedBlob);
            
            // 创建并存储预览URL
            const previewUrl = URL.createObjectURL(compressedBlob);
            this.previewUrls.add(previewUrl);
            
            // 更新预览
            this.updatePreview(file.name, previewUrl, file.size, compressedBlob.size);
            
            // 显示下载按钮和预览面板
            document.getElementById('downloadBtn').style.display = 'block';
            document.getElementById('previewPanel').style.display = 'block';
            
            return true;
        } catch (error) {
            console.error('压缩失败:', error);
            alert(`压缩失败: ${error.message || file.name}`);
            return false;
        }
    }

    async downloadImages() {
        if (this.compressedImages.size === 0) {
            alert('没有可下载的图片！');
            return;
        }

        try {
            if (this.compressedImages.size === 1) {
                // 张图片直接下载
                const [filename, blob] = this.compressedImages.entries().next().value;
                await this.downloadSingleImage(blob, filename);
            } else {
                // 多张图片打包下载
                await this.downloadAsZip();
            }
        } catch (error) {
            throw error; // 向上传播错误
        }
    }

    async downloadSingleImage(blob, filename) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        try {
            link.href = url;
            link.download = `compressed_${filename}`;
            document.body.appendChild(link);
            link.click();
        } finally {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    getMaxSize() {
        const sizeInput = document.getElementById('maxSizeInput');
        return parseFloat(sizeInput.value);
    }

    getMaxDimension() {
        const dimensionInput = document.getElementById('maxDimensionInput');
        return parseInt(dimensionInput.value, 10);
    }

    getOutputFormat() {
        const keepOriginal = document.getElementById('keepOriginalFormat').checked;
        if (keepOriginal) {
            return undefined; // 使用原格式
        }
        const formatSelect = document.getElementById('outputFormat');
        return formatSelect.value;
    }

    getFileFormat(file) {
        return file.type.split('/')[1].toUpperCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updatePreview(filename, previewUrl, originalSize, compressedSize) {
        const resultGrid = document.getElementById('resultGrid');
        const div = document.createElement('div');
        div.className = 'result-item';
        
        const compressionRatio = ((1 - (compressedSize / originalSize)) * 100).toFixed(1);
        
        div.innerHTML = `
            <h6 class="mb-2">${filename}</h6>
            <div class="comparison">
                <div class="image-preview">
                    <img src="${previewUrl}" alt="压缩后预览">
                </div>
            </div>
            <div class="info-box">
                <p>原始大小：${this.formatFileSize(originalSize)}</p>
                <p>压缩后大小：${this.formatFileSize(compressedSize)}</p>
                <p>压缩率：${compressionRatio}%</p>
            </div>
        `;
        
        resultGrid.appendChild(div);
    }

    async compressAllImages() {
        const total = this.imageQueue.size;
        let completed = 0;
        
        for (const [_, item] of this.imageQueue) {
            await this.compressImage(item.file);
            completed++;
            // 可以在这里添加进度更新
        }
        
        return completed === total;
    }

    removeImage(id) {
        const item = this.imageQueue.get(id);
        if (item && item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
        }
        this.imageQueue.delete(id);
        this.updateImageList();
        
        if (this.imageQueue.size === 0) {
            document.getElementById('settingsPanel').style.display = 'none';
            document.getElementById('imageList').style.display = 'none';
        }
    }

    // 组件销毁时的清理
    destroy() {
        this.clearPreviousResults();
        // 清理队列中的预览URL
        for (const [_, item] of this.imageQueue) {
            if (item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
        }
        this.imageQueue.clear();
    }
}

// 初始化工具
let imageCompressor;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 等待压缩库加载
        await waitForImageCompression();
        console.log('压缩库加载成功');

        // 等待DOM元素加载
        await waitForElements();
        console.log('DOM元素加载成功');

        // 初始化压缩工具
        imageCompressor = new ImageCompressor();
        console.log('压缩工具初始化成功');
    } catch (error) {
        console.error('初始化失败:', error);
        // 在页面上显示错误信息
        const container = document.querySelector('.image-compressor-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">初始化失败</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">请刷新页面重试。如果问题持续存在，请检查浏览器控制台获取详细信息。</p>
                </div>
            `;
        }
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (imageCompressor) {
        imageCompressor.destroy();
    }
}); 