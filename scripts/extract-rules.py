import ast,json,pathlib,sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/netskrafl-reference')
lang=ast.parse((root/'src/languages.py').read_text()); rules={}
for node in lang.body:
 if isinstance(node,ast.ClassDef) and node.name=='NewTileSet':
  for a in node.body:
   if isinstance(a,ast.Assign) and a.targets[0].id in ['scores','bag_tiles']:
    rules[a.targets[0].id]=ast.literal_eval(a.value)
mech=ast.parse((root/'src/skraflmechanics.py').read_text())
for a in mech.body:
 if isinstance(a,ast.AnnAssign) and a.target.id in ['_WSC','_LSC']:rules[a.target.id]=ast.literal_eval(a.value)['standard']
rules['scores']={k.upper():v for k,v in rules['scores'].items()};rules['counts']={k.upper():v for k,v in rules.pop('bag_tiles')}
out=pathlib.Path(__file__).resolve().parent.parent/'src/rules.js';out.write_text('export const RULES = '+json.dumps(rules,ensure_ascii=False)+';\n')
