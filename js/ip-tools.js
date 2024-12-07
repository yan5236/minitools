class IPTools {
    constructor() {
        this.fetchIPInfo();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.fetchIPInfo();
        });
    }

    async fetchIPInfo() {
        try {
            // 使用vore.top的API获取IP信息
            const response = await fetch('https://api.vore.top/api/ip');
            const data = await response.json();

            if (data.code === 200) {
                // 更新IPv4地址
                document.getElementById('ipv4Address').textContent = data.data.ip;

                // 更新IPv6地址
                document.getElementById('ipv6Address').textContent = '不支持或未启用';

                // 更新详细信息
                document.getElementById('country').textContent = `${data.data.info.country} (CN)`;
                document.getElementById('city').textContent = data.data.info.city || '未知';
                document.getElementById('region').textContent = data.data.info.prov || '未知';
                document.getElementById('timezone').textContent = 'Asia/Shanghai';
                document.getElementById('isp').textContent = data.data.info.isp || '未知';
                document.getElementById('location').textContent = 
                    `${data.data.info.latitude || '-'}, ${data.data.info.longitude || '-'}`;
            } else {
                throw new Error(data.msg || 'API返回错误');
            }

        } catch (error) {
            console.error('获取IP信息失败:', error);
            
            // 尝试使用备用API
            try {
                const backupResponse = await fetch('https://forge.speedtest.cn/api/location/info');
                const backupData = await backupResponse.json();

                // 更新IPv4地址
                document.getElementById('ipv4Address').textContent = backupData.ip;
                document.getElementById('ipv6Address').textContent = '不支持或未启用';

                // 更新详细信息
                document.getElementById('country').textContent = '中国 (CN)';
                document.getElementById('city').textContent = backupData.city || '未知';
                document.getElementById('region').textContent = backupData.province || '未知';
                document.getElementById('timezone').textContent = 'Asia/Shanghai';
                document.getElementById('isp').textContent = backupData.isp || '未知';
                document.getElementById('location').textContent = 
                    `${backupData.latitude || '-'}, ${backupData.longitude || '-'}`;

            } catch (backupError) {
                console.error('备用API也失败:', backupError);
                alert('获取IP信息失败，请稍后重试！');
                
                // 清空显示
                document.getElementById('ipv4Address').textContent = '获取失败';
                document.getElementById('ipv6Address').textContent = '获取失败';
                document.getElementById('country').textContent = '-';
                document.getElementById('city').textContent = '-';
                document.getElementById('region').textContent = '-';
                document.getElementById('timezone').textContent = '-';
                document.getElementById('isp').textContent = '-';
                document.getElementById('location').textContent = '-';
            }
        }
    }

    copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (text === '获取中...' || text === '不支持或未启用' || text === '获取失败' || text === '-') {
            alert('暂无可复制的内容！');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            alert('IP地址已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制！');
        });
    }
}

// 创建全局实例以供HTML中使用
let ipTools;
document.addEventListener('DOMContentLoaded', () => {
    ipTools = new IPTools();
}); 