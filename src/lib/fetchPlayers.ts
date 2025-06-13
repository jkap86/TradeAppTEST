import pool from "./pool";

export const fetchPlayers = async (identifier: string) => {
  const identifier_array = identifier.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  const query = `
        SELECT *
        FROM db
        WHERE user_id = $1 AND league_id = $2 AND lm_user_id = $3
    `;

  const values = [user_id, league_id, lm_user_id];

  try {
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (err) {
    return err;
  }
};
