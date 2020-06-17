#!/usr/bin/env node

const axios = require("axios");
const root = "https://www.basketball-reference.com";
const fs = require("fs");

const { program } = require("commander");
program.version("0.0.1");

program
  .arguments("<name>")
  .option("-o, --output <filename>", "write the teamates to an output file")
  .action(async (name, { output }) => {
    console.log("getting streaks for " + name + "...");
    let matchupsWithRosters;
    try {
      matchupsWithRosters = require("./finals-matchups-with-rosters.json");
    } catch (e) {
      console.log("please run this command:");
      console.log("finals generate");
      process.exit(0);
    }
    const playedWithPlayer = await getPlayerTeamates(name);
    const streaks = getPlayedWithPlayerFinalsAndStreaks(
      playedWithPlayer,
      output,
      matchupsWithRosters
    );
    console.log(`${name} had teamates in these finals:`);
    console.log(streaks);
  });

program.command("generate").action(async () => {
  getFinalsTeamsAndRosters();
});

async function getFinalsTeamsAndRosters() {
  console.log("generating...");
  const res = await axios.get(`${root}/playoffs/`);
  const championRegex = /<td class="left " data-stat="champion" ><a href="(.*?.html)">([A-Za-z\S\s]*?)<\/a><\/td>/g;
  const runnerUpRegex = /<td class="left " data-stat="runnerup" ><a href="(.*?.html)">([A-Za-z\S\s]*?)<\/a><\/td>/g;
  const matchups = {};
  res.data.match(championRegex).forEach((champion) => {
    const url = champion.match(/href="(.*?.html)"/)[1];
    const year = champion.match(/\/(\d*?).html/)[1];
    const team = champion.match(
      /<a href=".*?.html">([A-Za-z\S\s]*?)<\/a><\/td>/
    )[1];
    matchups[year] = {
      champion: {
        name: team,
        url,
      },
    };
  });

  res.data.match(runnerUpRegex).forEach((runnerUp) => {
    const url = runnerUp.match(/href="(.*?.html)"/)[1];
    const year = runnerUp.match(/\/(\d*?).html/)[1];
    const team = runnerUp.match(
      /<a href=".*?.html">([A-Za-z\S\s]*?)<\/a><\/td>/
    )[1];
    matchups[year].runnerUp = {
      name: team,
      url,
    };
  });

  // eslint-disable-next-line no-undef
  await Promise.all(
    Object.keys(matchups).map(async (year) => {
      const championRoster = await getRoster(matchups[year].champion.url);
      const runnerUpRoster = await getRoster(matchups[year].runnerUp.url);

      matchups[year].champion.roster = championRoster;
      matchups[year].runnerUp.roster = runnerUpRoster;
    })
  );
  fs.writeFileSync(
    "finals-matchups-with-rosters.json",
    JSON.stringify(matchups, null, 2)
  );
}

async function getRoster(url) {
  const otherStuff = await axios
    .get(`${root}${url}`)
    .catch((e) => console.log(e));
  const playoffPlayersTableRegex = /<table[\s\S]*?id="playoffs_totals"[\s\S]*?>([\s\S]*?)<\/table>/;
  const table = otherStuff.data.match(playoffPlayersTableRegex)[1];
  const playerRegex = /data-stat="player" csk=".*?" ><a href=".*?\.html">(.*?)<\/a>/g;
  const players = table.match(playerRegex).map((player) => {
    return player.match(/<a href=".*?\.html">(.*?)<\/a>/)[1];
  });
  return players;
}

function getPlayedWithPlayerFinalsAndStreaks(
  playedWithArr,
  fileName,
  matchupsWithRosters
) {
  const playedWithByFinals = Object.keys(matchupsWithRosters).reduce(
    (acc, year) => {
      const playedWithChampion = acc[year].champion.roster.filter((player) =>
        playedWithArr.includes(player)
      );
      const playedWithRunnerUp = acc[year].runnerUp.roster.filter((player) =>
        playedWithArr.includes(player)
      );
      acc[year].champion.roster = playedWithChampion;
      acc[year].runnerUp.roster = playedWithRunnerUp;
      if (!playedWithChampion.length && !playedWithRunnerUp.length) {
        delete acc[year];
      }
      return acc;
    },
    matchupsWithRosters
  );
  let start, current;
  const streaks = Object.keys(playedWithByFinals).reduce(
    (streaks, year, index, arr) => {
      if (!start) {
        start = year;
        current = year;
      } else if (Number(year) - Number(current) === 1) {
        current = year;
        if (index === arr.length - 1) {
          streaks.push([start, current, Number(current) - Number(start)]);
        }
      } else if (start && current) {
        streaks.push([start, current, Number(current) - Number(start)]);
        start = year;
        current = year;
      }
      return streaks;
    },
    []
  );
  if (fileName) {
    fs.writeFileSync(
      fileName + ".json",
      JSON.stringify(
        {
          streaks,
          playedWithByFinals,
        },
        null,
        2
      )
    );
  }
  return streaks;
}

async function getPlayerTeamates(player) {
  const [first, last] = player.split(" ");
  const url = `https://www.basketball-reference.com/friv/teammates_and_opponents.fcgi?pid=${last
    .slice(0, 5)
    .toLowerCase()}${first
    .slice(0, 2)
    .toLowerCase()}01&idx=bbr__players&type=t`;
  const { data } = await axios.get(url);
  const teamatesTableRegex = /<table[\s\S]*?id="teammates-and-opponents"[\s\S]*?>([\s\S]*?)<\/table>/;
  const table = data.match(teamatesTableRegex)[1];
  const playerRegex = /<a href='\/players\/.*?.html'>(.*?)<\/a>/g;
  const players = table.match(playerRegex);
  const mungedPlayers = players.map(
    (player) => player.match(/<a href='\/players\/.*?.html'>(.*?)<\/a>/)[1]
  );
  return mungedPlayers;
}

program.parse(process.argv);
