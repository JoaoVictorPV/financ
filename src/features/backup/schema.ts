import { z } from "zod";

export const BackupSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  profile: z.object({
    currency: z.literal("BRL"),
    timezone: z.string(),
  }),
  tags: z.array(z.any()),
  account: z.any().nullable(),
  transactions: z.array(z.any()),
  creditCards: z.array(z.any()),
  installmentPlans: z.array(z.any()),
  cardPayments: z.array(z.any()),
  recurringTemplates: z.array(z.any()),
  investments: z.array(z.any()),
  investmentSnapshots: z.array(z.any()),
});

export type BackupV1 = z.infer<typeof BackupSchemaV1>;
