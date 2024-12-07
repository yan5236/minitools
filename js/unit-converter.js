const unitTypes = {
    length: {
        name: '长度',
        units: {
            mm: { name: '毫米', factor: 1 },
            cm: { name: '厘米', factor: 10 },
            m: { name: '米', factor: 1000 },
            km: { name: '千米', factor: 1000000 },
            inch: { name: '英寸', factor: 25.4 },
            ft: { name: '英尺', factor: 304.8 }
        }
    },
    weight: {
        name: '重量',
        units: {
            mg: { name: '毫克', factor: 1 },
            g: { name: '克', factor: 1000 },
            kg: { name: '千克', factor: 1000000 },
            oz: { name: '盎司', factor: 28349.5 },
            lb: { name: '磅', factor: 453592 }
        }
    },
    temperature: {
        name: '温度',
        units: {
            c: { name: '摄氏度', factor: 1 },
            f: { name: '华氏度', factor: 1 },
            k: { name: '开尔文', factor: 1 }
        }
    }
};

class UnitConverter {
    constructor() {
        this.initializeSelects();
        this.setupEventListeners();
    }

    initializeSelects() {
        const unitType = document.getElementById('unitType');
        const fromUnit = document.getElementById('fromUnit');
        const toUnit = document.getElementById('toUnit');

        // 填充单位类型选择器
        for (const [key, value] of Object.entries(unitTypes)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.name;
            unitType.appendChild(option);
        }

        // 初始填充单位选择器
        this.updateUnitSelects(unitTypes.length.units);
    }

    updateUnitSelects(units) {
        const fromUnit = document.getElementById('fromUnit');
        const toUnit = document.getElementById('toUnit');

        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';

        for (const [key, value] of Object.entries(units)) {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');

            option1.value = option2.value = key;
            option1.textContent = option2.textContent = value.name;

            fromUnit.appendChild(option1);
            toUnit.appendChild(option2.cloneNode(true));
        }
    }

    convert() {
        const fromValue = parseFloat(document.getElementById('fromValue').value);
        if (isNaN(fromValue)) {
            document.getElementById('toValue').value = '';
            return;
        }

        const unitType = document.getElementById('unitType').value;
        const fromUnit = document.getElementById('fromUnit').value;
        const toUnit = document.getElementById('toUnit').value;

        let result;
        if (unitType === 'temperature') {
            result = this.convertTemperature(fromValue, fromUnit, toUnit);
        } else {
            const fromFactor = unitTypes[unitType].units[fromUnit].factor;
            const toFactor = unitTypes[unitType].units[toUnit].factor;
            result = (fromValue * fromFactor) / toFactor;
        }

        document.getElementById('toValue').value = result.toFixed(4);
    }

    convertTemperature(value, fromUnit, toUnit) {
        let celsius;
        // 先转换为摄氏度
        switch (fromUnit) {
            case 'c': celsius = value; break;
            case 'f': celsius = (value - 32) * 5/9; break;
            case 'k': celsius = value - 273.15; break;
        }
        // 从摄氏度转换为目标单位
        switch (toUnit) {
            case 'c': return celsius;
            case 'f': return celsius * 9/5 + 32;
            case 'k': return celsius + 273.15;
        }
    }

    setupEventListeners() {
        document.getElementById('unitType').addEventListener('change', (e) => {
            this.updateUnitSelects(unitTypes[e.target.value].units);
            this.convert();
        });

        ['fromUnit', 'toUnit', 'fromValue'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.convert());
        });

        document.getElementById('fromValue').addEventListener('input', () => this.convert());
    }
}

// 初始化单位转换器
document.addEventListener('DOMContentLoaded', () => {
    new UnitConverter();
}); 