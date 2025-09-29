
let nodeId = 0;
let ruleList = '';
let apiKey = '';
let maxBatchSize = '100';
const nodeTextMap = new Map();

function gatherWebPageTextNode(node) {
  if (node && node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue && node.nodeValue.trim().length > 0) {
      if (!node.__textId) {
        node.__textId = ++nodeId;
      }
      nodeTextMap.set(String(node.__textId), node);
    }
  } else {
    node.childNodes.forEach(gatherWebPageTextNode);
  }
}

async function transferWebPageText(requestText) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: false,
        top_p: 0.95,
        temperature: 1,
        messages: [{
          role: 'user',
          content: "### 待翻译英文片段:\n{{content}}\n\n### 任务说明：\n你现在是一名中英翻译专家，请你按照“### 翻译内容步骤”的说明将“待翻译英文片段”中的英文论文片段翻译为中文，最后将结果整理成json格式（“输出格式”）输出。\n翻译时需要注意的事项：\n- 人名、专属名词大写缩写、数字、网页链接、文献引用不要翻译\n{{rules}}\n\n### 翻译内容步骤\n1、你需要翻译的内容有特殊的文本格式：<节点10>What is mixture of experts?<节点10/><节点11>Mixtures of experts in deep learning<节点11/>\n2、比如你遇到这样的翻译内容：...<节点10>What is mixture of experts?<节点10/>...\n3、其中<节点10>和<节点10/>只是单纯的分隔符，不要翻译\n4、提取<节点10>和<节点10/>之间的：What is mixture of experts?，这是你需要翻译的内容\n5、翻译What is mixture of experts?为：什么是混合专家？\n6、组合翻译结果和分隔符：<节点10>什么是混合专家？<节点10/>\n7、重复上面的过程，将所有内容翻译完成并拼接完所有原本的分隔符\n8、按照“### 输出格式”要求输出结果\n\n### 输出格式\n注意：输出格式一定要严格按照```json {\"result\": \"你翻译的内容\"}```输出：\n```json\n{\"result\": \"你翻译的内容\"}\n```\n".replace('{{content}}', requestText).replace('{{rules}}', ruleList)
        }],
      })
    });
    const data = await response.json();
    const result = data.choices[0].message.content;
    const matched = result.match(/```json([\s\S]*?)```/);
    return matched ? JSON.parse(matched[1].trim()).result : requestText;
  } catch (err) {
    console.log(err);
    return requestText;
  }
}

function transferWebPageTextNode() {
  let requestText = '';
  nodeTextMap.forEach((node, nodeId) => {
    if (requestText.length > maxBatchSize) {
      transferWebPageText(requestText).then(result => {
        let matched;
        const regex = /<节点(\d+)>([\s\S]*?)<节点\1\/>/g;
        while ((matched = regex.exec(result)) !== null) {
          nodeTextMap.get(matched[1]).nodeValue = String(matched[2]);
        }
      });
      requestText = '';
    }
    requestText += `<节点${nodeId}>${node.nodeValue}<节点${nodeId}\/>`;
  });
}

chrome.storage.local.get(['appToken', 'rules', 'maxWords'], (res) => {
  if (res.appToken) apiKey = res.appToken;
  maxBatchSize = Number(res.maxWords ?? '100');
  ruleList = ((res.rules && res.rules.length > 0) ? res.rules : ['翻译要地道']).map(one => `- ${one}`).join('\n');
  // 获取网页节点信息
  gatherWebPageTextNode(document.body);
  // 转换网页节点信息
  transferWebPageTextNode();
});
