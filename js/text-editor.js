class TextEditor {
    constructor() {
        this.initializeEditor();
        this.setupEventListeners();
        this.currentFile = null;
    }

    initializeEditor() {
        this.editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
            lineNumbers: true,
            theme: 'default',
            mode: 'text/plain',
            lineWrapping: true,
            indentUnit: 4,
            autofocus: true,
            extraKeys: {
                "Ctrl-F": "findPersistent",
                "Cmd-F": "findPersistent",
                "Ctrl-H": "replace",
                "Cmd-H": "replace"
            }
        });

        // 更新状态栏
        this.editor.on('cursorActivity', () => this.updateStatusBar());
        this.editor.on('change', () => this.updateStatusBar());
    }

    setupEventListeners() {
        // 文件操作
        document.getElementById('newFile').addEventListener('click', () => this.newFile());
        document.getElementById('openFile').addEventListener('click', () => this.openFile());
        document.getElementById('saveFile').addEventListener('click', () => this.saveFile());

        // 编辑操作
        document.getElementById('undoBtn').addEventListener('click', () => this.editor.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.editor.redo());
        document.getElementById('findBtn').addEventListener('click', () => this.editor.execCommand('findPersistent'));
        document.getElementById('replaceBtn').addEventListener('click', () => this.editor.execCommand('replace'));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());

        // 主题切换
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.editor.setOption('theme', e.target.value);
        });

        // 处理文件拖放
        this.editor.getWrapperElement().addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.editor.getWrapperElement().addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) this.readFile(file);
        });
    }

    newFile() {
        if (this.editor.getValue().trim() !== '') {
            if (!confirm('当前文件未保存，是否创建新文件？')) {
                return;
            }
        }
        this.editor.setValue('');
        this.currentFile = null;
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.js,.html,.css,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this.readFile(file);
        };
        input.click();
    }

    readFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.setValue(e.target.result);
            this.currentFile = file;
        };
        reader.readAsText(file);
    }

    saveFile() {
        const content = this.editor.getValue();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.currentFile ? this.currentFile.name : 'untitled.txt';
        link.click();
        URL.revokeObjectURL(url);
    }

    clearEditor() {
        if (this.editor.getValue().trim() !== '' && 
            !confirm('确定要清空编辑器吗？')) {
            return;
        }
        this.editor.setValue('');
    }

    updateStatusBar() {
        const pos = this.editor.getCursor();
        const content = this.editor.getValue();
        
        document.getElementById('cursorPos').textContent = 
            `行: ${pos.line + 1}, 列: ${pos.ch + 1}`;
        
        document.getElementById('charCount').textContent = 
            `字符数: ${content.length}`;
        
        document.getElementById('lineCount').textContent = 
            `行数: ${this.editor.lineCount()}`;
    }
}

// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
    new TextEditor();
}); 