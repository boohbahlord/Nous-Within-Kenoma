/* ---------------- v41: room titles, descriptions, a player cap, and open rooms anyone can join ----------------
   A host names the room (a title of 40 characters, a description of 200), sets how many players it holds (2 to 8, the host
   counted), and can make it Open: listed for anyone, no code needed. Each listed room shows its title, players, the host's time
   zone and whether a game is on; its description opens on demand.
   There is no server: the host of one open room keeps the list at a fixed address on the same free connection service the game
   uses, and every open room checks in with it every 20 seconds. When that host leaves, the next open room to check in takes the
   list over. Rooms that stop checking in drop off after a minute. (Room codes starting with LOCAL use a stand-in between tabs.) */

const ROOM_DIR = "ec-rooms-v1",
  ROOM_TTL = 60000,
  ROOM_BEAT = 20000;
const roomTZ = () => {
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      o = -new Date().getTimezoneOffset(),
      h = Math.trunc(o / 60),
      m = Math.abs(o % 60);
    const off = `UTC${o >= 0 ? "+" : "−"}${Math.abs(h)}${m ? ":" + String(m).padStart(2, "0") : ""}`,
      city = z.split("/").pop().replace(/_/g, " ");
    return !city || /^(UTC|GMT|Etc)/.test(z)
      ? o
        ? off
        : "UTC"
      : `${city} (${off})`;
  } catch (e) {
    return "";
  }
};
const cleanRoom = (r) => ({
  code: String((r && r.code) || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12),
  title: String((r && r.title) || "").slice(0, 40),
  desc: String((r && r.desc) || "").slice(0, 200),
  players: Math.max(1, Math.min(8, +(r && r.players) || 1)),
  cap: Math.max(2, Math.min(8, +(r && r.cap) || 4)),
  tz: String((r && r.tz) || "").slice(0, 40),
  playing: !!(r && r.playing),
  local: !!(r && r.local),
  cheat: !!(r && r.cheat),
});

/* ---------- a stand-in for the connection service between tabs of one browser (for LOCAL rooms and for trying it alone) ---------- */
class TabPeer {
  constructor(id) {
    this.id = id || "tp-" + Math.random().toString(36).slice(2, 9);
    this.h = {};
    this.c = {};
    this.open = false;
    this.taken = false;
    this.dead = false;
    this.bc = new BroadcastChannel("ec-tabpeer");
    this.bc.onmessage = (e) => this._m(e.data);
    if (id) {
      this.bc.postMessage({ k: "who", id });
      setTimeout(() => {
        if (this.dead) return;
        if (this.taken) this._e("unavailable-id");
        else {
          this.open = true;
          this._f("open", this.id);
        }
      }, 250);
    } else
      setTimeout(() => {
        this.open = true;
        this._f("open", this.id);
      }, 10);
  }
  on(ev, f) {
    (this.h[ev] = this.h[ev] || []).push(f);
  }
  _f(ev, ...a) {
    for (const f of this.h[ev] || [])
      try {
        f(...a);
      } catch (e) {
        console.error(e);
      }
  }
  _e(type) {
    this._f("error", { type });
  }
  _conn(cid, peer) {
    const self = this,
      C = {
        peer,
        open: false,
        h: {},
        on(ev, f) {
          (C.h[ev] = C.h[ev] || []).push(f);
        },
        _f(ev, ...a) {
          for (const f of C.h[ev] || []) f(...a);
        },
        send(d) {
          if (C.open)
            self.bc.postMessage({ k: "data", cid, to: peer, from: self.id, d });
        },
        close() {
          if (!C.open) return;
          C.open = false;
          self.bc.postMessage({ k: "close", cid, to: peer });
          C._f("close");
          delete self.c[cid];
        },
      };
    this.c[cid] = C;
    return C;
  }
  connect(id) {
    const cid = Math.random().toString(36).slice(2),
      C = this._conn(cid, id);
    this.bc.postMessage({ k: "conn", to: id, from: this.id, cid });
    setTimeout(() => {
      if (!C.open && !this.dead) this._e("peer-unavailable");
    }, 1200);
    return C;
  }
  _m(m) {
    if (!m || this.dead) return;
    if (m.k === "who" && m.id === this.id && this.open)
      this.bc.postMessage({ k: "have", id: this.id });
    else if (m.k === "have" && m.id === this.id && !this.open)
      this.taken = true;
    else if (m.k === "conn" && m.to === this.id && this.open) {
      const C = this._conn(m.cid, m.from);
      C.open = true;
      this.bc.postMessage({ k: "connok", cid: m.cid, to: m.from });
      this._f("connection", C);
      setTimeout(() => C._f("open"), 0);
    } else if (m.k === "connok" && m.to === this.id && this.c[m.cid]) {
      const C = this.c[m.cid];
      C.open = true;
      C._f("open");
    } else if (m.k === "data" && m.to === this.id && this.c[m.cid])
      this.c[m.cid]._f("data", m.d);
    else if (m.k === "close" && m.to === this.id && this.c[m.cid]) {
      const C = this.c[m.cid];
      C.open = false;
      C._f("close");
      delete this.c[m.cid];
    }
  }
  destroy() {
    if (this.dead) return;
    for (const C of Object.values(this.c))
      try {
        C.close();
      } catch (e) {}
    this.dead = true;
    try {
      this.bc.close();
    } catch (e) {}
  }
}
const roomsLocal = () =>
  /^LOCAL/i.test(NET.code || "") || !!window.__EC_LOCALDIR;
const newPeer = async (id, local) => {
  if (local) return new TabPeer(id);
  await loadPeer();
  return id ? new window.Peer(id) : new window.Peer();
};
const send1 = (c, d) => {
  try {
    c.send(d);
  } catch (e) {}
};
const parse = (raw) => {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
};

/* ---------- the list keeper (one open room's host) and the check-ins ---------- */
const DIR = {
  peer: null,
  keeper: false,
  rooms: {},
  conn: null,
  beat: null,
  busy: false,
};
function dirKeep(peer) {
  DIR.peer = peer;
  DIR.keeper = true;
  peer.on("connection", (c) => {
    c.on("data", (raw) => {
      const d = parse(raw);
      if (!d) return;
      if (d.t === "reg" && d.room) {
        const r = cleanRoom(d.room);
        if (r.code) DIR.rooms[r.code] = Object.assign(r, { at: Date.now() });
      } else if (d.t === "unreg" && d.code)
        delete DIR.rooms[String(d.code).toUpperCase()];
      else if (d.t === "list") send1(c, { t: "rooms", rooms: dirList() });
    });
  });
}
function dirList() {
  const now = Date.now();
  for (const [k, r] of Object.entries(DIR.rooms))
    if (now - r.at > ROOM_TTL) delete DIR.rooms[k];
  return Object.values(DIR.rooms).map((r) => {
    const o = { ...r };
    delete o.at;
    return o;
  });
}
function myRoom() {
  const R = NET.room || {};
  return cleanRoom({
    code: NET.code,
    title: R.title || `${NET.name}'s room`,
    desc: R.desc,
    players: 1 + guestIds().length,
    cap: R.cap,
    tz: roomTZ(),
    playing: !!(G && G.opts.online && !G.over),
    local: roomsLocal(),
    cheat:
      G && G.opts.online && !G.over
        ? !!G.opts.cheat
        : !!($("#ocheat") && $("#ocheat").checked),
  });
}
async function dirBeat() {
  if (DIR.busy) return;
  DIR.busy = true;
  try {
    const open =
      (NET.role === "lobby-host" || NET.role === "host") &&
      NET.room &&
      NET.room.open;
    if (!open) {
      if (DIR.conn)
        try {
          send1(DIR.conn, { t: "unreg", code: NET.code });
          DIR.conn.close();
        } catch (e) {}
      DIR.conn = null;
      if (DIR.keeper) {
        delete DIR.rooms[NET.code];
        if (!Object.keys(DIR.rooms).length) {
          try {
            DIR.peer.destroy();
          } catch (e) {}
          DIR.peer = null;
          DIR.keeper = false;
        }
      }
      return;
    }
    const me = myRoom();
    if (DIR.keeper) {
      DIR.rooms[me.code] = Object.assign(me, { at: Date.now() });
      return;
    }
    if (DIR.conn && DIR.conn.open) {
      send1(DIR.conn, { t: "reg", room: me });
      return;
    }
    // reach the keeper, or become it
    const local = roomsLocal(),
      p = await newPeer(undefined, local);
    const ok = await new Promise((res) => {
      let done = false;
      const fin = (v) => {
        if (!done) {
          done = true;
          res(v);
        }
      };
      p.on("open", () => {
        const c = p.connect(ROOM_DIR, { reliable: true });
        c.on("open", () => {
          DIR.conn = c;
          DIR.connPeer = p;
          send1(c, { t: "reg", room: me });
          fin(true);
        });
        c.on("close", () => {
          if (DIR.conn === c) DIR.conn = null;
        });
      });
      p.on("error", (e) => {
        if (e && e.type === "peer-unavailable") fin(false);
      });
      setTimeout(() => fin(false), 6000);
    });
    if (ok) return;
    try {
      p.destroy();
    } catch (e) {}
    const k = await newPeer(ROOM_DIR, local);
    await new Promise((res) => {
      k.on("open", () => {
        dirKeep(k);
        DIR.rooms[me.code] = Object.assign(me, { at: Date.now() });
        res();
      });
      k.on("error", () => {
        try {
          k.destroy();
        } catch (e) {}
        res();
      });
      setTimeout(res, 6000);
    });
  } catch (e) {
    console.error(e);
  } finally {
    DIR.busy = false;
  }
}
function dirStart() {
  clearInterval(DIR.beat);
  DIR.beat = setInterval(dirBeat, ROOM_BEAT);
  dirBeat();
}
function dirStop() {
  clearInterval(DIR.beat);
  DIR.beat = null;
  const was = NET.room && NET.room.open;
  if (NET.room) NET.room.open = false;
  if (was) dirBeat();
  setTimeout(() => {
    if (DIR.keeper && !Object.keys(DIR.rooms).length) {
      try {
        DIR.peer.destroy();
      } catch (e) {}
      DIR.peer = null;
      DIR.keeper = false;
    }
  }, 500);
}
let beatSoon = null;
const dirSoon = () => {
  clearTimeout(beatSoon);
  beatSoon = setTimeout(() => {
    if (NET.room && NET.room.open) dirBeat();
  }, 300);
};
/* anyone: ask the keeper for the list */
async function listRooms(local) {
  if (DIR.keeper) return dirList();
  const p = await newPeer(undefined, local);
  return await new Promise((res) => {
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        try {
          p.destroy();
        } catch (e) {}
        res(v);
      }
    };
    p.on("open", () => {
      const c = p.connect(ROOM_DIR, { reliable: true });
      c.on("open", () => send1(c, { t: "list" }));
      c.on("data", (raw) => {
        const d = parse(raw);
        if (d && d.t === "rooms") fin((d.rooms || []).map(cleanRoom));
      });
    });
    p.on("error", () => fin([]));
    setTimeout(() => fin([]), 7000);
  });
}

/* ---------- the Online screen: room details for the host, the list of open rooms for everyone ---------- */
{
  const _ol = onlineLobby;
  onlineLobby = function () {
    const out = _ol.apply(this, arguments);
    if (!NET.role) {
      const host = $("#onHost");
      if (host) {
        const R = PREF.netRoom || {};
        host.insertAdjacentHTML(
          "beforebegin",
          `<div class="roomset"><label class="f">Room title <input id="rmTitle" maxlength="40" placeholder="${esc(PREF.netName || "My")}'s room" value="${esc(R.title || "")}"></label>
<label class="f rmdesc">Description <textarea id="rmDesc" maxlength="200" rows="3" placeholder="House rules, the mood, who it's for (200 characters)">${esc(R.desc || "")}</textarea><small class="dim" id="rmCount"></small></label>
<div class="rmrow"><label class="f">Players <select id="rmCap">${[2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${n === (R.cap || 4) ? "selected" : ""}>${n}${n === 4 ? " (default)" : ""}</option>`).join("")}</select></label>
<label class="chk"><input type="checkbox" id="rmOpen" ${R.open ? "checked" : ""}> <span><b>Open room</b><small>Listed for anyone to join, no code needed.</small></span></label></div></div>`,
        );
        const cnt = () => {
          $("#rmCount").textContent = `${$("#rmDesc").value.length}/200`;
        };
        $("#rmDesc").addEventListener("input", cnt);
        cnt();
        host.addEventListener(
          "click",
          () => {
            NET.room = {
              title: $("#rmTitle").value.trim().slice(0, 40),
              desc: $("#rmDesc").value.trim().slice(0, 200),
              cap: +$("#rmCap").value || 4,
              open: $("#rmOpen").checked,
            };
            PREF.netRoom = NET.room;
            savePrefs();
          },
          true,
        );
      }
      const onl = document.querySelector(".ovbox.online .onl");
      if (onl && !$("#rmList")) {
        const nm = onl.querySelector(":scope > label.f");
        (nm || onl).insertAdjacentHTML(
          nm ? "afterend" : "beforeend",
          `<fieldset class="pf"><legend>Open rooms</legend><div id="rmList"><p class="dim">Looking for open rooms…</p></div><p><button type="button" class="btn ghost sm" id="rmRefresh">Refresh</button></p></fieldset>`,
        );
        $("#rmRefresh").onclick = paintRooms;
        paintRooms();
      }
    }
    if ((NET.role === "lobby-host" || NET.role === "host") && NET.room) {
      const R = NET.room,
        code = document.querySelector(".ovbox.online .roomcode");
      if (code && !$("#rmInfo"))
        code.insertAdjacentHTML(
          "beforebegin",
          `<div id="rmInfo"><h3>${esc(R.title || `${NET.name}'s room`)}</h3>${R.desc ? `<p class="dim">${esc(R.desc)}</p>` : ""}<p class="dim">Up to ${R.cap || 4} players · ${R.open ? "Open: listed for anyone to join" : "Private: only with the code"} · ${esc(roomTZ())}</p></div>`,
        );
      if (R.open && !DIR.beat) dirStart();
    }
    return out;
  };
}
async function paintRooms() {
  const box = $("#rmList");
  if (!box) return;
  box.innerHTML = '<p class="dim">Looking for open rooms…</p>';
  const local =
    ($("#onCode") && /^LOCAL/i.test($("#onCode").value)) ||
    !!window.__EC_LOCALDIR;
  let rooms = [];
  try {
    rooms = await listRooms(local);
  } catch (e) {}
  if (!$("#rmList")) return;
  if (!rooms.length) {
    box.innerHTML =
      '<p class="dim">No open rooms right now. Open one yourself, or join a friend with their code.</p>';
    return;
  }
  rooms.sort((a, b) => a.playing - b.playing || b.players - a.players);
  box.innerHTML = `<ul class="rmlist">${rooms
    .map(
      (
        r,
        i,
      ) => `<li><div class="rmtop"><b>${esc(r.title || "A room")}</b><span class="rmn">${r.players}/${r.cap} players</span>${r.playing ? '<span class="rmtag">playing</span>' : ""}${r.cheat ? '<span class="rmtag cheattag" title="The host has cheat mode on.">cheat mode on</span>' : ""}</div>
<div class="rmsub dim">${esc(r.tz || "")}</div>${r.desc ? `<details class="rmd"><summary>About this room</summary><p>${esc(r.desc)}</p></details>` : ""}
<p><button type="button" class="btn sm" data-rmjoin="${i}" ${r.players >= r.cap ? "disabled" : ""}>${r.players >= r.cap ? "Full" : r.playing ? "Join and watch" : "Join"}</button></p></li>`,
    )
    .join("")}</ul>`;
  box.querySelectorAll("[data-rmjoin]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = rooms[+b.dataset.rmjoin];
        $("#onCode").value = r.code;
        $("#onJoin").click();
      }),
  );
}

/* ---------- the host: the cap, the list, and the room's details for everyone in it ---------- */
{
  const _on = onNet;
  onNet = function (from, d) {
    if (d && (NET.role === "lobby-host" || NET.role === "host")) {
      if (
        d.t === "hello" &&
        !(d.token && G && G.p.some((P) => P.netToken === d.token))
      ) {
        const cap = (NET.room && NET.room.cap) || 8;
        if (!NET.guests[from] && 1 + guestIds().length >= cap) {
          sendTo(from, { t: "full", cap });
          return;
        }
      }
      if (d.t === "hello" || d.t === "bye") {
        const out = _on(from, d);
        dirSoon();
        return out;
      }
    }
    if (d && NET.role === "guest") {
      if (d.t === "full") {
        netLeave();
        ovShow(
          `<div class="ovbox"><h2>The room is full</h2><p>It holds ${+d.cap || ""} players. Try another room, or ask the host to make room.</p><p class="acts"><button class="btn" id="netOk">Back</button></p></div>`,
        );
        $("#netOk").onclick = () => {
          startMode = "online";
          showStart();
        };
        return;
      }
      if (d.t === "lobby" && d.room) {
        const first = !NET.roomInfo;
        NET.roomInfo = cleanRoom(d.room);
        if (first && $(".glob")) setTimeout(guestLobby, 0);
      }
    }
    return _on(from, d);
  };
}
{
  const _nl = netLeave;
  netLeave = function () {
    if (NET.role === "lobby-host" || NET.role === "host") dirStop();
    return _nl.apply(this, arguments);
  };
}
{
  const _sg = startGame;
  startGame = function (opts) {
    const out = _sg.apply(this, arguments);
    if (NET.room && NET.room.open) dirSoon();
    return out;
  };
}
if (window.__EC)
  Object.assign(window.__EC, { listRooms, dirBeat, DIR, TabPeer });
