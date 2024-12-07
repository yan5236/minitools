class ImageCompressor {
    constructor() {
        this.imageQueue = new Map();
        this.compressedImages = new Map();
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
        document.getElementById('compressBtn').addEventListener('click', async () => {
            if (this.imageQueue.size === 0) {
                alert('请先添加图片！');
                return;
            }
            
            const batchCompress = document.getElementById('batchCompress').checked;
            if (batchCompress) {
                await this.compressAllImages();
            } else {
                const currentImage = this.imageQueue.values().next().value;
                if (currentImage) {
                    await this.compressImage(currentImage.file);
                }
            }
        });

        // 下载按钮事件
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImages();
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

    async compressImage(file) {
        try {
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
            
            // 更新预览
            const previewUrl = URL.createObjectURL(compressedBlob);
            this.updatePreview(file.name, previewUrl, file.size, compressedBlob.size);
            
            // 显示下载按钮
            document.getElementById('downloadBtn').style.display = 'block';
            
            return true;
        } catch (error) {
            console.error('压缩失败:', error);
            alert(`压缩失败: ${file.name}`);
            return false;
        }
    }

    async compressAllImages() {
        const total = this.imageQueue.size;
        let success = 0;
        
        for (const [_, item] of this.imageQueue) {
            if (await this.compressImage(item.file)) {
                success++;
            }
        }

        if (success > 0) {
            alert(`压缩完成！成功: ${success}/${total}`);
        }
    }

    async downloadImages() {
        if (this.compressedImages.size === 0) {
            alert('没有可下载的图片！');
            return;
        }

        try {
            if (this.compressedImages.size === 1) {
                // 单张图片直接下载
                const [filename, blob] = this.compressedImages.entries().next().value;
                await this.downloadSingleImage(blob, filename);
            } else {
                // 多张图片打包下载
                await this.downloadAsZip();
            }
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试！');
        }
    }

    async downloadSingleImage(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `compressed_${filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    async downloadAsZip() {
        const zip = new JSZip();
        
        for (const [filename, blob] of this.compressedImages) {
            const arrayBuffer = await blob.arrayBuffer();
            zip.file(`compressed_${filename}`, arrayBuffer);
        }
        
        const zipBlob = await zip.generateAsync({type: 'blob'});
        await this.downloadSingleImage(zipBlob, 'compressed_images.zip');
    }

    updatePreview(filename, previewUrl, originalSize, compressedSize) {
        const resultGrid = document.getElementById('resultGrid');
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        const originalSizeStr = this.formatFileSize(originalSize);
        const compressedSizeStr = this.formatFileSize(compressedSize);

        resultItem.innerHTML = `
            <div class="preview-image">
                <img src="${previewUrl}" alt="${filename}">
            </div>
            <div class="preview-info">
                <div class="filename">${filename}</div>
                <div class="size-info">
                    <span>原始大小: ${originalSizeStr}</span>
                    <span>压缩后: ${compressedSizeStr}</span>
                    <span>���缩率: ${compressionRatio}%</span>
                </div>
            </div>
        `;

        resultGrid.appendChild(resultItem);
        document.getElementById('previewPanel').style.display = 'block';
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

            // 显示下载按钮
            document.getElementById('downloadBtn').style.display = 'block';
            
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

    async downloadImages() {
        if (this.compressedImages.size === 0) {
            alert('没有可下载的图片！');
            return;
        }

        try {
            if (this.compressedImages.size === 1) {
                // 单张图片直接下载
                const [filename, blob] = this.compressedImages.entries().next().value;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `compressed_${filename}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } else {
                // 多张图片打包下载
                const zip = new JSZip();
                
                for (const [filename, blob] of this.compressedImages) {
                    const arrayBuffer = await blob.arrayBuffer();
                    zip.file(`compressed_${filename}`, arrayBuffer);
                }
                
                const zipBlob = await zip.generateAsync({type: 'blob'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'compressed_images.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试！');
        }
    }

    updatePreview(filename, previewUrl, originalSize, compressedSize) {
        const resultGrid = document.getElementById('resultGrid');
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        const originalSizeStr = this.formatFileSize(originalSize);
        const compressedSizeStr = this.formatFileSize(compressedSize);

        resultItem.innerHTML = `
            <div class="preview-image">
                <img src="${previewUrl}" alt="${filename}">
            </div>
            <div class="preview-info">
                <div class="filename">${filename}</div>
                <div class="size-info">
                    <span>原始大小: ${originalSizeStr}</span>
                    <span>压缩后: ${compressedSizeStr}</span>
                    <span>压缩率: ${compressionRatio}%</span>
                </div>
            </div>
        `;

        resultGrid.appendChild(resultItem);
        document.getElementById('previewPanel').style.display = 'block';
    }
}

// 创建全局实例以供下载按钮使用
let imageCompressor;
document.addEventListener('DOMContentLoaded', () => {
    imageCompressor = new ImageCompressor();
}); 