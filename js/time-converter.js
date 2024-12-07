class TimeConverter {
    constructor() {
        this.setupEventListeners();
        this.startCurrentTimeUpdate();
    }

    setupEventListeners() {
        // 时间戳转日期
        document.getElementById('timestampInput').addEventListener('input', () => this.convertTimestamp());
        document.getElementById('timestampUnit').addEventListener('change', () => this.convertTimestamp());

        // 日期转时间戳
        document.getElementById('dateInput').addEventListener('input', () => this.convertDate());

        // 设置当前时间为默认值
        const now = new Date();
        const localDateTime = now.toISOString().slice(0, 16);
        document.getElementById('dateInput').value = localDateTime;
        this.convertDate();
    }

    convertTimestamp() {
        const input = document.getElementById('timestampInput').value;
        const unit = document.getElementById('timestampUnit').value;
        
        if (!input) {
            document.getElementById('localTime').textContent = '-';
            document.getElementById('utcTime').textContent = '-';
            return;
        }

        try {
            let timestamp = parseInt(input);
            if (unit === 's') {
                timestamp *= 1000;
            }

            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
            }

            document.getElementById('localTime').textContent = this.formatDate(date);
            document.getElementById('utcTime').textContent = this.formatDateUTC(date);
        } catch (error) {
            document.getElementById('localTime').textContent = '无效时间戳';
            document.getElementById('utcTime').textContent = '无效时间戳';
        }
    }

    convertDate() {
        const input = document.getElementById('dateInput').value;
        if (!input) {
            document.getElementById('secondTimestamp').textContent = '-';
            document.getElementById('millisecondTimestamp').textContent = '-';
            return;
        }

        const date = new Date(input);
        const timestampSeconds = Math.floor(date.getTime() / 1000);
        const timestampMilliseconds = date.getTime();

        document.getElementById('secondTimestamp').textContent = timestampSeconds;
        document.getElementById('millisecondTimestamp').textContent = timestampMilliseconds;
    }

    startCurrentTimeUpdate() {
        const updateCurrentTime = () => {
            const now = new Date();
            document.getElementById('currentLocalTime').textContent = this.formatDate(now);
            document.getElementById('currentUtcTime').textContent = this.formatDateUTC(now);
            document.getElementById('currentTimestampSeconds').textContent = Math.floor(now.getTime() / 1000);
            document.getElementById('currentTimestampMilliseconds').textContent = now.getTime();
        };

        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    }

    formatDateUTC(date) {
        return date.toUTCString();
    }
}

// 初始化时间转换器
document.addEventListener('DOMContentLoaded', () => {
    new TimeConverter();
}); 