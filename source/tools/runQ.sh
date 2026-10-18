cd /tmp/claude-0/-home-claude/0202bf85-1066-5d6a-bb4d-1cf5068a8573/scratchpad
timeout 230 node simp.js duel hard,hard 1 '{"subs":["beginner","tiph"],"moon":"sun","cap":250,"ms":150000}' > sq_sun.txt 2>&1 &
timeout 230 node simp.js duel hard,hard 1 '{"subs":["beginner","jester"],"cap":250,"ms":150000}' > sq_moon.txt 2>&1 &
timeout 230 node simp.js duel hard,hard 1 '{"subs":["beginner","tiph"],"moon":"saturn","cap":250,"ms":150000}' > sq_sat.txt 2>&1 &
timeout 230 node simp.js team-same hard,hard,hard,hard 1 '{"subs":["beginner","tiph","angel","beginner"],"teams":[0,0,1,1],"moon":"saturn","eclipseStart":true,"cap":250,"ms":150000}' > sq_satecl.txt 2>&1 &
timeout 230 node simp.js ffa hard,hard,medium 1 '{"subs":["beginner","binah","jester"],"moon":"venus","eclipseStart":true,"cap":250,"ms":150000}' > sq_ven.txt 2>&1 &
wait
for f in sq_*.txt; do echo "== $f"; grep -o '"stumble":\[[^]]*\],"over":[a-z]*' $f | head -2; grep -i 'error\|TypeError\|Reference' $f | head -5; done
