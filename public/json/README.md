# 题目数据文件说明

本文件夹用于存放智能刷题系统的题目数据。

## 文件命名规范

- 使用英文文件名，避免编码问题
- 建议使用描述性的名称，如 `paper-1.json`、`paper-2.json`
- 文件扩展名必须是 `.json`

## 题目 ID 命名规范（重要）

为确保题目 ID 在全系统中唯一且有序，采用以下统一规则：

| 题型  | 题号范围        | ID 格式            | 示例                                |
| --- | ----------- | ---------------- | --------------------------------- |
| 单选题 | 第 1–100 题   | `paper1-dx-{n}`  | `paper1-dx-1`、`paper1-dx-100`     |
| 多选题 | 第 101–140 题 | `paper1-duo-{n}` | `paper1-duo-101`、`paper1-duo-140` |
| 判断题 | 第 141–200 题 | `paper1-pd-{n}`  | `paper1-pd-141`、`paper1-pd-200`   |

> **说明**：`paper1` 表示第一份试卷；`dx` 代表单选、`duo` 代表多选、`pd` 代表判断；后缀数字与试卷题号保持一致。

## 当前文件

- `paper-index.json`: 试卷索引文件，记录所有试卷的基本信息
- `paper-1.json`: 第一份试卷的题目数据
- `exam-papers.json`: 旧格式的题目数据文件（向后兼容）

## 多试卷管理

系统支持多份独立的JSON试卷文件，采用**索引+试卷**的管理方式：

### 1. 创建试卷索引 (`paper-index.json`)

```json
{
  "papers": [
    {
      "id": "paper-1",
      "name": "2026历年真题练习（卷A）",
      "file": "paper-1.json"
    },
    {
      "id": "paper-2",
      "name": "2026模拟试卷（卷B）",
      "file": "paper-2.json"
    }
  ]
}
```

### 2. 创建试卷文件 (`paper-xxx.json`)

每个试卷文件只包含题目数组：

```json
{
  "questions": [
    {
      "id": "paper1-dx-1",
      "type": "single",
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": ["A"],
      "parse": "解析内容"
    }
  ]
}
```

### 3. 添加新试卷步骤

1. 在 `paper-index.json` 中添加新试卷的元数据（id、name、file）
2. 创建对应的试卷文件（如 `paper-2.json`）
3. 刷新页面即可自动加载新试卷

# JSON 数据格式

### 基本结构

```json
{
  "papers": [
    {
      "id": "唯一标识",
      "name": "试卷名称",
      "questions": [
        {
          "id": "题目唯一标识",
          "type": "题目类型",
          "question": "题目内容",
          "options": ["选项1", "选项2", "选项3", "选项4"],
          "answer": ["正确答案"],
          "parse": "解析内容"
        }
      ]
    }
  ],
  "questions": []
}
```

### 题目类型说明

- `single`: 单选题，只有一个正确答案
- `multiple`: 多选题，有一个或多个正确答案
- `judge`: 判断题，答案为"正确"或"错误"

### 示例题目

#### 单选题示例

```json
{
  "id": "paper1-dx-1",
  "type": "single",
  "question": "What is the capital city of France?",
  "options": [
    "A. London",
    "B. Berlin",
    "C. Paris",
    "D. Madrid"
  ],
  "answer": ["C"],
  "parse": "Paris is the capital and most populous city of France."
}
```

#### 多选题示例

```json
{
  "id": "paper1-duo-101",
  "type": "multiple",
  "question": "Which of the following are programming languages?",
  "options": [
    "A. Python",
    "B. Java",
    "C. HTML",
    "D. English"
  ],
  "answer": ["A", "B"],
  "parse": "Python and Java are programming languages. HTML is a markup language, and English is a natural language."
}
```

#### 判断题示例

```json
{
  "id": "paper1-pd-141",
  "type": "judge",
  "question": "In JavaScript, 'const' declares a variable that cannot be reassigned.",
  "options": ["正确", "错误"],
  "answer": ["正确"],
  "parse": "'const' creates a read-only reference to a value, meaning the variable cannot be reassigned to a different value."
}
```

## 注意事项

1. **ID 唯一性**: 确保每个题目和试卷的 ID 在整个系统中是唯一的
2. **答案格式**: 答案必须是数组格式，即使是单选题也要用 `["A"]` 而不是 `"A"`
3. **选项格式**: 选项数组中的每个选项都要包含选项标识（A、B、C、D）
4. **JSON 格式**: 确保 JSON 格式正确，可以使用在线 JSON 验证工具检查
5. **编码问题**: 文件保存时使用 UTF-8 编码，避免中文乱码

## 数据验证

在添加新题目后，建议：

1. 检查 JSON 格式是否正确
2. 确认所有必填字段都已填写
3. 验证答案格式是否正确
4. 测试题目在系统中的显示和功能

## 多文件管理

如果题目数量较多，可以按以下方式拆分文件：

- 按试卷分类：`paper-a.json`, `paper-b.json`
- 按题型分类：`single-choice.json`, `multiple-choice.json`, `judge.json`
- 按难度分类：`basic.json`, `advanced.json`

拆分后需要在代码中相应修改加载逻辑。
