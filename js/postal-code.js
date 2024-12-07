class PostalCodeTool {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchPostalCode());
        document.getElementById('validateBtn').addEventListener('click', () => this.validateAddress());
    }

    async searchPostalCode() {
        const country = document.getElementById('countrySelect').value;
        const searchTerm = document.getElementById('searchInput').value.trim();
        
        if (!searchTerm) {
            alert('请输入查询内容！');
            return;
        }

        try {
            const response = await fetch(`https://secure.shippingapis.com/ShippingAPI.dll?API=CityStateLookup&XML=<CityStateLookupRequest USERID="XXXXXXXXXXXX"><ZipCode ID="0"><Zip5>${searchTerm}</Zip5></ZipCode></CityStateLookupRequest>`);
            const data = await response.text();
            
            // 解析XML响应
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            
            // 显示结果
            document.getElementById('resultSection').style.display = 'block';
            const resultTable = document.getElementById('resultTable');
            resultTable.innerHTML = '';

            const zip = xmlDoc.querySelector('Zip5')?.textContent;
            const city = xmlDoc.querySelector('City')?.textContent;
            const state = xmlDoc.querySelector('State')?.textContent;

            if (zip && city && state) {
                resultTable.innerHTML = `
                    <tr>
                        <td>${zip}</td>
                        <td>${city}</td>
                        <td>${state}</td>
                        <td>${country}</td>
                        <td>-</td>
                    </tr>
                `;
            } else {
                resultTable.innerHTML = '<tr><td colspan="5">未找到结果</td></tr>';
            }
        } catch (error) {
            console.error('查询失败:', error);
            alert('查询失败，请稍后重试！');
        }
    }

    async validateAddress() {
        const street = document.getElementById('streetInput').value.trim();
        const city = document.getElementById('cityInput').value.trim();
        const state = document.getElementById('stateInput').value.trim();

        if (!street || !city || !state) {
            alert('请填写完整的街道地址信息！');
            return;
        }

        try {
            const response = await fetch(`https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=<AddressValidateRequest USERID="XXXXXXXXXXXX"><Address ID="0"><Address1></Address1><Address2>${street}</Address2><City>${city}</City><State>${state}</State><Zip5></Zip5><Zip4></Zip4></Address></AddressValidateRequest>`);
            const data = await response.text();
            
            // 解析XML响应
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            
            // 显示验证结果
            const validationResult = document.getElementById('validationResult');
            validationResult.style.display = 'block';

            const address = xmlDoc.querySelector('Address');
            if (address) {
                const zip5 = address.querySelector('Zip5')?.textContent;
                const zip4 = address.querySelector('Zip4')?.textContent;
                validationResult.innerHTML = `
                    <div class="validation-result valid">
                        <h6><i class="bi bi-check-circle-fill text-success"></i> 地址有效</h6>
                        <p>标准化地址：</p>
                        <p>${address.querySelector('Address2')?.textContent}</p>
                        <p>${address.querySelector('City')?.textContent}, ${address.querySelector('State')?.textContent} ${zip5}${zip4 ? '-'+zip4 : ''}</p>
                    </div>
                `;
            } else {
                validationResult.innerHTML = `
                    <div class="validation-result invalid">
                        <h6><i class="bi bi-x-circle-fill text-danger"></i> 地址无效</h6>
                        <p>请检查地址信息是否正确。</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('验证失败:', error);
            alert('验证失败，请稍后重试！');
        }
    }
}

// 初始化工具
document.addEventListener('DOMContentLoaded', () => {
    new PostalCodeTool();
}); 