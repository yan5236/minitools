class CodeFormatter {
    constructor() {
        this.initializeEditors();
        this.setupEventListeners();
    }

    initializeEditors() {
        // 初始化输入编辑器
        this.inputEditor = CodeMirror.fromTextArea(document.getElementById('inputEditor'), {
            mode: 'javascript',
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });

        // 初始化输出编辑器
        this.outputEditor = CodeMirror.fromTextArea(document.getElementById('outputEditor'), {
            mode: 'javascript',
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true,
            readOnly: true
        });
    }

    setupEventListeners() {
        // 格式化按钮
        document.getElementById('formatBtn').addEventListener('click', () => this.formatCode());

        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', () => this.copyCode());

        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCode());

        // 语言选择
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.setEditorMode(e.target.value);
        });

        // 主题选择
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setEditorTheme(e.target.value);
        });

        // 缩进选择
        document.getElementById('indentSelect').addEventListener('change', (e) => {
            const value = e.target.value === 'tab' ? '\t' : parseInt(e.target.value);
            this.inputEditor.setOption('indentUnit', value);
            this.outputEditor.setOption('indentUnit', value);
        });
    }

    async formatCode() {
        const code = this.inputEditor.getValue();
        if (!code.trim()) {
            alert('请输入要格式化的代码！');
            return;
        }

        try {
            const language = document.getElementById('languageSelect').value;
            const printWidth = parseInt(document.getElementById('printWidth').value);
            const useTabs = document.getElementById('indentSelect').value === 'tab';
            const tabWidth = parseInt(document.getElementById('indentSelect').value) || 2;

            const options = {
                parser: this.getParser(language),
                plugins: prettierPlugins,
                printWidth,
                useTabs,
                tabWidth,
                semi: true,
                singleQuote: true,
                trailingComma: 'es5',
                bracketSpacing: true,
                arrowParens: 'avoid'
            };

            const formattedCode = prettier.format(code, options);
            this.outputEditor.setValue(formattedCode);
        } catch (error) {
            console.error('格式化错误:', error);
            alert('格式化失败，请检查代码语法是否正确！');
        }
    }

    getParser(language) {
        const parserMap = {
            javascript: 'babel',
            typescript: 'typescript',
            html: 'html',
            css: 'css',
            json: 'json',
            markdown: 'markdown'
        };
        return parserMap[language] || 'babel';
    }

    copyCode() {
        const code = this.outputEditor.getValue();
        if (!code.trim()) {
            alert('没有可复制的代码！');
            return;
        }

        navigator.clipboard.writeText(code).then(() => {
            alert('代码已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制！');
        });
    }

    clearCode() {
        this.inputEditor.setValue('');
        this.outputEditor.setValue('');
    }

    setEditorMode(mode) {
        this.inputEditor.setOption('mode', mode);
        this.outputEditor.setOption('mode', mode);
    }

    setEditorTheme(theme) {
        this.inputEditor.setOption('theme', theme);
        this.outputEditor.setOption('theme', theme);
    }
}

// 初始化代码格式化器
document.addEventListener('DOMContentLoaded', () => {
    new CodeFormatter();
}); 