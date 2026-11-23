# -*- coding: utf-8 -*-
"""
把 JSON 题库转换成 App 可直接使用的 ES 模块。

用法：
  python tools/import_questions.py data/source/banks.json

输入 JSON 结构：
{
  "subjects": [
    {
      "key": "computer", "name": "计算机基础", "full": "完整名称",
      "code": "DEMO-001", "total": 24, "examCount": 10, "examMinutes": 20,
      "chapters": [
        { "id": "s01", "name": "第一章", "weight": "35%", "focus": "说明", "count": 8 }
      ]
    }
  ],
  "questions": [
    {
      "id": "computer_s01_001", "subject": "computer", "chapter": "s01",
      "type": "judge", "stem": "题干", "answer": "正确", "explain": "解析"
    },
    {
      "id": "computer_s01_002", "subject": "computer", "chapter": "s01",
      "type": "single", "stem": "题干", "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "A", "explain": "解析"
    }
  ]
}

题型 type：judge（判断题，选项自动生成）、single（单选）、multi（多选）。
答案 answer：judge 用「正确」或「错误」；single 用 "B"；multi 用 "ABD"。
多选题选好全部选项后在页面上点「确认答案」提交。

输出：
  src/data/questions.js
  src/data/meta.js
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, 'src', 'data')
DEFAULT_INPUT = os.path.join(ROOT, 'data', 'source', 'banks.json')


def build_options(q):
    """判断题选项由 App 自动生成，这里只处理选择题。"""
    if q['type'] == 'judge':
        return [
            {'letter': '正确', 'text': '正确'},
            {'letter': '错误', 'text': '错误'}
        ]
    raw = q.get('options') or []
    return [{'letter': chr(65 + i), 'text': str(t)} for i, t in enumerate(raw)]


def validate(data):
    subjects = data.get('subjects') or []
    questions = data.get('questions') or []
    errors = []

    if not subjects:
        errors.append('缺少 subjects')
    if not questions:
        errors.append('缺少 questions')

    subject_keys = set()
    for s in subjects:
        if not s.get('key') or not s.get('name'):
            errors.append('科目缺少 key 或 name')
        if s.get('key') in subject_keys:
            errors.append('科目 key 重复: ' + s['key'])
        subject_keys.add(s.get('key'))

    ids = set()
    for q in questions:
        qid = q.get('id', '?')
        for k in ('id', 'subject', 'chapter', 'type', 'stem', 'answer', 'explain'):
            if not q.get(k):
                errors.append(f'{qid} 缺少字段 {k}')
                break
        if q.get('id') in ids:
            errors.append('题目 id 重复: ' + qid)
        ids.add(q.get('id'))

        if q.get('subject') not in subject_keys:
            errors.append(f'{qid} 科目 key 不存在: {q.get("subject")}')

        if q.get('type') not in ('judge', 'single', 'multi'):
            errors.append(f'{qid} 未知题型: {q.get("type")}')
            continue

        ans = str(q.get('answer', ''))
        if q['type'] == 'judge':
            if ans not in ('正确', '错误'):
                errors.append(f'{qid} 判断题答案异常: {ans}')
        else:
            letters = set(c for c in ans if 'A' <= c <= 'H')
            options = q.get('options') or []
            if not letters:
                errors.append(f'{qid} 选择题答案异常: {ans}')
            if len(letters) > len(options):
                errors.append(f'{qid} 答案选项数超过提供的选项数')
            if q['type'] == 'single' and len(letters) != 1:
                errors.append(f'{qid} 单选题答案不是唯一: {ans}')
            if q['type'] == 'multi' and len(letters) < 2:
                errors.append(f'{qid} 多选题答案不足 2 项: {ans}')
    return subjects, questions, errors


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
    if not os.path.exists(src):
        print('找不到输入文件:', src)
        print('请按文件头注释的格式准备 JSON，或指定路径。')
        sys.exit(1)

    with open(src, encoding='utf-8') as f:
        data = json.load(f)

    subjects, raw_questions, errors = validate(data)
    if errors:
        print(f'输入数据有 {len(errors)} 个问题：')
        for e in errors[:40]:
            print('  -', e)
        sys.exit(1)

    questions = []
    for q in raw_questions:
        questions.append({
            'id': q['id'],
            'subject': q['subject'],
            'chapter': q['chapter'],
            'type': q['type'],
            'stem': q['stem'],
            'options': build_options(q),
            'answer': q['answer'],
            'explain': q['explain']
        })

    q_header = '''/**
 * 本文件由 tools/import_questions.py 生成，请勿手工编辑。
 * 修改题库请编辑源文件后重新执行导入脚本。
 */
export const questions = '''
    m_header = '''/**
 * 科目与章节配置，由 tools/import_questions.py 生成。
 * weight 用于模拟考试按章节权重组卷。
 */
export const subjects = '''

    with open(os.path.join(OUT_DIR, 'questions.js'), 'w', encoding='utf-8') as f:
        f.write(q_header + json.dumps(questions, ensure_ascii=False, indent=2) + '\n\nexport default questions\n')
    with open(os.path.join(OUT_DIR, 'meta.js'), 'w', encoding='utf-8') as f:
        f.write(m_header + json.dumps(subjects, ensure_ascii=False, indent=2) + '\n\nexport default subjects\n')

    print(f'已导入 {len(questions)} 道题，{len(subjects)} 个科目')
    print('题型分布:', dict(Counter(q["type"] for q in questions)))
    print('输出:', os.path.join(OUT_DIR, 'questions.js'))
    print('      ', os.path.join(OUT_DIR, 'meta.js'))


if __name__ == '__main__':
    main()
