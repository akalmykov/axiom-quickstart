# Axiom Quickstart

## Demo

`npx ts-node ./src/index.ts`

## Introduction

This starter repo is a guide to get you started making your first [Axiom](https://axiom.xyz) query as quickly as possible using the [Axiom SDK](https://github.com/axiom-crypto/axiom-sdk). To learn more about Axiom, check out the developer docs at [docs.axiom.xyz](https://docs.axiom.xyz) or join our developer [Telegram](https://t.me/axiom_discuss).

## Setup

Install `npm` or `yarn` or `pnpm`:

```bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
# Install latest LTS node
nvm install --lts
# Install pnpm
npm install -g pnpm
pnpm setup
source ~/.bashrc
```

To install this project's dependencies, run

```bash
pnpm install
```

Copy `env.example` to `.env` and fill in with your provider URL (and optionally Goerli private key).
You can export your Goerli private key in Metamask by going to "Account Details" and then "Export Private Key".

> ⚠️ **WARNING**: Never use your mainnet private key on a testnet! You should never use a private key for an account you have on both mainnet and a testnet.

## Run

To run the script in [`index.ts`](./src/index.ts) that sends a query to `AxiomV1QueryMock` on Goerli testnet, run

```bash
pnpm start
```

## Validate Witness

For an example of how to read your query results from `AxiomV1QueryMock` after they are fulfilled, see [`getWitness.ts`](./src/getWitness.ts).
This can be used to generate calldata for apps using Axiom.

Run the script with

```bash
pnpm getWitness
```

This particular script was used to generate the [test data](https://github.com/axiom-crypto/axiom-apps/blob/main/uniswap-v3-twap/test/data/input.json) for the [Uniswap V3 TWAP demo app](https://demo.axiom.xyz/token-price-v3) smart contract.
