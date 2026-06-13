#!/usr/bin/env python3
import json
import os

# 读取原始试卷文件
with open('/Users/jackqiaosan/Desktop/test/fire-exam-react/public/json/exam-papers.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取第一份试卷的题目
if data.get('papers') and len(data['papers']) > 0:
    paper_data = {
        'questions': data['papers'][0]['questions']
    }
    
    # 创建独立的试卷文件
    with open('/Users/jackqiaosan/Desktop/test/fire-exam-react/public/json/paper-1.json', 'w', encoding='utf-8') as f:
        json.dump(paper_data, f, ensure_ascii=False, indent=2)
    
    print("✓ paper-1.json 已创建")
    
    # 更新索引文件
    index_data = {
        'papers': [
            {
                'id': 'paper-1',
                'name': data['papers'][0]['name'],
                'file': 'paper-1.json'
            }
        ]
    }
    
    with open('/Users/jackqiaosan/Desktop/test/fire-exam-react/public/json/paper-index.json', 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    print("✓ paper-index.json 已更新")
else:
    print("✗ 未找到试卷数据")