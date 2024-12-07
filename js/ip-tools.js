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
            // 获取IP详细信息
            const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,org,as,lat,lon,query');
            const data = await response.json();

            if (data.status === 'success') {
                // 更新IP地址
                document.getElementById('ipv4Address').textContent = data.query;

                // 尝试获取IPv6地址
                try {
                    const ipv6Response = await fetch('https://api6.ipify.org?format=json');
                    const ipv6Data = await ipv6Response.json();
                    document.getElementById('ipv6Address').textContent = ipv6Data.ip;
                } catch {
                    document.getElementById('ipv6Address').textContent = '不支持或未启用';
                }

                // 更新详细信息
                document.getElementById('country').textContent = `${data.country} (${data.countryCode})`;
                document.getElementById('city').textContent = data.city || '未知';
                document.getElementById('region').textContent = data.regionName || '���知';
                document.getElementById('timezone').textContent = data.timezone || '未知';
                document.getElementById('isp').textContent = data.isp || '未知';
                document.getElementById('location').textContent = 
                    `${data.lat}, ${data.lon}`;
            } else {
                throw new Error(data.message || '获取IP信息失败');
            }
        } catch (error) {
            console.error('获取IP信息失败:', error);
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

    copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (text === '获取中...' || text === '不支持或未启用' || text === '获取失败') {
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