/**
 * 科目与章节配置，由 tools/import_questions.py 生成。
 * weight 用于模拟考试按章节权重组卷。
 */
export const subjects = [
  {
    "key": "computer",
    "name": "计算机基础",
    "full": "计算机基础知识测试题库（示例数据）",
    "code": "DEMO-001",
    "total": 24,
    "examCount": 10,
    "examMinutes": 20,
    "chapters": [
      {
        "id": "s01",
        "name": "计算机基础",
        "weight": "35%",
        "focus": "计算机组成、存储单位、操作系统常识",
        "count": 8
      },
      {
        "id": "s02",
        "name": "网络基础",
        "weight": "35%",
        "focus": "IP 地址、协议、网络设备与传输介质",
        "count": 8
      },
      {
        "id": "s03",
        "name": "网络安全",
        "weight": "30%",
        "focus": "密码学基础、常见攻击与防护措施",
        "count": 8
      }
    ]
  }
]

export default subjects
