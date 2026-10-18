# Codex of Beings data. Each entry: id, name, cat, ch, lead, forms [(title, ch, text)], notes [..]
CATS = ["Beyond the Kenoma", "Powers and fates", "The demiurge", "Serpents and demons", "Angels",
        "Puppets, dolls and shadows", "Limbo", "Souls and wanderers", "Figures of single stories"]
E = []
def add(id, name, cat, ch, lead, forms, notes=()):
    E.append(dict(id=id, name=name, cat=cat, ch=ch, lead=lead,
                  forms=[dict(t=t, ch=c, x=x) for t, c, x in forms], notes=list(notes)))

add("nameless", "The Nameless One", "Beyond the Kenoma", "4, 16",
 "The pure source that the demiurge imitates, never given a name.",
 [("In the sermons", "4",
   "The snake's sermons in chapter 4 speak of lost souls “further losing their name of the nameless one; from them pours itself, of itself.” When the demiurge calls himself “the first and only God,” the sermon calls it “a blasphemy against the nameless purity and its indescribable holiness.” Of the place the lost came from it says, “What ought to be is always being, and of itself is complete light.”"),
  ("Among the Euclids", "16",
   "The Euclids argue over it. The Northern tribe does not see “an absolute nameless simplicity as emanator,” believing instead in an infinite one that only a few may unlock. All the Euclids acknowledge the demiurge; they differ “in the manner and kind of essence of the nameless one, and in solution.”")],
 ["Note: the nameless one belongs to the Fullness, and is what the demiurge imitates."])

add("sophia", "Sophia", "Beyond the Kenoma", "4, 17, 31",
 "Mother of Yaldabaoth and the form of Wisdom.",
 [("The mistake", "4, 17",
   "Chapter 17 ends by naming the demiurge outright: “Yaldabaoth: the ideal of imperfection, you were only ever a mother's mistake, Sophia's mistake; without father.” The sermons of chapter 4 say the Devil God “was cast into the outer darkness, of a Mother's mistake, unwanted and deformed; he could barely even remember.”"),
  ("Wisdom of all", "31",
   "When Samson asks the hanging shadow who Wisdom of all is, Wisdom of Limbo answers: “Sophia is the mother of the devil-God Yaldabaoth, and she is the one who is the form of Wisdom.” He adds that Samson is closer to life in asking it.")],
 ["Note: unofficially, Sophia comes from the Fullness."])

add("spirit", "The Spirit of Life", "Powers and fates", "33",
 "A bright spirit that roams outside every realm, even the outer darkness.",
 [("Tree I: Life", "33",
   "The spirit roams free, outside Limbo, the material world, the stars and planets, and even outside the outer darkness. It shines in the darkness, “seeing the truth of the realms,” and swims up through the abyss to a place above all of it, wanting to be heard: “We are the same!” Its next saying, “Either sleeping or waking, come to life and see,” shakes every world. Snakes hide beneath rocks, the Leviathan shudders, and the Yaldabaoth runs from it and trips into the outermost moat. Unable to become full without love, the spirit descends again toward the knocks and whispers it has heard: “Life returns to the dead home, searching for the sleeper caught in between.”")])

add("koah", "Kōaḥ", "Powers and fates", "2, 4, 18, 19",
 "The soothsaying voice of dice and numbers.",
 [("Ten: I", "2",
   "The second chapter carries the name kōaḥ and is signed with it. It is a voice of dice, numbers and flames: “Follow me tonight, listen to me,” “Shake dice below the lapping flames of my hunger,” “Twenty-eight rolls the dice,” and at the end, “I'll be there waiting.”"),
  ("The passage", "4",
   "At the end of the shoreline sermons the speaker says, “We no longer need journey through the carrion passing of Kōaḥ's passage.”"),
  ("The magician", "18",
   "At the desert rite, a long speech of numbers (the thirteenth age of twelve, the sixteenth bondage, “six-sixes reversing”) is “shown in the soul, by the form of the magician, kōaḥ.” Later in the same chapter the soothsaying of kōaḥ is listed among all that speaks to the boy."),
  ("The pleasure", "19",
   "Under the tree of life, a voice from the night tells Samson that his battle is “foretold in my soothsayings” and that “it is the pleasure of kōaḥ that you kill the Leviathan.”")],
 ["Note: clarity as madness."])

add("crab", "The Woman with Crab Claws", "Powers and fates", "19, 20, 36",
 "A woman of shadow who stands on the moon and weaves.",
 [("On the moon", "19",
   "Past the portal, the moon serves as a stepping stool for a woman's shadow, “who weaves fabrics out of the clouds as creation; her weaving is with claws of a crab on a human shape.” The tree sews its heart into the fabric of the clouds, and she speaks last: Leviathan's corpse will litter the heavens, “and Tartarus will celebrate this castration of the dark oceans, which frees both Adam and Eve from the past.”"),
  ("Breath over the shore", "20",
   "Before the battle, “the pneuma of the shadowy woman with claws of a crab from the moon blows, her voice heard in the soul by those who can hear, a breath without a mouth,” and the sea begins to turn."),
  ("Sewing words", "36",
   "Words are sewn from the moon “by a woman of shadow with crabs claws, her fabric woven into the ground of the heavens,” and the memories speak into Yaldabaoth's sanity: “You and your false angels are as pawns, your will unto these two you bless is against your own.”")],
 ["Echoes, not named as her: “she sews the words of fate into being” (13); “sewn by the fullness from the moon” (17); “the night sewing of clouds” (22)."])

add("archons", "The Archons", "Powers and fates", "10, 11, 13, 18",
 "Rulers of the stars of the material heaven.",
 [("The stars", "10",
   "The true angels hang by the spine from “the archons' stars.” When Antony climbs among them, “they do not attempt to bind him; not even one dares.” After his wound, the archons question the place of the demiurge, confused."),
  ("Betrayal and cells", "11, 13",
   "In Thomas's storm the sun falls from the sky, “shot down by an Archon's fired betrayal” (11). The angry God brings hearts “into confines of the Archonic cell plans” (13)."),
  ("At the rite", "18",
   "“The archons glow in the night in solidarity,” and the archons “of the glowing throughout the cloud-covered desert night” are among all that speaks to the boy.")])

add("titans", "The Three Titans", "Powers and fates", "36",
 "Watchers of the first moat, covered in eyes.",
 [("The watch", "36",
   "Through the first moat Yaldabaoth finds towering titans with eyes between every slit of muscle fiber: three of them, twelve times taller than himself, each covered in seven hundred and seventy-seven eyes. Their purpose, says the one on the right, is “To see it through.” The center one judges: “We watch your pride unfold from your impurity for thirteen infinitudes.” The leftmost adds that his third mistake will be his last, every time. Yaldabaoth grows over them, and his shadow swallows them whole, their souls consumed. Later, sinking in the tar, he finds that not even the titans can save him, “for he swallowed their souls.”")])

add("yalda", "Yaldabaoth", "The demiurge", "4, 10, 13, 17, 18, 21, 25, 31, 33, 36",
 "The lion-headed serpent creator: the demiurge, the Devil God, the False-God.",
 [("The Devil God of the dead home", "4, 13, 17",
   "The sermons of chapter 4 say he was cast into the outer darkness, “of a Mother's mistake, unwanted and deformed.” His dying memory spews corruption onto the material plane, “this being his creation.” He calls himself the first and only God, and “this Demon God has fashioned your dream, your dead home.” Chapter 13 speaks of a raging God and hateful father who traps nameless souls in a tangled world, and of “the curseful chains from the demiurge,” “called devil-god by some.” Chapter 17 speaks to him directly: he eats the stars and himself, vomits and eats his vomit again, and fashions “a dead home made of dead memories,” until it names him: “Yaldabaoth: the ideal of imperfection.”"),
  ("In his heaven", "10",
   "Antony reaches “the gates of the Devil-God” and calls him “Demiurge of sixteen lies.” The demiurge flees on his slithering tail and is dragged back by it; his lion head shows as he hisses “like a child caught wrong.” Antony's spear splits the end of his tongue, “where serpents will be cursed with the opened front half of this mouth muscle.” He hides in shame in his own coils while “another below the demiurge,” Satan, attacks the angel."),
  ("At the rite", "18",
   "“Drop the seed, plant the seed of Antichrist,” speaks the demiurge, listed among the voices as “the Demiurge as a Devil-God serpent creator.”"),
  ("Poured and betrayed", "21, 25, 31",
   "Leviathan pours out the demiurge and Ouroboros “as clay cups,” and the demiurge “will stumble into three times” the nothingness moat before surrendering (21). The good puppet announces, “Yaldabaoth is betrayed” (25). Wisdom of Limbo calls him “the devil-God Yaldabaoth,” Sophia's son (31)."),
  ("Fleeing life", "33",
   "At the spirit's saying, the Yaldabaoth runs, “trying to find life in their ignorance,” trips into the outermost moat, and finds no life there to consume, “only the nothingness swallowing his imperfect flame.” Saturn's rings hide on the seventh day in homage to “the suffering of its God.”"),
  ("Crossing the moats", "36",
   "Advised by 361 demons, he bridges the scalding river with his own angels, swallows the souls of the titans, tears the Sun from the sky and loses it in the tar, and nearly drowns. Lucifer, as a flying angel doll, pulls him out with a ladder made of a word in exchange for a realm of his own. Home again, he spits out a second Sun, breathes out the star Redemption, casts Curse down, and at last curses Lucifer and Ouroboros: “You and your brother are delusion kind.”")])

add("leviathan", "Leviathan", "Serpents and demons", "1, 4, 6, 10, 18, 19, 20, 21, 22, 23, 33, 36",
 "The serpent of the sea who became the nothingness of the outer darkness.",
 [("The voice of the dead home", "1",
   "“The leviathan told me, ‘I need something made of you.’” The voice is pulled into a blackened heat and fed ignorance."),
  ("The sea serpent", "10, 19, 20",
   "Antony's head sinks “into the abyss of Leviathan's ocean” (10). The voice under the tree of life calls for Leviathan's death so that “his soul will be cast into the outer darkness, a new home for the beast” (19). At the north shore he rises out of a whirlpool, hissing in “a choir of dying engines,” his teeth taller than any structure. His form is “the prime evil form of empty darkness, bondage, hell, exile, and chaos”; his temperament is cold and dry. Samson cuts and shoots him; Antony's lightning splits his tongue down to the throat, strikes him one hundred and fifty-seven times, and drives a length of his own spine into his eye (20)."),
  ("Snake on the moon", "18",
   "At the desert rite, “Leviathan slips something into the drink of sand; memories of memories,” “constricting a shadow on the moon above.” The rite names “Leviathan as Snake on the moon.”"),
  ("The nothingness", "20, 21, 23",
   "After his death he roams “the outer darkness of the Kenoma,” a prison worse than the demiurge's bondage that “encircles even the heavens and the skies” (20). He pours out the demiurge and Ouroboros like clay cups and is given “keys of providence in this nothingness moat.” He whispers into the ears of Kether and Satan: “I am the nothingness you can never hear and have never heard … my only match is the fullness I fell from with purpose” (21). He holds Satan and every soul in their toys: “You will know nothing” (23)."),
  ("In Kether's hallway", "22",
   "Kether's chest opens with teeth like Leviathan's, and Lucifer squeezes the heart “between the mouth of Leviathan.” Antony's lightning explodes Leviathan's throat. At the end, “the moon is knocked out of the sky by Leviathan.”"),
  ("Elsewhere", "4, 6, 33, 36",
   "“I see past the Leviathan” (4). The rabbit-masked father is caught “in leviathan's choke-fingered grip” (6). The Leviathan shudders at the spirit of life (33). Yaldabaoth boasts, “I fashioned the Leviathan” (36).")],
 ["Note: the outer darkness is made of the shadow of Leviathan."])

add("ouroboros", "Ouroboros", "Serpents and demons", "4, 6, 18, 21, 22, 23, 25, 36, 38, 41",
 "The serpent that consumes itself; Lucifer's brother.",
 [("The self-eater", "18, 21",
   "At the rite, “the Ouroboros slither who consumes themselves endlessly” speaks by way of gut movements: “Return to your folly here again and consume; it is your vomit and tail of your soul's future and end together. You will never begin but always end” (18). Poured out by Leviathan, “Ouroboros consumes only itself, a chaos journey inward, likened unto the demiurge's creation” (21)."),
  ("The dream", "4, 22, 23",
   "“Now I am freed of an anaconda's ouroboros dream, the nothingness of a black serpent” (4). Kether's dreams reach “the dreamscape of the ouroboros” (22). The stairs of the outer darkness mock “the dreams of ouroboros” (23)."),
  ("The fangs", "6",
   "The rabbit-masked father is struck by “the spring fangs of ouroboros.”"),
  ("The copy", "25",
   "The one who stomps his copy says, “The himself who stomps on his tail by teeth is repeating itself,” and Lucifer tells the copy, “I hate you, ouroboros.”"),
  ("The brother", "36, 38, 41",
   "Lucifer's logic is to be written “with the ink of the snake's fang, from your brother Ouroboros.” Cursed as “delusion kind,” the brothers are cast down, and Lucifer swallows Ouroboros to protect him from the fall (36). On the clowns' stretcher he lies paralyzed until he laughs, “I hate God!” and “I fucking hate you, Lucifer!” (38). Lucifer feeds him the world that fell out of his head: “Oh, yeah, I am just an analogy being read” (41).")],
 ["Note: the chaos of nous, introverted."])

add("lucifer", "Lucifer", "Serpents and demons", "6, 14, 16, 18, 21, 22, 25, 34, 36, 38, 41",
 "A brother and a deceiver, who takes many forms.",
 [("The brother", "14",
   "In the Hermit's vision a teary brother approaches: “I love you, brother.” The brothers hold each other, “Lucifer forgiven forever—” and the vision breaks. Lucifer is then sitting on the Hermit's heart, yelling, “Repeating! Repeating!” and at the end whispers, “You are God; there is nothing else.”"),
  ("Of lies, in the heart", "6, 16, 18, 21",
   "A grip is “familiar to the Lucifer” (6). Kether's pride “puts Lucifer himself to shame” (16). At the rite, “speaks the Lucifer, who holds his heart with déjà vu weight”: “Spit the burning flashes of your sixteen; you will culminate in a new form of pride.” He is “the Lucifer of lies in his heart” (18). “The image of Lucifer in the fluid reflection” (21)."),
  ("Holding the heart", "22, 25",
   "In Kether's chest, Lucifer squeezes the heart with madness until threads undo his claws and arm like fabric (22). “Lucifer is holding your heart from within”; he tells the good puppet, “You are God” (25)."),
  ("The man in the hoard", "34",
   "“Hey, Lucifer!” A man buried in his hoard stops when he hears his name, “unfamiliar now.”"),
  ("The angel doll with bleeding eyes", "36",
   "“One does come by, the flying doll in the form of an angel, its eyes bleeding out of its tear ducts.” Lucifer answers in his new form, “For what price?” and lifts Yaldabaoth out of the tar with a ladder made of the word “Ladder.” He is promised words written into worlds and an apocryphon, then cursed and cast down with Ouroboros, whom he swallows."),
  ("The clown", "38",
   "One perverted clown kisses and licks the paralyzed man, then says, “Imagine this is a joke. Wouldn't that be funny, Ouroboros?” Lucifer laughs with his brother, “I hate you too, brother!” and learns from another clown that they are only words on a papyrus."),
  ("The writer's voice", "41",
   "“Lucifer has me write this to say his voice”: “Why would I eat my words, then? I think you took too much Ouroboros.”")],
 ["Note: delusion and pride; extroverted psychosis.",
  "Note: Lucifer is the Antichrist when in the form of the angel doll with the bleeding eyes.",
  "Lucifer and Satan are different beings."])

add("satan", "Satan", "Serpents and demons", "6, 10, 18, 20, 21, 22, 23, 29, 41",
 "A violent demon, possessor and prisoner.",
 [("Below the demiurge", "10",
   "“Another below the demiurge nearby draws in, and his name is Satan.” He tackles Antony out of the delusion lands, screams “I am promise of violence!”, tears off his wings and his head: “Nothing ever was, Antony.”"),
  ("The possessor", "6, 18, 20",
   "“This is wrestling with Satan” (6). The boy at the rite is Christopher, “his soul possessing his soul named Satan” (18). On the shore, Samson sees a yellow hallway and kicks at teeth that grab: “A feral brother possesses him. Satan.” Antony casts out “familiar Satan by the power of the fullness” (20)."),
  ("The whisperer", "21, 22",
   "Leviathan whispers into his ear (21). He whispers to Kether, “This is all there is,” and Antony wrestles him under the tree of life and hangs him from it by two spines (22)."),
  ("The prisoner", "23",
   "In the outer darkness the marionettes force him to eat his own rotted teeth while the boy in overalls holds his mouth open. He watches himself die through a puppet's pupil, cannot leave, and learns he has been held there for a span beyond counting: “You will know nothing.”"),
  ("Elsewhere", "29, 41",
   "The goat-bull has “claws of hand like Satan” (29). “Didn't we one time write about Satan doing the same with his teeth?” (41).")],
 ["Lucifer and Satan are different beings."])

add("anti", "The Antichrist", "Serpents and demons", "7, 18, 28, 30, 34, 36",
 "A promise spoken over souls, and a baby angel doll that weeps blood.",
 [("The promise", "7, 18",
   "“A snake whisper crawled legless across my hospital bed and next to the ear, where the slithering tongue promised me as antichrist” (7). At the rite: “Drop the seed, plant the seed of Antichrist,” speaks the demiurge (18)."),
  ("The baby angel doll", "28, 30, 34",
   "Spirits tell a mother “the Antichrist's soul is condemned in the floorboards now,” and she says, “I become the Antichrist by doing this.” A porcelain baby hangs by a single string, dressed in white wings, crying “bloody lamb tears” (28). A baby doll with angel wings, crying blood, unrolls the circus banner “Toll of a Tree: Death!” (30). A baby doll in angel wings hangs from the ceiling bleeding tears over a scroll that reads “I am the Antichrist” (34)."),
  ("Lucifer's new form", "36",
   "The flying doll in the form of an angel, its eyes bleeding, is Lucifer “in his new form.”")],
 ["Note: Lucifer is the Antichrist when in the form of the angel doll with the bleeding eyes."])

add("demons", "Demons", "Serpents and demons", "4, 6, 10, 33, 36",
 "Souls grown sick in their lostness.",
 [("The sick", "4",
   "“Sons and daughters of our family tree blindly spill forth their emptying seeds, growing lostness; some become deeply sick therein, and these are the demons.” Some serve Demon Fathers and Mothers, some pleasure, some pride, and some hatred and blasphemy. “These tortured ones rule the outer darkness, of which is your Devil God.”"),
  ("Possessors", "6, 10",
   "“This demon knew the suffering from God's hatred unto themselves, having lived it forever” (6). Under the stars, “the demons possess and stoke the burning joy of human cackles,” and demonic spirits hold the calves of the restless angel (10)."),
  ("Council and infestation", "33, 36",
   "“Many demons search for life, but their idea of it is blind” (33). “Whispering councils of three hundred and sixty-one demons” tell the demiurge to bridge the river; later he cries, “The demons have infested our home!” (36).")])

add("goatbull", "The Goat-Bull Devil", "Serpents and demons", "29, 30",
 "Guardian of the gate of the black joker.",
 [("At the gate", "29",
   "Over seven feet tall, hooved, with horns like a goat, claws like Satan, black wings at rest, piercings, and the head of a strong bull. It beats Samson beside the pond and stamps on his chest until Samson pulls a spine from the water, spits blood on it, and drives it through the beast's sternum."),
  ("Remembered", "30",
   "The Fool tells Alice, “He killed my devil friend at the gate as well!”")],
 ["Note: a guardian demon."])

add("bull", "The Bull with a Goat's Head", "Serpents and demons", "30",
 "The beast of the Fool's circus.",
 [("In the tent", "30",
   "Walking on all fours, held by eight small boy puppets on sixteen ropes, it smells of wet fur. Riled by the pelting, it breaks loose, flings the dolls into the air, and tramples Alice.")])

add("antony", "Antony", "Angels", "5, 10, 19, 20, 22, 23, 32, 33, 34, 37",
 "Guardian angel: a restless angel, a machine, a heart and a judge.",
 [("The angel machine", "5, 32, 34",
   "An angel “looks down from its porcelain-cracked white smile mask,” hanging from the wires and pumps of a wall crucifix in a stone chamber, its eyes rolling with the sound of dry gears. It counts backward in a cackling analog tenor and glitches as it warns: “Christopher! You must go back!” and “Christopher, the fallen one, return” (5). It pleads with Kether in a dream, “Every repeat is eternal, but in each is a chance!” (32), and cries that a demon is there in the chamber (34)."),
  ("The restless angel", "10",
   "Among the angels hung by the spine from the stars, “there is one who does not sit still.” He climbs the spine-rope through the clouds and the archons to the gates of the demiurge, rips his spine from his neck as a spear, and splits the serpent's tongue. Satan tears off his wings and head, which falls into Leviathan's ocean. “He will be made again.”"),
  ("The heart", "19",
   "Pulled from the oceans without wings, with serpent's eyes, he tells the Euclids of Tartarus and of “the sleeping-demi-God rising,” the half of himself he must save. Lodged in a crystal in Samson's new heart, he tells Samson, “I am the half that watched.”"),
  ("The judge", "20",
   "His screams become lightning through Leviathan's mouth. When Samson dies on the shore, Antony's wings re-form from the wreck. He strikes the serpent one hundred and fifty-seven times, tears out a length of its spine, and drives it into its eye. His form is “primordial, made of judgement, time, protection, responsibility, and endurance.”"),
  ("On the crucifix", "22",
   "Hung and butchered by Kether, his heart keeps beating: “I share no house with the ancient poison.” He then wrestles Satan under the tree of life, puts three swords through Kether's heart, and hangs Satan from the tree with two spines."),
  ("Remembered", "23, 33, 37",
   "The boy doll's voice is “the mockery of his murderer, Antony” (23). “The guardian angel knows this” (33). Alice feels Antony watching and knows his name (37).")])

add("truea", "The True Angels", "Angels", "4, 10",
 "Angels hung by the spine from the stars.",
 [("Hung from the stars", "10",
   "“They hang by the spine from stars”: angels whose souls outreach the lights of the archons' stars, hanging spine-first over ancients who dance in masks at their stones. Where they hang by the spine from open neck wounds, “their sparks quiet for another time, like sleeping giants. Many are waiting their dignities to return, after however many eternities in the snake pit; praying.” The chapter asks whether they were “mimicked three hundred and sixty-five times,” the heaven-sent kinds apart from the mimicked ones. One of them, Antony, does not sit still."),
  ("Messengers", "4",
   "“You have angels amongst you. You are safe for now.” They will help guide the lost home “if you trust their mercy and love.” “Angels pour forth for the will of the unseen, but were a once-seen holy reality.” Some deviated from “those sent, messengers.”")],
 ["Note: the angels hanging from the stars are true angels, from the Fullness, distinct from the false angels of the demiurge."])

add("falsea", "The False Angels", "Angels", "36",
 "The demiurge's own three hundred and sixty-one angels.",
 [("The bridge", "36",
   "Yaldabaoth yanks his angels through a portal “like rope clogging a pipe.” They try to fly, to run, to plead in “their corrupted seraphic tears.” He tears their wings, boils their bones, sews their eyes and mouths shut, and binds their hands and feet into a hanging bridge, thanking them twice before slithering across their squirms. When he sinks in the tar they cannot answer him."),
  ("Redemption", "36",
   "Home again, Yaldabaoth breathes out the star Redemption to heal any of his three hundred and sixty-one angels who forgive themselves. Three hundred and sixty are healed: stitches undone, bones strengthened, wings sutured and blessed into flesh. The woman of shadow tells him, “You and your false angels are as pawns.”")],
 ["Note: distinct from the true angels who hang by their spines from the stars."])

add("curse", "Curse", "Angels", "36",
 "The one angel who refuses Redemption.",
 [("The fall", "36",
   "The one angel who denies Redemption's aid “is the most able to forgive himself,” but he is left wingless and broken, hating the demiurge and his creation and feeling betrayed. Cast out of Heaven, “his name is Curse,” thrown into the dirt of humankind like a meteor; “a nightfall lit up by an angel fall.”")])

add("wired", "The Wired Angels", "Angels", "7, 15",
 "Angels of metal, wires and drives.",
 [("Over the towers", "7",
   "Winged angels with “metal below the ear and inside the neck” watch people in their cubicle shelters in towers risen from no ground. They wake the narrator, glowing and beeping a forgotten pattern, and slide a drive behind the narrator's ear “like a slit of a lock.”"),
  ("On the battlefield", "15",
   "“A fallen angel maybe,” almost seven feet tall in black armor with a plasma spear, leads a squadron against Samson. Black-winged, it crawls over his mech like a spider, shows a deformed face of many mandibles, and pulls the memory chip from the back of his neck. Samson calls it a demon.")])

add("puppets", "The Puppets and Marionettes", "Puppets, dolls and shadows", "3, 4, 9, 18, 20, 22, 23, 24, 30, 34, 35, 36",
 "Smiling figures on strings, in many places and forms.",
 [("In the outer darkness", "20, 23",
   "On Samson's dying vision, puppets march on playground-colored stairs that defy gravity, “their broken puppet smiles and skin reflecting hell-sweat down plastic and porcelain cheeks, some rosy, some dimpled, some freckled,” begging for the death they live in (20). In Satan's room, a marigold round of marionette heads sings “Row, row, row your boat” with guns to the backs of their heads, rewinds like a tape, works in a workshop “like elves busy with nothing,” then forces Satan to eat his own teeth. Their hair is painted on, their eyes porcelain, their dress shoes treadless; “Where Satan lies is just one little room of this infinitude hotel of puppet machines” (23)."),
  ("The doll in the bedroom", "24",
   "A porcelain doll clicks lifelessly at Alice's window, then seems to be only in her painting, then, while a tape's tenor-squeal sings “Row, row, row your boat” in the dark, is less than an inch from her eye, and at last sits straight on her bed under the light: “Why don't we talk about Christopher?” It points to the painting she made of it."),
  ("The circus crowd", "30",
   "Puppets smile from tiered benches in early twentieth-century dress, “all looking like children,” smelling of paint and varnish. Musicians in white with red stripes mimic horns and drums. A dummy hands out a sack, and they pelt Alice with beating hearts. Eight small boy puppets drag the bull in on sixteen ropes."),
  ("On the piano", "35",
   "In the antique shop: “the antique dolls painted with thin legs and long horn shoes, smiling away. They sit in columns and rows over the old piano in one corner,” beneath the jester painting by Alice Love."),
  ("In the hoard", "34",
   "“Wee little puppets go in and out of mouse holes, like doors,” and small woodworkers with tiny hammers crawl over the man like a second Earth."),
  ("As a word", "3, 4, 9, 18, 22, 36",
   "“Hollow marionette, I will remember the toll of your lifeless clicks” (3). “A puppet of puppets, marionettes of marionettes” (4, 36). “I'm a good puppet” (9). “The end is filled with puppets playing with themselves” (18). Kether falls “like a bad puppet” off the strings (22).")],
 ["Note: the puppets and the playground stairs live inside the outer darkness."])

add("toys", "Puppet Toys", "Puppets, dolls and shadows", "23, 28, 30, 34, 35",
 "Toys that hold souls, mimic children, or guard a hoard.",
 [("Souls in toys", "23",
   "The marionettes sit “impaled on little sticks like toys,” work “with toy hammers without choice,” and caress Satan's hair as little toys. “Leviathan forces this unto every soul trapped within their toys.” The boy doll who feeds Satan is “the toy boy.”"),
  ("The angel toy", "28",
   "A porcelain baby hangs by a single string with eyes that shine empty: “The angel toy looks just like her son, dressed in white wings.” When God cuts the strings, the doll thuds to the ground."),
  ("Boys and girls of the stands", "30",
   "“These little toys of boys and girls are adorned in the classical formal attire of the early twentieth century,” the dead stares of “the toys in their seats.”"),
  ("The shop's toys", "35",
   "A miniature train rests on tiny railroads before metal cups of pearl necklaces and marbles; pocket-sized toy soldiers in red coats, “little nutcrackers,” stand at the ends of the table “almost guarding the mounds.” Above the piano sit “the tiny toys of boys and girls.”"),
  ("The collected", "34",
   "“His lies are built by bitty nothing toys he collected, towering around him in his room.”")])

add("golden", "The Good Puppet · Golden Child", "Puppets, dolls and shadows", "9, 25, 34",
 "A man with a pink television, painted in gold.",
 [("Good Puppet", "9",
   "In an abandoned room, a thirty-year-old man keeps his hand on a fuzzy pink television and talks to God: “You want me to? Okay, I'll listen, God.” He smacks his head on the counter, hears ringing, and wonders where she is. The phone rings, and the pain makes him smile “like a good puppet. I'm a good puppet. I hope I am dead.”"),
  ("Golden Child", "25",
   "Gold covers an earlier silver across a face breathing through a bag. A chosen one stomps on his copy, screaming “Say God!” When the image shatters like a television, a good puppet stands covered in gold at a broken pink television: “Yaldabaoth is betrayed.” Lucifer tells him, “You are God.” Bald in gold, he kicks his smiling copy, then sits against a tree as a puppet boy in overalls swings and tells him, “Lucifer, you're stupid,” and he laughs in disbelief."),
  ("Thistle Rope", "34",
   "A bald man of forty-three, wrapped in wires in a room hoarded with childhood memories, drags a pink television by its cord, babbles at the shadows, and is buried by his own clutter. A voice calls “Hey, Lucifer!” and he stops at his name. He sees a baby doll with angel wings bleeding tears and a scroll: “I am the Antichrist.” He wakes on a cold floor before the raised stone and the machine angel, who calls him Christopher.")],
 ["Note: the man in Thistle Rope is the Good Puppet and the Golden Child."])

add("rosy", "The Boy in Overalls", "Puppets, dolls and shadows", "23, 25, 42",
 "A porcelain boy with black hair and rosy cheeks.",
 [("The feeder", "23",
   "“This dark-haired porcelain boy in overalls, with rosy cheeks” pries Satan's teeth apart with tiny fake fingers and scoops the fleshy gum-teeth from the carpet into his mouth: “Eat the can—can—candy!” His grin stretches until it hurts to look at. Satan recognizes the voice as “the mockery of his murderer, Antony.” Through the boy's pupil, Satan watches his own death."),
  ("On the swing", "25",
   "“A toy or puppet of a boy is swinging in overalls” on the tire swing of a childhood tree. “His fake voice cassette tells him, ‘Lucifer, you're stupid.’”"),
  ("A flash", "42",
   "Damon remembers “being forcefully fed gummy flesh like teeth by the rosy cheek puppet in overalls.”")])

add("opi", "Opi and Noidy", "Puppets, dolls and shadows", "11, 35",
 "Two button-eyed stuffed dolls with yarn hair.",
 [("On the table", "11",
   "“Opi with Noidy, the two button-eye stuff-stitch friends holding one another,” in yarn hair and crochet clothes. Black-haired Opi and red-haired Noidy sit among dice, rune books and scribbles. Under Noidy's shirt Thomas finds a red wax seal, “like a letter, but of a necromantic kind.”"),
  ("The red house", "11",
   "In the red house hangs a picture of little Noidy in a corner. In the box of mirrors a little black-haired one runs through the reflections, and another doll of red yarn falls over weeping; the weeping of Thomas's wife comes from “the doll lying on the table.” At the end, “Noidy, stuck inside without Opi. Cannot leave.”"),
  ("In the shop", "35",
   "Not named in chapter 35: two dolls with button eyes and yarn hair, one red-haired and one black-haired, sit in front of a small red house across the piano.")])

add("clowns", "The Clowns", "Puppets, dolls and shadows", "38",
 "Clowns who take a paralyzed man.",
 [("Joy & Pleasure", "38",
   "Clowns wrap around a paralyzed man and wheel him on a white stretcher dotted blue, red and yellow. One with goat eyes and slit pupils kisses him with perverse love; others joke about the last kidnapping. They cut blue worms from under his skin and eat them like noodles, and one strangles another for the longest worm. When the man laughs, “I hate God!”, they all laugh with him, until one points to the edge of the papyrus they are written on: “Just words is all, see?”")])

add("shadows", "Shadow Figures", "Puppets, dolls and shadows", "18, 19, 22, 29, 31, 34",
 "Shadows that speak, mutter, hang and weave.",
 [("Shadow people of the hoard", "34",
   "“Shadows across the walls mutter a name without noise,” repeating it. One black shadow rolls its hands around itself; one kicks the garbage pile over onto the man; “one of the shadow people on the wall” says, “I been wanting to tell you something.”"),
  ("The crimson hallway", "22",
   "Moonlight breaks into Kether's hall, “black shadows of many forms rising at the walls, up and down like waves,” and “the shadow of a crab runs up the wall quickly, like a spider.”"),
  ("The hangman", "31",
   "A shadow hangs upside down from the tree of both life and death, skinny, with a pointed hat. It names itself Wisdom of Limbo."),
  ("On the moon", "18, 19",
   "Leviathan constricts “a shadow on the moon above” (18). A woman's shadow uses the moon as a stepping stool and weaves with crab claws (19)."),
  ("In the water", "29",
   "Samson's reflection in the fountain is “a form unseen, blotted out by a shadow not himself.”")],
 ["Note: the outer darkness itself is made of the shadow of Leviathan."])

add("chin", "The Long Chin Shadow", "Puppets, dolls and shadows", "11, 18, 22",
 "A whispering shadow with a long, pointed chin.",
 [("The dark one", "11",
   "“The dark, shadowy chin point; he leans in”: it whispers to Thomas, “You will take a life then.” After the shot it says, “She did this, but she is a memory,” whispers as he walks to the red house, and asks, “Do you see the memories?” In the end it grabs at everyone in the dark."),
  ("At the rite", "18",
   "“Don't ignore the presence; keep it close,” says a long chin shadow, listed as “a shadow chin darkness as Virgil guidance often unseen.”"),
  ("Over Kether's neck", "22",
   "“The darkness of a chin shadow stretches across the wall, cold at the back of his neck”: “The chase is the rabbit chased … Do you really think you should not run from that which terrifies you, rabbit?”")])

add("fool", "The Fool", "Limbo", "26, 30, 31, 35",
 "A long-nosed Jester of Limbo.",
 [("On his tree", "26",
   "In black-and-white stripes with red points and two golden buttons, skin like baking bread and a nose that hangs like a rope, he lounges on the single dead tree of his realm. He sniffs Samson, eats a queen of hearts and chews a deck of cards, counts jokers in impossible numbers, and calls himself Fool. Samson chops the tree down; “My first ever tree in this realm! Given by God!”"),
  ("Ringmaster", "30",
   "He descends into his circus tent on an enormous fish hook playing accordion, a third arm sprouting from his back. He smells “an Alice,” tells her that her lover cut down his tree, has the dolls pelt her with hearts, and screams for the bull to murder her."),
  ("Relations", "31",
   "Wisdom of Limbo calls himself “a fool's relation,” the lesson learned born of foolishness, and so the son of a fool."),
  ("The painting", "35",
   "Sarah's painting shows a white-faced jester in black and white, with yellow buttons and a long drooping nose, on a dry old tree over a green field and a pure black sky.")])

add("wisdom", "Wisdom of Limbo", "Limbo", "31",
 "The hanging shadow on the tree of both life and death.",
 [("The hangman", "31",
   "“Wisdom of the first of third Limbo” hangs upside down from the tree of both life and death and smells “a waking God made of Mars.” He asks for the mind as a toll, explains the curse of the joker brought by cutting the Fool's tree, tells Samson he is the waking God and his half the sleeping God, and names Sophia as the form of Wisdom. “I am the both of both, and my duty is unto the fullness.”")])

add("christopher", "Christopher", "Souls and wanderers", "5, 18, 24, 26, 30, 34, 37, 42",
 "A man in the stone chamber, caught in the maiden.",
 [("The stone chamber", "5",
   "“Born today: Christopher.” Waking in withdrawal on a raised stone under the angel machine, he pulls out his needles and walks into the maiden of wires and gas, “his blindfold.” A woman combs his hair and begs him to come back; he mouths “Go away, Antony.” The maiden spills him out pockmarked and burned: “I CANNOT TRUST!”"),
  ("The rite", "18",
   "The boy at the desert rite is named: “The boy named Christopher, his soul possessing his soul named Satan.” He drinks the end, sees “a brother and a lover as one,” swears to kill the brother, and cannot see the lover past an angel in every vision."),
  ("Named elsewhere", "24, 26, 30, 42",
   "His name comes to Alice's mind in her bedroom (24). The Fool smells “the lostness of Christopher” on Samson (26) and Christopher's scent on Alice (30). Damon hears a woman call “Christopher!” in a flash (42)."),
  ("Pulled out", "34, 37",
   "He falls from the maiden onto the floor, crawling away from it, burned by the gas (34). Alice pulls him out, turns off the phone, and her tears wake him: “Alice…?” (37).")])

add("alice", "Alice", "Souls and wanderers", "24, 30, 35, 37",
 "A painter, and Christopher's love.",
 [("The bedroom", "24",
   "Alone at night with cubed paintings of marionettes and pastel angels on her walls, she is frozen by a clicking porcelain doll that moves between her window, her painting and her bed. It says, “Your love, he is free now,” and when the light cuts out a voice says, “I am the nothingness…”"),
  ("The circus", "30",
   "Falling down a rabbit hole, she lands in the Fool's tent in a dark dress with yellow chaos stars, is pelted with beating hearts, and is trampled by the bull. She is found dead in her bed of heroin and PCP."),
  ("The painting", "35",
   "The jester painting Sarah buys is signed “By Alice Love”; the shopkeeper says the painter recently passed away."),
  ("The stone chamber", "37",
   "Inside the God Machine she finds the body, runs the stone corridors, opens the maiden, refuses the call from 25291791441265, and wakes Christopher with her tears: “I found you, love.”")],
 ["Note: the woman in the bedroom in chapter 24 is Alice."])

add("samson", "Samson", "Souls and wanderers", "15, 19, 20, 26, 29, 30, 31",
 "A soldier who becomes a traveler.",
 [("Tank Meat", "15",
   "In a green mech over ten feet tall, he fights his way out of rubble and through a squadron. A black-winged angel pulls the memory chip from his neck: “She never was; they used me as a machine for war.”"),
  ("The heart", "19, 20",
   "The Euclids of Binah give him a new heart with Antony in it. He climbs the mountain, enters the portal, and is sent to kill Leviathan. His form is “vitality, courage, and will,” hot and dry. He dies on the shore after the battle, seeing a feral brother and the marionettes."),
  ("The traveler", "26, 29, 31",
   "Crossing Limbo, he chops down the Fool's tree (26), kills the goat-bull with a spine spear and finds the black joker lock (29), and hears from Wisdom that he is the waking God and that his love lies in the outermost realm (31)."),
  ("Named", "30",
   "The Fool says Alice smells like Samson's and tells her that her lover cut down his tree.")])

add("kether", "Kether", "Souls and wanderers", "16, 18, 21, 22, 30, 32",
 "Leader of the Tiphareth Euclids, worshipped as a God.",
 [("The boy-God", "16",
   "Eighteen, six-foot-two, with a long mouth and strong teeth; “a rising morning Venus,” called a fallen angel, with a pride that puts Lucifer to shame. His tribe trades in forbidden knowledge and drugs."),
  ("The chapter of the rite", "18",
   "Chapter 18 bears his name: Kether: Meat Ends of Three Snakes. It follows a boy of sixteen and seventeen into the desert rite, where he is named Christopher, and where Satan, Leviathan, Lucifer, the long chin shadow, Ouroboros, kōaḥ, the Demiurge and the archons all speak."),
  ("Awake", "21, 22",
   "Leviathan whispers into his ear (21). He hangs and butchers Antony, flees, falls “like a bad puppet” seeing a pink television, and is freed when Antony wrestles Satan: “Antony! I am awake!” (22)."),
  ("The dream", "32",
   "From a stone bed full of needles he tells Antony the drugs are only an imitation and screams, “This is all there is!”")],
 ["Note: Kether is connected to every figure named in chapter 18."])

add("hermit", "The Hermit", "Souls and wanderers", "14",
 "A man who dies believing he is God.",
 [("Chemical Hermit", "14",
   "He sees spirits around his table calling him the God and a heaven of his own making. A teary brother forgives him, then he is on a yellow-lit brown carpet with Lucifer on his heart. Blue at the hands and feet, he fights the brother who tries to help, wets himself, and hears, “You are God; there is nothing else.” His heart stops. “Back to sleep.”")])

def single(id, name, ch, lead, text, notes=()):
    add(id, name, "Figures of single stories", ch, lead, [(name, ch, text)], notes)
single("thomas", "Thomas", "11", "A husband led by the dark one.",
 "On a porch in the rain, the long-chinned dark one whispers to him. Inside, his wife Ana convulses after the dolls vanish, and he shoots her. He follows the shadow to a small red house, falls into a box of mirrors, loses his body among the reflections, and remembers Ana burying him in red wax under a new moon.")
single("ana", "Ana", "11", "Thomas's wife in a rabbit mask.",
 "In a scarlet silk dress and charcoal rabbit mask, she smokes beside Opi and Noidy and the rune books. The seal on Noidy is hers. She convulses in the flickering lights and is shot. Her weeping comes from the doll in the box of mirrors.")
single("boy6", "The Hived Boy", "6", "A sixteen-year-old covered in hives.",
 "Beaten by his rabbit-masked father, he is possessed and kills him. He wakes at dawn beside the body, covered in blood and hives, smiling by accident and knowing “something awakened for a night.”")
single("rabbit", "The Rabbit-Masked Father", "6", "A father in a grey stone rabbit mask.",
 "In a filthy vest he beats his son, “Why does the boy grow emptier!?”, and is killed by him: “The father murdered by his own son.”")
single("mother", "The Mother", "28", "A mother in a bathroom with sirens outside.",
 "The cradle is empty. She hears three spirits, says “I become the Antichrist by doing this,” and sees an angel doll that looks like her son, before God cuts the string over her.")
single("sarah", "Sarah", "35", "A buyer at the antique shop.",
 "She buys the jester painting signed “By Alice Love” for twenty dollars and is given an unpriced VHS tape for free.")
single("louis", "Louis", "35", "The old shopkeeper.",
 "He kept too many things and learned to share them. He tells Sarah the painter recently passed away after selling him almost all her paintings.")
single("damon", "Damon", "42", "A man fighting his brother over pills.",
 "He bites off his brother's finger, beats and kisses him, shoots him, and hears his father on the line 25291791441265 tell him to take the pills. Flashes of a fight in the hallway, a fall through clouds, a puppet in overalls and a maiden come to him. His dead brother beats his face into the toilet.")
single("brother", "Damon's Brother", "42", "Damon's brother.",
 "He tries to take the pills, loses a finger, is shot with his phone dialed, and returns “riddled in a multitude of fatal gunshots” to stop Damon flushing them.")
single("father", "The Father", "42", "Father of both brothers.",
 "On the phone, on the line 25291791441265: “Your tail is a little far down your throat now, son,” and “you need to take the rest of the pills.” At the end: “He didn't listen. Yeah… We'll have to repeat it again.”")
single("red", "Red", "39", "A crimson rose of a man.",
 "Under two setting suns he chases Blue's rain with a golden chalice and drinks his own tears after she is carried away. “Why?”")
single("blue", "Blue", "39", "A trumpet gentian of a woman.",
 "She glides with a mirage of rain until a breeze carries her off, leaving the smell of her rain in the soil.")
single("binah", "The Euclids of Binah", "16, 19", "The Southern tribe of Euclids.",
 "They pour wax down their backs, lash themselves and starve; one practitioner is castrated, hairless and rune-burned. They keep soul-locked grunts with machine-hijacked brains (16). In a cave of forgotten machines, they set Antony into Samson's new heart (19).")
single("tiph", "The Euclids of Tiphareth", "16", "The Northern tribe of Euclids.",
 "Led by Kether, they seek visions through pleasure and bondage, synthesize new drugs, trade in taboo knowledge and humans, and fight like jackals and scorpions.")
