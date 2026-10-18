CATS = ["Beyond the Kenoma", "The outer darkness and its moats", "Limbo", "The heavens of creation",
        "The Earth", "Rooms, houses and halls", "Visions and other realms"]
E = []
def add(id, name, cat, ch, lead, forms, notes=()):
    E.append(dict(id=id, name=name, cat=cat, ch=ch, lead=lead,
                  forms=[dict(t=t, ch=c, x=x) for t, c, x in forms], notes=list(notes)))

add("full", "The Fullness", "Beyond the Kenoma", "4, 17, 19, 20, 21, 23, 31",
 "Perfect light, and the home the lost once knew.",
 [("Home", "4",
   "The shoreline sermons describe a light that fades at its shore into nothingness, and souls who grow colder “the more it leaves home.” “What ought to be is always being, and of itself is complete light, so those who fall into the deep are not even adjusted to the depths of the ever-death.” If the lost had known the truth, they would know “a place called home.”"),
  ("Above", "17, 19, 20, 21, 23, 31",
   "“The fullness will unleash your own kind upon you” (17). At the portal, “emptiness and fullness meet” (19). Samson stands “before the orders from the fullness”; Antony casts out Satan “by the power of the fullness,” and the judgement on Leviathan is “a command of the fullness above” (20). Leviathan's “only match is the fullness I fell from with purpose” (21). “In nothingness is anything but fullness” (23). Wisdom of Limbo says, “my duty is unto the fullness” (31).")],
 ["Note: the Fullness is pure and perfect, without flaw or suffering, and the nameless one belongs to it. It does not surround the Kenoma; it sits above it as a ball of white light.",
  "Note: unofficially, Sophia comes from the Fullness."])

add("kenoma", "The Kenoma", "Beyond the Kenoma", "17, 20, 21, 23",
 "The emptiness: everything below the Fullness.",
 [("Cold under a blanket of stars", "17",
   "The chapter named for it begins in a bed: you pull the sheets until the walls come down with them, wrap yourself in the ceiling, then in the stars and the dark of the night sky. “Cold, no matter how thick the blanket is. You can't escape the pain. You have to wake up.” Hungry, you eat the stars and their planets, then yourself, and repeat."),
  ("Named", "20, 21, 23",
   "Leviathan roams “the outer darkness of the Kenoma” (20). A truthless saying “echoes throughout the Kenoma” (21). Souls are fed into Leviathan “from a lostness path away, not meant to be found within the Kenoma” (23).")],
 ["The text does not mark where the Kenoma ends."])

add("outer", "The Outer Darkness", "The outer darkness and its moats", "1, 3, 4, 6, 13, 20, 21, 23, 33",
 "Outside creation: Leviathan's realm of nothingness.",
 [("Drunk on poisons", "1, 3, 4, 13",
   "“That outer darkness, drunk on bridling poisons / Torturing who I am with stirnament / Eternal” (1). Quiet doors knock, “hinting of its confinement to the outer darkness, find help” (3). The demons, “these tortured ones rule the outer darkness,” and the Devil God was cast into it (4). Souls are “taken to the outer darkness and punished by vile drunkenness and stupor” (13)."),
  ("Leviathan's realm", "20, 21",
   "After his death, Leviathan rules it, “granting a spiritual prison beyond even the realm of the demiurge”; it “encircles even the heavens and the skies, ensnaring all of creation deeper with newfound evil” (20). “The outer darkness is the bastardization of all living, where they march in confusion that nous-rots with eternal tyranny … a mockery of the demiurge's creation” (21)."),
  ("The playground stairs", "20",
   "Puppets march on “stairs that defy gravity, in every direction, on every axis, in the colors of a children's playground,” leading nowhere but themselves. A light shines through it, “darker than Leviathan's eyes, and it is made of the outer darkness.”"),
  ("The hotel of puppet machines", "23",
   "A vast yellow-lit room with brown walls and carpet where marionettes torment Satan. “Where Satan lies is just one little room of this infinitude hotel of puppet machines. Stairs all leading into each other, always making new stairs, where steps hold rooms inside of rooms.” Time there is counted with the Number, a one followed by ten billion zeros raised to itself again and again, and even that is only a yardstick."),
  ("Inside and outside", "6, 33",
   "“Welcome to this outer darkness from inside the boy” (6). The spirit of life roams “even outside the outer darkness” (33).")],
 ["Note: outside creation, made of the shadow of Leviathan. The puppets and stairs live inside it. The three moats are three of its darknesses."])

add("moat3", "The Third Moat: the Outermost Darkness", "The outer darkness and its moats", "3, 4, 21, 31, 33",
 "The last ring of darkness around creation.",
 [("The shore", "3, 4",
   "“The shore is always stretching, always reaching further into the abyss, into the blindness of the outer darkness. It is eternally void” (4). A voice lies “dead at the bottom of this shore of the abyss, on the cusp of nothingness” (3)."),
  ("The nothingness moat", "21, 31, 33",
   "Leviathan is “given keys of providence in this nothingness moat, which the demiurge will stumble into three times” (21). Wisdom tells Samson his love “could be found within yourself, within the outermost realm of the outer—darkness” (31). Fleeing the spirit, the Yaldabaoth trips “into the outermost moat of the outer darkness” and finds “only the nothingness swallowing his imperfect flame” (33).")],
 ["Note: the third moat, around creation, is the outermost darkness."])

add("moat2", "The Second Moat: the Tar", "The outer darkness and its moats", "36",
 "A black abyss twice as long as the first.",
 [("Where the Sun was lost", "36",
   "Never having seen it, Yaldabaoth wonders how to pass “twice as long as the last.” He tears the Sun from the sky and throws it into “the abyssal moat,” hoping to see. The dark devours the light, the Sun sinks into the black tar, and the quicksand of dark pulls him down after it, face first, “like a child drowning in the pool of oil.” Lucifer lifts him out with a ladder of a word, but “the sun is missing and left behind.”")])

add("titans", "The Titans' Watch", "The outer darkness and its moats", "36",
 "Where the three titans stood.",
 [("Through the first moat", "36",
   "“It is through the first moat that he finds towering titans of eyes,” three of them, covered in seven hundred and seventy-seven eyes, who watch his pride. His shadow swallows them there.")])

add("moat1", "The First Moat: the Scalding River", "The outer darkness and its moats", "21, 33, 36",
 "The river of dying memories.",
 [("The river", "36",
   "“The river of dying memories caustically scalds, splitting the skin into peels of cuticles.” It is “cauldrous with thick tar boils, their substance being the decay of reminiscence.” The demons call it “the burning black sludge liquid of withering remembrance.” Yaldabaoth crosses it on a bridge of his own bound angels."),
  ("By the first moat", "21, 33",
   "Leviathan sweeps down “from the moat of the hell beyond” (21). Saturn is “resonant in sickness by the first moat, and its rings, like the first encircling darkness around creation,” hide on the seventh day (33).")],
 ["Note: Limbo lies between the first moat and creation."])

add("limbo", "Limbo", "Limbo", "3, 18, 26, 30, 31, 33",
 "The realm of neither living nor dead.",
 [("Between", "26, 30",
   "The Fool calls his home “in between the unreal realms of the material and the nothingness … Of spirit beyond!” (26), and “the land of neither dead nor living” (30)."),
  ("Named", "3, 18, 31, 33",
   "“Fading births and fathomless limbo” (3). “Spit revelation's limbo back into the cup of sand” (18). Wisdom is “of the first of third Limbo” (31). The spirit of life roams “outside the limbo” (33).")],
 ["Note: the layers of Limbo lie between the first moat and creation. Their order on the map follows Samson's walk; the text does not say which way is outward."])

add("limbo1", "The Fool's Realm", "Limbo", "26, 35",
 "Green fields under a black sky, and the tree of neither life nor death.",
 [("Tree IV", "26",
   "Short, thick dark-green grass; a path curving left and right from one horizon to its opposite; a blank sky, “no stars, just black,” with no sun or moon. A single long, thick, dry-brown dead tree stands there, the Fool's first tree, “given by God.” Samson enters from the south of route zero and takes the only exit, to the north, after chopping the tree down."),
  ("Painted", "35",
   "Alice Love's painting shows the jester on an old tree, “an endless field of green with a path cutting through it, like the slithering movement of a large snake gone North,” beneath “that most pure black.”")])

add("circus", "The Circus Tent", "Limbo", "30",
 "Beneath a rabbit hole, the Fool's circus.",
 [("Toll of a Tree: Death!", "30",
   "Down a tunnel of roots and dry dirt lies a drooping black, white and red circus tent, lit by swirling lights of every color in fast breaths. Puppets fill tiers of benches; puppet musicians mimic false music while an accordion plays true. The Fool descends on a fish hook. Hearts are thrown, and the goat-headed bull tramples Alice there.")])

add("limbo2", "The Gate of the Black Joker", "Limbo", "29",
 "A pond, a fountain and a guarded gate.",
 [("The arcadium", "29",
   "Past the green flats, rich soil covered in thick bristles, “within the plentiful arcadium.” Lotus flowers drift across a pond with a fountain at its middle; the black sky above is not reflected in the water; a blue and golden glow conjures from the ground in cycles. A tall wooden gate is guarded by the goat-bull devil, its padlock printed “black joker.” From the water Samson pulls a spine that becomes a spear.")])

add("limbo3", "The Graveyard Crossroad", "Limbo", "31",
 "A graveyard of fog, and the tree of both life and death.",
 [("Tree III", "31",
   "Howls whistle through the teeth of skulls; bones tick in walls of bone. Fog lies over grey-purple ground, stones run to a dark blue-purple horizon, and dead trees rot under mycelium. Only the hangman's tree lives: the tree of both life and death, “always withering without loss,” the form of transformation. It is a crossroad of four forms (life, death, both, none) and four ends (eternal life, eternal nothingness, both, none).")])

add("heaven", "The Heaven of the Demiurge", "The heavens of creation", "10, 11, 13, 36",
 "The land of memories.",
 [("Land of memory forms", "10",
   "Antony pulls himself up “into the land of memory forms; a part of this fake heaven,” and stands “in swirls of delusion lands without ground.” The dragged serpent leaves road burns across “the puppet master's home, staining his memories.”"),
  ("Land of memories", "13, 36",
   "God casts his followers “deeper into the land of memories” (13). After the moats, Yaldabaoth swims up through the firmament, “finding his land of memories restful,” breathes out the star Redemption there, and casts Curse out of it (36)."),
  ("An echo", "11",
   "Not named as the heaven: the dark one tells Thomas, “You found yourself in the land of delusion, made of memories forgetting themselves and of themselves.”")],
 ["Note: the heaven is made of memories of itself and lies beyond the stars."])

add("stars", "The Dome of Stars", "The heavens of creation", "10, 17, 18, 22",
 "The star-stricken dome over creation, where the true angels hang.",
 [("The star-stricken dome", "10",
   "“Stars: shining chaos of infinite points, mad with the curse of the prison ruse.” Ancients dance in masks around fires “in the star-stricken dome above,” and angels hang from the stars by the spine. Chapter 10 calls them “the archons' stars”; the text names the archons but says little about who they are."),
  ("A blanket", "17, 18, 22",
   "In chapter 17 you bend the stars down and wrap yourself in them, then eat them. “Swirling star domes wrapping you warmly, cooking you alchemically” (18). The night sewing of clouds whispers numbers felt by ten epinoias (22).")],
 ["Note: the angels hanging from the stars are true angels from the Fullness."])

add("planets", "The Planets", "The heavens of creation", "3, 4, 11, 16, 18, 20, 22, 31, 33, 39",
 "The old spheres around the Earth, with Neptune beyond.",
 [("Saturn", "11, 22, 33",
   "Saturn squares off with Mars and Neptune at Thomas's burial (11), is revealed in conjunction with Jupiter behind the moon (22), and is “resonant in sickness by the first moat,” its rings hidden on the seventh day “as homage, honouring the suffering of its God” (33)."),
  ("Jupiter", "4, 22",
   "“A serpent of a side from Jupiter never ending in light” (4). In conjunction with Saturn, opposite Venus, Mars and the Sun (22)."),
  ("Mars", "16, 20, 22, 31",
   "“The stinging of Mars' eyes” (16); “a now-dead Mars look” (20); “a waking God made of Mars” (31)."),
  ("Venus", "3, 16, 22",
   "“Where Venus begins again” (3); Kether as “a rising morning Venus” (16)."),
  ("Mercury", "18",
   "“The soul speaks like Mercury of the skies and alchemy.”"),
  ("Neptune", "11, 18, 39",
   "“A dissolve of Neptune's conjunction” (18); “sapphiric neptune haze” in the sky of two suns (39).")],
 ["Note: Neptune is placed beyond Saturn."])

add("sun", "The Sun", "The heavens of creation", "11, 22, 36",
 "The first Sun, lost, and the second Sun.",
 [("The first Sun", "36",
   "Torn out of the sky by Yaldabaoth, it scorches his claws and begs, “My will is to be let free!” then yields. It sinks into the tar of the second moat and stays there."),
  ("The second Sun", "36",
   "Yaldabaoth swims through the dark night sky “and he spits out a new sun, the second Sun of creation, looking just the same as before.”"),
  ("Shot down", "11, 22",
   "In Thomas's storm, the sun falls “shot down by an Archon's fired betrayal” (11). Opposed to Saturn and Jupiter (22).")])

add("moon", "The Moon", "The heavens of creation", "2, 17, 18, 19, 22, 36",
 "A stepping stool for the weaver, and a perch for a snake.",
 [("The weaver's moon", "19, 36",
   "The moon is a stepping stool for the shadow woman who weaves clouds with crab claws (19). Words are sewn from it into Yaldabaoth's sanity, “and the Moon says the same” (36)."),
  ("The snake's moon", "17, 18",
   "“Your snake son of moon” (17). “Leviathan as Snake on the moon,” constricting a shadow above the desert (18)."),
  ("Knocked from the sky", "22",
   "Leviathan knocks the full moon out of the sky, revealing Saturn and Jupiter behind it."),
  ("Crescent", "2, 19",
   "“Under a dark crescent” (2). A thin daylight crescent hangs over the tree of death (19).")])

add("earth", "The Earth", "The Earth", "1, 4, 13, 16, 36",
 "The material plane: the dead home.",
 [("The dead home", "1, 4, 13",
   "“You're in a dead home, a dead curtain, go back” (1). The Devil God's dying memory “spews forth corruption onto the material plane you have left, this being his creation … your dream, your dead home” (4). A raging God covers the lands “into sickening rot of material bondage” (13)."),
  ("The island", "16",
   "The Euclids live on an island: the South mountains of Binah and the stony North mountains of Tiphareth."),
  ("Cast down", "36",
   "Curse falls into “the dirt of humankind” like a meteor, and Lucifer and Ouroboros are cast down into the Earth together.")],
 ["Note: a plane of existence, not necessarily a sphere, with the planets and the Sun around it as in old cosmology."])

add("tartarus", "Tartarus", "The Earth", "19, 20",
 "A prison in the ocean.",
 [("A nightmare within nightmares", "19, 20",
   "Antony is “the only angel to have been there and come back,” and calls it “a nightmare within nightmares, though dreadfully aware, even inside it, of its foreboding falsehood” (19). Leviathan “held the keys to his Tartarus prison” (20), and “Tartarus will celebrate this castration of the dark oceans” (19).")],
 ["Note: placed in the ocean."])

add("ocean", "Leviathan's Ocean and the North Shore", "The Earth", "10, 19, 20",
 "The sea that held the serpent.",
 [("The ocean", "10, 19",
   "Antony's head falls “into a booming splash … into the abyss of Leviathan's ocean” (10). “From the oceans they pulled another, this one missing its wings” (19)."),
  ("The north shore", "20",
   "A cliff's edge above clouded oceans and a shore of sand. The sea spins into a whirlpool as the serpent rises; the battle ends with Samson's armor ploughed into the wet sand and the ocean “a floor of red and black.”")])

add("cave", "The Cave of Forgotten Machines", "The Earth", "19",
 "Where Samson's new heart was made.",
 [("The hoard", "19",
   "Behind gates in the Southern mountains, a black cave lit only by goggle lamps: brass gyroscopes gone green, a dusty tube-screen, a horned phonograph, bent antennas, a cracked orrery, a hundred disagreeing clocks, and crystal lodges “waiting like cups for a drink.” On a stone slab hollowed by the weight of others, the Euclids cut out Samson's heart and set Antony in its place.")])

add("mountain", "The Mountain and the Portal", "The Earth", "19",
 "A tree of death on a cliff, and a portal of dark flame.",
 [("The crimson shroud", "19",
   "Climbing by day, Samson and Antony find “a crimson shroud … beneath a tree of death, standing like a tombstone that blotted out the sun.” Its dark flame bursts into a portal that comes “once in twenty years,” and a wind nearly throws Samson from the cliff. Through it, “emptiness and fullness meet,” and he stands under a tree of life glowing like the sun.")])

add("trees", "The Four Trees", "Visions and other realms", "19, 22, 26, 31, 32, 33",
 "The trees of the four chapters titled Tree.",
 [("Tree IV: Neither Life or Death", "26, 30",
   "The Fool's single tree in the green realm; cut down by Samson. Its fall brings “the curse of the joker” (31)."),
  ("Tree III: Both Life and Death", "31",
   "The hangman's tree in the graveyard, “always withering without loss,” the form of transformation."),
  ("Tree II: Death", "19, 22, 32",
   "A tree of death under a crimson shroud on the mountain (19). In Kether's hallway, when Satan hangs from the tree, “the tree is no longer life, but death” (22). Chapter 32 bears its name."),
  ("Tree I: Life", "19, 22, 33",
   "Through the portal, “a tree emanating life like a fountain, glowing like the sun from its heart” (19). A tree grows violently at the end of Kether's hallway, and Antony wrestles Satan “under the tree of life” (22). Chapter 33 bears its name.")],
 ["Note: Trees I and II are seen in implied spiritual form in 19 and 22."])

add("chamber", "The Stone Chamber", "Rooms, houses and halls", "5, 32, 34, 37",
 "The room of the raised stone, the crucifix and the maiden.",
 [("The angel's room", "5",
   "A stone-raised slope with tubes and needles; Antony on a wall crucifix of wires and pumps, blue sparks from the ceiling; and in the corner “the jugged stone maiden of wires, needles, and a mask connected to the large gas tank beside it: the blindfold.”"),
  ("Return", "32, 34",
   "Kether lies on “the bed of raised stone” full of needles (32). The man wakes on the cold floor before the raised stone, the pumps and the blindfold; lights flicker and old wires spark (34)."),
  ("The corridors", "37",
   "Large square corridors, almost bare, wires spraying blue and yellow sparks across stone architecture, the air sweet with gas. Alice opens the maiden in the corner and pulls Christopher out.")])

add("yellow", "The Yellow Room and the Brown Carpet", "Rooms, houses and halls", "7, 8, 14, 20, 23, 25, 27, 28, 42",
 "A yellow light on brown carpet that keeps returning.",
 [("The carpet", "7, 8, 14",
   "“There is a soft yellow glow from the closet” (7). “Beneath soft, sick-hued yellows out from lamp shade reminders across brown carpet” (8). The Hermit dies “in the corner of a small room on brown carpet, yellow-hued familiarly, like a million times in a million times familiar” (14)."),
  ("The hallway", "20, 25, 27, 28",
   "Samson sees “a hallway, yellow, with brown carpet” in his cracked visor (20). Lucifer's voice comes “down a narrow hallway, yellow with forgotten memories” (25). Blows beat “across a yellow lit hallway” (27). “The darkness broken by the yellow from the hall” (28)."),
  ("In the outer darkness", "23",
   "Satan's room: “the bright yellow and the brown walls of a room vast,” brown carpet fibers, “a lampshade-yellow with brown carpet.”"),
  ("The trailer", "42",
   "Damon finds “the hue of the yellow bathroom light terrifyingly familiar,” beside brown wallpaper that imitates wood grain.")])

add("kether-hall", "Kether's Hall", "Rooms, houses and halls", "16, 22",
 "The throne hall and the crimson hallway.",
 [("The throne", "16",
   "People of every kind are chained in bondage in the hall before his throne, “used as symbolic decorations.”"),
  ("The crimson hallway", "22",
   "Behind a tall wooden door, Antony hangs from a wall crucifix. Outside it, the hall turns crimson under a full moon, shadows rise on the walls, a tree bursts up, and Antony fights Satan. At sunrise the window is shattered and the tree is gone.")])

add("towers", "The Monolith Towers", "Rooms, houses and halls", "7",
 "Towers risen from no ground.",
 [("Rebirth", "7",
   "“Our monolith towers we are trapped inside of have always been risen from no ground,” filled “with wires and runes,” with little cubicle shelters watched by wired angels, smog between towering skylines, and rain forever.")])

add("stonehouse", "The House of the Rabbit Mask", "Rooms, houses and halls", "6",
 "Stone tiles, wasps' nests and a thorned window.",
 [("As Snakes See", "6",
   "Stone tiles and stone ceiling; nests and wasps hugging the ceiling and walls; a window where thunder spills in, and at dawn branches with thorned stipes climbing over the glass.")])

add("thomashouse", "Thomas's House and the Red House", "Rooms, houses and halls", "11",
 "A porch in the rain, and a red house that wasn't there.",
 [("The house", "11",
   "A stone porch over hills and rain, a mellotron record, and a warm room with a coffee table of silk covers, dice, rune books and the two dolls."),
  ("The red house", "11",
   "A small red house that wasn't there, toy-sculpted, plastic and glossy, between two trees with broken bicycles. Inside, a carpetless hallway, a picture of Noidy, no doors, and a descent into a box of mirrors where Thomas loses his body.")])

add("room9", "The Abandoned Room and the Hoard", "Rooms, houses and halls", "9, 34",
 "Rooms with a pink television.",
 [("Good Puppet", "9",
   "An abandoned room with a small window and a carpetless floor, which “looks like thirty years old, like me. My mom used to own this place.” A pink television, a counter, a ringing phone."),
  ("Thistle Rope", "34",
   "A room of hoarded piles, “four walls of childhood memories replaying,” a chandelier that is “more like a ceiling fan,” a folding chair, a fallen mirror, and a pink television on a dresser.")])

add("alice-room", "Alice's Bedroom", "Rooms, houses and halls", "24, 30",
 "A second-story room of paintings.",
 [("Hexahedone", "24",
   "“The second story as high as the fourth,” a window over a flickering street light and tall trees, her bed beside it, a ceiling fan, and her cubed paintings of marionettes and angels on the walls."),
  ("Found", "30",
   "She is found dead “in a room with shut blinds on the morning of inspections.”")])

add("store", "The Antique Store", "Rooms, houses and halls", "35",
 "A maze of trinkets in the rain.",
 [("Store", "35",
   "Gold-like trinkets, paintings leaning on shelves, velvet-like wine carpets, a miniature train, cups of pearls and marbles, toy soldiers, a mannequin in a sapphire hat, and a smell of library, lacquer and coins. In one corner, dolls sit over an old piano beneath the jester painting, by a window of rain.")])

add("trailer", "Damon's Trailer", "Rooms, houses and halls", "42",
 "A trailer of wires, pills and a bathroom.",
 [("Pills", "42",
   "Damon's room is cluttered with wires and objects, with a sleeping bag and a blue curtain. The hallway has brown wood-grain wallpaper; his brother's room holds a safe; the bathroom has a hanging door, a missing hot-water knob, and a piss-soaked rug on a carpetless floor.")])

add("bathroom", "The Bathroom of the Empty Cradle", "Rooms, houses and halls", "28",
 "Red and blue lights through the blinds.",
 [("Dead Baby", "28",
   "Blue and red lights square through the blinds onto the wall; sirens; a tile floor; the yellow of the hall breaking through the door; stars beginning to shine from the textured white ceiling.")])

add("clownroom", "The Clowns' Room", "Visions and other realms", "38",
 "A box, a stretcher and a papyrus edge.",
 [("Joy & Pleasure", "38",
   "A ride inside a box with clowns, and a room where the man lies bound by wires and leather cuffs under small surgical blades, until the clowns point to “the edge of a papyrus they were all written into.”")])

add("desert", "The Desert of the Rite", "Visions and other realms", "18",
 "A cold new-moon desert.",
 [("Kether: Meat Ends of Three Snakes", "18",
   "Mining-town tropical nights with desert signs, abandoned basements, then a desert of sand-smog under a cold new-moon night, symbols across the ground, and a cup scooped in the sand that catches tears and spit.")])

add("godmachine", "The God Machine", "Visions and other realms", "37",
 "A fractal of every eternity.",
 [("YHWH; 25291791441265", "37",
   "Reflections in every direction, “more precise than atoms,” though there are no mirrors, only patterns. “The ineffable God Machine is stretching every which way, almost like an unfolding synesthesia.” Each fractal houses every cycle of God's existence with creation, and deep inside it the narrator finds a body, and is pulled into it in the stone corridors.")])

add("twosuns", "The Land of Two Suns", "Visions and other realms", "39",
 "Mountains, a crystal shore and two setting suns.",
 [("Chalice of Tears", "39",
   "Two suns rise, one red and one blue, over tall rolling mountains; the sky mixes purple, velvet, indigo, scarlet and “sapphiric neptune haze.” At the other pole a shore crystallizes with refractions. Between them, Red and Blue meet at dusk.")])

add("tiles", "The Black-and-White Tiles", "Visions and other realms", "41",
 "A world of squares, a bridge-door and words.",
 [("Words for Reading", "41",
   "A purple blob stretches over black-and-white tiles toward the other side; a door becomes a bridge, cheered by jester machines in orange and blue with little flutes; beyond it are five squares and an awfully long hallway, until the words themselves begin reading.")])
