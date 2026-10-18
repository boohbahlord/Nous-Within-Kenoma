cd /tmp/claude-0/-home-claude/0202bf85-1066-5d6a-bb4d-1cf5068a8573/scratchpad
timeout 280 node simp.js ffa hard,easy,medium 1 '{"subs":["beginner","tiph","jester"],"moon":"mercury","cap":300,"ms":200000}' > sr_merc.txt 2>&1 &
timeout 280 node simp.js duel easy,easy 1 '{"subs":["beginner","jester"],"moon":"mercury","bankStart":true,"cap":300,"ms":200000}' > sr_merc2.txt 2>&1 &
timeout 280 node simp.js duel hard,medium 1 '{"subs":["binah","beginner"],"moon":"venus","cap":300,"ms":200000}' > sr_ven.txt 2>&1 &
timeout 280 node simp.js ffa hard,hard,hard 1 '{"subs":["beginner","tiph","angel"],"cap":300,"ms":200000}' > sr_moon.txt 2>&1 &
timeout 280 node simp.js duel hard,hard 1 '{"subs":["beginner","tiph"],"pshop":false,"cap":200,"ms":150000}' > sr_off.txt 2>&1 &
wait
for f in sr_*.txt; do echo "== $f"; cat $f | cut -c1-1800; done
