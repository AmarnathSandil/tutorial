const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
    return {
        playerId: dbObject.player_id,
        playerName: dbObject.player_name,
    };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
    return {
        matchId: dbObject.match_id,
        match: dbObject.match,
        year: dbObject.year,
    };
};



app.get("/players/", async (request,response) => {
    const getPlayersQuery = `
        SELECT *
        FROM player_details;
    `;
    const playersArray = await db.all(getPlayersQuery);
    response.send(
        playersArray.map((eachPlayer) => 
            convertPlayerDbObjectToResponseObject(eachPlayer)
        )
    );
});

app.get("/players/:playerId/", async (request,response) => {
    const { playerId } = request.params;
    const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId}
    `;
    const player = await db.get(getPlayerQuery);
    response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request,response) => {
    const {playerId} = request.params;
    const {playerName} = request.body;
    
    const updatePlayerQuery = `
        UPDATE 
            player_details
        SET 
            player_name = "${playerName}"
        WHERE 
            player_id = ${playerId}    
    `;
    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request,response) => {
    const {matchId} = request.params;
    const getMatchQuery = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId}
    `;
    const match = await db.get(getMatchQuery);
    response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches",async (request,response) => {
    const {playerId} = request.params;
    const getMatchesQuery = `
        SELECT *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE player_id = ${playerId};
    `;
    const matches = await db.all(getMatchesQuery);
    response.send(
        matches.map((eachMatch) => 
            convertMatchDbObjectToResponseObject(eachMatch)
        )
    );
});

app.get("/matches/:matchId/players",async (request,response) => {
    const {matchId} = request.params;
    const getPlayersQuery = `
        SELECT *
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE match_id = ${matchId}
    `;

    const players = await db.all(getPlayersQuery)
    response.send(
        players.map((eachPlayer) => 
            convertPlayerDbObjectToResponseObject(eachPlayer)
        )
    );
});

app.get("/players/:playerId/playerScores", (request,response) => {
    const {playerId} = request.params;
    const getPlayerScoreQuery = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM
            player_match_score
        NATURAL JOIN 
            player_details
        WHERE 
            player_id = ${playerId}            
    `;
    const stats = await db.get(getPlayerScoreQuery);
    response.send(stats);
});

module.exports = app;