import {
  Axiom,
  AxiomConfig,
  ValidationWitnessResponse,
} from "@axiom-crypto/core";
import { ethers } from "ethers";
import { Constants } from "./shared/constants";
import { abi as AxiomV1QueryAbi } from "./lib/abi/AxiomV1Query.json";
import { abi as my_abi } from "./abi.json";
import dotenv from "dotenv";
dotenv.config();

let providerUri =
  "https://eth-goerli.g.alchemy.com/v2/q4W0PaEugB3k4NDVqEr8M1Qy87FAd8a3";

const config: AxiomConfig = {
  providerUri,
  version: "v1",
  chainId: 5, // Goerli; defaults to 1 (Ethereum Mainnet)
  mock: true, // builds proofs without utilizing actual Prover resources
};
const ax = new Axiom(config);
const UNI_V3_ADDR = "0x297FFb1BbAc2F906A7c8f10808E2E48825CF5b7f";
const currentQueryBlock = 9852684;
const N_DATA_POINTS = 64;
const BLOCK_SAMPLING_RATE = 12 * 5 * 10;
const SLOT = 0;

// Proof for SLOT 0
// https://explorer.axiom.xyz/v1/goerli/query/0x9313ad04234460c26ce72138da52bdf636aa9c3f34b62e0dc8b4c7a52cafb797
// Proof for SLOT 1
//https://explorer.axiom.xyz/v1/goerli/query/0x2111832ee39104a60c944f63ab70eba9196fd3faa0cecbfafc926b969ed96da0

async function newQuery(blockNum: number) {
  const qb = ax.newQueryBuilder();

  for (let i = 0; i < N_DATA_POINTS; i++) {
    await qb.append({
      blockNumber: blockNum - i * BLOCK_SAMPLING_RATE,
      address: UNI_V3_ADDR,
      slot: SLOT,
    });
  }

  const { keccakQueryResponse, queryHash, query } = await qb.build();
  console.log("keccakQueryResponse:", keccakQueryResponse);
  console.log("Query hash:", queryHash);
  return { keccakQueryResponse, queryHash, query };
}

async function main() {
  let signer: ethers.Signer;

  const provider = new ethers.JsonRpcProvider(providerUri);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
  signer = wallet;

  const axiomV1Query = new ethers.Contract(
    Constants.AxiomV1QueryAddress,
    AxiomV1QueryAbi,
    signer
  );

  const { keccakQueryResponse, query } = await newQuery(currentQueryBlock);

  let responseTree = await ax.query.getResponseTreeForKeccakQueryResponse(
    keccakQueryResponse
  );

  const keccakBlockResponse = responseTree.blockTree.getHexRoot();
  const keccakAccountResponse = responseTree.accountTree.getHexRoot();
  const keccakStorageResponse = responseTree.storageTree.getHexRoot();

  let storageWitnesses: ValidationWitnessResponse[] = new Array();
  for (let i = 0; i < N_DATA_POINTS; i++) {
    storageWitnesses[i] = ax.query.getValidationWitness(
      responseTree,
      currentQueryBlock - i * BLOCK_SAMPLING_RATE,
      UNI_V3_ADDR,
      SLOT
    )!;
  }
  console.log(storageWitnesses);
}

main();
