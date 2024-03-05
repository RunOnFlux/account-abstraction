import z from "zod"
import { Address } from "abitype/zod"
import type { Transport } from "viem"
import { isHex } from "viem"
import type { SmartAccountSigner, SupportedTransports } from "@alchemy/aa-core"
import { ChainSchema, createPublicErc4337ClientSchema, isSigner } from "@alchemy/aa-core"

export const createBaseSmartAccountParamsSchema = <
  TTransport extends SupportedTransports = Transport,
  TOwner extends SmartAccountSigner | undefined = SmartAccountSigner | undefined,
>() =>
  z.object({
    rpcClient: z.union([z.string(), createPublicErc4337ClientSchema<TTransport>()]),
    factoryAddress: Address,
    owner: z
      .custom<TOwner>((owner) => (owner ? isSigner(owner) : undefined))
      .optional()
      .describe("Optional override for the account's owner."),
    entryPointAddress: Address.optional(),
    chain: ChainSchema,
    accountAddress: Address.optional().describe("Optional override for the account address."),
    initCode: z.string().refine(isHex, "initCode must be a valid hex.").optional().describe("Optional override for the account init code."),
  })

export const MultiSigSmartAccountParamsSchema = <
  TTransport extends SupportedTransports = Transport,
  TOwner extends SmartAccountSigner = SmartAccountSigner,
>() =>
  createBaseSmartAccountParamsSchema<TTransport, TOwner>().extend({
    combinedPubKeys: z.array(z.string()).optional(),
    salt: z.string().optional(),
    factoryAddress: z.string().optional().describe("Optional override for the factory address."),
  })

export type MultiSigAccountAbstractionParams<
  TTransport extends SupportedTransports = Transport,
  TOwner extends SmartAccountSigner = SmartAccountSigner,
> = z.input<ReturnType<typeof MultiSigSmartAccountParamsSchema<TTransport, TOwner>>>
