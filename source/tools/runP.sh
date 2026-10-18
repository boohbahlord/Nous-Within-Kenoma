cd /tmp/claude-0/-home-claude/0202bf85-1066-5d6a-bb4d-1cf5068a8573/scratchpad
for p in '["firm","yald"]' '["jester","firm"]' '["firm","beginner"]'; do
 timeout 230 node simp.js duel hard,hard 1 "{\"subs\":$p,\"turns\":\"classic\",\"cap\":300,\"ms\":150000}" > "sp_$(echo $p | tr -dc 'a-z_').txt" 2>&1 &
done
timeout 230 node simp.js duel hard,medium 1 '{"subs":["beginner","yald"],"moon":"sun","cap":250,"ms":150000}' > sp_sun.txt 2>&1 &
timeout 230 node simp.js ffa hard,hard,medium 1 '{"subs":["beginner","binah","jester"],"moon":"venus","cap":250,"ms":150000}' > sp_venus.txt 2>&1 &
timeout 230 node simp.js team-same hard,hard,hard,hard 1 '{"subs":["beginner","tiph","angel","beginner"],"teams":[0,0,1,1],"moon":"jupiter","cap":250,"ms":150000}' > sp_jup.txt 2>&1 &
wait
for f in sp_*.txt; do echo "== $f"; grep -v '404\|agent\|connect_rej\|Allowed\|details\|more$' $f | python3 -c "
import json,sys
for line in sys.stdin:
  try: d=json.loads(line)
  except: print(line[:400].rstrip()); continue
  print('stumble',d.get('stumble'),'over',d['over'],'turns',d['turns'],'rounds',d['rounds'],'win',d['win'][:140],'stacks',d['stacks']); print('  ev:', ' | '.join(e[:90] for e in d['ev'][:22]))
"; done
