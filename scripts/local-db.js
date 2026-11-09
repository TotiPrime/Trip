import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function localDatabase() {
  const db = new DatabaseSync(':memory:');
  for (const name of ['0000_reservations','0001_interactive_plan','0002_customer_profiles','0003_requests_without_table_hold']) {
    db.exec(readFileSync(new URL('../drizzle/'+name+'.sql',import.meta.url),'utf8'));
  }
  let queue = Promise.resolve();
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {bind(...args) {
        return {
          sql,
          first: async () => stmt.get(...args) ?? null,
          all: async () => ({results:stmt.all(...args)}),
          run: async () => ({meta:stmt.run(...args)})
        };
      }};
    },
    batch(statements) {
      const batch = queue.then(async () => {
        db.exec('BEGIN');
        try {
          const results = [];
          for (const stmt of statements) results.push(await (/^SELECT /i.test(stmt.sql) ? stmt.all() : stmt.run()));
          db.exec('COMMIT');
          return results;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      });
      queue = batch.catch(() => {});
      return batch;
    }
  };
}
