export default interface IDbConfig {
  dbName: string;
  dbUser: string;
  dbPass?: string;
  dbArn?: string;
  dbHost: string;
  dbRegion?: string;
  dbPort?: number;
  debug: boolean;
}
