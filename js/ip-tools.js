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
            // 获取IPv4信息（主要API）
            let ipData;
            try {
                const response = await fetch('https://api.myip.com');
                ipData = await response.json();
            } catch {
                // 如果主要API失败，使用备用API
                const backupResponse = await fetch('https://ip.seeip.org/jsonip');
                const backupData = await backupResponse.json();
                ipData = {
                    ip: backupData.ip,
                    country: backupData.country,
                    cc: backupData.code
                };
            }

            // 更新IP地址
            document.getElementById('ipv4Address').textContent = ipData.ip;

            // 尝试获取IPv6地址
            try {
                const ipv6Response = await fetch('https://api-ipv6.ip.sb/ip');
                const ipv6Data = await ipv6Response.text();
                document.getElementById('ipv6Address').textContent = ipv6Data.trim();
            } catch {
                document.getElementById('ipv6Address').textContent = '不支持或未启用';
            }

            // 更新基��信息
            document.getElementById('country').textContent = `${ipData.country} (${ipData.cc})`;
            
            // 获取更多详细信息
            try {
                const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
                const geoData = await geoResponse.json();
                
                document.getElementById('city').textContent = geoData.city || '未知';
                document.getElementById('region').textContent = geoData.region || '未知';
                document.getElementById('timezone').textContent = geoData.timezone || '未知';
                document.getElementById('isp').textContent = geoData.org || '未知';
                document.getElementById('location').textContent = 
                    `${geoData.latitude || '-'}, ${geoData.longitude || '-'}`;
            } catch {
                // 如果获取详细信息失败，显示基本信息
                document.getElementById('city').textContent = '未知';
                document.getElementById('region').textContent = '未知';
                document.getElementById('timezone').textContent = '未知';
                document.getElementById('isp').textContent = '未知';
                document.getElementById('location').textContent = '-';
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