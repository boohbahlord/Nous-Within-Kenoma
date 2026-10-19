/* ---------------- v45: nothing in the Ether is free ----------------
   Sales and blessings (a Demon-slayer's Ether sale, Venus, the Oath of the Moon, Jupiter) can make a conjuring cheaper, but
   never cheaper than 1 mana, so nobody can sweep the Ether bare for nothing. */
{const _sc=spellCost;spellCost=function(sp){let c=_sc(sp);if(sp&&sp.school==="Conjuring"&&G&&baseCost(sp)>0)c=Math.max(1,c);return c}}
