// node simn.js <layout> <levels comma> <games> [extra-json]
const { chromium } = require("playwright");
(async () => {
  const [L, lv, N, extra] = [
    process.argv[2] || "ffa",
    (process.argv[3] || "medium,medium,medium,medium").split(","),
    +process.argv[4] || 2,
    process.argv[5] || "{}",
  ];
  const b = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1300, height: 1400 } });
  const errs = [];
  p.on("pageerror", (e) =>
    errs.push(
      e.message + " " + (e.stack || "").split("\n").slice(0, 3).join("|"),
    ),
  );
  p.on("console", (m) => {
    if (m.type() === "error") errs.push("console: " + m.text());
  });
  await p.goto(
    "http://localhost:8765/ethers-crossroads-play.html?x=" + Date.now(),
  );
  await p.waitForTimeout(300);
  for (let g = 0; g < N; g++) {
    const r = await p.evaluate(
      async ([L, lv, extra]) => {
        const E = window.__EC;
        const C = ["#ee7a3c", "#4c92e6", "#45b89c", "#e4648f", "#e3b944"],
          S = ["tetra", "icosa", "cube", "octa", "dodeca"];
        const coop = L === "coop";
        const X0 = JSON.parse(extra);
        const players = lv.map((l, i) => ({
          name: "P" + i + "-" + l,
          tribe: (X0.subs && X0.subs[i]) || (i % 2 ? "tiph" : "binah"),
          color: C[i],
          solid: S[i],
          cpu: l,
        }));
        if (coop)
          players.push({
            name: "The Horde",
            color: "#97a487",
            solid: "dodeca",
            cpu: "horde",
          });
        const X = JSON.parse(extra);
        E.startGame(
          Object.assign(
            {
              mode: coop ? "survival" : "cpu",
              players,
              layout: L,
              mid: true,
              fast: true,
              turns: "prep",
            },
            X,
          ),
        );
        const t0 = Date.now();
        while (
          !E.G.over &&
          E.G.turnNo < (+X.cap || 400) &&
          Date.now() - t0 < (+X.ms || 90000)
        )
          await new Promise((r) => setTimeout(r, 50));
        const G = E.G;
        const ev = G.log
          .filter(
            (l) =>
              !/^Spell prices|^— Round|pays Saturn|ignores Saturn/.test(
                l.html.replace(/<[^>]+>/g, ""),
              ) &&
              /Sun|Venus|Jupiter|Oath|Trade|Black|cries|blind|ground|eats|Judgement|shop|cycle|ban|Rob|Jail|takes the sky|robs/.test(
                l.html,
              ),
          )
          .map((l) => l.html.replace(/<[^>]+>/g, "").slice(0, 120));
        return {
          stumble: G.log
            .filter((l) => /stumbles/.test(l.html))
            .map((l) => l.html)
            .slice(0, 3),
          subs: G.p.map((P) => P.tribe).join(","),
          nev: ev.length,
          ev: [...new Set(ev.map((e) => e.slice(0, 60)))].slice(0, 22),
          over: G.over,
          turns: G.turnNo,
          rounds: G.moon.round,
          win: G.log.find((l) => l.cls === "win")?.html || "",
          out: G.p.map((P) => (P.out ? 1 : 0)).join(""),
          decks: G.p.map((P) => P.deck.length),
          stacks: G.p.map(
            (P, i) => G.board.flat().filter((s) => s && s.owner === i).length,
          ),
          rows: G.rows,
          cols: G.board[0].length,
          sr: G.round,
        };
      },
      [L, lv, extra],
    );
    console.log(JSON.stringify(r, null, 0).slice(0, 2500));
  }
  console.log(errs.slice(0, 10).join("\n") || "no errors");
  await b.close();
})();
