

const appTokenInput = document.getElementById('appToken');
const saveTokenBtn = document.getElementById('saveToken');
const maxWordsSelect = document.getElementById('maxWords');

const ruleListEl = document.getElementById('ruleList');
const ruleInput = document.getElementById('ruleInput');
const addBtn = document.getElementById('addBtn');
const saveBtn = document.getElementById('saveBtn');

let rules = ['翻译要地道'];


// 保存 APP-TOKEN
saveTokenBtn.addEventListener('click', () => {
    const token = appTokenInput.value.trim();
    chrome.storage.local.set({ appToken: token }, () => {
        alert('Api-Key 已保存');
    });
});

// 读取已有规则
chrome.storage.local.get(['appToken', 'rules', 'maxWords'], (res) => {
    if (res.appToken) appTokenInput.value = res.appToken;
    if (res.rules && res.rules.length > 0) rules = res.rules;
    maxWordsSelect.value = res.maxWords || '100';
    renderList();
});

// 渲染列表
function renderList() {
    ruleListEl.innerHTML = '';
    for (let i = rules.length - 1; i >= 0; i--) {
        const rule = rules[i];
        const li = document.createElement('li');
        li.textContent = rule;

        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.onclick = () => {
            rules.splice(i, 1);
            renderList();
        };

        li.appendChild(delBtn);
        ruleListEl.appendChild(li);
    }
}

// 添加规则
addBtn.addEventListener('click', () => {
    const value = ruleInput.value.trim();
    if (!value) return;
    rules.push(value);
    ruleInput.value = '';
    renderList();
});

// 保存规则
saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({ rules }, () => {
        alert('保存成功！');
    });
});


// 保存 maxWords
maxWordsSelect.addEventListener('change', () => {
    chrome.storage.local.set({ maxWords: maxWordsSelect.value });
});
