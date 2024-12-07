class ImageCompressor {
    constructor() {
        this.imageQueue = new Map(); // 存储待处理的图片
        this.compressedImages = new Map(); // 存储压缩后的图片
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 上传区域点击事件
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    this.addToQueue(file);
                }
            });
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    this.addToQueue(file);
                }
            });
        });

        // 质量滑块事件
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityInput = document.getElementById('qualityInput');
        const qualityValue = document.getElementById('qualityValue');

        qualitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            qualityInput.value = value;
            qualityValue.textContent = `${value}%`;
        });

        qualityInput.addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            value = Math.min(100, Math.max(1, value));
            qualitySlider.value = value;
            qualityInput.value = value;
            qualityValue.textContent = `${value}%`;
        });

        // 压缩按钮事件
        document.getElementById('compressBtn').addEventListener('click', () => {
            this.compressImage();
        });

        // 下载按钮事件
        document.getElementById('downloadBtn').addEventListener('click', () => {
            if (this.compressedImages.size === 0) {
                alert('没有可下载的图片！');
                return;
            }

            // 如果只有一张图片，直接下载
            if (this.compressedImages.size === 1) {
                const [filename, blob] = this.compressedImages.entries().next().value;
                this.downloadImage(blob, filename);
                return;
            }

            // 如果有多张图片，创建zip文件
            this.downloadAsZip();
        });

        // 宽度输入联动
        document.getElementById('widthInput').addEventListener('input', (e) => {
            if (document.getElementById('keepAspectRatio').checked) {
                const width = parseInt(e.target.value) || 0;
                const img = document.getElementById('originalPreview');
                if (img && width) {
                    const ratio = img.naturalWidth / img.naturalHeight;
                    document.getElementById('heightInput').value = Math.round(width / ratio);
                }
            }
        });

        // 高度输入联动
        document.getElementById('heightInput').addEventListener('input', (e) => {
            if (document.getElementById('keepAspectRatio').checked) {
                const height = parseInt(e.target.value) || 0;
                const img = document.getElementById('originalPreview');
                if (img && height) {
                    const ratio = img.naturalWidth / img.naturalHeight;
                    document.getElementById('widthInput').value = Math.round(height * ratio);
                }
            }
        });

        // 重置尺寸按钮
        document.getElementById('resetSize').addEventListener('click', () => {
            document.getElementById('widthInput').value = '';
            document.getElementById('heightInput').value = '';
        });
    }

    addToQueue(file) {
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.imageQueue.set(id, {
            file,
            status: 'pending'
        });
        this.updateImageList();
        document.getElementById('settingsPanel').style.display = 'block';
        document.getElementById('imageList').style.display = 'block';
    }

    updateImageList() {
        const grid = document.getElementById('imageGrid');
        const count = document.getElementById('imageCount');
        grid.innerHTML = '';
        count.textContent = this.imageQueue.size;

        this.imageQueue.forEach((item, id) => {
            const card = this.createImageCard(item, id);
            grid.appendChild(card);
        });
    }

    createImageCard(item, id) {
        const div = document.createElement('div');
        div.className = 'image-card';
        const format = item.file.type.split('/')[1].toUpperCase();
        div.innerHTML = `
            <div class="card-img">
                <img src="${URL.createObjectURL(item.file)}" alt="预览">
            </div>
            <div class="card-info">
                <div class="d-flex justify-content-between">
                    <span>${item.file.name}</span>
                    <span class="badge bg-secondary">${format}</span>
                </div>
                <div>${this.formatFileSize(item.file.size)}</div>
            </div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
        `;
        return div;
    }

    async compressImage() {
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
        const batchCompress = document.getElementById('batchCompress').checked;
        const resultGrid = document.getElementById('resultGrid');
        resultGrid.innerHTML = '';

        try {
            for (const [id, item] of this.imageQueue) {
                if (item.status === 'done' && !batchCompress) continue;

                const result = await this.processImage(item.file, quality);
                this.compressedImages.set(id, result);
                item.status = 'done';

                const resultItem = this.createResultItem(item.file, result, id);
                resultGrid.appendChild(resultItem);
            }

            document.getElementById('previewPanel').style.display = 'block';
        } catch (error) {
            console.error('压缩失败:', error);
            alert('图片压缩失败，请重试！');
        }
    }

    async processImage(file, quality) {
        const img = await this.createImage(file);
        const keepOriginalFormat = document.getElementById('keepOriginalFormat').checked;
        const outputFormat = keepOriginalFormat ? file.type : document.getElementById('formatSelect').value;
        
        // 获取用户输入的尺寸
        let targetWidth = parseInt(document.getElementById('widthInput').value) || 0;
        let targetHeight = parseInt(document.getElementById('heightInput').value) || 0;
        const keepAspectRatio = document.getElementById('keepAspectRatio').checked;
        
        // 计算最终尺寸
        let width = img.width;
        let height = img.height;
        
        if (targetWidth || targetHeight) {
            if (keepAspectRatio) {
                const ratio = img.width / img.height;
                if (targetWidth && !targetHeight) {
                    targetHeight = Math.round(targetWidth / ratio);
                } else if (targetHeight && !targetWidth) {
                    targetWidth = Math.round(targetHeight * ratio);
                }
            }
            width = targetWidth || width;
            height = targetHeight || height;
        } else {
            // 如果没有指定新尺寸，使用默认的最大尺寸限制
            const maxDimensions = this.calculateSize(img, 1920, 1080);
            width = maxDimensions.width;
            height = maxDimensions.height;
        }

        // 创建canvas并绘制图片
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 如果是PNG或WebP，设置白色背景
        if (outputFormat === 'image/png' || outputFormat === 'image/webp') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
        }

        // 使用双线性插值实现更平滑的缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve({
                    blob,
                    width,
                    height,
                    url: URL.createObjectURL(blob),
                    format: outputFormat
                });
            }, outputFormat, quality);
        });
    }

    createResultItem(originalFile, compressedResult, id) {
        const div = document.createElement('div');
        div.className = 'result-item';
        const compressionRatio = ((1 - compressedResult.blob.size / originalFile.size) * 100).toFixed(1);
        const originalFormat = originalFile.type.split('/')[1].toUpperCase();
        const newFormat = compressedResult.format.split('/')[1].toUpperCase();
        
        div.innerHTML = `
            <div class="comparison">
                <div class="image-preview">
                    <img src="${URL.createObjectURL(originalFile)}" alt="原图">
                    <div class="format-badge">${originalFormat}</div>
                </div>
                <div class="image-preview">
                    <img src="${compressedResult.url}" alt="转换后">
                    <div class="format-badge">${newFormat}</div>
                </div>
            </div>
            <div class="info-group">
                <span>文件名: ${originalFile.name}</span>
                <span class="compression-ratio">压缩率: ${compressionRatio}%</span>
            </div>
            <div class="info-group">
                <span>原始大小: ${this.formatFileSize(originalFile.size)}</span>
                <span>处理后: ${this.formatFileSize(compressedResult.blob.size)}</span>
            </div>
            <div class="info-group">
                <span>格式转换: ${originalFormat} → ${newFormat}</span>
            </div>
            <button class="btn btn-success w-100 download-btn" onclick="imageCompressor.downloadImage('${id}')">
                <i class="bi bi-download"></i> 下载处理后的图片
            </button>
        `;
        return div;
    }

    downloadImage(id) {
        const item = this.imageQueue.get(id);
        const compressed = this.compressedImages.get(id);
        if (!item || !compressed) return;

        const format = compressed.format.split('/')[1].toLowerCase();
        const extension = format === 'jpeg' ? 'jpg' : format;
        const originalName = item.file.name.split('.')[0];

        const link = document.createElement('a');
        link.href = compressed.url;
        link.download = `${originalName}.${extension}`;
        link.click();
    }

    createImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    calculateSize(img, maxWidth, maxHeight) {
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }
        }

        return { width, height };
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    // 添加单个图片下载方法
    downloadImage(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `compressed_${filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // 修改压缩完成后的处理
    async compressImage(file) {
        try {
            const options = {
                maxSizeMB: this.getMaxSize(),
                maxWidthOrHeight: this.getMaxDimension(),
                useWebWorker: true,
                fileType: this.getOutputFormat()
            };

            const compressedBlob = await imageCompression(file, options);
            
            // 存储压缩后的图片
            this.compressedImages.set(file.name, compressedBlob);
            
            // 更新预览
            const previewUrl = URL.createObjectURL(compressedBlob);
            this.updatePreview(file.name, previewUrl, file.size, compressedBlob.size);
            
            // 更新进度
            this.updateProgress();
            
        } catch (error) {
            console.error('压缩失败:', error);
            alert(`压缩失败: ${file.name}`);
        }
    }

    // 添加zip下载方法
    async downloadAsZip() {
        const zip = new JSZip();
        
        // 添加所有压缩后的图片到zip
        for (const [filename, blob] of this.compressedImages) {
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(`compressed_${filename}`, arrayBuffer);
        }
        
        // 生成zip文件并下载
        zip.generateAsync({type: 'blob'})
            .then(zipBlob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'compressed_images.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            })
            .catch(error => {
                console.error('创建zip文件失败:', error);
                alert('下载失败，请重试！');
            });
    }
}

// 创建全局实例以供下载按钮使用
let imageCompressor;
document.addEventListener('DOMContentLoaded', () => {
    imageCompressor = new ImageCompressor();
}); 