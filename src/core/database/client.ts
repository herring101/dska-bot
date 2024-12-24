import { PrismaClient } from "@prisma/client";
import { Logger } from "winston";

export class Database {
  private static instance: Database;
  private prisma: PrismaClient;
  private logger?: Logger;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "stdout",
          level: "error",
        },
        {
          emit: "stdout",
          level: "info",
        },
        {
          emit: "stdout",
          level: "warn",
        },
      ],
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger?.info("Database connected successfully");
    } catch (error) {
      this.logger?.error("Failed to connect to database", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }
}

// エクスポートするインスタンス
export const db = Database.getInstance();
