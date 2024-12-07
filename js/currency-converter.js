class CurrencyConverter {
    constructor() {
        this.rates = {};
        this.lastUpdate = null;
        // API配置
        this.API_BASE_URL = 'https://open.er-api.com/v6/latest';
        
        this.setupEventListeners();
        this.fetchRates();
    }

    async fetchRates() {
        const refreshBtn = document.getElementById('refreshRate');
        refreshBtn.disabled = true;
        refreshBtn.classList.add('refreshing');

        try {
            // 获取所有汇率，使用USD作为基准货币
            const response = await fetch(`${this.API_BASE_URL}/USD`);
            const data = await response.json();
            
            if (data.result === 'success') {
                // 处理汇率数据
                this.rates = data.rates;
                this.lastUpdate = new Date(data.time_last_update_utc);
                this.nextUpdate = new Date(data.time_next_update_utc);
                this.updateLastUpdateTime();
                this.convert();
            } else {
                throw new Error('获取汇率失败');
            }
        } catch (error) {
            console.error('获取汇率失败:', error);
            alert('获取汇率失败，请稍后重试');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.classList.remove('refreshing');
        }
    }

    convert() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        if (isNaN(fromAmount)) {
            document.getElementById('toAmount').value = '';
            return;
        }

        if (this.rates[fromCurrency] && this.rates[toCurrency]) {
            // 使用API返回的汇率进行计算
            const fromRate = this.rates[fromCurrency];
            const toRate = this.rates[toCurrency];
            // 先转换为USD，再转换为目标货币
            const result = (fromAmount / fromRate) * toRate;
            document.getElementById('toAmount').value = result.toFixed(2);
        }
    }

    updateLastUpdateTime() {
        if (this.lastUpdate) {
            const formatter = new Intl.DateTimeFormat('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            document.getElementById('lastUpdate').textContent = 
                `最后更新: ${formatter.format(this.lastUpdate)}\n下次更新: ${formatter.format(this.nextUpdate)}`;
        }
    }

    setupEventListeners() {
        // 输入金额时实时转换
        document.getElementById('fromAmount').addEventListener('input', () => this.convert());

        // 切换货币时重新转换
        document.getElementById('fromCurrency').addEventListener('change', () => this.convert());
        document.getElementById('toCurrency').addEventListener('change', () => this.convert());

        // 刷新汇率按钮
        document.getElementById('refreshRate').addEventListener('click', () => this.fetchRates());

        // 交换货币按钮
        document.getElementById('swapCurrency').addEventListener('click', () => {
            const fromCurrency = document.getElementById('fromCurrency');
            const toCurrency = document.getElementById('toCurrency');
            const fromAmount = document.getElementById('fromAmount');
            const toAmount = document.getElementById('toAmount');

            [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value];
            fromAmount.value = toAmount.value;
            this.convert();
        });
    }
}

// 初始化汇率转换器
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
}); 