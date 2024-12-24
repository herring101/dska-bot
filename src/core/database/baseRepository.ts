import { db } from "./client";
import { PrismaClient } from "@prisma/client";

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = db.getClient();
  }

  /**
   * トランザクションを実行する
   * @param fn トランザクション内で実行する関数
   */
  protected async transaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >
    ) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return await fn(tx);
    });
  }
}
