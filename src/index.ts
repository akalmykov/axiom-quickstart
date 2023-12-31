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

let providerUri = process.env.TESTNET_PROVIDER_URI as string;
if (!providerUri || providerUri === "") {
  providerUri = "http://127.0.0.1:8545";
}
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
const SLOT = 1;

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

  // Since the AxiomV1Query contract saves the keccakQueryResponses in a mapping and the call will fail if the keccakQueryResponse already exists in that mapping.
  // Uncomment this block and execute it once per query. It will revert for the query it has been already called with
  // ===============================================================
  console.log("Sending query transaction...");
  let signerAddress = await signer.getAddress();
  const tx = await axiomV1Query.sendQuery(
    keccakQueryResponse,
    signerAddress,
    query,
    {
      value: ethers.parseEther("0.01"),
      gasPrice: ethers.parseUnits("100", "gwei"),
    }
  );
  console.log("tx", tx);
  // AxiomProxy https://goerli.etherscan.io/address/0x4fb202140c5319106f15706b1a69e441c9536306#events
  const res = await tx.wait();
  console.log("res", res);
  console.log("keccakQueryResponse", keccakQueryResponse);
  // ===============================================================

  // let responseTree = await ax.query.getResponseTreeForKeccakQueryResponse(
  //   keccakQueryResponse
  // );

  // const keccakBlockResponse = responseTree.blockTree.getHexRoot();
  // const keccakAccountResponse = responseTree.accountTree.getHexRoot();
  // const keccakStorageResponse = responseTree.storageTree.getHexRoot();

  // let storageWitnesses: ValidationWitnessResponse[] = new Array();
  // for (let i = 0; i < N_DATA_POINTS; i++) {
  //   storageWitnesses[i] = ax.query.getValidationWitness(
  //     responseTree,
  //     currentQueryBlock - i * BLOCK_SAMPLING_RATE,
  //     UNI_V3_ADDR,
  //     SLOT
  //   )!;
  // }
  // //console.log(storageWitnesses);

  // const storageProofData = {
  //   keccakBlockResponse,
  //   keccakAccountResponse,
  //   keccakStorageResponse,
  //   blockResponses: [...storageWitnesses.map((x) => x.blockResponse)],
  //   accountResponses: [...storageWitnesses.map((x) => x.accountResponse)],
  //   storageResponses: [...storageWitnesses.map((x) => x.storageResponse)],
  // };

  // const myContract = new ethers.Contract(
  //   "0x51d6cc0dd7afe04bbf4b791e012246493abbf36e",
  //   my_abi,
  //   signer
  // );

  // const rebal_tx = await myContract.rebalance(storageProofData, 1);

  // console.log("rebal_tx", rebal_tx);
  // // https://goerli.etherscan.io/address/0x51d6cc0dd7afe04bbf4b791e012246493abbf36e
  // const rebal_tx_res = await rebal_tx.wait();
  // console.log("rebal_tx_res", rebal_tx_res);
}

main();
