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
            // 获取IPv4信息
            const ipv4Response = await fetch('https://api.ipify.org?format=json');
            const ipv4Data = await ipv4Response.json();
            document.getElementById('ipv4Address').textContent = ipv4Data.ip;

            // 获取IPv6信息（如果支持）
            try {
                const ipv6Response = await fetch('https://api64.ipify.org?format=json');
                const ipv6Data = await ipv6Response.json();
                document.getElementById('ipv6Address').textContent = ipv6Data.ip;
            } catch {
                document.getElementById('ipv6Address').textContent = '不支持或未启用';
            }

            // 获取详细信息
            const detailResponse = await fetch(`https://ipapi.co/${ipv4Data.ip}/json/`);
            const detailData = await detailResponse.json();

            // 更新详细信息
            document.getElementById('country').textContent = `${detailData.country_name} (${detailData.country})`;
            document.getElementById('city').textContent = detailData.city || '未知';
            document.getElementById('region').textContent = detailData.region || '未知';
            document.getElementById('timezone').textContent = detailData.timezone || '未知';
            document.getElementById('isp').textContent = detailData.org || '未知';
            document.getElementById('location').textContent = 
                `${detailData.latitude}, ${detailData.longitude}`;

        } catch (error) {
            console.error('获取IP信息失败:', error);
            alert('获取IP信息失败，请稍后重试！');
        }
    }

    copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (text === '获取中...' || text === '不支持或未启用') {
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