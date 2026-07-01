import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://marketing:marketing_pass@localhost:5432/marketing",
  max: 5,
});

export default pool;
