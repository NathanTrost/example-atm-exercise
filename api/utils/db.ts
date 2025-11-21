import pg from "pg";

export type PoolClient = pg.PoolClient;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (
  query: string,
  values: any[] = []
): Promise<pg.QueryResult<any>> => {
  return pool.query(query, values);
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { pool };
