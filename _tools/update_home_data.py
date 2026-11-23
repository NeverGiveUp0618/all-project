"""Refresh navigation summaries from the sibling sites' built content, without rebuilding them."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parents[1];PROJECTS=ROOT.parent

def read_json(p):return json.loads(p.read_text())
def meta(name):
 text=(PROJECTS/name/'data/data-meta.js').read_text();pos=text.index('window.DATA_META=')+len('window.DATA_META=')
 return json.JSONDecoder().raw_decode(text[pos:])[0]['counts']
def build():
 counts={k:meta(n) for k,n in [('mangpai','mangpai-course'),('jingjiang','bazi-course'),('lrcourse','liuren-course')]}
 bank=read_json(PROJECTS/'zeri-web/question-bank/questions.json');terms=read_json(PROJECTS/'zeri-web/question-bank/glossary/terms.json');tq=read_json(PROJECTS/'zeri-web/question-bank/glossary/questions.json')
 counts['zeri']={'questions':len(bank),'chapters':len({q['chapter'] for q in bank}),'terms':len(terms),'termQuestions':len(tq)}
 m,j,l,z=(counts[k] for k in ['mangpai','jingjiang','lrcourse','zeri'])
 labels={'mangpai':f"{m['course']}讲教材 · {m['plain']}课初级白话 · {m['selftest']}道章末题",'zeri':f"{z['questions']}道教材题 · {z['terms']}个名词 · {z['termQuestions']}道名词题",'jingjiang':f"{j['course']}章教材 · {j['notes']}篇笔记 · {j['quiz']}道命例题",'lrcourse':f"通解{l['lesson']}课 · 初中级{l['basicLesson']}课 · {l['ref']+l['basicRef']}条速查",'bazi':'教材知识点 · 断盘陪练 · 错题复习','xiangfa':'断事图 · 八字与六壬 · 共象速查'}
 p=ROOT/'index.html';s=p.read_text()
 for key,label in labels.items():
  pat=r'(<a class="card" data-app="'+key+r'"[\s\S]*?<div class="t-sub">)[\s\S]*?(</div>)'
  label=' · '.join('<span class="summary-item">'+html.escape(part)+'</span>' for part in label.split(' · '))
  s,n=re.subn(pat,lambda m:m[1]+label+m[2],s);assert n==1,key
 block='/* SITE_COUNTS_START */\nwindow.YST_COUNTS='+json.dumps(counts,ensure_ascii=False,separators=(',',':'))+';\n/* SITE_COUNTS_END */'
 if '/* SITE_COUNTS_START */' in s:s,n=re.subn(r'/\* SITE_COUNTS_START \*/[\s\S]*?/\* SITE_COUNTS_END \*/',lambda _:block,s);assert n==1
 else:s=s.replace('// —— 学习看板',block+'\n\n// —— 学习看板',1);assert block in s
 assert len(s)>20000;p.write_text(s)
 print(json.dumps({'counts':counts,'summaries':labels},ensure_ascii=False,indent=2))
if __name__=='__main__':build()
