"use client";

import { useEffect, useState, useMemo } from "react";

type Player = { name: string; position: string; value: number };
type Team = {
  team: string;
  ownerId: string;
  wins: number;
  losses: number;
  pf: number;
  pa: number;
  maxPf: number;
  value: number;
  qb: number;
  rb: number;
  wr: number;
  te: number;
  starters: number;
  bench: number;
  starterPlayers: Player[];
  benchPlayers: Player[];
  totalTransactions: number;
};

type MatchupPair = { team1: string; team2: string; points1: number; points2: number; proj1: number; proj2: number };
type TradeSide = { team: string; received: string[]; gave: string[] };
type TransactionItem =
  | { kind: "trade"; week: number; sides: TradeSide[]; created: number }
  | { kind: "move"; week: number; team: string; type: string; adds: string[]; drops: string[]; created: number; faab?: number };

type DraftCell = { player: string; pos: string; manager: string };
type DraftBoard = { year: number; draftOrder: string[]; rounds: DraftCell[][] };

type Format = "sf_tep" | "1qb_notep";
type ValueSource = "statsguy" | "fantasycalc";
type Section = "standings" | "transactions" | "values" | "history" | "charter";
type TxTypeFilter = "all" | "waiver_fa" | "trade";

const sheetBoards: DraftBoard[] = [
  {
    year: 2022,
    draftOrder: ["Billy", "Andrew", "Jared", "Nick V", "Eric", "Chris", "Charles", "Hank", "Dave", "Nick S"],
    rounds: [
      [
        { player: "Breece Hall", pos: "RB", manager: "Billy" },
        { player: "Kenneth Walker III", pos: "RB", manager: "Andrew" },
        { player: "Drake London", pos: "WR", manager: "Jared" },
        { player: "Treylon Burks", pos: "WR", manager: "Nick V" },
        { player: "Dameon Pierce", pos: "RB", manager: "Eric" },
        { player: "Chris Olave", pos: "WR", manager: "Chris" },
        { player: "Garrett Wilson", pos: "WR", manager: "Charles" },
        { player: "Jameson Williams", pos: "WR", manager: "Hank" },
        { player: "George Pickens", pos: "WR", manager: "Dave" },
        { player: "Skyy Moore", pos: "WR", manager: "Nick S" },
      ],
      [
        { player: "Jahan Dotson", pos: "WR", manager: "Billy" },
        { player: "Allen Lazard", pos: "WR", manager: "Andrew" },
        { player: "James Cook", pos: "RB", manager: "Jared" },
        { player: "Trey McBride", pos: "TE", manager: "Nick V" },
        { player: "Christian Watson", pos: "WR", manager: "Eric" },
        { player: "Rachaad White", pos: "RB", manager: "Chris" },
        { player: "Isaiah Spiller", pos: "RB", manager: "Charles" },
        { player: "Alec Pierce", pos: "WR", manager: "Hank" },
        { player: "Romeo Doubs", pos: "WR", manager: "Dave" },
        { player: "Isiah Pacheco", pos: "RB", manager: "Nick S" },
      ],
      [
        { player: "Brian Robinson", pos: "RB", manager: "Billy" },
        { player: "Tyler Allgeier", pos: "RB", manager: "Andrew" },
        { player: "Marquez Valdes-Scantling", pos: "WR", manager: "Jared" },
        { player: "Desmond Ridder", pos: "QB", manager: "Nick V" },
        { player: "Jalen Tolbert", pos: "WR", manager: "Eric" },
        { player: "Kenny Pickett", pos: "QB", manager: "Chris" },
        { player: "Zamir White", pos: "RB", manager: "Charles" },
        { player: "Tyrion Davis-Price", pos: "RB", manager: "Hank" },
        { player: "Isaiah Likely", pos: "TE", manager: "Dave" },
        { player: "Jelani Woods", pos: "TE", manager: "Nick S" },
      ],
    ],
  },
  {
    year: 2021,
    draftOrder: ["Charles", "Nick S", "Nick V", "Chris", "Billy", "Eric", "Jared", "Andrew", "Dave", "Hank"],
    rounds: [
      [
        { player: "Najee Harris", pos: "RB", manager: "Charles" },
        { player: "Javonte Williams", pos: "RB", manager: "Nick S" },
        { player: "Travis Etienne Jr.", pos: "RB", manager: "Nick V" },
        { player: "Kyle Pitts", pos: "TE", manager: "Chris" },
        { player: "Ja'Marr Chase", pos: "WR", manager: "Billy" },
        { player: "Jaylen Waddle", pos: "WR", manager: "Eric" },
        { player: "DeVonta Smith", pos: "WR", manager: "Jared" },
        { player: "Trey Sermon", pos: "RB", manager: "Andrew" },
        { player: "Michael Carter", pos: "RB", manager: "Dave" },
        { player: "Trevor Lawrence", pos: "QB", manager: "Hank" },
      ],
      [
        { player: "Elijah Moore", pos: "WR", manager: "Charles" },
        { player: "Justin Fields", pos: "QB", manager: "Nick S" },
        { player: "Rondale Moore", pos: "WR", manager: "Nick V" },
        { player: "Terrace Marshall Jr.", pos: "WR", manager: "Chris" },
        { player: "Rhamondre Stevenson", pos: "RB", manager: "Billy" },
        { player: "Kadarius Toney", pos: "WR", manager: "Eric" },
        { player: "Chuba Hubbard", pos: "RB", manager: "Jared" },
        { player: "Zach Wilson", pos: "QB", manager: "Andrew" },
        { player: "Rashod Bateman", pos: "WR", manager: "Dave" },
        { player: "Amon-Ra St. Brown", pos: "WR", manager: "Hank" },
      ],
      [
        { player: "Marquez Callaway", pos: "WR", manager: "Charles" },
        { player: "Trey Lance", pos: "QB", manager: "Nick S" },
        { player: "Mac Jones", pos: "QB", manager: "Nick V" },
        { player: "Cole Kmet", pos: "TE", manager: "Chris" },
        { player: "Nico Collins", pos: "WR", manager: "Billy" },
        { player: "Sony Michel", pos: "RB", manager: "Eric" },
        { player: "Jacob Harris", pos: "TE", manager: "Jared" },
        { player: "J.J. Taylor", pos: "RB", manager: "Andrew" },
        { player: "Pat Freiermuth", pos: "TE", manager: "Dave" },
        { player: "Joshua Palmer", pos: "WR", manager: "Hank" },
      ],
      [
        { player: "Anthony Firkser", pos: "TE", manager: "Charles" },
        { player: "Dyami Brown", pos: "WR", manager: "Nick S" },
        { player: "Kenneth Gainwell", pos: "RB", manager: "Nick V" },
        { player: "Qadree Ollison", pos: "RB", manager: "Chris" },
        { player: "Devontae Booker", pos: "RB", manager: "Billy" },
        { player: "Amari Rodgers", pos: "WR", manager: "Eric" },
        { player: "Sam Ehlinger", pos: "QB", manager: "Jared" },
        { player: "Jeff Wilson Jr.", pos: "RB", manager: "Andrew" },
        { player: "Jaelon Darden", pos: "WR", manager: "Dave" },
        { player: "D'Wayne Eskridge", pos: "WR", manager: "Hank" },
      ],
      [
        { player: "Kellen Mond", pos: "QB", manager: "Charles" },
        { player: "Anthony Schwartz", pos: "WR", manager: "Nick S" },
        { player: "Justin Jackson", pos: "RB", manager: "Nick V" },
        { player: "Tevin Coleman", pos: "RB", manager: "Chris" },
        { player: "Tutu Atwell", pos: "WR", manager: "Billy" },
        { player: "Kene Nwangwu", pos: "RB", manager: "Eric" },
        { player: "Elijah Mitchell", pos: "RB", manager: "Jared" },
        { player: "Cam Newton", pos: "QB", manager: "Andrew" },
        { player: "Tony Jones Jr.", pos: "RB", manager: "Dave" },
        { player: "Malcolm Brown", pos: "RB", manager: "Hank" },
      ],
    ],
  },
];

const posColor: Record<string, string> = {
  QB: "bg-blue-600",
  RB: "bg-green-600",
  WR: "bg-purple-600",
  TE: "bg-orange-500",
};

function calcStartersAndBench(players: { name: string; value: number; position: string }[]) {
  const sorted = [...players].sort((a, b) => b.value - a.value);
  const used = new Set<number>();
  const starterPlayers: Player[] = [];
  let starterValue = 0;
  const take = (pos: string | string[], count: number) => {
    let taken = 0;
    for (let i = 0; i < sorted.length && taken < count; i++) {
      if (used.has(i)) continue;
      const p = sorted[i];
      const match = Array.isArray(pos) ? pos.includes(p.position) : p.position === pos;
      if (match) {
        starterValue += p.value;
        starterPlayers.push({ name: p.name, position: p.position, value: p.value });
        used.add(i);
        taken++;
      }
    }
  };
  take("QB", 1);
  take("RB", 2);
  take("WR", 2);
  take("TE", 1);
  take(["RB", "WR", "TE"], 2);
  const benchPlayers = sorted.filter((_, i) => !used.has(i)).map((p) => ({ name: p.name, position: p.position, value: p.value }));
  return { starterValue, starterPlayers, benchPlayers };
}

function formatPick(pick: any): string {
  if (!pick) return "Draft Pick";
  const round = pick.round || "?";
  const season = pick.season || "";
  const suffix = round === 1 ? "st" : round === 2 ? "nd" : round === 3 ? "rd" : "th";
  return `${season} ${round}${suffix} Rd`;
}

function teamInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function badgeColor(type: string) {
  if (type === "trade") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  if (type === "waiver") return "bg-teal-500/20 text-teal-300 border-teal-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mb-6 md:mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-transparent rounded-2xl blur-sm" />
      <h2 className="relative text-2xl md:text-3xl font-bold text-center py-3 md:py-4 bg-gradient-to-r from-teal-200 to-white bg-clip-text text-transparent">{children}</h2>
    </div>
  );
}

export default function Home() {
  const [standings, setStandings] = useState<Team[]>([]);
  const [matchups, setMatchups] = useState<MatchupPair[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [draftBoards, setDraftBoards] = useState<DraftBoard[]>(sheetBoards);
  const [sleeperPlayers, setSleeperPlayers] = useState<Record<string, any>>({});
  const [news, setNews] = useState<{ title: string; link: string; created: string }[]>([]);
  const [format, setFormat] = useState<Format>("sf_tep");
  const [valueSource, setValueSource] = useState<ValueSource>("statsguy");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [section, setSection] = useState<Section>("standings");
  const [txFilter, setTxFilter] = useState<string>("all");
  const [txTypeFilter, setTxTypeFilter] = useState<TxTypeFilter>("all");
  const [sortKey, setSortKey] = useState<"pf" | "pa" | "maxPf" | "totalTransactions" | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [currentWeek, setCurrentWeek] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const leagueId = "1312891873920040960";
        const [usersRes, rostersRes, valuesRes, leagueRes, sleeperPlayersRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
          fetch("https://api.statsguyfantasy.com/api/v1/players"),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
          fetch("https://api.sleeper.app/v1/players/nfl"),
        ]);

        const users = await usersRes.json();
        const rosters = await rostersRes.json();
        const valuesData = await valuesRes.json();
        const league = await leagueRes.json();
        const sleeperPlayersData = await sleeperPlayersRes.json();
        setSleeperPlayers(sleeperPlayersData);
        const week = league.settings?.leg || 1;
        setCurrentWeek(week);

        // Draft history
        try {
          const boards: DraftBoard[] = [...sheetBoards];
          let currentLeagueId: string | null = leagueId;
          for (let i = 0; i < 5 && currentLeagueId; i++) {
            const lg = await (await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`)).json();
            const season = parseInt(lg.season);
            if (season < 2023) break;
            const drafts = await (await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/drafts`)).json();
            if (drafts.length) {
              const picks = await (await fetch(`https://api.sleeper.app/v1/draft/${drafts[0].draft_id}/picks`)).json();
              const lgUsers = await (await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}/users`)).json();
              const userMap = Object.fromEntries(lgUsers.map((u: any) => [u.user_id, u.metadata?.team_name || u.display_name]));
              const draftOrder: string[] = [];
              const byRound: Record<number, DraftCell[]> = {};
              picks.forEach((p: any) => {
                const mgr = userMap[p.picked_by] || "Unknown";
                if (!draftOrder.includes(mgr)) draftOrder.push(mgr);
                const rnd = p.round || 1;
                if (!byRound[rnd]) byRound[rnd] = [];
                byRound[rnd].push({
                  player: `${p.metadata?.first_name || ""} ${p.metadata?.last_name || ""}`.trim(),
                  pos: p.metadata?.position || "?",
                  manager: mgr,
                });
              });
              const maxRound = Math.max(...Object.keys(byRound).map(Number), 0);
              const rounds: DraftCell[][] = [];
              for (let r = 1; r <= maxRound; r++) rounds.push(byRound[r] || []);
              boards.push({ year: season, draftOrder, rounds });
            }
            currentLeagueId = lg.previous_league_id;
          }
          boards.sort((a, b) => b.year - a.year);
          setDraftBoards(boards);
        } catch (e) {
          console.warn("Draft history load failed", e);
        }

        // Values
        let playerMap: Record<string, { name: string; value: number; position: string }> = {};
        if (valueSource === "fantasycalc") {
          try {
            const isSf = format === "sf_tep";
            const fcUrl = `https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=${isSf ? 2 : 1}&numTeams=10&ppr=0.5`;
            const fcRes = await fetch(fcUrl);
            const fcData = await fcRes.json();
            playerMap = Object.fromEntries(
              (fcData || []).map((p: any) => [
                p.player?.sleeperId || String(p.player?.id || ""),
                { name: p.player?.name || "Unknown", value: p.value || 0, position: p.player?.position || "UNK" },
              ])
            );
          } catch (e) {
            console.warn("FantasyCalc failed", e);
          }
        } else {
          const valueKey = format === "sf_tep" ? "sf_dynasty" : "non_sf_dynasty";
          playerMap = Object.fromEntries(
            (valuesData.players || []).map((p: any) => [
              p.id,
              { name: p.name || "Unknown", value: p.value?.[valueKey] || 0, position: p.position || "UNK" },
            ])
          );
        }

        const sleeperName = (id: string) => {
          const sp = sleeperPlayersData[id];
          if (sp) return `${sp.first_name || ""} ${sp.last_name || ""}`.trim();
          return playerMap[id]?.name || id;
        };

        const userMap = Object.fromEntries(users.map((u: any) => [u.user_id, u]));
        const teamByRoster = Object.fromEntries(
          rosters.map((r: any) => {
            const user = userMap[r.owner_id] || {};
            return [r.roster_id, user.metadata?.team_name || user.display_name || "Unknown"];
          })
        );

        // Transactions
        const allItems: TransactionItem[] = [];
        const txCountByTeam: Record<string, number> = {};
        for (let w = 1; w <= week; w++) {
          try {
            const txRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${w}`);
            const txs = await txRes.json();
            if (Array.isArray(txs)) {
              txs.forEach((tx: any) => {
                if (tx.status !== "complete") return;
                const created = tx.created || tx.status_updated || 0;
                const rosterIds = tx.roster_ids || [];
                const teamNames = rosterIds.map((id: number) => teamByRoster[id] || "Unknown");
                if (tx.type === "trade" && teamNames.length >= 2) {
                  const sides: TradeSide[] = teamNames.map((teamName: string, idx: number) => {
                    const received: string[] = [];
                    const gave: string[] = [];
                    Object.keys(tx.adds || {}).forEach((id) => { if (tx.adds[id] === rosterIds[idx]) received.push(sleeperName(id)); });
                    Object.keys(tx.drops || {}).forEach((id) => { if (tx.drops[id] === rosterIds[idx]) gave.push(sleeperName(id)); });
                    (tx.draft_picks || []).forEach((pick: any) => {
                      if (pick.owner_id === rosterIds[idx]) received.push(formatPick(pick));
                      if (pick.previous_owner_id === rosterIds[idx]) gave.push(formatPick(pick));
                    });
                    (tx.waiver_budget || []).forEach((wb: any) => {
                      const amount = `$${wb.amount} FAAB`;
                      if (wb.sender === rosterIds[idx]) gave.push(amount);
                      if (wb.receiver === rosterIds[idx]) received.push(amount);
                    });
                    return { team: teamName, received, gave };
                  });
                  allItems.push({ kind: "trade", week: w, sides, created });
                  teamNames.forEach((name: string) => { txCountByTeam[name] = (txCountByTeam[name] || 0) + 1; });
                } else {
                  const teamName = teamNames[0] || "Unknown";
                  const adds = Object.keys(tx.adds || {}).map(sleeperName);
                  const drops = Object.keys(tx.drops || {}).map(sleeperName);
                  let faab: number | undefined;
                  if (tx.waiver_budget && tx.waiver_budget.length) {
                    faab = tx.waiver_budget[0].amount;
                  } else if (tx.metadata?.amount) {
                    faab = Number(tx.metadata.amount);
                  }
                  allItems.push({ kind: "move", week: w, team: teamName, type: tx.type, adds, drops, created, faab });
                  if (tx.type === "waiver" || tx.type === "free_agent") txCountByTeam[teamName] = (txCountByTeam[teamName] || 0) + 1;
                }
              });
            }
          } catch (e) {
            console.warn(`Week ${w} transactions failed`, e);
          }
        }
        allItems.sort((a, b) => b.created - a.created);
        setTransactions(allItems);

        // Standings
        const data: Team[] = rosters.map((r: any) => {
          const user = userMap[r.owner_id] || {};
          const teamName = user.metadata?.team_name || user.display_name || "Unknown";
          const s = r.settings || {};
          const players = (r.players || []).map((id: string) => playerMap[id]).filter(Boolean);
          let qb = 0, rb = 0, wr = 0, te = 0;
          players.forEach((p: any) => {
            if (p.position === "QB") qb += p.value;
            else if (p.position === "RB") rb += p.value;
            else if (p.position === "WR") wr += p.value;
            else if (p.position === "TE") te += p.value;
          });
          const total = qb + rb + wr + te;
          const { starterValue, starterPlayers, benchPlayers } = calcStartersAndBench(players);
          return {
            team: teamName, ownerId: r.owner_id, wins: s.wins || 0, losses: s.losses || 0,
            pf: (s.fpts || 0) + (s.fpts_decimal || 0) / 100,
            pa: (s.fpts_against || 0) + (s.fpts_against_decimal || 0) / 100,
            maxPf: (s.ppts || 0) + (s.ppts_decimal || 0) / 100,
            value: total || 0, qb, rb, wr, te,
            starters: starterValue || 0, bench: total - starterValue, starterPlayers, benchPlayers,
            totalTransactions: txCountByTeam[teamName] || 0,
          };
        });
        setStandings(data.sort((a, b) => b.wins - a.wins || b.pf - a.pf));

        // Projections
        let projMap: Record<string, number> = {};
        try {
          const projRes = await fetch(`/api/projections?week=${week}`);
          if (projRes.ok) {
            const projData = await projRes.json();
            (projData || []).forEach((p: any) => {
              const id = p.player_id;
              const pts = Number(p.stats?.pts_half_ppr || p.stats?.pts_ppr || 0);
              if (id) projMap[id] = pts;
            });
          }
        } catch (e) {
          console.warn("Projections failed", e);
        }

        // Matchups (simpler pairing)
        let pairs: MatchupPair[] = [];
        try {
          const matchupsRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
          if (matchupsRes.ok) {
            const matchupData = await matchupsRes.json();
            if (Array.isArray(matchupData) && matchupData.length > 0) {
              const byMatchup: Record<number, any[]> = {};
              matchupData.forEach((m: any) => {
                if (!byMatchup[m.matchup_id]) byMatchup[m.matchup_id] = [];
                byMatchup[m.matchup_id].push(m);
              });

              Object.values(byMatchup).forEach((group) => {
                if (group.length >= 2) {
                  const [m1, m2] = group;
                  pairs.push({
                    team1: teamByRoster[m1.roster_id] || "Unknown",
                    team2: teamByRoster[m2.roster_id] || "Unknown",
                    points1: Number(m1.points) || 0,
                    points2: Number(m2.points) || 0,
                    proj1: 0,
                    proj2: 0,
                  });
                }
              });
            }
          }
        } catch (e) {
          console.warn("Matchups failed", e);
        }
        setMatchups(pairs);

        // News
        try {
          const newsRes = await fetch("/api/news");
          if (newsRes.ok) {
            const newsData = await newsRes.json();
            setNews((newsData.items || []).map((n: any) => ({
              title: n.title,
              link: n.link,
              created: n.created_formated || n.created || "",
            })));
          } else {
            setNews([]);
          }
        } catch (e) {
          console.warn("News failed", e);
          setNews([]);
        }

        setSelectedTeam(null);
      } catch (e) {
        console.error("Main load failed", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [format, valueSource]);

  function toggleSort(key: "pf" | "pa" | "maxPf" | "totalTransactions") {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }
  const sorted = [...standings].sort((a, b) => {
    if (!sortKey) return 0;
    return sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
  });
  const arrow = (key: "pf" | "pa" | "maxPf" | "totalTransactions") => sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : "";
  const valueSorted = [...standings].sort((a, b) => (b.value || 0) - (a.value || 0));
  const maxVal = Math.max(...valueSorted.map(t => t.value || 0), 1);
  const bar = (val: number, color: string) => (
    <div className="w-16 md:w-24 bg-zinc-800 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, ((val || 0) / maxVal) * 100)}%` }} />
    </div>
  );
  const teams = ["all", ...new Set(standings.map(t => t.team))];
  const playerSuggestions = useMemo(() => {
    if (playerSearch.length < 3) return [];
    const q = playerSearch.toLowerCase();
    return Object.values(sleeperPlayers).filter((p: any) => p.full_name && p.full_name.toLowerCase().includes(q)).slice(0, 8).map((p: any) => p.full_name);
  }, [playerSearch, sleeperPlayers]);
  const filteredTx = useMemo(() => {
    return transactions.filter((item) => {
      if (txTypeFilter === "trade" && item.kind !== "trade") return false;
      if (txTypeFilter === "waiver_fa" && item.kind !== "move") return false;
      if (txFilter !== "all") {
        if (item.kind === "trade") { if (!item.sides.some((s) => s.team === txFilter)) return false; }
        else if (item.team !== txFilter) return false;
      }
      if (selectedPlayer) {
        const names = item.kind === "trade" ? item.sides.flatMap((s) => [...s.received, ...s.gave]) : [...item.adds, ...item.drops];
        if (!names.some((n) => n.toLowerCase().includes(selectedPlayer.toLowerCase()))) return false;
      }
      return true;
    });
  }, [transactions, txFilter, txTypeFilter, selectedPlayer]);
  const totalPages = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const safePage = Math.min(txPage, totalPages);
  const pagedTx = filteredTx.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setTxPage(1); }, [txFilter, txTypeFilter, selectedPlayer]);

  const navItems = [
    { id: "standings" as Section, label: "Standings & Matchups" },
    { id: "transactions" as Section, label: "Transactions" },
    { id: "values" as Section, label: "Team Values" },
    { id: "history" as Section, label: "Draft History" },
    { id: "charter" as Section, label: "League Charter" },
  ];

  const handleNavClick = (id: Section) => {
    setSection(id);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-teal-400">Loading league data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900/95 border-b border-teal-900/40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-zinc-800"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-teal-300 truncate">Champion Of The Sun</span>
        <div className="w-10" />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 border-r border-teal-900/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-6 shrink-0
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-teal-300 to-zinc-100 bg-clip-text text-transparent">
              Dynasty Fantasy Football: Champion Of The Sun
            </h1>
            <p className="text-xs text-teal-500/70 mt-1">2026</p>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 text-zinc-400 hover:text-white" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all min-h-[44px] ${
                section === item.id ? "bg-teal-600 text-white shadow-lg shadow-teal-900/50" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-3 md:p-8 overflow-auto pt-16 md:pt-8">
        {section === "standings" && (
          <div>
            <PageTitle>Standings & Matchups</PageTitle>

            <div className="md:hidden space-y-3 mb-8">
              {sorted.map((team, i) => (
                <div key={team.team} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">{teamInitials(team.team)}</span>
                      <span className="font-medium">{team.team}</span>
                    </div>
                    <span className="text-sm text-zinc-400">#{i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>W-L: <span className="font-medium">{team.wins}-{team.losses}</span></div>
                    <div>PF: <span className="font-medium">{team.pf.toFixed(1)}</span></div>
                    <div>PA: <span className="font-medium">{team.pa.toFixed(1)}</span></div>
                    <div>Max PF: <span className="font-medium">{team.maxPf.toFixed(1)}</span></div>
                    <div className="col-span-2">TrnsAct: <span className="font-medium">{team.totalTransactions}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-zinc-900/70 border border-teal-900/30 rounded-2xl overflow-hidden shadow-xl shadow-black/30 mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-4 md:px-6 py-3 text-left font-medium">RK</th>
                      <th className="px-4 md:px-6 py-3 text-left font-medium">TEAM</th>
                      <th className="px-4 md:px-6 py-3 text-right font-medium">W-L</th>
                      <th className="px-4 md:px-6 py-3 text-right font-medium cursor-pointer hover:text-white" onClick={() => toggleSort("pf")}>PF{arrow("pf")}</th>
                      <th className="px-4 md:px-6 py-3 text-right font-medium cursor-pointer hover:text-white" onClick={() => toggleSort("pa")}>PA{arrow("pa")}</th>
                      <th className="px-4 md:px-6 py-3 text-right font-medium cursor-pointer hover:text-white" onClick={() => toggleSort("maxPf")}>MAX PF{arrow("maxPf")}</th>
                      <th className="px-4 md:px-6 py-3 text-right font-medium cursor-pointer hover:text-white" onClick={() => toggleSort("totalTransactions")}>TrnsAct{arrow("totalTransactions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((team, i) => (
                      <tr key={team.team} className={`border-b border-zinc-800/50 last:border-0 hover:bg-teal-950/30 transition h-14 ${i % 2 === 1 ? "bg-zinc-800/40" : "bg-zinc-900/20"}`}>
                        <td className="px-4 md:px-6 py-0 text-zinc-400 align-middle">{i + 1}</td>
                        <td className="px-4 md:px-6 py-0 font-medium align-middle">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold shrink-0">{teamInitials(team.team)}</span>
                            <span className="leading-tight">{team.team}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-0 text-right align-middle">{team.wins}-{team.losses}</td>
                        <td className="px-4 md:px-6 py-0 text-right align-middle">{team.pf.toFixed(1)}</td>
                        <td className="px-4 md:px-6 py-0 text-right align-middle">{team.pa.toFixed(1)}</td>
                        <td className="px-4 md:px-6 py-0 text-right text-zinc-400 align-middle">{team.maxPf.toFixed(1)}</td>
                        <td className="px-4 md:px-6 py-0 text-right align-middle">{team.totalTransactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-teal-300">Week {currentWeek} Matchups</h3>
              <p className="text-xs text-zinc-500 mt-1">Projections: Sleeper weekly half-PPR (full week)</p>
            </div>
            <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto mb-10">
              {matchups.length === 0 && <p className="text-center text-zinc-500">No matchups loaded yet.</p>}
              {matchups.map((m, i) => (
                <div key={i} className="bg-zinc-900/70 border-2 border-teal-800/60 rounded-2xl p-4 md:p-5 hover:border-teal-500 transition shadow-lg">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex-1 text-center sm:text-right">
                      <div className="font-medium flex items-center justify-center sm:justify-end gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs">{teamInitials(m.team1)}</span>
                        {m.team1}
                      </div>
                      <div className="text-2xl font-bold mt-1 text-teal-300">{(m.points1 || 0).toFixed(1)}</div>
                      <div className="text-xs text-zinc-500">Proj {m.proj1.toFixed(1)}</div>
                    </div>
                    <div className="text-zinc-500 text-sm font-medium">VS</div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-medium flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs">{teamInitials(m.team2)}</span>
                        {m.team2}
                      </div>
                      <div className="text-2xl font-bold mt-1 text-teal-300">{(m.points2 || 0).toFixed(1)}</div>
                      <div className="text-xs text-zinc-500">Proj {m.proj2.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold mb-4 text-center text-teal-300">Fantasy News</h3>
              <div className="bg-zinc-900/70 border border-teal-900/30 rounded-2xl p-4 md:p-5 space-y-3">
                {news.length === 0 && <p className="text-sm text-zinc-500 text-center">No news available.</p>}
                {news.map((n, i) => (
                  <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block text-sm hover:text-teal-300 transition border-b border-zinc-800/50 last:border-0 pb-2">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-zinc-500">{n.created}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "transactions" && (
          <div>
            <PageTitle>Transactions</PageTitle>
            <div className="mb-4 flex flex-col gap-3">
              <select value={txFilter} onChange={(e) => setTxFilter(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm">
                {teams.map((t) => <option key={t} value={t}>{t === "all" ? "All Teams" : t}</option>)}
              </select>
              <select value={txTypeFilter} onChange={(e) => setTxTypeFilter(e.target.value as TxTypeFilter)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm">
                <option value="all">All Types</option>
                <option value="waiver_fa">Waiver & Free Agent</option>
                <option value="trade">Trades</option>
              </select>
            </div>
            <div className="mb-4 relative">
              <input type="text" placeholder="Search player (3+ letters)..." value={playerSearch} onChange={(e) => { setPlayerSearch(e.target.value); setSelectedPlayer(null); }} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm" />
              {playerSuggestions.length > 0 && !selectedPlayer && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {playerSuggestions.map((name) => (
                    <button key={name} onClick={() => { setSelectedPlayer(name); setPlayerSearch(name); }} className="block w-full text-left px-4 py-3 text-sm hover:bg-zinc-800">{name}</button>
                  ))}
                </div>
              )}
              {selectedPlayer && <button onClick={() => { setSelectedPlayer(null); setPlayerSearch(""); }} className="mt-2 text-xs text-teal-400">Clear ({selectedPlayer})</button>}
            </div>
            <div className="space-y-3">
              {pagedTx.length === 0 && <p className="text-zinc-500 text-center">No transactions found.</p>}
              {pagedTx.map((item, i) => {
                if (item.kind === "trade") {
                  return (
                    <div key={i} className="bg-zinc-800/60 border border-amber-900/40 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                        <span>Week {item.week}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${badgeColor("trade")}`}>TRADE</span>
                      </div>
                      {item.sides.map((side, idx) => (
                        <div key={idx} className="border border-zinc-700 rounded-lg p-3 mb-2 last:mb-0 bg-zinc-900/40">
                          <div className="font-medium mb-1 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px]">{teamInitials(side.team)}</span>
                            {side.team}
                          </div>
                          {(side.received || []).length > 0 && <div className="text-sm text-teal-400">+ {side.received.join(", ")}</div>}
                          {(side.gave || []).length > 0 && <div className="text-sm text-zinc-400">- {side.gave.join(", ")}</div>}
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={i} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between text-sm items-center mb-1">
                      <span className="font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px]">{teamInitials(item.team)}</span>
                        {item.team}
                      </span>
                      <span className="text-zinc-500 text-xs">Week {item.week} · {item.type}</span>
                    </div>
                    {item.adds.length > 0 && <div className="text-sm text-teal-400">+ {item.adds.join(", ")}</div>}
                    {item.drops.length > 0 && <div className="text-sm text-zinc-400">- {item.drops.join(", ")}</div>}
                    {item.faab !== undefined && item.faab > 0 && <div className="text-sm text-amber-300">${item.faab} FAAB</div>}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 text-sm">
                <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-4 py-2 rounded border border-zinc-700 disabled:opacity-40">‹</button>
                <span>Page {safePage}</span>
                <button onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-4 py-2 rounded border border-zinc-700 disabled:opacity-40">›</button>
              </div>
            )}
          </div>
        )}

        {section === "values" && (
          <div>
            <PageTitle>Team Values</PageTitle>
            <div className="flex flex-col gap-4 mb-6 items-center">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">League Type</span>
                <div className="inline-flex rounded-lg border border-teal-800 bg-zinc-800 p-1">
                  <button onClick={() => setFormat("sf_tep")} className={`px-3 py-1.5 text-xs rounded-md ${format === "sf_tep" ? "bg-teal-600 text-white" : "text-zinc-400"}`}>SF + TEP</button>
                  <button onClick={() => setFormat("1qb_notep")} className={`px-3 py-1.5 text-xs rounded-md ${format === "1qb_notep" ? "bg-teal-600 text-white" : "text-zinc-400"}`}>1QB</button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-400">Values From</span>
                <div className="inline-flex rounded-lg border border-teal-800 bg-zinc-800 p-1">
                  <button onClick={() => setValueSource("statsguy")} className={`px-3 py-1.5 text-xs rounded-md ${valueSource === "statsguy" ? "bg-teal-600 text-white" : "text-zinc-400"}`}>Stats Guy</button>
                  <button onClick={() => setValueSource("fantasycalc")} className={`px-3 py-1.5 text-xs rounded-md ${valueSource === "fantasycalc" ? "bg-teal-600 text-white" : "text-zinc-400"}`}>FantasyCalc</button>
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-3 mb-6">
              {valueSorted.map((team, i) => (
                <div key={team.team} onClick={() => setSelectedTeam(team)} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">{teamInitials(team.team)}</span>
                      <span className="font-medium">{team.team}</span>
                    </div>
                    <span className="text-teal-400 font-medium">{(team.value || 0).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs text-center">
                    <div>QB<br/>{(team.qb || 0).toLocaleString()}</div>
                    <div>RB<br/>{(team.rb || 0).toLocaleString()}</div>
                    <div>WR<br/>{(team.wr || 0).toLocaleString()}</div>
                    <div>TE<br/>{(team.te || 0).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-zinc-900/70 border border-teal-900/30 rounded-2xl p-4 md:p-6 shadow-xl mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-800">
                      <th className="px-4 py-3 text-left">RK</th>
                      <th className="px-4 py-3 text-left">TEAM</th>
                      <th className="px-4 py-3 text-right">TOTAL</th>
                      <th className="px-4 py-3 text-right">QB</th>
                      <th className="px-4 py-3 text-right">RB</th>
                      <th className="px-4 py-3 text-right">WR</th>
                      <th className="px-4 py-3 text-right">TE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueSorted.map((team, i) => (
                      <tr key={team.team} onClick={() => setSelectedTeam(team)} className={`border-b border-zinc-800/50 hover:bg-teal-950/30 cursor-pointer h-16 ${i % 2 === 1 ? "bg-zinc-800/40" : ""} ${selectedTeam?.team === team.team ? "bg-teal-950/40" : ""}`}>
                        <td className="px-4 py-0 text-zinc-400 align-middle">{i + 1}</td>
                        <td className="px-4 py-0 font-medium align-middle">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold">{teamInitials(team.team)}</span>
                            {team.team}
                          </div>
                        </td>
                        <td className="px-4 py-0 text-right font-medium text-teal-400 align-middle">{(team.value || 0).toLocaleString()}</td>
                        <td className="px-4 py-0 text-right align-middle"><div>{(team.qb || 0).toLocaleString()}</div>{bar(team.qb || 0, "bg-blue-500")}</td>
                        <td className="px-4 py-0 text-right align-middle"><div>{(team.rb || 0).toLocaleString()}</div>{bar(team.rb || 0, "bg-green-500")}</td>
                        <td className="px-4 py-0 text-right align-middle"><div>{(team.wr || 0).toLocaleString()}</div>{bar(team.wr || 0, "bg-emerald-500")}</td>
                        <td className="px-4 py-0 text-right align-middle"><div>{(team.te || 0).toLocaleString()}</div>{bar(team.te || 0, "bg-amber-500")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-6">
              Values from {valueSource === "fantasycalc" ? "FantasyCalc" : "Stats Guy Fantasy"}. Draft picks not included.
            </p>

            <div className="flex flex-col gap-4">
              <div className="border border-teal-900/40 rounded-xl overflow-hidden bg-zinc-800/40">
                <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-900/50">
                  <h3 className="font-semibold text-teal-300">Starters vs Bench</h3>
                </div>
                <div className="divide-y divide-zinc-700/50">
                  {valueSorted.map((team) => (
                    <div key={team.team} onClick={() => setSelectedTeam(team)} className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-teal-950/30 ${selectedTeam?.team === team.team ? "bg-teal-950/50" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs">{teamInitials(team.team)}</span>
                        <span className="text-sm">{team.team}</span>
                      </div>
                      <div className="text-sm text-right">
                        <span className="text-teal-400">{(team.starters || 0).toLocaleString()}</span>
                        <span className="text-zinc-500 mx-1">/</span>
                        <span className="text-zinc-400">{(team.bench || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTeam && (
                <div className="border border-teal-900/40 rounded-xl p-4 bg-zinc-800/30">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-teal-200">
                    <span className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs">{teamInitials(selectedTeam.team)}</span>
                    {selectedTeam.team}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-teal-400 font-medium mb-1 text-sm">Starters</h4>
                      {selectedTeam.starterPlayers.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-zinc-700/50">
                          <span>{p.name} ({p.position})</span>
                          <span className="text-teal-300">{p.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-zinc-400 font-medium mb-1 text-sm">Bench</h4>
                      {selectedTeam.benchPlayers.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-zinc-700/50">
                          <span>{p.name} ({p.position})</span>
                          <span>{p.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {section === "history" && (
          <div>
            <PageTitle>Draft History</PageTitle>
            <div className="flex flex-wrap justify-center gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600" /> QB</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600" /> RB</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-600" /> WR</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> TE</span>
            </div>
            <div className="space-y-6">
              {draftBoards.map((board) => (
                <div key={board.year} className="bg-zinc-900/70 border border-teal-900/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-2 text-teal-300">{board.year} Rookie Draft</h3>
                  <div className="text-xs text-zinc-400 mb-3 space-y-1">
                    <div>{board.draftOrder.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join(" · ")}</div>
                    <div>{board.draftOrder.slice(5, 10).map((m, i) => `${i + 6}. ${m}`).join(" · ")}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-[10px] border-collapse">
                      <thead>
                        <tr>
                          <th className="px-1 py-1 text-zinc-500 w-6">Rd</th>
                          {(board.rounds[0] || []).map((_, idx) => (
                            <th key={idx} className="px-1 py-1 text-center text-teal-200 w-16">P{idx + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {board.rounds.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="px-1 py-1 text-zinc-500">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-0.5 py-0.5">
                                <div className={`h-12 w-14 rounded flex flex-col items-center justify-center text-center leading-tight ${posColor[cell.pos] || "bg-zinc-700"}`}>
                                  <div className="font-medium text-white text-[8px] px-0.5">{cell.player.split(" ").pop()}</div>
                                  <div className="text-[7px] text-white/80">{cell.manager.split(" ")[0]}</div>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "charter" && (
          <div>
            <PageTitle>League Charter</PageTitle>
            <p className="text-xs text-zinc-500 text-center mb-6">Last formal rules update: September 2, 2022. Rules are now decided yearly at the draft.</p>
            <div className="space-y-6 text-sm leading-relaxed text-zinc-300 bg-zinc-900/50 border border-teal-900/30 rounded-xl p-4">
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article I – Purpose & Members</h3>
                <p>This document outlines the league settings and rules. Amendments may be made upon league vote.</p>
                <p className="mt-2"><strong>Executive Committee:</strong> Commissioner (Jared), Vice Commissioner (Billy), Tie Break Vote (Chris).</p>
                <p className="mt-1"><strong>League Members:</strong> Billy, Jared, New Dave, Chris, Beth, Charles, Andrew, Henry, Lucas, Nick.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article II – Financials</h3>
                <p><strong>League Dues:</strong> $75, due at or before the draft.</p>
                <p className="mt-1"><strong>Payouts (10 teams):</strong> 1st $400 · 2nd $200 · 3rd $150.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article III – League Settings</h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Dynasty · 10 teams · 0.5 PPR</li>
                  <li>Roster: QB, 2WR, 2RB, TE, 2FLEX, 12BN, 2IR</li>
                  <li>Playoffs: 4 teams, Weeks 16–17</li>
                </ul>
              </section>
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article IV – Dynasty Settings</h3>
                <p className="text-xs">All players kept. No offseason free agent adds. Waivers lock after championship through rookie draft. Trades allowed in offseason.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article V – Player Management</h3>
                <p className="text-xs"><strong>Rookie Draft:</strong> Lottery for top 3, then reverse standings. 3 rounds.</p>
                <p className="text-xs mt-1"><strong>Waivers:</strong> FAAB · 2-day · Weekly Tuesday.</p>
                <p className="text-xs mt-1"><strong>Trades:</strong> Deadline Week 11 · FAAB trading allowed · Traded 1sts require next year’s dues.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-teal-300 mb-1">Article VI – Ownership</h3>
                <p className="text-xs">Rule changes by majority vote. Tanking not tolerated. Owners must set lineups.</p>
              </section>
              <p className="text-xs text-zinc-500 pt-2">Contact the commissioner for the complete document.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
