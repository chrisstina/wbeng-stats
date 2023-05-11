export interface StorageConfig {
  client: "mysql" | "pg" | "sqlite3" | "redis" | "mongo";
  connection: {} | string;
}
