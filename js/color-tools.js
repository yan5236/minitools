class ColorTools {
    constructor() {
        this.initializeColorPicker();
        this.initializeImagePicker();
    }

    initializeColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        const alphaSlider = document.getElementById('alphaSlider');
        const colorDisplay = document.getElementById('colorDisplay');
        const hexInput = document.getElementById('hexInput');
        const rgbInput = document.getElementById('rgbInput');
        const copyHex = document.getElementById('copyHex');
        const copyRgb = document.getElementById('copyRgb');

        const updateColor = () => {
            const color = colorPicker.value;
            const alpha = alphaSlider.value / 100;
            const rgb = this.hexToRgb(color);
            const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            
            colorDisplay.style.backgroundColor = rgba;
            hexInput.value = color;
            rgbInput.value = rgba;
        };

        colorPicker.addEventListener('input', updateColor);
        alphaSlider.addEventListener('input', updateColor);

        copyHex.addEventListener('click', () => this.copyToClipboard(hexInput.value));
        copyRgb.addEventListener('click', () => this.copyToClipboard(rgbInput.value));

        updateColor();
    }

    initializeImagePicker() {
        const dropZone = document.getElementById('dropZone');
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const colorList = document.getElementById('colorList');

        dropZone.addEventListener('click', () => imageInput.click());
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
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImage(file, canvas, ctx, imagePreview);
            }
        });

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImage(file, canvas, ctx, imagePreview);
            }
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            this.addColorToList(color, colorList);
        });
    }

    handleImage(file, canvas, ctx, imagePreview) {
        const img = new Image();
        img.onload = () => {
            // 调整canvas大小以适应图片
            const maxWidth = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (maxWidth * height) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            imagePreview.style.display = 'block';
            document.getElementById('colorList').innerHTML = '';
        };
        img.src = URL.createObjectURL(file);
    }

    addColorToList(color, colorList) {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.innerHTML = `
            <div class="color-preview" style="background-color: ${color}"></div>
            <div class="color-code">${color}</div>
        `;
        colorItem.addEventListener('click', () => this.copyToClipboard(color));
        colorList.appendChild(colorItem);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('颜色代码已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制！');
        });
    }
}

// 初始化颜色工具
document.addEventListener('DOMContentLoaded', () => {
    new ColorTools();
}); 